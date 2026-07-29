"""End-to-end API contract test.

One file that hits every URL in the public API surface, demonstrating the
expected request payload and the response body for each endpoint. External
integrations (ZenML, fair-py-ops, S3) are mocked at the seam, so no test
reaches a live service.

Run with `just test` (pytest tests/test_api.py).
"""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.gis.geos import Polygon
from django.test import override_settings
from rest_framework.test import APIClient

from accounts.models import OsmUser
from shared.storage import BackendLocalModelPaths
from datasets.models import AOI, Dataset
from feedback.models import Feedback
from modelregistry.models import BaseModel, LocalModel
from notifications.models import Banner, UserNotification
from predictions.models import Prediction
from trainings.models import TrainingRunRef


@pytest.fixture
def user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1001, username="alice")


@pytest.fixture
def admin_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1002, username="root", is_staff=True)


@pytest.fixture
def other_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=1003, username="eve")


@pytest.fixture
def client(user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def admin_client(admin_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=admin_user)
    return api


@pytest.fixture
def anon_client() -> APIClient:
    return APIClient()


@pytest.fixture
def aoi(db, user: OsmUser) -> AOI:
    polygon = Polygon(
        ((85.5, 27.6), (85.5, 27.61), (85.51, 27.61), (85.51, 27.6), (85.5, 27.6)),
        srid=4326,
    )
    return AOI.objects.create(geom=polygon, user=user)


@pytest.fixture
def registered_base_model(db, user: OsmUser) -> BaseModel:
    return BaseModel.objects.create(
        name="unet-segmentation",
        stac_item_id="unet-segmentation",
        category_id="buildings",
        user=user,
    )


@pytest.fixture
def local_model(db, user: OsmUser, registered_base_model: BaseModel) -> LocalModel:
    return LocalModel.objects.create(
        name="my-finetuned",
        base_model=registered_base_model,
        status=LocalModel.Status.ACTIVE,
        user=user,
    )


@pytest.fixture
def published_dataset(db, user: OsmUser) -> Dataset:
    return Dataset.objects.create(
        stac_id="ds-banepa",
        title="Banepa buildings",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        status=Dataset.Status.BUILT,
        user=user,
    )


@pytest.fixture
def training_ref(
    db, user: OsmUser, local_model: LocalModel, published_dataset: Dataset
) -> TrainingRunRef:
    return TrainingRunRef.objects.create(
        zenml_run_id="run-abc",
        local_model=local_model,
        base_model_stac_id="unet-segmentation",
        dataset=published_dataset,
        overrides={"epochs": 3},
        description="t1",
        user=user,
    )


@pytest.fixture
def prediction(db, user: OsmUser) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id="pred-run-1",
        local_model_stac_id="3a0374bf-d73c-4b4d-b165-081ffa2a18ad",
        image_uri="https://tiles.example/{z}/{x}/{y}.png",
        geometry={
            "type": "Polygon",
            "coordinates": [
                [[85.5, 27.6], [85.51, 27.6], [85.51, 27.61], [85.5, 27.61], [85.5, 27.6]]
            ],
        },
        zoom=19,
        params={},
        description="p1",
        status="completed",
        results_ready=True,
        user=user,
    )


def test_root_home_describes_api(anon_client):
    response = anon_client.get("/api/")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "fAIr API"
    assert body["api_version"] == "v1"
    assert body["app_version"]  # sourced from pyproject.toml
    assert body["schema"] == "/api/schema/"
    assert body["docs"] == "/api/docs/"


def test_openapi_schema_is_served(anon_client):
    response = anon_client.get("/api/schema/")
    assert response.status_code == 200
    assert b"openapi" in response.content


def test_kpi_stats_returns_counts(anon_client, db):
    response = anon_client.get("/api/v1/kpi/stats/")
    assert response.status_code == 200
    assert set(response.data) == {
        "total_models_published",
        "total_registered_users",
        "total_feedback_labels",
        "total_accepted_predictions",
    }


def test_swagger_ui_renders(anon_client):
    response = anon_client.get("/api/docs/")
    assert response.status_code == 200


def test_redoc_ui_renders(anon_client):
    response = anon_client.get("/api/redoc/")
    assert response.status_code == 200


def test_health_reports_dependency_status(anon_client, db):
    response = anon_client.get("/api/v1/health/")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["postgresql"], bool)
    assert body["postgresql"] is True


def test_auth_status_returns_provider_and_authenticated_flag(anon_client, db):
    response = anon_client.get("/api/v1/auth/status/")
    assert response.status_code == 200
    body = response.json()
    assert body["auth_provider"] in ("dev", "hanko")
    assert body["authenticated"] is False


def test_auth_me_get_returns_user_profile(client, user):
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 201
    body = response.json()
    assert body["osm_id"] == user.osm_id
    assert body["username"] == "alice"
    assert body["email_verified"] is False
    assert body["date_joined"] is not None
    for key in (
        "models_count",
        "datasets_count",
        "feedbacks_count",
        "approved_predictions_count",
        "unread_notifications_count",
    ):
        assert body[key] == 0
    # Base 25%; no img_url, email, or verification on this fixture user.
    assert body["profile_completion_percentage"] == 25


