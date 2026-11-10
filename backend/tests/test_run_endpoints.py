from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from zenml.exceptions import IllegalOperationError

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from predictions.models import Prediction
from trainings.models import TrainingRunRef

_RUN_ID = "run-7"
_TRAINING_RUNS = "/api/v1/trainings/runs"
_PREDICTION_RUNS = "/api/v1/predictions/runs"


@pytest.fixture
def prediction(user: OsmUser) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id=_RUN_ID,
        local_model_stac_id="dinov3s-buildings",
        imagery={"image": "https://tile.example.com/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]},
        zoom=19,
        user=user,
    )


@pytest.fixture
def training_run(user: OsmUser) -> TrainingRunRef:
    base_model = BaseModel.objects.create(name="unet", stac_item_id="unet", user=user)
    local_model = LocalModel.objects.create(name="erin-trees", base_model=base_model, user=user)
    return TrainingRunRef.objects.create(
        zenml_run_id=_RUN_ID, local_model=local_model, base_model_stac_id="unet", user=user
    )


@pytest.mark.parametrize("action", ["status", "logs"])
def test_anonymous_run_status_and_logs_require_login(training_run: TrainingRunRef, action: str) -> None:
    response = APIClient().get(f"{_TRAINING_RUNS}/{_RUN_ID}/{action}/")

    assert response.status_code == 401


@pytest.mark.parametrize("tail", ["abc", "0"])
def test_run_logs_rejects_invalid_tail(client: APIClient, training_run: TrainingRunRef, tail: str) -> None:
    response = client.get(f"{_TRAINING_RUNS}/{_RUN_ID}/logs/?tail={tail}")

    assert response.status_code == 400


@patch("shared.run_endpoints.fetch_step_logs", side_effect=KeyError("step 'nope' not found. Available: train_model"))
def test_run_logs_unknown_step_is_not_found(mock_fetch, client: APIClient, training_run: TrainingRunRef) -> None:
    response = client.get(f"{_TRAINING_RUNS}/{_RUN_ID}/logs/?step=nope")

    assert response.status_code == 404
    assert "Available: train_model" in str(response.json())


@patch("shared.run_endpoints.fetch_run_logs", return_value=[])
def test_run_logs_passes_since_as_datetime(mock_fetch, client: APIClient, training_run: TrainingRunRef) -> None:
    response = client.get(f"{_TRAINING_RUNS}/{_RUN_ID}/logs/?since=2026-10-06T16:30:00Z")

    assert response.status_code == 200
    mock_fetch.assert_called_once_with(_RUN_ID, tail=1000, since=datetime(2026, 10, 6, 16, 30, tzinfo=UTC))


@patch("predictions.views.stop_pipeline_run")
def test_cancel_of_another_users_run_is_forbidden(mock_stop, prediction: Prediction) -> None:
    other = APIClient()
    other.force_authenticate(user=OsmUser.objects.create(osm_id=32, username="frank"))

    response = other.post(f"{_PREDICTION_RUNS}/{_RUN_ID}/cancel/")

    assert response.status_code == 403
    mock_stop.assert_not_called()
    prediction.refresh_from_db()
    assert prediction.status != "stopping"


def test_cancel_of_an_unknown_run_is_not_found(client: APIClient) -> None:
    response = client.post(f"{_PREDICTION_RUNS}/no-such-run/cancel/")

    assert response.status_code == 404


@patch("zenml.client.Client")
@patch("zenml.utils.run_utils.stop_run", side_effect=IllegalOperationError("Run is already finished"))
def test_cancel_of_a_finished_run_is_a_conflict(
    mock_stop, mock_client, client: APIClient, prediction: Prediction
) -> None:
    response = client.post(f"{_PREDICTION_RUNS}/{_RUN_ID}/cancel/")

    assert response.status_code == 409
    prediction.refresh_from_db()
    assert prediction.status != "stopping"
