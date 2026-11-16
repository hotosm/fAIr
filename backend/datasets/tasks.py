import asyncio
import json
import logging
import tempfile
from pathlib import Path
from typing import Any, Literal, cast

from django.conf import settings
from django_tasks import task
from fair.datasets import (
    DEFAULT_CLASS_PROPERTY,
    MaterializedDataset,
    label_classes_of,
    osm_filters,
    osm_label_features,
    select_labels,
)
from upath import UPath

from shared.chips import chip_files, chips_every_input_has, upload_chips
from shared.integrations.stac import DATASETS_COLLECTION, invalidate_stac_cache
from shared.integrations.zenml import for_user
from shared.storage import BackendDatasetPaths, StoragePaths

from .label_sources import fetch_labels_geojson, parse_labels_geojson
from .models import AOI, Dataset

logger = logging.getLogger(__name__)

OSM_LICENSE = "ODbL-1.0"


@task()
def build_dataset(
    *,
    dataset_id: int,
    description: str,
    label_tasks: list[str],
    keywords: list[str],
    label_type: str,
    zoom: int,
    geometry_type: str,
    osm_tags: dict[str, list[str]] | None = None,
    labels_url: str | None = None,
    labels_file_uri: str | None = None,
    class_property: str = DEFAULT_CLASS_PROPERTY,
) -> None:
    """Materialize chips + labels for the AOIs attached to `dataset_id`,
    upload to S3, and register the result as a STAC dataset item.
    """
    from fair.stac.builders import DatasetItemParams

    try:
        dataset = Dataset.objects.get(id=dataset_id)
        try:
            built = _materialize_dataset_assets(
                dataset,
                zoom=zoom,
                geometry_type=geometry_type,
                osm_tags=osm_tags,
                labels_url=labels_url,
                labels_file_uri=labels_file_uri,
                class_property=class_property,
            )
            params = DatasetItemParams(
                label_type=cast(Literal["vector", "raster"], label_type),
                label_tasks=label_tasks,
                label_classes=built.label_classes,
                label_properties=built.label_properties,
                keywords=keywords,
                chips_hrefs=built.chips_dirs,
                labels_href=built.labels_file,
                title=dataset.title,
                description=description,
                user_id=str(dataset.user.osm_id),
                item_id=dataset.stac_id,
                providers=[dataset.user.stac_producer()],
                source_imagery=dataset.primary_imagery,
                imagery_hrefs=dict(dataset.imagery),
                geometry=built.geometry,
                bbox=built.bbox,
                geometry_type=cast(Literal["point", "line", "polygon"], geometry_type),
                license_id=OSM_LICENSE if osm_tags else None,
            )
            client = for_user(str(dataset.user.osm_id))
            published_id = client.register_dataset(params, paths=BackendDatasetPaths)
            dataset.stac_id = published_id
            dataset.status = Dataset.Status.BUILT
            dataset.save(update_fields=["stac_id", "status", "last_modified"])
            invalidate_stac_cache(DATASETS_COLLECTION, published_id)
            from modelregistry.tasks import mirror_stac_assets_task

            mirror_stac_assets_task.enqueue(collection_id=DATASETS_COLLECTION, item_id=published_id)
        except Exception as exc:
            logger.exception("dataset build failed for %s", dataset_id)
            dataset.status = Dataset.Status.FAILED
            dataset.error = f"{type(exc).__name__}: {exc}"
            dataset.save(update_fields=["status", "error", "last_modified"])
            raise
    finally:
        if labels_file_uri:
            UPath(labels_file_uri).unlink(missing_ok=True)


