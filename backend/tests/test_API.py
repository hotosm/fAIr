from unittest.mock import patch

import pytest
import responses
from rest_framework.test import APIClient

API_URL = "/api/v1"
ACCESS_TOKEN = "test-access-token"


@pytest.fixture
def client():
    c = APIClient()
    c.credentials(HTTP_ACCESS_TOKEN=ACCESS_TOKEN)
    return c


@patch("login.authentication.CustomTokenAuthentication.authenticate")
@responses.activate
def test_full_api_workflow(mock_auth, client):
    class DummyUser:
        is_authenticated = True
        osm_id = 1
        username = "testuser"

    mock_auth.return_value = (DummyUser(), None)
    responses.add(
        responses.POST,
        "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
        body="",
        status=200,
    )
    dataset_payload = {
        "name": "Building Detection Nepal",
        "source_imagery": "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
        "status": -1,
        "offset": [0.0, 0.0],
    }
    dataset_resp = client.post(f"{API_URL}/datasets/", dataset_payload, format="json")
    assert dataset_resp.status_code == 201
    dataset_id = dataset_resp.data["id"]

    aoi_payload = {
        "dataset": dataset_id,
        "geom": {
            "type": "Polygon",
            "coordinates": [
                [
                    [85.3240, 27.7172],
                    [85.3250, 27.7172],
                    [85.3250, 27.7182],
                    [85.3240, 27.7182],
                    [85.3240, 27.7172],
                ]
            ],
        },
    }
    aoi_resp = client.post(f"{API_URL}/aois/", aoi_payload, format="json")
    assert aoi_resp.status_code == 201
    aoi_id = aoi_resp.data["id"]

    osm_labels_resp = client.post(
        f"{API_URL}/labels/fetch_osm/", {"aoi": aoi_id}, format="json"
    )
    assert osm_labels_resp.status_code == 200

    label_payload = {
        "aoi": aoi_id,
        "geom": {
            "type": "Polygon",
            "coordinates": [
                [
                    [85.32405, 27.71725],
                    [85.32410, 27.71725],
                    [85.32410, 27.71730],
                    [85.32405, 27.71730],
                    [85.32405, 27.71725],
                ]
            ],
        },
        "tags": {"building": "yes"},
    }
    label_resp = client.post(f"{API_URL}/labels/", label_payload, format="json")
    assert label_resp.status_code == 201
    label_id = label_resp.data["id"]

    model_payload = {
        "dataset": dataset_id,
        "name": "YOLOv8 Building Model v1",
        "description": "Building detection model trained on Kathmandu imagery",
        "base_model": "YOLO_V8_V1",
        "status": -1,
    }
    model_resp = client.post(f"{API_URL}/models/", model_payload, format="json")
    assert model_resp.status_code == 201
    model_id = model_resp.data["id"]

    training_payload = {
        "model": model_id,
        "description": "Training run with 50 epochs",
        "epochs": 50,
        "batch_size": 8,
        "zoom_level": [19, 20],
    }
    training_resp = client.post(
        f"{API_URL}/trainings/", training_payload, format="json"
    )
    assert training_resp.status_code == 201
    training_id = training_resp.data["id"]

    # prediction_payload = {
    #     "bbox": [85.3240, 27.7172, 85.3250, 27.7182],
    #     "model_id": model_id,
    #     "zoom_level": 20,
    #     "confidence": 50,
    #     "source": "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
    # }
    # prediction_resp = client.post(f"{API_URL}/predictions/", prediction_payload, format="json")
    # assert prediction_resp.status_code == 201
    # prediction_id = prediction_resp.data["id"]
