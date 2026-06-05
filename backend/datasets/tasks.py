import asyncio
import json
import logging
import tempfile
from pathlib import Path
from typing import Any, Literal, cast

from django.conf import settings
from django_tasks import task
from upath import UPath

from shared.integrations.stac import DATASETS_COLLECTION, invalidate_stac_cache
from shared.integrations.zenml import for_user
from shared.storage import BackendDatasetPaths, StoragePaths

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
) -> None:
    """Materialize chips + OSM labels for the AOIs attached to `dataset_id`,
    upload to S3, and register the result as a STAC dataset item.
    """
    from fair.stac.builders import DatasetItemParams

    dataset = Dataset.objects.get(id=dataset_id)
    try:
        chips_href, labels_href, geometry, bbox = _materialize_dataset_assets(
            dataset,
            zoom=zoom,
            label_classes=label_classes,
            geometry_type=geometry_type,
        )
        params = DatasetItemParams(
            label_type=cast(Literal["vector", "raster"], label_type),
            label_tasks=label_tasks,
            label_classes=label_classes,
            keywords=keywords,
            chips_href=chips_href,
            labels_href=labels_href,
            title=dataset.title,
            description=description,
            user_id=str(dataset.user.osm_id),
            item_id=dataset.stac_id,
            providers=[
                {
                    "name": dataset.user.username or str(dataset.user.osm_id),
                    "roles": ["producer"],
                }
            ],
            source_imagery_href=dataset.source_imagery,
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
    join_or = {
        cls["name"]: ([] if cls["classes"] == ["*"] else list(cls["classes"]))
        for cls in label_classes
    }
    return {"tags": {geometry_type: {"join_or": join_or}}}


def _stamp_class_label(feat: dict[str, Any], label_classes: list[dict[str, Any]]) -> int | None:
    """Stamp `properties.label = i+1` for the first matching label_classes entry.

    Returns the assigned class index (1-based; 0 reserved for background) or
    ``None`` if no class matched (defensive — raw-data API only returns
    matching features, so this should not fire in practice).
    """
    tags = (feat.get("properties") or {}).get("tags") or {}
    for index, cls in enumerate(label_classes, start=1):
        key = cls["name"]
        values = cls["classes"]
        if key not in tags:
            continue
        if values == ["*"] or tags[key] in values:
            feat.setdefault("properties", {})["label"] = index
            return index
    return None


def _materialize_dataset_assets(
    dataset: Dataset,
    *,
    zoom: int,
    label_classes: list[dict[str, Any]],
    geometry_type: str,
) -> tuple[str, str, dict[str, Any], list[float]]:
    """Download chips + OSM labels for `dataset` and stage them on S3.
    Returns (chips_prefix, labels_prefix, union_geom, bbox).
    """
    from django.contrib.gis.db.models import Union as GeomUnion
    from geomltoolkits.downloader.osm import download_osm_data
    from geomltoolkits.downloader.tms import download_tiles

    aois: list[AOI] = list(dataset.aois.all())
    if not aois:
        raise RuntimeError(f"Dataset {dataset.id} has no AOIs to materialize")

    stac_id = str(dataset.stac_id)
    chips_prefix = UPath(StoragePaths.dataset_chips_dir_uri(stac_id))
    labels_prefix = UPath(StoragePaths.dataset_labels_dir_uri(stac_id))
    labels_file = labels_prefix / "labels.geojson"

    union = dataset.aois.aggregate(geom=GeomUnion("geom"))["geom"]
    geometry: dict[str, Any] = json.loads(union.geojson)
    if geometry["type"] == "Polygon":
        geometry = {"type": "MultiPolygon", "coordinates": [geometry["coordinates"]]}
    bbox = [float(v) for v in union.extent]

    osm_filters = _build_osm_filters(label_classes, geometry_type)

    # Dedupe overlapping-AOI features by OSM identity. Chip filenames are
    # tile-coord-deterministic so overlapping writes are idempotent.
    osm_features: dict[tuple[Any, Any], dict[str, Any]] = {}
    with tempfile.TemporaryDirectory(prefix=f"fair-build-{dataset.id}-") as tmp:
        for aoi in aois:
            aoi_geojson = aoi.geom.geojson
            local_chips = Path(
                asyncio.run(
                    download_tiles(
                        tms=str(dataset.source_imagery),
                        zoom=zoom,
                        out=str(Path(tmp) / f"aoi-{aoi.id}"),
                        geojson=aoi_geojson,
                        georeference=True,
                    )
                )
            )
            for src in local_chips.rglob("*"):
                if src.is_file():
                    dst = chips_prefix / src.relative_to(local_chips)
                    dst.write_bytes(src.read_bytes())

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

    # Multi-class label stamping: each feature gets `label = i+1` matching the
    # first label_classes entry whose tag key/value the feature carries.
    # 0 is reserved for background. Features matching no class are dropped.
    features: list[dict[str, Any]] = []
    skipped = 0
    for feat in osm_features.values():
        if _stamp_class_label(feat, label_classes) is None:
            skipped += 1
            continue
        features.append(feat)
    if skipped:
        logger.warning(
            "Dataset %s: %d OSM features did not match any label_classes entry; dropped",
            dataset.id,
            skipped,
        )

    labels_file.write_text(json.dumps({"type": "FeatureCollection", "features": features}))

    logger.info(
        "Dataset %s: %d AOIs -> chips %s, labels %s (%d features)",
        dataset.id,
        len(aois),
        chips_prefix,
        labels_prefix,
        len(features),
    )
    return str(chips_prefix), str(labels_prefix), geometry, bbox
