import asyncio
import logging
import tempfile
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit

from django.conf import settings
from django.db import transaction
from django.db.models import F, Q, QuerySet
from django.utils import timezone
from django_tasks import task
from upath import UPath

from shared.chips import chip_files, chips_every_input_has, upload_chips
from shared.enums import PipelineRunStatus
from shared.integrations.zenml import for_user
from shared.run_endpoints import RUN_GONE_ERROR, run_failure_reason, run_is_gone
from shared.run_status import TERMINAL_STATUSES, get_run_status, is_terminal
from shared.storage import StoragePaths, remove_dir

from .models import Prediction
from .post_run import PredictionOutputError, post_process_prediction

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_S = settings.PREDICTION_SYNC_INTERVAL


@task()
def submit_prediction(*, prediction_id: int) -> None:
    prediction = Prediction.objects.get(id=prediction_id)
    chips_by_input = materialize_prediction_input(prediction)

    client = for_user(str(prediction.user.osm_id))
    zenml_run_id = client.submit_predict(
        local_model_id=prediction.local_model_stac_id,
        input_images=chips_by_input,
        params=prediction.params,
    )
    prediction.zenml_run_id = zenml_run_id
    prediction.status = PipelineRunStatus.SUBMITTED
    prediction.save(update_fields=["zenml_run_id", "status"])

    sync_prediction_status.using(
        run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
    ).enqueue(prediction_id=prediction.id)


# A completed run whose outputs are not written yet still needs its poll.
_AWAITING_OUTPUTS = Q(status=PipelineRunStatus.COMPLETED, results_ready=False)
MAX_POST_RUN_ATTEMPTS = 20


@task()
def sync_prediction_status(*, prediction_id: int) -> None:
    prediction = Prediction.objects.filter(id=prediction_id).first()
    if prediction is None or not prediction.zenml_run_id:
        return
    if prediction.is_finished:
        return
    # Queued before polling, so a ZenML error or a worker killed mid-poll cannot end the chain.
    sync_prediction_status.using(
        run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
    ).enqueue(prediction_id=prediction_id)

    try:
        new_status = get_run_status(prediction.zenml_run_id)
    except KeyError:  # ZenML raises KeyError for a missing run and any unrecognised 404, so confirm
        if not run_is_gone(prediction.zenml_run_id):
            raise
        still_open = ~Q(status__in=TERMINAL_STATUSES) | _AWAITING_OUTPUTS
        failed = Prediction.objects.filter(still_open, id=prediction_id).update(
            status=PipelineRunStatus.FAILED, error=RUN_GONE_ERROR, last_polled_at=timezone.now()
        )
        if failed:
            delete_input_tiles(prediction)
        return
    updated = (
        Prediction.objects.filter(id=prediction_id)
        .exclude(status__in=TERMINAL_STATUSES)
        .update(status=new_status, last_polled_at=timezone.now())
    )
    # A completed row awaiting post-run is expected; any other finished row was cancelled mid-poll.
    if not updated and prediction.status != PipelineRunStatus.COMPLETED:
        return
    if updated and new_status == PipelineRunStatus.FAILED:
        Prediction.objects.filter(id=prediction_id).update(
            error=run_failure_reason(prediction.zenml_run_id)
        )

    if new_status == PipelineRunStatus.COMPLETED:
        _write_outputs(prediction_id)
    elif is_terminal(new_status):
        delete_input_tiles(prediction)


def _write_outputs(prediction_id: int) -> None:
    awaiting = Prediction.objects.filter(_AWAITING_OUTPUTS, id=prediction_id)
    claimed = None
    try:
        with transaction.atomic():
            # Skips a row another worker is writing, so one worker writes each request's outputs.
            claimed = awaiting.select_for_update(skip_locked=True).first()
            if claimed is None:
                return
            if claimed.post_run_attempts >= MAX_POST_RUN_ATTEMPTS:
                awaiting.update(
                    status=PipelineRunStatus.FAILED,
                    error=f"Writing the results failed {MAX_POST_RUN_ATTEMPTS} times.",
                )
            else:
                _post_process(claimed, awaiting)
    finally:
        if claimed is not None:
            _count_failed_attempt(awaiting)
    delete_input_tiles(claimed)


def _post_process(prediction: Prediction, awaiting: QuerySet[Prediction]) -> None:
    try:
        feature_count = post_process_prediction(prediction)
    except PredictionOutputError:
        # A model/STAC mismatch is permanent; a terminal status stops the poller.
        logger.exception("Prediction %s: outputs rejected", prediction.id)
        awaiting.update(status=PipelineRunStatus.FAILED)
        return
    awaiting.update(results_ready=True, feature_count=feature_count)


def _count_failed_attempt(awaiting: QuerySet[Prediction]) -> None:
    # Runs after the rollback, so only a failed attempt still matches awaiting.
    with transaction.atomic():
        if awaiting.select_for_update(skip_locked=True).exists():
            awaiting.update(post_run_attempts=F("post_run_attempts") + 1)


@task()
def delete_prediction_input_tiles(*, prediction_id: int) -> None:
    delete_input_tiles(Prediction.objects.get(id=prediction_id))


def delete_input_tiles(prediction: Prediction) -> None:
    if not settings.DELETE_PREDICTION_INPUT_TILES:
        return
    for name in prediction.imagery:  # type: ignore[not-iterable]
        remove_dir(StoragePaths.prediction_input_dir_uri(prediction.id, name))


def materialize_prediction_input(prediction: Prediction) -> dict[str, str]:
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
