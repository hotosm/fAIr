import importlib
from unittest.mock import patch

import httpx
import pytest
from django.apps import apps
from rest_framework.test import APIClient

from accounts.models import OsmUser
from feedback.models import Feedback
from modelregistry.models import BaseModel, Category, LocalModel
from modelregistry.usage import model_titles, registered_model_name
from predictions.models import Prediction
from shared.enums import Visibility

_SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
_POINT = {"type": "Point", "coordinates": [0.5, 0.5]}


@pytest.fixture
def base_model(user: OsmUser) -> BaseModel:
    category, _ = Category.objects.get_or_create(slug="trees", defaults={"label": "Trees"})
    return BaseModel.objects.create(
        name="trees",
        stac_item_id="trees-base",
        category=category,
        user=user,
        status=BaseModel.Status.ACTIVE,
        visibility=Visibility.PUBLIC,
    )


@pytest.fixture
def local_model(user: OsmUser, base_model: BaseModel) -> LocalModel:
    return LocalModel.objects.create(
        name="freetown-trees",
        stac_item_id="freetown-v2",
        base_model=base_model,
        category=base_model.category,
        user=user,
        status=LocalModel.Status.ACTIVE,
        visibility=Visibility.PUBLIC,
    )


def _prediction(user: OsmUser, stac_id: str, model_name: str = "") -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id=stac_id,
        model_name=model_name,
        imagery={"image": "https://tile.example.com/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry=_SQUARE,
        zoom=19,
        user=user,
    )


@pytest.mark.parametrize(
    ("stac_id", "expected"),
    [("freetown-v2", "freetown-trees"), ("trees-base", "trees"), ("removed", "")],
    ids=["local-model", "base-model", "unknown"],
)
def test_registered_model_name_resolves_registered_models(local_model, stac_id, expected):
    assert registered_model_name(stac_id) == expected


def test_usage_counts_add_up_across_local_model_versions(client, user, other_user, local_model):
    _prediction(user, "freetown-v1", "freetown-trees")
    _prediction(user, "freetown-v2", "freetown-trees")
    _prediction(other_user, "freetown-v2", "freetown-trees")
    _prediction(user, "trees-base", "trees")
    Feedback.objects.create(stac_id="freetown-v2", model_name="freetown-trees", geom="POINT(0.5 0.5)", user=user)

    body = client.get(f"/api/v1/local-models/{local_model.id}/").json()

    assert (body["map_request_count"], body["user_count"], body["feedback_count"]) == (3, 2, 1)


def test_base_model_reports_its_own_usage_and_local_models(client, user, base_model, local_model):
    _prediction(user, "trees-base", "trees")
    LocalModel.objects.create(
        name="bo-trees", base_model=base_model, category=base_model.category, user=user
    )

    body = client.get(f"/api/v1/base-models/{base_model.id}/").json()

    assert (body["map_request_count"], body["local_model_count"], body["prediction_runs"]) == (1, 2, 0)


def test_anyone_can_count_a_run_of_a_public_model(local_model):
    for _ in range(2):
        response = APIClient().post("/api/v1/prediction-runs/", {"stac_id": "freetown-v2"}, format="json")
        assert response.status_code == 204

    local_model.refresh_from_db()
    assert local_model.prediction_runs == 2


@pytest.mark.parametrize(
    ("change", "signed_in"),
    [
        ({"visibility": Visibility.PRIVATE}, True),
        ({"visibility": Visibility.PRIVATE}, False),
        ({"status": LocalModel.Status.ARCHIVED}, False),
    ],
    ids=["private-other-user", "private-anonymous", "archived-public"],
)
def test_a_run_of_a_model_the_caller_cannot_see_is_not_counted(
    local_model, other_user, change, signed_in
):
    LocalModel.objects.filter(pk=local_model.pk).update(**change)
    caller = APIClient()
    if signed_in:
        caller.force_authenticate(user=other_user)

    response = caller.post("/api/v1/prediction-runs/", {"stac_id": "freetown-v2"}, format="json")

    assert response.status_code == 404
    local_model.refresh_from_db()
    assert local_model.prediction_runs == 0