def _materialize_dataset_assets(
    dataset: Dataset,
    *,
    zoom: int,
    geometry_type: str,
    osm_tags: dict[str, list[str]] | None,
    labels_url: str | None,
    labels_file_uri: str | None,
    class_property: str,
) -> MaterializedDataset:
    from django.contrib.gis.db.models import Union as GeomUnion
    from geomltoolkits.downloader.osm import download_osm_data

    aois: list[AOI] = list(dataset.aois.all())
    if not aois:
        raise RuntimeError(f"Dataset {dataset.id} has no AOIs to materialize")

    stac_id = str(dataset.stac_id)
    imagery: dict[str, str] = dataset.imagery  # type: ignore[assignment]
    prefixes = {name: UPath(StoragePaths.dataset_chips_dir_uri(stac_id, name)) for name in imagery}
    chip_names: set[str] = set()
    labels_prefix = UPath(StoragePaths.dataset_labels_dir_uri(stac_id))
    labels_file = labels_prefix / StoragePaths.LABELS_GEOJSON_FILENAME

    union = dataset.aois.aggregate(geom=GeomUnion("geom"))["geom"]
    geometry: dict[str, Any] = json.loads(union.geojson)
    if geometry["type"] == "Polygon":
        geometry = {"type": "MultiPolygon", "coordinates": [geometry["coordinates"]]}
    bbox = [float(v) for v in union.extent]

    # Dedupe overlapping-AOI features by OSM identity. Chip filenames are
    # tile-coord-deterministic so overlapping writes are idempotent.
    osm_features: dict[tuple[Any, Any], dict[str, Any]] = {}
    # Read and checked first so unusable labels fail before any chip is downloaded.
    labels_source = _read_labels_source(labels_url, labels_file_uri)
    if labels_source is None and not osm_tags:
        raise ValueError(f"Dataset {dataset.id} needs osm_tags, labels_url or labels_file_uri")
    tags = osm_tags or {}
    selected = (
        select_labels(labels_source, geometry, geometry_type, class_property)
        if labels_source is not None
        else None
    )
    with tempfile.TemporaryDirectory(prefix=f"fair-build-{dataset.id}-") as tmp:
        for aoi in aois:
            aoi_geojson = aoi.geom.geojson
            downloads = {
                name: _download_chips(url, zoom, aoi_geojson, Path(tmp) / f"aoi-{aoi.id}-{name}")
                for name, url in imagery.items()
            }
            shared = chips_every_input_has(downloads, f"Dataset {dataset.id} AOI {aoi.id}")
            for name, files in downloads.items():
                upload_chips(files, shared, prefixes[name])
            chip_names |= shared

            if labels_source is not None:
                continue
            osm = asyncio.run(
                download_osm_data(
                    geojson=aoi_geojson,
                    api_url=str(settings.RAW_DATA_API_URL),
                    filters=osm_filters(tags, geometry_type),
                    geometry_types=[geometry_type],
                )
            )
            for feat in osm.get("features", []):
                props = feat.get("properties") or {}
                key = (props.get("osm_id"), props.get("osm_type"))
                osm_features.setdefault(key, feat)

    if not chip_names:
        raise RuntimeError(
            f"Dataset {dataset.id}: no tile has imagery for every input {sorted(imagery)}"
        )

    if selected is not None:
        features = selected
        names = [class_property]
    else:
        features = osm_label_features(list(osm_features.values()), tags)
        names = list(tags)
    if not features:
        raise ValueError(f"Dataset {dataset.id}: no label inside the AOIs")
    label_classes = label_classes_of(features, names)

    labels_file.write_text(json.dumps({"type": "FeatureCollection", "features": features}))

    chips_hrefs = {name: str(prefix) for name, prefix in prefixes.items()}
    logger.info(
        "Dataset %s: %d AOIs, %d chip files per input -> chips %s, labels %s (%d features)",
        dataset.id,
        len(aois),
        len(chip_names),
        chips_hrefs,
        labels_prefix,
        len(features),
    )
    return MaterializedDataset(
        chips_dirs=chips_hrefs,
        labels_file=str(labels_prefix),
        geometry=geometry,
        bbox=bbox,
        label_properties=[cls["name"] for cls in label_classes],
        label_classes=label_classes,
    )


def _read_labels_source(
    labels_url: str | None, labels_file_uri: str | None
) -> dict[str, Any] | None:
    if labels_url:
        return fetch_labels_geojson(labels_url)
    if labels_file_uri:
        return parse_labels_geojson(UPath(labels_file_uri).read_bytes())
    return None


def _download_chips(tms: str, zoom: int, aoi_geojson: str, local_dir: Path) -> dict[str, Path]:
    """Download the AOI's tiles from `tms`; returns each file by its path within the download."""
    from geomltoolkits.downloader.tms import download_tiles

    local_chips = Path(
        asyncio.run(
            download_tiles(
                tms=tms, zoom=zoom, out=str(local_dir), geojson=aoi_geojson, georeference=True
            )
        )
    )
    return chip_files(local_chips)