def test_auth_me_profile_stats_reflect_owned_records(client, user):
    from datasets.models import Dataset
    from feedback.models import Feedback
    from modelregistry.models import BaseModel, LocalModel
    from notifications.models import UserNotification
    from shared.enums import FeedbackAction

    geom = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326)
    base = BaseModel.objects.create(name="b", stac_item_id="b", user=user)
    LocalModel.objects.create(name="m1", base_model=base, user=user)
    Dataset.objects.create(stac_id="d1", title="D1", source_imagery="https://x/{z}/{x}/{y}", user=user)
    Feedback.objects.create(stac_id="s1", action=FeedbackAction.ACCEPT, geom=geom, user=user)
    Feedback.objects.create(stac_id="s2", action=FeedbackAction.REJECT, geom=geom, user=user)
    UserNotification.objects.create(user=user, message="hi", is_read=False)

    body = client.get("/api/v1/auth/me/").json()
    assert body["models_count"] == 1
    assert body["datasets_count"] == 1
    assert body["approved_predictions_count"] == 1
    assert body["feedbacks_count"] == 1
    assert body["unread_notifications_count"] == 1


def test_auth_me_patch_updates_email(client):
    response = client.patch(
        "/api/v1/auth/me/", data={"email": "alice@example.com"}, format="json"
    )
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_auth_me_request_email_verification_400s_without_email(client):
    response = client.post("/api/v1/auth/me/request-email-verification/")
    assert response.status_code == 400
    assert response.json()["message"] == "Email address not found"


def test_auth_me_requires_authentication(anon_client):
    response = anon_client.get("/api/v1/auth/me/")
    assert response.status_code in (401, 403)


def test_aoi_create_returns_geojson_feature(client):
    payload = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[0, 0], [0, 0.01], [0.01, 0.01], [0.01, 0], [0, 0]]],
        },
        "properties": {},
    }
    response = client.post("/api/v1/aois/", data=payload, format="json")
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["type"] == "Feature"
    assert body["geometry"]["type"] == "Polygon"
    assert body["properties"]["user"]["username"] == "alice"


def test_aoi_list_paginates(client, aoi):
    response = client.get("/api/v1/aois/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"]["type"] == "FeatureCollection"
    assert body["results"]["features"][0]["properties"]["id"] == aoi.id


def test_aoi_retrieve_returns_single_feature(client, aoi):
    response = client.get(f"/api/v1/aois/{aoi.id}/")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "Feature"
    assert body["properties"]["id"] == aoi.id


def test_aoi_gpx_export_returns_xml(client, aoi):
    response = client.get(f"/api/v1/aois/gpx/{aoi.id}/")
    assert response.status_code == 200
    assert response["Content-Type"] == "application/xml"
    assert b"<gpx" in response.content


@patch("datasets.views.build_dataset")
def test_dataset_build_creates_record_and_enqueues(mock_task, client, aoi):
    payload = {
        "title": "Buildings Banepa",
        "description": "demo",
        "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
        "category": "buildings",
        "zoom": 19,
        "aoi_ids": [aoi.id],
        "label_tasks": ["semantic-segmentation"],
        "label_classes": [{"name": "building", "classes": ["yes"]}],
        "keywords": ["buildings"],
        "geometry_type": "polygon",
    }
    response = client.post("/api/v1/datasets/build/", data=payload, format="json")
    assert response.status_code == 202, response.content
    body = response.json()
    assert body["title"] == "Buildings Banepa"
    assert body["status"] == "building"
    # Temp stac_id is slug + random suffix to avoid unique-constraint
    # collisions when two datasets share a title; the build task overwrites
    # this with the published STAC id.
    assert body["stac_id"].startswith("buildings-banepa-")
    assert body["star_count"] == 0
    assert body["is_starred"] is False
    assert body["user"]["username"] == "alice"
    mock_task.enqueue.assert_called_once()
    enqueue_kwargs = mock_task.enqueue.call_args.kwargs
    assert enqueue_kwargs["geometry_type"] == "polygon"
    assert "feature_type" not in enqueue_kwargs


def test_build_osm_filters_simple():
    from datasets.tasks import _build_osm_filters

    filters = _build_osm_filters(
        [{"name": "building", "classes": ["yes"]}], "polygon"
    )
    assert filters == {
        "tags": {"polygon": {"join_or": {"building": ["yes"]}}}
    }


def test_build_osm_filters_wildcard_translates_to_empty_list():
    from datasets.tasks import _build_osm_filters

    filters = _build_osm_filters(
        [{"name": "building", "classes": ["*"]}], "polygon"
    )
    assert filters["tags"]["polygon"]["join_or"]["building"] == []


def test_build_osm_filters_multi_class():
    from datasets.tasks import _build_osm_filters

    filters = _build_osm_filters(
        [
            {"name": "building", "classes": ["*"]},
            {"name": "amenity", "classes": ["hospital", "school"]},
        ],
        "polygon",
    )
    assert filters == {
        "tags": {
            "polygon": {
                "join_or": {"building": [], "amenity": ["hospital", "school"]}
            }
        }
    }


def test_stamp_class_label_assigns_index_for_first_match():
    from datasets.tasks import _stamp_class_label

    label_classes = [
        {"name": "building", "classes": ["*"]},
        {"name": "amenity", "classes": ["hospital"]},
    ]
    feat_b = {"properties": {"tags": {"building": "yes"}}}
    feat_h = {"properties": {"tags": {"amenity": "hospital"}}}
    feat_none = {"properties": {"tags": {"highway": "primary"}}}

    assert _stamp_class_label(feat_b, label_classes) == 1
    assert feat_b["properties"]["label"] == 1
    assert _stamp_class_label(feat_h, label_classes) == 2
    assert feat_h["properties"]["label"] == 2
    assert _stamp_class_label(feat_none, label_classes) is None
    assert "label" not in feat_none["properties"]


