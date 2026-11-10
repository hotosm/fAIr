from datetime import UTC, datetime
from unittest.mock import patch

import pystac
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from accounts.models import OsmUser
from modelregistry.models import BaseModel, Category, LocalModel
from predictions.models import Prediction
from shared.enums import Visibility

_SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}


@pytest.fixture
def base_model(user: OsmUser) -> BaseModel:
    waste, _ = Category.objects.get_or_create(slug="solid-waste", defaults={"label": "Solid waste"})
    return BaseModel.objects.create(name="waste", stac_item_id="waste-base", category=waste, user=user)


@pytest.fixture
def local_model(user: OsmUser, base_model: BaseModel) -> LocalModel:
    buildings, _ = Category.objects.get_or_create(slug="buildings", defaults={"label": "Buildings"})
    return LocalModel.objects.create(
        name="banepa", stac_item_id="banepa-local", base_model=base_model, category=buildings, user=user
    )


def _prediction(user: OsmUser, model_id: str, visibility: str = Visibility.PRIVATE) -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id=model_id,
        imagery={"image": "https://tile.example.com/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry=_SQUARE,
        zoom=19,
        user=user,
        visibility=visibility,
    )


@pytest.mark.parametrize(("model_id", "expected"), [("banepa-local", "buildings"), ("waste-base", "solid-waste"), ("removed-model", None)])
def test_prediction_detail_reports_the_model_category(
    client: APIClient, user: OsmUser, local_model: LocalModel, model_id: str, expected: str | None
) -> None:
    prediction = _prediction(user, model_id)

    response = client.get(f"/api/v1/predictions/{prediction.id}/")

    assert response.status_code == 200
    assert response.json()["category"] == expected


@pytest.mark.parametrize(("model_id", "expected"), [("banepa-local", "banepa"), ("waste-base", "waste"), ("removed-model", None)])
def test_prediction_detail_reports_the_model_name(
    client: APIClient, user: OsmUser, local_model: LocalModel, model_id: str, expected: str | None
) -> None:
    prediction = _prediction(user, model_id)

    response = client.get(f"/api/v1/predictions/{prediction.id}/")

    assert response.status_code == 200
    assert response.json()["model_name"] == expected


def test_prediction_list_category_costs_no_query_per_row(client: APIClient, user: OsmUser, local_model: LocalModel) -> None:
    _prediction(user, "banepa-local")
    with CaptureQueriesContext(connection) as one_row:
        client.get("/api/v1/predictions/")
    for _ in range(4):
        _prediction(user, "waste-base")
    with CaptureQueriesContext(connection) as five_rows:
        response = client.get("/api/v1/predictions/")

    assert sorted(row["category"] for row in response.json()["results"]) == ["buildings"] + ["solid-waste"] * 4
    assert len(five_rows) == len(one_row)


def _single_image_model() -> pystac.Item:
    item = pystac.Item("banepa-local", None, None, datetime.now(UTC), {"mlm:input": [{"name": "image"}]})
    item.add_asset("mlm:training", pystac.Asset("ghcr.io/hotosm/fair-models/banepa:latest"))
    return item


@patch("predictions.views.get_item", return_value=_single_image_model())
@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", return_value=True)
def test_submit_response_includes_the_category(
    mock_exists, mock_task, mock_get_item, client: APIClient, local_model: LocalModel
) -> None:
    response = client.post(
        "/api/v1/predictions/submit/",
        {"model_stac_id": "banepa-local", "image_uri": "https://tile.example.com/{z}/{x}/{y}.png", "bbox": [85.5, 27.6, 85.51, 27.61], "zoom": 19},
        format="json",
    )

    assert response.status_code == 202
    assert response.json()["category"] == "buildings"


def test_anonymous_prediction_list_reports_the_category(user: OsmUser, local_model: LocalModel) -> None:
    _prediction(user, "banepa-local", visibility=Visibility.PUBLIC)

    response = APIClient().get("/api/v1/predictions/")

    assert [row["category"] for row in response.json()["results"]] == ["buildings"]


def test_local_model_category_wins_over_a_base_model_with_the_same_id(
    client: APIClient, user: OsmUser, local_model: LocalModel, base_model: BaseModel
) -> None:
    BaseModel.objects.create(name="clash", stac_item_id="banepa-local", category=base_model.category, user=user)
    prediction = _prediction(user, "banepa-local")

    response = client.get(f"/api/v1/predictions/{prediction.id}/")

    assert response.json()["category"] == "buildings"


def test_publish_response_includes_the_category(client: APIClient, user: OsmUser, local_model: LocalModel) -> None:
    prediction = _prediction(user, "banepa-local")
    prediction.results_ready = True
    prediction.save(update_fields=["results_ready"])

    response = client.post(f"/api/v1/predictions/{prediction.id}/publish/")

    assert response.status_code == 200
    assert response.json()["category"] == "buildings"


def test_a_failure_error_is_shown_to_the_owner_and_hidden_from_everyone_else(
    client: APIClient, user: OsmUser, local_model: LocalModel
) -> None:
    prediction = _prediction(user, "banepa-local", visibility=Visibility.PUBLIC)
    prediction.status = "failed"
    prediction.error = "RuntimeError: tiles at http://minio:9000/fair-data timed out"
    prediction.save(update_fields=["status", "error"])

    as_owner = client.get(f"/api/v1/predictions/{prediction.id}/").json()
    as_anonymous = APIClient().get(f"/api/v1/predictions/{prediction.id}/").json()

    assert as_owner["error"] == prediction.error
    assert as_anonymous["error"] == ""