def test_a_run_of_a_base_model_is_counted_on_the_base_model(base_model):
    response = APIClient().post("/api/v1/prediction-runs/", {"stac_id": "trees-base"}, format="json")

    assert response.status_code == 204
    base_model.refresh_from_db()
    assert base_model.prediction_runs == 1


def test_a_run_without_a_stac_id_is_rejected(local_model):
    response = APIClient().post("/api/v1/prediction-runs/", {"stac_id": ""}, format="json")

    assert response.status_code == 400


def test_the_owner_can_count_a_run_of_a_private_model(client, local_model):
    LocalModel.objects.filter(pk=local_model.pk).update(visibility=Visibility.PRIVATE)

    response = client.post("/api/v1/prediction-runs/", {"stac_id": "freetown-v2"}, format="json")

    assert response.status_code == 204
    local_model.refresh_from_db()
    assert local_model.prediction_runs == 1


def test_feedback_records_the_model_name(client, local_model):
    feature = {
        "type": "Feature",
        "geometry": _POINT,
        "properties": {"stac_id": "freetown-v2", "action": "accept", "comments": "", "config": {}},
    }

    response = client.post("/api/v1/feedback/", feature, format="json")

    assert response.status_code == 201
    assert Feedback.objects.get(id=response.json()["properties"]["id"]).model_name == "freetown-trees"


def test_feedback_moved_to_another_model_records_its_name(client, user, local_model):
    feedback = Feedback.objects.create(
        stac_id="freetown-v2", model_name="freetown-trees", geom="POINT(0.5 0.5)", user=user
    )

    response = client.patch(
        f"/api/v1/feedback/{feedback.id}/",
        {"type": "Feature", "properties": {"stac_id": "trees-base"}},
        format="json",
    )

    assert response.status_code == 200
    feedback.refresh_from_db()
    assert feedback.model_name == "trees"


@pytest.mark.parametrize(
    "failure",
    [httpx.ConnectError("down"), KeyError("freetown-v2"), ValueError("not JSON")],
    ids=["unreachable", "missing-item", "invalid-response"],
)
def test_prediction_list_still_loads_when_stac_fails(client, user, local_model, failure):
    _prediction(user, "freetown-v2", "freetown-trees")

    with patch("modelregistry.usage.bulk_get_cached_items", side_effect=failure):
        response = client.get("/api/v1/predictions/")

    assert response.status_code == 200
    row = response.json()["results"][0]
    assert (row["model_title"], row["model_name"]) == (None, "freetown-trees")


def test_model_titles_reads_only_current_items(local_model):
    with patch("modelregistry.usage.bulk_get_cached_items") as fetch:
        fetch.return_value = {("local-models", "freetown-v2"): {"properties": {"title": "Freetown trees"}}}
        titles = model_titles({"freetown-v2", "freetown-v1"})

    fetch.assert_called_once_with([("local-models", "freetown-v2")])
    assert titles == {"freetown-v2": "Freetown trees"}


@pytest.mark.parametrize("properties", [{}, {"title": ""}], ids=["missing", "empty"])
def test_model_titles_maps_a_missing_or_empty_title_to_none(local_model, properties):
    with patch("modelregistry.usage.bulk_get_cached_items") as fetch:
        fetch.return_value = {("local-models", "freetown-v2"): {"properties": properties}}

        assert model_titles({"freetown-v2"}) == {"freetown-v2": None}


@pytest.mark.parametrize(
    ("module", "model"),
    [
        ("predictions.migrations.0013_prediction_model_name", Prediction),
        ("feedback.migrations.0003_feedback_model_name", Feedback),
    ],
)
def test_backfill_names_rows_whose_item_is_current(user, local_model, module, model):
    common = {"user": user}
    if model is Prediction:
        current = _prediction(user, "freetown-v2")
        older = _prediction(user, "freetown-v1")
    else:
        current = Feedback.objects.create(stac_id="freetown-v2", geom="POINT(0.5 0.5)", **common)
        older = Feedback.objects.create(stac_id="freetown-v1", geom="POINT(0.5 0.5)", **common)

    importlib.import_module(module).backfill_model_name(apps, None)

    assert model.objects.get(pk=current.pk).model_name == "freetown-trees"
    assert model.objects.get(pk=older.pk).model_name == ""
