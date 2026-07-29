from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from predictions.models import Prediction


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=7, username="carol")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


_LOCAL_MODEL_UUID = "3a0374bf-d73c-4b4d-b165-081ffa2a18ad"
_TMS_URL = "https://tile.example.com/{z}/{x}/{y}.png"
_BBOX = [85.5, 27.6, 85.51, 27.61]


@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_creates_record_and_enqueues(mock_task, mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"confidence_threshold": 0.5},
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    assert Prediction.objects.count() == 1
    prediction = Prediction.objects.first()
    assert prediction is not None
    assert prediction.local_model_stac_id == _LOCAL_MODEL_UUID
    assert prediction.bbox == _BBOX
    assert prediction.zoom == 19
    mock_task.enqueue.assert_called_once()


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", side_effect=[False, True])
def test_prediction_submit_accepts_base_model(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "dinov3s-buildings",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    assert Prediction.objects.get().local_model_stac_id == "dinov3s-buildings"
    mock_task.enqueue.assert_called_once()


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", side_effect=[False, False])
def test_prediction_submit_404s_when_model_missing(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "ghost", "image_uri": _TMS_URL, "bbox": _BBOX, "zoom": 19},
        format="json",
    )
    assert response.status_code == 404
    assert Prediction.objects.count() == 0
    mock_task.enqueue.assert_not_called()


def test_prediction_submit_rejects_bad_bbox(client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": [85.51, 27.61, 85.5, 27.6],
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 400


def test_prediction_submit_rejects_zoom_out_of_range(client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 5,
        },
        format="json",
    )
    assert response.status_code == 400


@patch("predictions.views.get_run_status")
@patch("predictions.views.is_terminal")
def test_prediction_run_status(mock_terminal, mock_status, client, authed_user):
    mock_status.return_value = "completed"
    mock_terminal.return_value = True
    Prediction.objects.create(
        zenml_run_id="zen-123",
        local_model_stac_id=_LOCAL_MODEL_UUID,
        image_uri=_TMS_URL,
        bbox=_BBOX,
        zoom=19,
        user=authed_user,
    )
    response = client.get("/api/v1/predictions/runs/zen-123/status/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["is_terminal"] is True
