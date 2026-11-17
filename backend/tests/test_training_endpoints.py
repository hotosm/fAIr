from datetime import UTC, datetime
from unittest.mock import patch

import pystac
import pytest
from django.test import override_settings
from django_tasks_db.models import DBTaskResult
from fair.zenml.runs import LogEntry

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import BaseModel, LocalModel
from shared.enums import PipelineRunStatus
from trainings.models import TrainingRunRef
from trainings.tasks import submit_training, sync_training_status


@pytest.fixture
def published_dataset(db, user: OsmUser) -> Dataset:
    return Dataset.objects.create(
        stac_id="buildings-banepa",
        title="Buildings Banepa",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        status=Dataset.Status.BUILT,
        user=user,
    )


_BUILDING_CLASSES = [
    {"name": "background", "value": 0},
    {"name": "building", "value": 1, "fair:osm_tags": {"building": ["*"]}},
]


def _base_model_item(*asset_keys: str) -> pystac.Item:
    properties = {"mlm:output": [{"name": "mask", "classification:classes": _BUILDING_CLASSES}]}
    item = pystac.Item("unet-segmentation", None, None, datetime.now(UTC), properties)
    for key in asset_keys:
        item.add_asset(key, pystac.Asset(f"ghcr.io/hotosm/fair-models/unet:{key}"))
    return item


@pytest.fixture
def registered_base_model(db, user: OsmUser):
    """A base model row, with its STAC lookup patched to an item that has a training runtime."""
    dataset_item = pystac.Item(
        "buildings-banepa",
        None,
        None,
        datetime.now(UTC),
        {"label:properties": ["building"], "label:classes": [{"name": "building", "classes": ["yes"]}]},
    )
    with (
        patch("trainings.views.get_base_model", return_value=_base_model_item("mlm:training")),
        patch("trainings.views.get_dataset", return_value=dataset_item),
    ):
        yield BaseModel.objects.create(
            name="unet-segmentation",
            stac_item_id="unet-segmentation",
            user=user,
        )


@pytest.fixture
def local_model(db, user: OsmUser, registered_base_model: BaseModel) -> LocalModel:
    return LocalModel.objects.create(
        name="my-existing-finetune",
        base_model=registered_base_model,
        status=LocalModel.Status.ACTIVE,
        user=user,
    )


@pytest.fixture
def training_ref(
    db, user: OsmUser, local_model: LocalModel, published_dataset: Dataset
) -> TrainingRunRef:
    return TrainingRunRef.objects.create(
        zenml_run_id="abc-123",
        local_model=local_model,
        base_model_stac_id="unet-segmentation",
        dataset=published_dataset,
        user=user,
    )


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_refuses_a_prediction_only_base_model(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    with patch("trainings.views.get_base_model", return_value=_base_model_item("mlm:inference", "batch-inference")):
        response = client.post(
            "/api/v1/trainings/submit/",
            data={
                "base_model_stac_id": "unet-segmentation",
                "dataset_stac_id": published_dataset.stac_id,
                "model_name": "never-trained",
            },
            format="json",
        )

    assert response.status_code == 400
    assert "cannot be finetuned" in str(response.json())
    assert not LocalModel.objects.filter(name="never-trained").exists()
    mock_task.enqueue.assert_not_called()


@patch("trainings.views.item_exists", return_value=False)
def test_training_submit_404s_dataset_not_in_stac(mock_item_exists, client, registered_base_model):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": "ghost-ds",
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404


@patch("trainings.views.item_exists", return_value=True)
def test_training_submit_404s_dataset_not_published(
    mock_item_exists, client, user, registered_base_model
):
    Dataset.objects.create(
        stac_id="building-ds",
        title="Building",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        status=Dataset.Status.BUILDING,
        user=user,
    )
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": "building-ds",
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404


@override_settings(TASKS={"default": {"BACKEND": "django_tasks.backends.immediate.ImmediateBackend"}})
def test_failed_training_submission_marks_run_failed(training_ref: TrainingRunRef) -> None:
    with patch("trainings.tasks.for_user", side_effect=RuntimeError("zenml unreachable")):
        submit_training.enqueue(training_run_ref_id=training_ref.id)

    training_ref.refresh_from_db()
    assert training_ref.status == PipelineRunStatus.FAILED
    assert training_ref.error == "RuntimeError: zenml unreachable"


@override_settings(TASKS={"default": {"BACKEND": "django_tasks.backends.immediate.ImmediateBackend"}})
def test_training_submission_passes_the_class_map_to_the_pipeline(training_ref: TrainingRunRef) -> None:
    training_ref.class_map = {"roof=iron": "building"}
    training_ref.save(update_fields=["class_map"])

    with patch("trainings.tasks.for_user") as for_user, patch("trainings.tasks.sync_training_status"):
        for_user.return_value.submit_finetune.return_value = "run-1"
        submit_training.enqueue(training_run_ref_id=training_ref.id)

    assert for_user.return_value.submit_finetune.call_args.kwargs["class_map"] == {"roof=iron": "building"}
    training_ref.refresh_from_db()
    assert training_ref.zenml_run_id == "run-1"


@patch(
    "shared.run_endpoints.fetch_run_logs",
    return_value=[
        LogEntry(level="20", message="Node `train_model` started (status: running)"),
        LogEntry(level="ERROR", message="Job for step `train_model` failed: exit_code=137"),
    ],
)
@patch("trainings.tasks.get_run_status", return_value="failed")
def test_a_failed_training_records_the_first_error_zenml_logged(
    _status, _logs, training_ref: TrainingRunRef
) -> None:
    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status="running")

    sync_training_status.call(training_run_ref_id=training_ref.pk)

    training_ref.refresh_from_db()
    assert training_ref.status == "failed"
    assert training_ref.error == "Job for step `train_model` failed: exit_code=137"


