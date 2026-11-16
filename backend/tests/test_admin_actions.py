from unittest.mock import patch

import pytest
from django.test import Client

from accounts.models import OsmUser
from datasets.models import Dataset
from predictions.deletion import delete_prediction
from predictions.models import Prediction
from shared.integrations.stac import DATASETS_COLLECTION
from shared.storage import StoragePaths

PREDICTIONS = "/django-admin/predictions/prediction"


def _prediction(user: OsmUser, run_id: str, status: str) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id=run_id,
        local_model_stac_id="m",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={},
        zoom=19,
        status=status,
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


@patch("shared.run_endpoints.stop_pipeline_run")
def test_stop_action_stops_only_unfinished_runs(mock_stop, admin_site: Client, user: OsmUser) -> None:
    running = _prediction(user, "run-1", "running")
    finished = _prediction(user, "run-2", "completed")

    admin_site.post(PREDICTIONS + "/", {"action": "stop_runs", "_selected_action": [running.id, finished.id]})

    mock_stop.assert_called_once_with("run-1", graceful=False)
    running.refresh_from_db()
    assert running.status == "stopping"


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
def test_a_failed_file_delete_keeps_the_prediction(mock_remove, user: OsmUser) -> None:
    prediction = _prediction(user, "run-5", "completed")
    mock_remove.side_effect = OSError("bucket unreachable")

    with pytest.raises(OSError):
        delete_prediction(prediction)

    assert Prediction.objects.filter(pk=prediction.pk).exists()
