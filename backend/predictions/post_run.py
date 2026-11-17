"""Post-run automation for predictions.

Runs after a ZenML inference pipeline completes. Writes outputs at the
deterministic prefix `StoragePaths.prediction_output_dir_key(prediction.id)`;
the API surfaces them by recomputing those keys when status is "completed".
"""

import json
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from django.conf import settings
from upath import UPath

from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
    get_item,
    item_exists,
)
from shared.storage import StoragePaths

from .models import Prediction

logger = logging.getLogger(__name__)


class PredictionOutputError(RuntimeError):
    """Predictions do not match what the model's STAC item declares."""


def post_process_prediction(prediction: Prediction) -> int:
    """Write each output (PMTiles only when there are features) and return the feature count."""
    if not prediction.zenml_run_id:
        raise RuntimeError(f"Prediction {prediction.id} has no zenml_run_id")

    geojson = _load_geojson(str(prediction.zenml_run_id))
    _check_against_model_item(geojson, str(prediction.local_model_stac_id))

    UPath(StoragePaths.prediction_geojson_uri(prediction.id)).write_text(json.dumps(geojson))
    generate_geoparquet(geojson, prediction.id)
    _generate_pmtiles(geojson, prediction.id)
    logger.info("Prediction %s: post-run complete", prediction.id)
    return len(geojson.get("features", []))


def _check_against_model_item(geojson: dict[str, Any], model_id: str) -> None:
    from fair.stac.validators import validate_predictions_geojson

    collection = next(
        (
            collection
            for collection in (LOCAL_MODELS_COLLECTION, BASE_MODELS_COLLECTION)
            if item_exists(collection, model_id)
        ),
        None,
    )
    if collection is None:
        raise PredictionOutputError(f"Model {model_id} not found in STAC")
    if errors := validate_predictions_geojson(geojson, get_item(collection, model_id)):
        raise PredictionOutputError(
            f"Model {model_id}: {len(errors)} prediction errors against its STAC item, "
            f"first: {errors[:5]}"
        )


def _load_geojson(zenml_run_id: str) -> dict[str, Any]:
    from zenml.client import Client

    run = Client().get_pipeline_run(zenml_run_id)
    step = run.steps.get("run_inference")
    if step is None:
        raise RuntimeError(f"run_inference step not found on run {zenml_run_id}")
    return step.outputs["predictions"][0].load()


def generate_geoparquet(geojson: dict[str, Any], prediction_id: int) -> None:
    import geopandas as gpd

    features = geojson.get("features", [])
    if features:
        gdf = gpd.GeoDataFrame.from_features(features, crs="EPSG:4326")
    else:
        gdf = gpd.GeoDataFrame({"geometry": []}, crs="EPSG:4326")

    with tempfile.TemporaryDirectory(prefix=f"fair-geoparquet-{prediction_id}-") as tmp:
        local_parquet = Path(tmp) / StoragePaths.PREDICTION_GEOPARQUET_FILENAME
        gdf.to_parquet(local_parquet)
        UPath(StoragePaths.prediction_geoparquet_uri(prediction_id)).write_bytes(
            local_parquet.read_bytes()
        )


def _generate_pmtiles(geojson: dict[str, Any], prediction_id: int) -> None:
    # Tippecanoe is a local-only binary; stage in tempdir then upload.
    if not geojson.get("features"):
        logger.info("Prediction %s: no features, skipping pmtiles", prediction_id)
        return
    if shutil.which("tippecanoe") is None:
        raise RuntimeError(
            "tippecanoe binary not found in PATH; install it on the worker host "
            "(see https://github.com/felt/tippecanoe) before running post-process."
        )

    with tempfile.TemporaryDirectory(prefix=f"fair-pmtiles-{prediction_id}-") as tmp:
        local_geojson = Path(tmp) / "predictions.geojson"
        local_pmtiles = Path(tmp) / "predictions.pmtiles"
        local_geojson.write_text(json.dumps(geojson))
        subprocess.run(
            [
                "tippecanoe",
                "-o",
                str(local_pmtiles),
                "-z",
                str(settings.PMTILES_MAX_ZOOM),
                "-Z",
                str(settings.PMTILES_MIN_ZOOM),
                "--force",
                "--drop-densest-as-needed",
                "--read-parallel",
                str(local_geojson),
            ],
            check=True,
            capture_output=True,
        )
        UPath(StoragePaths.prediction_pmtiles_uri(prediction_id)).write_bytes(
            local_pmtiles.read_bytes()
        )
