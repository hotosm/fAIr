from unittest.mock import patch

import pytest
from django.contrib.gis.geos import Polygon
from rest_framework.test import APIClient

from datasets.models import AOI, Dataset
from accounts.models import OsmUser


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=42, username="alice")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


@pytest.fixture
def aoi(db, authed_user: OsmUser) -> AOI:
    placeholder = Dataset.objects.create(
        stac_id="placeholder",
        title="placeholder",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        user=authed_user,
    )
    polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326)
    return AOI.objects.create(dataset=placeholder, geom=polygon, user=authed_user)


def test_dataset_list_returns_owned_records(client, authed_user):
    Dataset.objects.create(
        stac_id="ds-1",
        title="Test 1",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        user=authed_user,
    )
    response = client.get("/api/v1/datasets/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    assert payload["results"][0]["stac_id"] == "ds-1"


def test_dataset_build_validates_tms_url(client, aoi):
    response = client.post(
        "/api/v1/datasets/build/",
        data={
            "title": "My dataset",
            "description": "demo",
            "source_imagery": "https://tiles.example/static.png",
            "aoi_ids": [aoi.id],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{"name": "building"}],
            "keywords": ["buildings"],
        },
        format="json",
    )
    assert response.status_code == 400
    assert "source_imagery" in response.json()["error"]["details"]


def test_dataset_build_rejects_label_class_without_name(client, aoi):
    response = client.post(
        "/api/v1/datasets/build/",
        data={
            "title": "My dataset",
            "description": "demo",
            "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
            "zoom": 19,
            "aoi_ids": [aoi.id],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{}],
            "keywords": ["buildings"],
        },
        format="json",
    )
    assert response.status_code == 400


def test_dataset_build_rejects_unknown_aoi(client):
    response = client.post(
        "/api/v1/datasets/build/",
        data={
            "title": "My dataset",
            "description": "demo",
            "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
            "zoom": 19,
            "aoi_ids": [99999],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{"name": "building", "classes": ["yes"]}],
            "keywords": ["buildings"],
            "geometry_type": "polygon",
        },
        format="json",
    )
    assert response.status_code == 404


@patch("datasets.views.build_dataset")
def test_dataset_build_enqueues_task_and_returns_202(mock_task, client, aoi):
    response = client.post(
        "/api/v1/datasets/build/",
        data={
            "title": "Buildings Banepa",
            "description": "demo",
            "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
            "zoom": 19,
            "aoi_ids": [aoi.id],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{"name": "building", "classes": ["yes"], "color": "#ff0000"}],
            "keywords": ["buildings"],
            "label_type": "vector",
            "geometry_type": "polygon",
        },
        format="json",
    )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "building"
    assert body["title"] == "Buildings Banepa"
    mock_task.enqueue.assert_called_once()
    assert Dataset.objects.filter(title="Buildings Banepa").count() == 1


def test_unauthenticated_dataset_list_returns_only_public(db):
    api = APIClient()
    response = api.get("/api/v1/datasets/")
    assert response.status_code == 200
    assert response.json()["results"] == []
