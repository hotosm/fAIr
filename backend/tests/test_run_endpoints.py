from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from zenml.exceptions import IllegalOperationError

from accounts.models import OsmUser
from predictions.models import Prediction

_RUN_ID = "run-7"
_RUNS = "/api/v1/predictions/runs"


@pytest.fixture
def owner(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=31, username="erin")


@pytest.fixture
def client(owner: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=owner)
    return api


@pytest.fixture
def prediction(owner: OsmUser) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id=_RUN_ID,
        local_model_stac_id="dinov3s-buildings",
        image_uri="https://tile.example.com/{z}/{x}/{y}.png",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]},
        zoom=19,
        user=owner,
    )


@pytest.mark.parametrize("action", ["status", "logs"])
def test_anonymous_run_status_and_logs_require_login(prediction: Prediction, action: str) -> None:
    response = APIClient().get(f"{_RUNS}/{_RUN_ID}/{action}/")

    assert response.status_code == 401


@pytest.mark.parametrize("tail", ["abc", "0"])
def test_run_logs_rejects_invalid_tail(client: APIClient, prediction: Prediction, tail: str) -> None:
    response = client.get(f"{_RUNS}/{_RUN_ID}/logs/?tail={tail}")

    assert response.status_code == 400


@patch("shared.run_endpoints.fetch_step_logs", side_effect=KeyError("step 'nope' not found. Available: run_inference"))
def test_run_logs_unknown_step_is_not_found(mock_fetch, client: APIClient, prediction: Prediction) -> None:
    response = client.get(f"{_RUNS}/{_RUN_ID}/logs/?step=nope")

    assert response.status_code == 404
    assert "Available: run_inference" in str(response.json())


@patch("shared.run_endpoints.fetch_run_logs", return_value=[])
def test_run_logs_passes_since_as_datetime(mock_fetch, client: APIClient, prediction: Prediction) -> None:
    response = client.get(f"{_RUNS}/{_RUN_ID}/logs/?since=2026-10-06T16:30:00Z")

    assert response.status_code == 200
    mock_fetch.assert_called_once_with(_RUN_ID, tail=1000, since=datetime(2026, 10, 6, 16, 30, tzinfo=UTC))


@patch("zenml.client.Client")
@patch("zenml.utils.run_utils.stop_run", side_effect=IllegalOperationError("Run is already finished"))
def test_cancel_of_a_finished_run_is_a_conflict(
    mock_stop, mock_client, client: APIClient, prediction: Prediction
) -> None:
    response = client.post(f"{_RUNS}/{_RUN_ID}/cancel/")

    assert response.status_code == 409
    prediction.refresh_from_db()
    assert prediction.status != "stopping"