def test_dataset_list_paginates(client, published_dataset):
    response = client.get("/api/v1/datasets/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["stac_id"] == "ds-banepa"


def test_dataset_retrieve_returns_record(client, published_dataset):
    response = client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 200
    body = response.json()
    assert body["stac_id"] == "ds-banepa"
    assert body["title"] == "Banepa buildings"
    assert body["status"] == "built"
    # Pinning lives in STAC properties; default response (no expand) has no `stac` field set.
    assert body["stac"] is None


def test_dataset_pin_blocks_non_admin(client, published_dataset):
    response = client.patch(
        f"/api/v1/datasets/{published_dataset.id}/pin/",
        data={"is_pinned": True},
        format="json",
    )
    assert response.status_code == 403


@patch("datasets.views.set_item_property")
def test_dataset_pin_writes_fair_pinned_to_stac(mock_set, admin_client, published_dataset):
    mock_set.return_value = {
        "description": "demo",
        "datetime": None,
        "geometry": None,
        "assets": {},
        "properties": {"fair:pinned": True},
        "links": [],
    }
    response = admin_client.patch(
        f"/api/v1/datasets/{published_dataset.id}/pin/",
        data={"is_pinned": True},
        format="json",
    )
    assert response.status_code == 200
    mock_set.assert_called_once()
    args = mock_set.call_args.args
    assert args[0] == "datasets"  # collection
    assert args[1] == published_dataset.stac_id
    assert args[2] == "fair:pinned"
    assert args[3] is True
    assert response.json()["stac"]["properties"]["fair:pinned"] is True


def test_local_model_list_paginates(client, local_model):
    response = client.get("/api/v1/local-models/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["name"] == "my-finetuned"
    assert body["results"][0]["run_count"] == 0


def test_local_model_retrieve_returns_record(client, local_model):
    response = client.get(f"/api/v1/local-models/{local_model.id}/")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "my-finetuned"
    assert body["status"] == "active"
    assert body["visibility"] == "private"
    assert body["star_count"] == 0
    assert body["run_count"] == 0
    assert "stac" not in body


@patch("modelregistry.views.list_runs_for_model")
def test_local_model_runs_returns_zenml_summaries(mock_list, client, local_model):
    summary = MagicMock(
        id="r1",
        status="completed",
        created_at="2026-05-01T00:00:00Z",
        pipeline_name="training_pipeline",
        model_name="my-finetuned",
        model_version=1,
    )
    summary.name = "run-1"
    mock_list.return_value = [summary]
    response = client.get(f"/api/v1/local-models/{local_model.id}/runs/")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0] == {
        "id": "r1",
        "name": "run-1",
        "status": "completed",
        "created_at": "2026-05-01T00:00:00Z",
        "pipeline_name": "training_pipeline",
        "model_name": "my-finetuned",
        "model_version": 1,
    }
    mock_list.assert_called_once_with("my-finetuned", limit=50)


def test_local_model_pin_blocks_non_admin(client, local_model):
    response = client.patch(
        f"/api/v1/local-models/{local_model.id}/pin/",
        data={"is_pinned": True},
        format="json",
    )
    assert response.status_code == 403


def test_local_model_pin_sets_db_flag(admin_client, local_model):
    assert local_model.is_pinned is False
    response = admin_client.patch(
        f"/api/v1/local-models/{local_model.id}/pin/",
        data={"is_pinned": True},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["is_pinned"] is True
    local_model.refresh_from_db()
    assert local_model.is_pinned is True


def test_local_model_unpin_clears_db_flag(admin_client, local_model):
    local_model.is_pinned = True
    local_model.save(update_fields=["is_pinned"])
    response = admin_client.patch(
        f"/api/v1/local-models/{local_model.id}/pin/",
        data={"is_pinned": False},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["is_pinned"] is False
    local_model.refresh_from_db()
    assert local_model.is_pinned is False


def test_local_models_filter_by_is_pinned(admin_client, local_model, admin_user):
    base = local_model.base_model
    LocalModel.objects.create(
        name="pinned-one", base_model=base, user=admin_user, is_pinned=True
    )
    response = admin_client.get("/api/v1/local-models/?is_pinned=true")
    assert response.status_code == 200
    names = {row["name"] for row in response.json()["results"]}
    assert names == {"pinned-one"}


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_creates_run_and_enqueues(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    payload = {
        "base_model_stac_id": "unet-segmentation",
        "dataset_stac_id": published_dataset.stac_id,
        "model_name": "tuned-v1",
        "overrides": {"epochs": 3, "learning_rate": 0.001},
        "description": "First attempt",
    }
    response = client.post("/api/v1/trainings/submit/", data=payload, format="json")
    assert response.status_code == 202, response.content
    body = response.json()
    assert body["status"] == "initializing"
    assert body["zenml_run_id"] is None
    assert body["overrides"] == {"epochs": 3, "learning_rate": 0.001}
    assert body["description"] == "First attempt"
    assert body["base_model_stac_id"] == "unet-segmentation"
    run = TrainingRunRef.objects.get(local_model__name="tuned-v1")
    assert run.local_model.base_model_id == registered_base_model.id
    assert run.local_model.category_id == registered_base_model.category_id == "buildings"
    mock_task.enqueue.assert_called_once()


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_persists_title_on_run_ref(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "tuned-v2",
            "title": "March retrain, buildings",
        },
        format="json",
    )
    assert response.status_code == 202, response.content
    run = TrainingRunRef.objects.get(local_model__name="tuned-v2")
    assert run.title == "March retrain, buildings"
    assert response.json()["title"] == "March retrain, buildings"


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_persists_keywords_on_run_ref(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "tuned-v3",
            "keywords": ["high-resolution", "march-batch"],
        },
        format="json",
    )
    assert response.status_code == 202, response.content
    run = TrainingRunRef.objects.get(local_model__name="tuned-v3")
    assert run.keywords == ["high-resolution", "march-batch"]


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_dedupes_keywords(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "tuned-v4",
            "keywords": ["building", "high-resolution", "building", "march", "high-resolution"],
        },
        format="json",
    )
    assert response.status_code == 202, response.content
    run = TrainingRunRef.objects.get(local_model__name="tuned-v4")
    assert run.keywords == ["building", "high-resolution", "march"]


def test_training_submit_404s_when_base_model_not_registered(client, published_dataset):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "ghost-base",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404
    assert "not a registered base model" in response.json()["error"]["details"]["detail"]


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_slugifies_model_name(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "Banepa  Buildings (v2)!",
        },
        format="json",
    )
    assert response.status_code == 202, response.content
    assert TrainingRunRef.objects.filter(local_model__name="banepa-buildings-v2").exists()


