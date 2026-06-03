import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django_tasks import task

from shared.integrations.zenml import for_user, get_run_status, is_terminal

from .models import TrainingRunRef

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_S = settings.TRAINING_SYNC_INTERVAL


@task()
def submit_training(*, training_run_ref_id: int) -> None:
    run_ref = TrainingRunRef.objects.select_related("local_model", "dataset").get(
        id=training_run_ref_id
    )
    if not run_ref.base_model_stac_id or run_ref.dataset is None:
        raise RuntimeError(f"TrainingRunRef {run_ref.id} missing base_model_stac_id or dataset")

    client = for_user(str(run_ref.user.osm_id))
    zenml_run_id = client.submit_finetune(
        base_model_id=run_ref.base_model_stac_id,
        dataset_id=run_ref.dataset.stac_id,
        model_name=run_ref.local_model.name,
        overrides=run_ref.overrides or {},
    )
    run_ref.zenml_run_id = zenml_run_id
    run_ref.status = "submitted"
    run_ref.save(update_fields=["zenml_run_id", "status"])

    sync_training_status.using(
        run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
    ).enqueue(training_run_ref_id=run_ref.id)


@task()
def sync_training_status(*, training_run_ref_id: int) -> None:
    """Self-enqueueing poller: keeps `TrainingRunRef.status` fresh."""
    run_ref = TrainingRunRef.objects.filter(id=training_run_ref_id).first()
    if run_ref is None or not run_ref.zenml_run_id:
        return
    if is_terminal(run_ref.status):
        return

    new_status = get_run_status(run_ref.zenml_run_id)
    TrainingRunRef.objects.filter(id=training_run_ref_id).update(
        status=new_status, last_polled_at=timezone.now()
    )

    if not is_terminal(new_status):
        sync_training_status.using(
            run_after=timezone.now() + timedelta(seconds=_SYNC_INTERVAL_S)
        ).enqueue(training_run_ref_id=training_run_ref_id)