@patch("trainings.tasks.get_run_status", side_effect=ConnectionError("ZenML server unreachable"))
def test_a_training_poll_that_cannot_reach_zenml_keeps_the_next_poll_queued(
    _status, training_ref: TrainingRunRef
) -> None:
    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status="running")

    with pytest.raises(ConnectionError):
        sync_training_status.call(training_run_ref_id=training_ref.pk)

    queued = DBTaskResult.objects.filter(
        task_path=sync_training_status.module_path,
        status="READY",
        args_kwargs__kwargs={"training_run_ref_id": training_ref.pk},
    )
    assert queued.count() == 1


@patch("trainings.tasks.run_is_gone", return_value=True)
@patch("trainings.tasks.get_run_status", side_effect=KeyError("No pipeline run with this ID found"))
def test_a_training_zenml_no_longer_has_is_marked_failed_and_polling_stops(
    _status, _gone, training_ref: TrainingRunRef
) -> None:
    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status="running")

    sync_training_status.call(training_run_ref_id=training_ref.pk)
    sync_training_status.call(training_run_ref_id=training_ref.pk)

    training_ref.refresh_from_db()
    assert training_ref.status == PipelineRunStatus.FAILED
    assert training_ref.error == "The pipeline run no longer exists in ZenML."
    assert _status.call_count == 1


@patch("trainings.tasks.run_is_gone", return_value=False)
@patch("trainings.tasks.get_run_status", side_effect=KeyError("404 from a proxy"))
def test_a_404_for_a_training_zenml_still_lists_leaves_the_row_running(
    _status, _gone, training_ref: TrainingRunRef
) -> None:
    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status="running")

    with pytest.raises(KeyError):
        sync_training_status.call(training_run_ref_id=training_ref.pk)

    training_ref.refresh_from_db()
    assert training_ref.status == "running"


@pytest.mark.parametrize("zenml_says", [PipelineRunStatus.RUNNING, PipelineRunStatus.FAILED])
@patch("trainings.tasks.run_failure_reason", return_value="boom")
def test_a_training_cancel_during_a_poll_wins_whatever_zenml_reports(
    _reason, zenml_says, training_ref: TrainingRunRef
) -> None:
    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status="running")

    def cancel_while_polling(_run_id: str) -> str:
        TrainingRunRef.objects.filter(pk=training_ref.pk).update(status=PipelineRunStatus.CANCELLED)
        return zenml_says

    with patch("trainings.tasks.get_run_status", side_effect=cancel_while_polling):
        sync_training_status.call(training_run_ref_id=training_ref.pk)

    training_ref.refresh_from_db()
    assert training_ref.status == PipelineRunStatus.CANCELLED
    assert training_ref.error == ""


@patch("trainings.views.get_run_status", return_value=PipelineRunStatus.RUNNING)
def test_the_status_endpoint_never_undoes_a_cancel(_status, training_ref: TrainingRunRef) -> None:
    from rest_framework.test import APIClient

    TrainingRunRef.objects.filter(pk=training_ref.pk).update(status=PipelineRunStatus.CANCELLED)
    client = APIClient()
    client.force_authenticate(user=training_ref.user)

    response = client.get(f"/api/v1/trainings/runs/{training_ref.zenml_run_id}/status/")

    training_ref.refresh_from_db()
    assert response.json()["status"] == PipelineRunStatus.CANCELLED
    assert response.json()["is_terminal"] is True
    assert training_ref.status == PipelineRunStatus.CANCELLED