@patch("trainings.views.item_exists", return_value=True)
def test_training_submit_rejects_unslugifiable_model_name(
    mock_item_exists, client, published_dataset
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "!!!",
        },
        format="json",
    )
    assert response.status_code == 400


@patch("trainings.views.item_exists", return_value=True)
@patch("trainings.views.submit_training")
def test_training_submit_403s_when_model_owned_by_other_user(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model, db
):
    # `client` fixture authenticates as `alice`; create a model owned by bob.
    bob = OsmUser.objects.create(osm_id=999, username="bob")
    LocalModel.objects.create(name="bobs-model", base_model=registered_base_model, user=bob)
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "bobs-model",
        },
        format="json",
    )
    assert response.status_code == 403
    assert "owned by another user" in response.json()["detail"]
    mock_task.enqueue.assert_not_called()


def test_training_list_paginates(client, training_ref):
    response = client.get("/api/v1/trainings/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["zenml_run_id"] == "run-abc"


def test_training_retrieve_returns_record(client, training_ref):
    response = client.get(f"/api/v1/trainings/{training_ref.id}/")
    assert response.status_code == 200
    body = response.json()
    assert body["zenml_run_id"] == "run-abc"
    assert body["overrides"] == {"epochs": 3}
    assert body["status"] == "initializing"


@patch("trainings.views.get_run_status")
def test_training_run_status_polls_zenml(mock_status, client, training_ref):
    mock_status.return_value = "running"
    response = client.get("/api/v1/trainings/runs/run-abc/status/")
    assert response.status_code == 200
    assert response.json() == {
        "run_id": "run-abc",
        "status": "running",
        "is_terminal": False,
    }
    mock_status.assert_called_once_with("run-abc")


@patch("trainings.views.get_run_status")
def test_training_run_status_marks_terminal_for_completed(mock_status, client, training_ref):
    mock_status.return_value = "completed"
    response = client.get("/api/v1/trainings/runs/run-abc/status/")
    assert response.json()["is_terminal"] is True


@patch("trainings.views.fetch_run_logs")
def test_training_run_logs_default_returns_run_level(mock_fetch, client, training_ref):
    mock_fetch.return_value = [
        MagicMock(level="INFO", message="epoch 1 done", timestamp="2026-05-01T00:00:00Z")
    ]
    response = client.get("/api/v1/trainings/runs/run-abc/logs/?tail=10")
    assert response.status_code == 200
    assert response.json() == [
        {"level": "INFO", "message": "epoch 1 done", "timestamp": "2026-05-01T00:00:00Z"}
    ]
    mock_fetch.assert_called_once_with("run-abc", tail=10)


@patch("trainings.views.fetch_step_logs")
def test_training_step_logs_routes_to_step_when_param_present(mock_fetch, client, training_ref):
    mock_fetch.return_value = []
    response = client.get(
        "/api/v1/trainings/runs/run-abc/logs/?step=train_model&tail=5"
    )
    assert response.status_code == 200
    mock_fetch.assert_called_once_with("run-abc", "train_model", tail=5)


@patch("zenml.utils.run_utils.stop_run")
@patch("zenml.client.Client")
def test_training_run_cancel_stops_zenml_run(
    mock_client_cls, mock_stop, client, training_ref
):
    mock_client_cls.return_value.get_pipeline_run.return_value = MagicMock()
    response = client.post("/api/v1/trainings/runs/run-abc/cancel/")
    assert response.status_code == 200
    assert response.json() == {"run_id": "run-abc", "status": "stopping", "graceful": False}
    mock_stop.assert_called_once()


def test_training_run_status_403s_for_non_owner(other_user, training_ref):
    other = APIClient()
    other.force_authenticate(user=other_user)
    response = other.get(f"/api/v1/trainings/runs/{training_ref.zenml_run_id}/status/")
    assert response.status_code == 403


def test_training_run_status_404s_for_unknown_run(client):
    response = client.get("/api/v1/trainings/runs/no-such-run/status/")
    assert response.status_code == 404


@patch("trainings.views.for_user")
def test_training_publish_publishes_local_model(mock_for_user, client, training_ref):
    training_ref.status = "completed"
    training_ref.save(update_fields=["status"])
    mock_for_user.return_value.promote.return_value = "local-model-id-xyz"
    response = client.post(
        f"/api/v1/trainings/{training_ref.id}/publish/",
        data={"description": "ready"},
        format="json",
    )
    assert response.status_code == 201
    assert response.json() == {"local_model_stac_id": "local-model-id-xyz"}
    training_ref.local_model.refresh_from_db()
    assert training_ref.local_model.stac_item_id == "local-model-id-xyz"
    mock_for_user.assert_called_once_with(str(training_ref.user.osm_id))
    mock_for_user.return_value.promote.assert_called_once_with(
        training_ref.local_model.name,
        base_model_id="unet-segmentation",
        dataset_id=training_ref.dataset.stac_id,
        description="ready",
        title=None,
        keywords=None,
        pipeline_run_id="run-abc",
        paths=BackendLocalModelPaths,
    )


@patch("trainings.views.for_user")
def test_training_publish_passes_title_when_provided(mock_for_user, client, training_ref):
    training_ref.status = "completed"
    training_ref.save(update_fields=["status"])
    mock_for_user.return_value.promote.return_value = "lm-1"
    response = client.post(
        f"/api/v1/trainings/{training_ref.id}/publish/",
        data={"description": "ready", "title": "Banepa buildings, March retrain"},
        format="json",
    )
    assert response.status_code == 201
    kwargs = mock_for_user.return_value.promote.call_args.kwargs
    assert kwargs["title"] == "Banepa buildings, March retrain"


@patch("trainings.views.for_user")
def test_training_publish_falls_back_to_run_ref_title(mock_for_user, client, training_ref):
    """Publish payload omits `title` -> chain picks up TrainingRunRef.title."""
    training_ref.status = "completed"
    training_ref.title = "Captured at submit time"
    training_ref.save(update_fields=["status", "title"])
    mock_for_user.return_value.promote.return_value = "lm-1"
    response = client.post(
        f"/api/v1/trainings/{training_ref.id}/publish/",
        data={"description": "ready"},
        format="json",
    )
    assert response.status_code == 201
    kwargs = mock_for_user.return_value.promote.call_args.kwargs
    assert kwargs["title"] == "Captured at submit time"


@patch("trainings.views.for_user")
def test_training_publish_passes_run_ref_keywords(mock_for_user, client, training_ref):
    """Keywords captured at submit -> passed to client.promote at publish."""
    training_ref.status = "completed"
    training_ref.keywords = ["high-resolution", "march-batch"]
    training_ref.save(update_fields=["status", "keywords"])
    mock_for_user.return_value.promote.return_value = "lm-1"
    response = client.post(
        f"/api/v1/trainings/{training_ref.id}/publish/",
        data={},
        format="json",
    )
    assert response.status_code == 201
    kwargs = mock_for_user.return_value.promote.call_args.kwargs
    assert kwargs["keywords"] == ["high-resolution", "march-batch"]


@patch("trainings.views.for_user")
def test_training_publish_409s_when_run_not_completed(mock_for_user, client, training_ref):
    response = client.post(
        f"/api/v1/trainings/{training_ref.id}/publish/",
        data={"description": "ready"},
        format="json",
    )
    assert response.status_code == 409
    mock_for_user.assert_not_called()


@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_creates_record_and_enqueues(mock_task, mock_item_exists, client):
    payload = {
        "model_stac_id": "3a0374bf-d73c-4b4d-b165-081ffa2a18ad",
        "image_uri": "https://tiles.example/{z}/{x}/{y}.png",
        "bbox": [85.5, 27.6, 85.51, 27.61],
        "zoom": 19,
        "params": {"confidence_threshold": 0.5},
        "remove_osm": True,
        "description": "Banepa demo",
    }
    response = client.post("/api/v1/predictions/submit/", data=payload, format="json")
    assert response.status_code == 202, response.content
    body = response.json()
    assert body["local_model_stac_id"] == payload["model_stac_id"]
    assert body["geometry"]["type"] == "Polygon"
    assert body["zoom"] == 19
    assert body["remove_osm"] is True
    assert body["status"] == "initializing"
    assert body["visibility"] == "private"
    # Pre-completion: assets are None (no files in S3 yet).
    assert body["assets"] is None
    mock_task.enqueue.assert_called_once()
    mock_item_exists.assert_called_once_with(
        "local-models", "3a0374bf-d73c-4b4d-b165-081ffa2a18ad"
    )


def test_storage_paths_are_deterministic_and_round_trip(settings):
    from shared.storage import StoragePaths

    settings.BUCKET_NAME = "fair-bucket"
    assert StoragePaths.dataset_chips_dir_key("ds-1") == "datasets/ds-1/chips"
    assert StoragePaths.dataset_labels_geojson_key("ds-1") == "datasets/ds-1/labels/labels.geojson"
    assert StoragePaths.prediction_geojson_key(7) == "predict/7/output/predictions.geojson"
    assert StoragePaths.prediction_pmtiles_uri(7) == "s3://fair-bucket/predict/7/output/predictions.pmtiles"
    # uri = s3:// + bucket + key (so callers stay consistent across both forms)
    assert StoragePaths.dataset_chips_dir_uri("ds-1") == "s3://fair-bucket/datasets/ds-1/chips"


def test_prediction_assets_populated_when_completed(client, prediction):
    # Default fixture already has status="completed".
    response = client.get(f"/api/v1/predictions/{prediction.id}/")
    assert response.status_code == 200
    assets = response.json()["assets"]
    assert assets is not None
    assert "predictions.geojson" in assets["geojson"]
    assert "predictions.fgb" in assets["fgb"]
    assert "predictions.pmtiles" in assets["pmtiles"]


def test_prediction_assets_are_none_when_outputs_not_ready(client, prediction):
    # Pipeline can be "completed" before post-process has actually written
    # outputs; assets must stay None until results_ready flips so consumers
    # never see presigned URLs that resolve to missing S3 objects.
    prediction.results_ready = False
    prediction.save(update_fields=["results_ready"])
    response = client.get(f"/api/v1/predictions/{prediction.id}/")
    assert response.status_code == 200
    assert response.json()["assets"] is None


def test_dataset_assets_populated_when_published(client, published_dataset):
    response = client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 200
    assets = response.json()["assets"]
    assert assets is not None
    assert "datasets/ds-banepa/chips" in assets["chips"]
    assert "datasets/ds-banepa/labels/labels.geojson" in assets["labels"]


def test_dataset_assets_are_none_when_not_published(client, aoi, db):
    from datasets.models import Dataset

    draft = Dataset.objects.create(
        stac_id="ds-draft",
        title="Drafty",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        status=Dataset.Status.BUILDING,
        user=aoi.user,
    )
    response = client.get(f"/api/v1/datasets/{draft.id}/")
    assert response.status_code == 200
    assert response.json()["assets"] is None


@patch("predictions.views.item_exists", return_value=False)
def test_prediction_submit_404s_when_model_missing_in_stac(mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "ghost-model",
            "image_uri": "https://tiles.example/{z}/{x}/{y}.png",
            "bbox": [85.5, 27.6, 85.51, 27.61],
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 404


def test_prediction_submit_rejects_inverted_bbox(client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "3a0374bf-d73c-4b4d-b165-081ffa2a18ad",
            "image_uri": "https://tiles.example/{z}/{x}/{y}.png",
            "bbox": [85.51, 27.61, 85.5, 27.6],
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 400


def test_prediction_list_paginates(client, prediction):
    response = client.get("/api/v1/predictions/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["zenml_run_id"] == "pred-run-1"


def test_prediction_retrieve_returns_record(client, prediction):
    response = client.get(f"/api/v1/predictions/{prediction.id}/")
    assert response.status_code == 200
    body = response.json()
    assert body["zenml_run_id"] == "pred-run-1"
    assert body["status"] == "completed"
    assert body["geometry"]["type"] == "Polygon"


@patch("predictions.views.get_run_status")
def test_prediction_run_status_polls_zenml(mock_status, client, prediction):
    mock_status.return_value = "completed"
    response = client.get("/api/v1/predictions/runs/pred-run-1/status/")
    assert response.status_code == 200
    assert response.json() == {
        "run_id": "pred-run-1",
        "status": "completed",
        "is_terminal": True,
    }


@patch("predictions.views.fetch_run_logs")
def test_prediction_run_logs_default_returns_run_level(mock_fetch, client, prediction):
    mock_fetch.return_value = []
    response = client.get("/api/v1/predictions/runs/pred-run-1/logs/")
    assert response.status_code == 200
    assert response.json() == []
    mock_fetch.assert_called_once_with("pred-run-1", tail=1000)


@patch("zenml.utils.run_utils.stop_run")
@patch("zenml.client.Client")
def test_prediction_run_cancel_stops_zenml_run(
    mock_client_cls, mock_stop, client, prediction
):
    mock_client_cls.return_value.get_pipeline_run.return_value = MagicMock()
    response = client.post("/api/v1/predictions/runs/pred-run-1/cancel/")
    assert response.status_code == 200
    assert response.json()["status"] == "stopping"
    mock_stop.assert_called_once()


def test_prediction_run_status_403s_for_non_owner(other_user, prediction):
    other = APIClient()
    other.force_authenticate(user=other_user)
    response = other.get(f"/api/v1/predictions/runs/{prediction.zenml_run_id}/status/")
    assert response.status_code == 403


def test_prediction_run_status_404s_for_unknown_run(client):
    response = client.get("/api/v1/predictions/runs/no-such-run/status/")
    assert response.status_code == 404


def test_prediction_publish_makes_record_public(client, prediction):
    response = client.post(f"/api/v1/predictions/{prediction.id}/publish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"


def test_prediction_unpublish_makes_record_private(client, prediction):
    prediction.visibility = "public"
    prediction.save(update_fields=["visibility"])
    response = client.post(f"/api/v1/predictions/{prediction.id}/unpublish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "private"


def test_prediction_publish_hidden_from_non_owner(other_user, prediction):
    other_client = APIClient()
    other_client.force_authenticate(user=other_user)
    response = other_client.post(f"/api/v1/predictions/{prediction.id}/publish/")
    assert response.status_code == 404


def test_anon_can_read_public_prediction(anon_client, prediction):
    prediction.visibility = "public"
    prediction.save(update_fields=["visibility"])
    response = anon_client.get(f"/api/v1/predictions/{prediction.id}/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"


def test_anon_404s_on_private_prediction(anon_client, prediction):
    response = anon_client.get(f"/api/v1/predictions/{prediction.id}/")
    assert response.status_code == 404


@override_settings(ENABLE_MAPSWIPE=False)
def test_prediction_mapswipe_returns_503_when_feature_disabled(client, prediction):
    response = client.post(
        f"/api/v1/predictions/{prediction.id}/mapswipe/",
        data={
            "topic": "Buildings Banepa",
            "region": "Banepa",
            "description": "Validate predicted buildings",
            "instruction": "Tap each building you see",
            "look_for": "buildings",
            "project_number": 1,
        },
        format="json",
    )
    assert response.status_code == 503
    assert "disabled" in response.json()["detail"].lower()


def test_feedback_create_returns_geojson_feature(client):
    payload = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[0, 0], [0, 0.01], [0.01, 0.01], [0.01, 0], [0, 0]]],
        },
        "properties": {
            "stac_id": "model-xyz",
            "action": "accept",
            "comments": "looks good",
            "config": {},
        },
    }
    response = client.post("/api/v1/feedback/", data=payload, format="json")
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["type"] == "Feature"
    assert body["properties"]["stac_id"] == "model-xyz"
    assert body["properties"]["action"] == "accept"
    assert body["properties"]["user"]["username"] == "alice"
    assert Feedback.objects.count() == 1


def test_feedback_list_paginates(client, user):
    Feedback.objects.create(
        stac_id="model-xyz",
        geom=Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326),
        action="accept",
        user=user,
    )
    response = client.get("/api/v1/feedback/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"]["type"] == "FeatureCollection"
    assert body["results"]["features"][0]["properties"]["stac_id"] == "model-xyz"


def test_banner_create_returns_record(client):
    response = client.post(
        "/api/v1/banners/",
        data={"message": "hello mappers", "start_date": "2026-01-01T00:00:00Z"},
        format="json",
    )
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["message"] == "hello mappers"
    assert body["is_displayable"] is True


def test_banner_list_returns_active_banners(client, db):
    Banner.objects.create(message="hello mappers")
    response = client.get("/api/v1/banners/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["message"] == "hello mappers"


def test_banner_retrieve_returns_record(client, db):
    banner = Banner.objects.create(message="hello mappers")
    response = client.get(f"/api/v1/banners/{banner.id}/")
    assert response.status_code == 200
    assert response.json()["message"] == "hello mappers"


def test_notifications_list_returns_user_notifications(client, user):
    UserNotification.objects.create(user=user, message="dataset built")
    UserNotification.objects.create(user=user, message="training done")
    response = client.get("/api/v1/notifications/me/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert body["results"][0]["is_read"] is False


def test_notifications_mark_read_flips_flag(client, user):
    notification = UserNotification.objects.create(user=user, message="dataset built")
    response = client.post(f"/api/v1/notifications/me/{notification.id}/mark-read/")
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_notifications_mark_all_read_clears_unread(client, user):
    UserNotification.objects.create(user=user, message="one")
    UserNotification.objects.create(user=user, message="two")
    response = client.post("/api/v1/notifications/me/mark-all-read/")
    assert response.status_code == 200
    assert response.json() == {"detail": "ok"}
    assert UserNotification.objects.filter(user=user, is_read=False).count() == 0


@patch("django.conf.settings.S3_CLIENT")
def test_workspace_listing_returns_folders_and_files(mock_s3, client):
    mock_s3.list_objects_v2.return_value = {
        "CommonPrefixes": [{"Prefix": "predict/1/"}],
        "Contents": [
            {
                "Key": "predict/1/output/predictions.geojson",
                "Size": 1024,
                "LastModified": datetime(2026, 5, 3),
            }
        ],
    }
    response = client.get("/api/v1/workspace/?prefix=predict/")
    assert response.status_code == 200
    body = response.json()
    assert body["folders"] == [{"name": "1", "prefix": "predict/1/"}]
    assert body["files"][0]["key"] == "predict/1/output/predictions.geojson"
    assert body["files"][0]["size"] == 1024


@patch("django.conf.settings.S3_CLIENT")
def test_workspace_presigned_url_signs_object(mock_s3, client):
    mock_s3.generate_presigned_url.return_value = "https://signed.example/object"
    response = client.get(
        "/api/v1/workspace/url/?key=predict/1/output/predictions.geojson"
    )
    assert response.status_code == 200
    body = response.json()
    assert body["url"] == "https://signed.example/object"
    assert body["expires_in"] == 900


def test_workspace_presigned_url_400s_without_key(client):
    response = client.get("/api/v1/workspace/url/")
    assert response.status_code == 400


def test_stars_get_for_unstarred_item(client):
    response = client.get("/api/v1/stars/?target_id=model-abc")
    assert response.status_code == 200
    assert response.json() == {"target_id": "model-abc", "count": 0, "starred": False}


def test_stars_post_creates_star(client):
    response = client.post("/api/v1/stars/?target_id=model-abc")
    assert response.status_code == 201
    assert response.json() == {
        "target_id": "model-abc",
        "starred": True,
        "count": 1,
        "created": True,
    }


def test_stars_post_is_idempotent(client):
    client.post("/api/v1/stars/?target_id=model-abc")
    response = client.post("/api/v1/stars/?target_id=model-abc")
    assert response.status_code == 200
    assert response.json()["created"] is False


def test_stars_delete_removes_star(client):
    client.post("/api/v1/stars/?target_id=model-abc")
    response = client.delete("/api/v1/stars/?target_id=model-abc")
    assert response.status_code == 204


def test_stars_anonymous_can_star(anon_client, db):
    create_response = anon_client.post("/api/v1/stars/?target_id=model-anon")
    assert create_response.status_code == 201
    state_response = anon_client.get("/api/v1/stars/?target_id=model-anon")
    assert state_response.json()["starred"] is True


def test_stars_400s_without_target_id(client):
    response = client.get("/api/v1/stars/")
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# sync_prediction_status: post-run is gated by results_ready, not status,
# so a manual /run_status/ that flips status to "completed" cannot
# bypass post-process. The poller re-runs post_process_prediction until
# results_ready is True, even if status is already terminal.
# ---------------------------------------------------------------------------


@patch("predictions.tasks.post_process_prediction")
@patch("predictions.tasks.get_run_status")
def test_sync_prediction_runs_post_process_when_status_jumps_to_completed(
    mock_get_status, mock_post_run, db, user
):
    from predictions.tasks import sync_prediction_status

    # Simulates a prior manual /run_status/ call having set status to
    # "completed" before the poller saw the run finish. Without the
    # results_ready guard the poller used to early-return on is_terminal and
    # skip post_run forever.
    p = Prediction.objects.create(
        zenml_run_id="rid-1",
        local_model_stac_id="m-uuid",
        image_uri="https://t/{z}/{x}/{y}.png",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]},
        zoom=19,
        status="completed",
        results_ready=False,
        user=user,
    )
    mock_get_status.return_value = "completed"

    sync_prediction_status.func(prediction_id=p.id)

    mock_post_run.assert_called_once()
    p.refresh_from_db()
    assert p.results_ready is True


@patch("predictions.tasks.post_process_prediction")
@patch("predictions.tasks.get_run_status")
def test_sync_prediction_skips_post_process_when_already_ready(
    mock_get_status, mock_post_run, db, user
):
    from predictions.tasks import sync_prediction_status

    p = Prediction.objects.create(
        zenml_run_id="rid-2",
        local_model_stac_id="m-uuid",
        image_uri="https://t/{z}/{x}/{y}.png",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]},
        zoom=19,
        status="completed",
        results_ready=True,
        user=user,
    )

    sync_prediction_status.func(prediction_id=p.id)

    mock_post_run.assert_not_called()
    mock_get_status.assert_not_called()


