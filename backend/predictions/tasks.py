import asyncio
import logging
import tempfile
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit

from django.conf import settings
from django.utils import timezone
from django_tasks import task
from upath import UPath

from shared.chips import chip_files, chips_every_input_has, upload_chips
from shared.enums import PipelineRunStatus
from shared.integrations.zenml import for_user, get_run_status, is_terminal
from shared.storage import StoragePaths

from .models import Prediction
from .post_run import PredictionOutputError, post_process_prediction

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_S = settings.PREDICTION_SYNC_INTERVAL


@task()
def submit_prediction(*, prediction_id: int) -> None:
    prediction = Prediction.objects.get(id=prediction_id)
    chips_by_input = _materialize_prediction_input(prediction)

    client = for_user(str(prediction.user.osm_id))
    zenml_run_id = client.submit_predict(
        local_model_id=prediction.local_model_stac_id,
        input_images=chips_by_input,
        params=prediction.params,
    )
    prediction.zenml_run_id = zenml_run_id
    prediction.status = "submitted"
    prediction.save(update_fields=["zenml_run_id", "status"])

    sync_prediction_status.using(
        run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
    ).enqueue(prediction_id=prediction.id)


@task()
def sync_prediction_status(*, prediction_id: int) -> None:
    prediction = Prediction.objects.filter(id=prediction_id).first()
    if prediction is None or not prediction.zenml_run_id:
        return
    pipeline_done = is_terminal(prediction.status)
    outputs_done = prediction.status != "completed" or prediction.results_ready
    if pipeline_done and outputs_done:
        return

    new_status = get_run_status(prediction.zenml_run_id)
    Prediction.objects.filter(id=prediction_id).update(
        status=new_status, last_polled_at=timezone.now()
    )

    needs_postrun = new_status == "completed" and not prediction.results_ready
    if not is_terminal(new_status) or needs_postrun:
        sync_prediction_status.using(
            run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
        ).enqueue(prediction_id=prediction_id)

    if needs_postrun:
        try:
            post_process_prediction(prediction)
        except PredictionOutputError:
            # A model/STAC mismatch is permanent; a terminal status stops the poller.
            logger.exception("Prediction %s: outputs rejected", prediction_id)
            Prediction.objects.filter(id=prediction_id).update(status=PipelineRunStatus.FAILED)
            return
        Prediction.objects.filter(id=prediction_id).update(results_ready=True)


def _materialize_prediction_input(prediction: Prediction) -> dict[str, str]:
    """Download each input's tiles for `prediction` and stage the tiles every input has on S3;
    returns the chips prefix of each input."""
    from geomltoolkits.geometry.tiles import get_tiles

    imagery: dict[str, str] = prediction.imagery  # type: ignore[assignment]
    zoom: int = int(prediction.zoom)
    geometry: dict = prediction.geometry  # type: ignore[assignment]

    tile_count = len(get_tiles(zoom=zoom, geojson=geometry, within=True))
    if not tile_count:
        raise ValueError(f"Prediction {prediction.id}: AOI covers no whole tile at zoom {zoom}")
    prefixes = {
        name: UPath(StoragePaths.prediction_input_dir_uri(prediction.id, name)) for name in imagery
    }
    with tempfile.TemporaryDirectory(prefix=f"fair-predict-{prediction.id}-") as tmp:
        downloads = {
            name: _download_input_tiles(url, zoom, geometry, tile_count, Path(tmp) / name)
            for name, url in imagery.items()
        }
        shared = chips_every_input_has(downloads, f"Prediction {prediction.id}")
        if not shared:
            raise RuntimeError(
                f"Prediction {prediction.id}: no tile has imagery for every input {sorted(imagery)}"
            )
        for name, files in downloads.items():
            upload_chips(files, shared, prefixes[name])

    chips_by_input = {name: str(prefix) for name, prefix in prefixes.items()}
    logger.info(
        "Prediction %s: staged %d tiles per input at %s", prediction.id, len(shared), chips_by_input
    )
    return chips_by_input


def _download_input_tiles(
    url: str, zoom: int, geometry: dict, tile_count: int, local_dir: Path
) -> dict[str, Path]:
    """Download the tiles within `geometry` from `url`; returns each file by its relative path."""
    from geomltoolkits.downloader.tms import download_tiles

    local_chips = asyncio.run(
        download_tiles(
            tms=url,
            zoom=zoom,
            out=str(local_dir),
            geojson=geometry,
            within=True,
            georeference=True,
            is_tilejson=urlsplit(url).path.endswith("tilejson.json"),
            # Edge tiles may miss the imagery; a run with no tile at all must stop.
            max_failures=tile_count - 1,
        )
    )
    return chip_files(Path(local_chips))
