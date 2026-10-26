import asyncio
import json
import logging
import tempfile
from pathlib import Path
from typing import Any, Literal, cast

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django_tasks import task
from upath import UPath

from shared.chips import chip_files, chips_every_input_has, upload_chips
from shared.integrations.stac import DATASETS_COLLECTION, invalidate_stac_cache
from shared.integrations.zenml import for_user
from shared.storage import BackendDatasetPaths, StoragePaths

from .label_sources import fetch_labels_geojson
from .models import AOI, Dataset

logger = logging.getLogger(__name__)


@task()
def build_dataset(
    *,
    dataset_id: int,
    description: str,
    label_tasks: list[str],
    label_classes: list[dict[str, Any]],
    keywords: list[str],
    label_type: str,
    zoom: int,
    geometry_type: str,
    labels_url: str | None = None,
) -> None:
    """Materialize chips + labels for the AOIs attached to `dataset_id`,
    upload to S3, and register the result as a STAC dataset item.
    """
    from fair.stac.builders import DatasetItemParams

    dataset = Dataset.objects.get(id=dataset_id)
    try:
        chips_hrefs, labels_href, geometry, bbox = _materialize_dataset_assets(
            dataset,
            zoom=zoom,
            label_classes=label_classes,
            geometry_type=geometry_type,
            labels_url=labels_url,
        )
        params = DatasetItemParams(
            label_type=cast(Literal["vector", "raster"], label_type),
            label_tasks=label_tasks,
            label_classes=label_classes,
            keywords=keywords,
            chips_hrefs=chips_hrefs,
            labels_href=labels_href,
            title=dataset.title,
            description=description,
            user_id=str(dataset.user.osm_id),
            item_id=dataset.stac_id,
            providers=[dataset.user.stac_producer()],
            source_imagery=dataset.primary_imagery,
            imagery_hrefs=dict(dataset.imagery),
            geometry=geometry,
            bbox=bbox,
            geometry_type=cast(Literal["point", "line", "polygon"], geometry_type),
        )
        client = for_user(str(dataset.user.osm_id))
        published_id = client.register_dataset(params, paths=BackendDatasetPaths)
        dataset.stac_id = published_id
        dataset.status = Dataset.Status.BUILT
        dataset.save(update_fields=["stac_id", "status", "last_modified"])
        invalidate_stac_cache(DATASETS_COLLECTION, published_id)
        from modelregistry.tasks import mirror_stac_assets_task

        mirror_stac_assets_task.enqueue(collection_id=DATASETS_COLLECTION, item_id=published_id)
    except Exception:
        logger.exception("dataset build failed for %s", dataset_id)
        dataset.status = Dataset.Status.FAILED
        dataset.save(update_fields=["status", "last_modified"])
        raise


def _build_osm_filters(label_classes: list[dict[str, Any]], geometry_type: str) -> dict[str, Any]:
    """Build a raw-data API `filters` block from a STAC `label_classes` list.

    Each entry's ``name`` is the OSM tag key, ``classes`` is the value list
    (``["*"]`` is the wildcard sentinel mapped to empty list = any value).
    """
    join_or: dict[str, list[str]] = {}
    for label_class in label_classes:
        key = label_class["name"]
        # An empty list means any value, so a wildcard on a key absorbs its other entries.
        if label_class["classes"] == ["*"] or join_or.get(key) == []:
            join_or[key] = []
        else:
            join_or[key] = [*join_or.get(key, []), *label_class["classes"]]
    return {"tags": {geometry_type: {"join_or": join_or}}}


def _stamp_class_label(feat: dict[str, Any], label_classes: list[dict[str, Any]]) -> int | None:
    """Stamp `properties.label = i+1` for the first matching label_classes entry.

    Returns the assigned class index (1-based; 0 reserved for background) or
    ``None`` if no class matched. The raw-data API only returns matching
    features, so a no-match is not expected in practice.
    """
    tags = (feat.get("properties") or {}).get("tags") or {}
    index = _class_index(tags, label_classes)
    if index is not None:
        feat.setdefault("properties", {})["label"] = index
    return index


def _class_index(attributes: dict[str, Any], label_classes: list[dict[str, Any]]) -> int | None:
    """1-based index of the first label_classes entry whose key and value `attributes` carries."""
    for index, label_class in enumerate(label_classes, start=1):
        key = label_class["name"]
        values = label_class["classes"]
        if key in attributes and (values == ["*"] or attributes[key] in values):
            return index
    return None


_GEOJSON_TYPES_BY_GEOMETRY_TYPE = {
    "point": {"Point", "MultiPoint"},
    "line": {"LineString", "MultiLineString"},
    "polygon": {"Polygon", "MultiPolygon"},
}


def _stamp_source_labels(
    source_features: list[dict[str, Any]],
    aoi_union: GEOSGeometry,
    label_classes: list[dict[str, Any]],
    geometry_type: str,
) -> tuple[list[dict[str, Any]], int]:
    """Features of `geometry_type` that intersect the AOIs and match a class by their properties,
    and the count of dropped features."""
    allowed_types = _GEOJSON_TYPES_BY_GEOMETRY_TYPE[geometry_type]
    features: list[dict[str, Any]] = []
    for feature in source_features:
        geometry = feature["geometry"]
        if not geometry or geometry["type"] not in allowed_types:
            continue
        if not aoi_union.intersects(GEOSGeometry(json.dumps(geometry), srid=4326)):
            continue
        properties = feature.get("properties") or {}
        index = _class_index(properties, label_classes)
        if index is None:
            continue
        features.append({**feature, "properties": {**properties, "label": index}})
    return features, len(source_features) - len(features)


def _materialize_dataset_assets(
    dataset: Dataset,
    *,
    zoom: int,
    label_classes: list[dict[str, Any]],
    geometry_type: str,
    labels_url: str | None,
) -> tuple[dict[str, str], str, dict[str, Any], list[float]]:
    """Stage on S3 each input's chips, on the tiles every input has, and the labels from OSM or
    `labels_url`; returns ({input name: chips prefix}, labels prefix, union geometry, bbox)."""
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

    osm_filters = _build_osm_filters(label_classes, geometry_type)

    # Dedupe overlapping-AOI features by OSM identity. Chip filenames are
    # tile-coord-deterministic so overlapping writes are idempotent.
    osm_features: dict[tuple[Any, Any], dict[str, Any]] = {}
    # Fetched first so an unusable labels_url fails before any chip is downloaded.
    labels_source = fetch_labels_geojson(labels_url) if labels_url else None
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
                    filters=osm_filters,
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

    # Labels are 1-based class indices, keeping 0 for background; unmatched features are dropped.
    features: list[dict[str, Any]] = []
    skipped = 0
    if labels_source is not None:
        features, skipped = _stamp_source_labels(
            labels_source["features"], union, label_classes, geometry_type
        )
    else:
        for feat in osm_features.values():
            if _stamp_class_label(feat, label_classes) is None:
                skipped += 1
                continue
            features.append(feat)
    if skipped:
        logger.warning(
            "Dataset %s: %d label features matched no class, AOI or geometry type; dropped",
            dataset.id,
            skipped,
        )

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
    return chips_hrefs, str(labels_prefix), geometry, bbox


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
