"""Post-run automation for predictions.

Runs after a ZenML inference pipeline completes. Writes outputs at the
deterministic prefix `StoragePaths.prediction_output_dir_uri(prediction.id)`;
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

from shared.storage import StoragePaths

from .models import Prediction

logger = logging.getLogger(__name__)


def post_process_prediction(prediction: Prediction) -> None:
    if not prediction.zenml_run_id:
        raise RuntimeError(f"Prediction {prediction.id} has no zenml_run_id")

    geojson = _load_geojson(str(prediction.zenml_run_id))

    if prediction.remove_osm:
        # TODO(remove-osm): OSM conflation not yet implemented.
        # Return features as-is; the removed_osm output file is not written.
        logger.info(
            "Prediction %s: remove_osm requested but not implemented; skipping",
            prediction.id,
        )

    UPath(StoragePaths.prediction_geojson_uri(prediction.id)).write_text(json.dumps(geojson))
    _generate_fgb(geojson, prediction.id)
    _generate_pmtiles(geojson, prediction.id)
    logger.info("Prediction %s: post-run complete", prediction.id)


def _load_geojson(zenml_run_id: str) -> dict[str, Any]:
    from zenml.client import Client

    run = Client().get_pipeline_run(zenml_run_id)
    step = run.steps.get("run_inference")
    if step is None:
        raise RuntimeError(f"run_inference step not found on run {zenml_run_id}")
    return step.outputs["predictions"][0].load()


def _generate_fgb(geojson: dict[str, Any], prediction_id: int) -> None:
    # FlatGeobuf is range-queryable client-side (FlatGeobuf.js) so a public
    # URL doesn't need to proxy bbox filtering through this service.
    import geopandas as gpd

    gdf = gpd.GeoDataFrame.from_features(geojson.get("features", []), crs="EPSG:4326")
    if gdf.empty:
        gdf = gpd.GeoDataFrame({"geometry": []}, crs="EPSG:4326")

    with tempfile.TemporaryDirectory(prefix=f"fair-fgb-{prediction_id}-") as tmp:
        local_fgb = Path(tmp) / "predictions.fgb"
        gdf.to_file(local_fgb, driver="FlatGeobuf")
        UPath(StoragePaths.prediction_fgb_uri(prediction_id)).write_bytes(local_fgb.read_bytes())


def _generate_pmtiles(geojson: dict[str, Any], prediction_id: int) -> None:
    # Tippecanoe is a local-only binary; stage in tempdir then upload.
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
