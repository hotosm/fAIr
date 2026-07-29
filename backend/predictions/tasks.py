import asyncio
import logging
import tempfile
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone
from django_tasks import task
from upath import UPath

from shared.integrations.zenml import for_user, get_run_status, is_terminal
from shared.storage import StoragePaths

from .models import Prediction
from .post_run import post_process_prediction

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_S = settings.PREDICTION_SYNC_INTERVAL


@task()
def submit_prediction(*, prediction_id: int) -> None:
    prediction = Prediction.objects.get(id=prediction_id)
    chips_prefix = _materialize_prediction_input(prediction)

    client = for_user(str(prediction.user.osm_id))
    zenml_run_id = client.submit_predict(
        local_model_id=prediction.local_model_stac_id,
        image_path=chips_prefix,
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
        post_process_prediction(prediction)
        Prediction.objects.filter(id=prediction_id).update(results_ready=True)


def _materialize_prediction_input(prediction: Prediction) -> str:
    """Download TMS tiles for `prediction` and stage them on S3."""
    from geomltoolkits.downloader.tms import download_tiles

    s3_prefix = UPath(StoragePaths.prediction_input_dir_uri(prediction.id))

    image_uri: str = str(prediction.image_uri)
    zoom: int = int(prediction.zoom)
    raw_bbox: list[float] = prediction.bbox  # type: ignore[assignment]
    bbox: list[float] = [float(v) for v in raw_bbox]

    with tempfile.TemporaryDirectory(prefix=f"fair-predict-{prediction.id}-") as tmp:
        local_chips_dir = Path(
            asyncio.run(
                download_tiles(
                    tms=image_uri,
                    zoom=zoom,
                    out=tmp,
                    bbox=bbox,
                    georeference=True,
                )
            )
        )
        remote_chips_dir = s3_prefix / local_chips_dir.name
        for src in local_chips_dir.rglob("*"):
            if src.is_file():
                dst = remote_chips_dir / src.relative_to(local_chips_dir)
                dst.write_bytes(src.read_bytes())

    logger.info("Prediction %s: staged chips at %s", prediction.id, remote_chips_dir)
    return str(remote_chips_dir)
