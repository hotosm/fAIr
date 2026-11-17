from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.test import Client
from django_tasks_db.models import DBTaskResult

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import BaseModel, Category, LocalModel
from predictions.deletion import delete_prediction
from predictions.models import Prediction
from predictions.tasks import sync_prediction_status
from shared.exceptions import ResourceInUseException
from shared.integrations.stac import DATASETS_COLLECTION
from shared.storage import StoragePaths
from trainings.models import TrainingRunRef

PREDICTIONS = "/django-admin/predictions/prediction"
TRAININGS = "/django-admin/trainings/trainingrunref"


def _prediction(user: OsmUser, run_id: str, status: str) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id=run_id,
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        status=status,
        results_ready=status == "completed",
        user=user,
    )


@patch("datasets.admin.set_item_property")
def test_pin_action_pins_only_built_datasets(mock_set, admin_site: Client, user: OsmUser) -> None:
    built = Dataset.objects.create(
        stac_id="built", title="B", imagery={}, status=Dataset.Status.BUILT, user=user
    )
    building = Dataset.objects.create(
        stac_id="building", title="C", imagery={}, status=Dataset.Status.BUILDING, user=user
    )

    admin_site.post(
        "/django-admin/datasets/dataset/",
        {"action": "pin", "_selected_action": [built.id, building.id]},
    )

    mock_set.assert_called_once_with(DATASETS_COLLECTION, "built", "fair:pinned", True)


@patch("zenml.client.Client")
@patch("zenml.utils.run_utils.stop_run")
def test_stop_action_stops_only_unfinished_runs(mock_stop, mock_client, admin_site: Client, user: OsmUser) -> None:
    running = _prediction(user, "run-1", "running")
    finished = _prediction(user, "run-2", "completed")

    admin_site.post(PREDICTIONS + "/", {"action": "stop_runs", "_selected_action": [running.id, finished.id]})

    mock_client.return_value.get_pipeline_run.assert_called_once_with("run-1")
    mock_stop.assert_called_once_with(
        mock_client.return_value.get_pipeline_run.return_value, graceful=False
    )
    running.refresh_from_db()
    assert running.status == "cancelled"


def _drain_worker() -> None:
    call_command("db_worker", batch=True, no_startup_delay=True, interval=0)


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
@patch("predictions.tasks.remove_dir")
@patch("zenml.client.Client")
@patch("zenml.utils.run_utils.stop_run")
def test_stopping_a_prediction_from_admin_cancels_it_and_removes_its_input_tiles(
    mock_stop, mock_client, mock_remove, admin_site: Client, user: OsmUser
) -> None:
    running = _prediction(user, "run-5", "running")

    admin_site.post(PREDICTIONS + "/", {"action": "stop_runs", "_selected_action": [running.id]})
    _drain_worker()

    running.refresh_from_db()
    assert running.status == "cancelled"
    mock_remove.assert_called_once()


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
@patch("zenml.client.Client")
@patch("zenml.utils.run_utils.stop_run")
def test_stopping_a_training_from_admin_cancels_it(
    mock_stop, mock_client, admin_site: Client, user: OsmUser
) -> None:
    category, _ = Category.objects.get_or_create(slug="buildings", defaults={"label": "Buildings"})
    base = BaseModel.objects.create(name="unet", stac_item_id="unet", category=category, user=user)
    dataset = Dataset.objects.create(stac_id="ds", title="D", imagery={}, category=category, user=user)
    run = TrainingRunRef.objects.create(
        zenml_run_id="run-6",
        local_model=LocalModel.objects.create(
            name="ft", base_model=base, category=category, user=user
        ),
        base_model_stac_id="unet",
        dataset=dataset,
        status="running",
        user=user,
    )

    admin_site.post(TRAININGS + "/", {"action": "stop_runs", "_selected_action": [run.id]})
    _drain_worker()

    run.refresh_from_db()
    assert run.status == "cancelled"


@patch("predictions.deletion.remove_dir")
def test_deleting_a_prediction_removes_its_files(mock_remove, admin_site: Client, user: OsmUser) -> None:
    prediction = _prediction(user, "run-3", "completed")

    admin_site.post(f"{PREDICTIONS}/{prediction.id}/delete/", {"post": "yes"})

    assert not Prediction.objects.filter(pk=prediction.pk).exists()
    mock_remove.assert_called_once_with(StoragePaths.prediction_dir_uri(prediction.id))


def test_a_running_prediction_cannot_be_deleted(admin_site: Client, user: OsmUser) -> None:
    prediction = _prediction(user, "run-4", "running")

    response = admin_site.post(f"{PREDICTIONS}/{prediction.id}/delete/", {"post": "yes"})

    assert response.status_code == 403
    assert Prediction.objects.filter(pk=prediction.pk).exists()


@patch("predictions.deletion.remove_dir")
def test_a_completed_prediction_still_writing_outputs_cannot_be_deleted(
    mock_remove, admin_site: Client, user: OsmUser
) -> None:
    prediction = _prediction(user, "run-6", "completed")
    Prediction.objects.filter(pk=prediction.pk).update(results_ready=False)

    response = admin_site.post(f"{PREDICTIONS}/{prediction.id}/delete/", {"post": "yes"})
    with pytest.raises(ResourceInUseException):
        delete_prediction(prediction)

    assert response.status_code == 403
    assert Prediction.objects.filter(pk=prediction.pk).exists()
    mock_remove.assert_not_called()


@patch("predictions.deletion.remove_dir")
def test_a_failed_file_delete_keeps_the_prediction(mock_remove, user: OsmUser) -> None:
    prediction = _prediction(user, "run-5", "completed")
    mock_remove.side_effect = OSError("bucket unreachable")

    with pytest.raises(OSError):
        delete_prediction(prediction)

    assert Prediction.objects.filter(pk=prediction.pk).exists()