# --- Visibility / anonymous-read matrix ---------------------------------


def test_anon_dataset_list_excludes_private(anon_client, published_dataset):
    response = anon_client.get("/api/v1/datasets/")
    assert response.status_code == 200
    assert response.json()["results"] == []


def test_anon_dataset_list_includes_public(anon_client, published_dataset):
    published_dataset.visibility = "public"
    published_dataset.save(update_fields=["visibility"])
    response = anon_client.get("/api/v1/datasets/")
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["stac_id"] == "ds-banepa"


def test_anon_dataset_retrieve_private_returns_404(anon_client, published_dataset):
    response = anon_client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 404


def test_anon_dataset_retrieve_public_returns_200(anon_client, published_dataset):
    published_dataset.visibility = "public"
    published_dataset.save(update_fields=["visibility"])
    response = anon_client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"


def test_anon_dataset_write_rejected(anon_client, aoi):
    response = anon_client.post("/api/v1/datasets/build/", data={}, format="json")
    assert response.status_code in (401, 403)


def test_owner_sees_own_private_dataset(client, published_dataset):
    response = client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "private"


def test_dataset_publish_toggle_round_trip(client, published_dataset, anon_client):
    response = client.post(f"/api/v1/datasets/{published_dataset.id}/publish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"

    response = anon_client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 200

    response = client.post(f"/api/v1/datasets/{published_dataset.id}/unpublish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "private"

    response = anon_client.get(f"/api/v1/datasets/{published_dataset.id}/")
    assert response.status_code == 404


def test_anon_local_model_list_excludes_private(anon_client, local_model):
    response = anon_client.get("/api/v1/local-models/")
    assert response.status_code == 200
    assert response.json()["results"] == []


def test_anon_local_model_retrieve_public_returns_200(anon_client, local_model):
    local_model.visibility = "public"
    local_model.save(update_fields=["visibility"])
    response = anon_client.get(f"/api/v1/local-models/{local_model.id}/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"


def test_local_model_publish_toggle_round_trip(client, local_model, anon_client):
    response = client.post(f"/api/v1/local-models/{local_model.id}/publish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "public"

    response = anon_client.get(f"/api/v1/local-models/{local_model.id}/")
    assert response.status_code == 200

    response = client.post(f"/api/v1/local-models/{local_model.id}/unpublish/")
    assert response.status_code == 200
    assert response.json()["visibility"] == "private"

    response = anon_client.get(f"/api/v1/local-models/{local_model.id}/")
    assert response.status_code == 404


def test_other_user_sees_only_public_datasets(other_user, published_dataset):
    other_client = APIClient()
    other_client.force_authenticate(user=other_user)
    response = other_client.get("/api/v1/datasets/")
    assert response.status_code == 200
    assert response.json()["results"] == []

    published_dataset.visibility = "public"
    published_dataset.save(update_fields=["visibility"])
    response = other_client.get("/api/v1/datasets/")
    assert len(response.json()["results"]) == 1


def test_admin_sees_all_datasets(admin_client, published_dataset):
    response = admin_client.get("/api/v1/datasets/")
    assert response.status_code == 200
    assert len(response.json()["results"]) == 1
