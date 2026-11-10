
import pytest
from django.contrib.gis.geos import Polygon

from datasets.models import AOI, Dataset
from accounts.models import OsmUser


@pytest.fixture
def aoi(db, user: OsmUser) -> AOI:
    placeholder = Dataset.objects.create(
        stac_id="placeholder",
        title="placeholder",
        imagery={"image": "https://tiles.example/{z}/{x}/{y}.png"},
        primary_input="image",
        user=user,
    )
    polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326)
    return AOI.objects.create(dataset=placeholder, geom=polygon, user=user)


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
            "category": "buildings",
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


def test_dataset_build_requires_category(client, aoi):
    response = client.post(
        "/api/v1/datasets/build/",
        data={
            "title": "My dataset",
            "description": "demo",
            "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
            "zoom": 19,
            "aoi_ids": [aoi.id],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{"name": "building", "classes": ["yes"]}],
            "keywords": ["buildings"],
            "geometry_type": "polygon",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "category" in response.json()["error"]["details"]


def test_generic_dataset_create_is_not_offered(client):
    response = client.post("/api/v1/datasets/", data={"title": "Direct"}, format="json")
    assert response.status_code == 405
