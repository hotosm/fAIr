from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import BaseModel, LocalModel
from trainings.models import TrainingRunRef


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=99, username="bob")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


@pytest.fixture
def published_dataset(db, authed_user: OsmUser) -> Dataset:
    return Dataset.objects.create(
        stac_id="buildings-banepa",
        title="Buildings Banepa",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        status=Dataset.Status.BUILT,
        user=authed_user,
    )


@pytest.fixture
def registered_base_model(db, authed_user: OsmUser) -> BaseModel:
    return BaseModel.objects.create(
        name="unet-segmentation",
        stac_item_id="unet-segmentation",
        user=authed_user,
    )


@pytest.fixture
def local_model(
    db, authed_user: OsmUser, registered_base_model: BaseModel
) -> LocalModel:
    return LocalModel.objects.create(
        name="my-existing-finetune",
        base_model=registered_base_model,
        status=LocalModel.Status.ACTIVE,
        user=authed_user,
    )


@pytest.fixture
def training_ref(
    db, authed_user: OsmUser, local_model: LocalModel, published_dataset: Dataset
) -> TrainingRunRef:
    # Backs the run-id keyed actions (status/logs/cancel) so the new ownership
    # check can resolve a TrainingRunRef row for "abc-123".
    return TrainingRunRef.objects.create(
        zenml_run_id="abc-123",
        local_model=local_model,
        base_model_stac_id="unet-segmentation",
        dataset=published_dataset,
        user=authed_user,
    )


@patch("trainings.views.item_exists")
@patch("trainings.views.submit_training")
def test_training_submit_creates_run_ref_and_enqueues(
    mock_task, mock_item_exists, client, published_dataset, registered_base_model
):
    mock_item_exists.return_value = True
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "my-finetuned-v1",
            "overrides": {"epochs": 3, "learning_rate": 0.001},
            "description": "First attempt",
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    body = response.json()
    assert body["status"] == "initializing"
    assert body["base_model_stac_id"] == "unet-segmentation"
    assert TrainingRunRef.objects.filter(local_model__name="my-finetuned-v1").exists()
    mock_task.enqueue.assert_called_once()


def test_training_submit_404s_unknown_base_model(client, published_dataset):
    # Base model is resolved from the DB; an unregistered id 404s before the
    # dataset is checked.
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "ghost",
            "dataset_stac_id": published_dataset.stac_id,
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404


@patch("trainings.views.item_exists", return_value=False)
def test_training_submit_404s_dataset_not_in_stac(
    mock_item_exists, client, registered_base_model
):
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": "ghost-ds",
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404


@patch("trainings.views.item_exists", return_value=True)
def test_training_submit_404s_dataset_not_published(
    mock_item_exists, client, authed_user, registered_base_model
):
    Dataset.objects.create(
        stac_id="building-ds",
        title="Building",
        source_imagery="https://tiles.example/{z}/{x}/{y}.png",
        status=Dataset.Status.BUILDING,
        user=authed_user,
    )
    response = client.post(
        "/api/v1/trainings/submit/",
        data={
            "base_model_stac_id": "unet-segmentation",
            "dataset_stac_id": "building-ds",
            "model_name": "x",
        },
        format="json",
    )
    assert response.status_code == 404


@patch("trainings.views.get_run_status")
@patch("trainings.views.is_terminal")
def test_training_run_status_polls_zenml(mock_terminal, mock_status, client, training_ref):
    mock_status.return_value = "running"
    mock_terminal.return_value = False
    response = client.get("/api/v1/trainings/runs/abc-123/status/")
    assert response.status_code == 200
    body = response.json()
    assert body["run_id"] == "abc-123"
    assert body["status"] == "running"
    assert body["is_terminal"] is False
    mock_status.assert_called_once_with("abc-123")


@patch("trainings.views.fetch_run_logs")
def test_training_run_logs_default_returns_run_level(mock_fetch, client, training_ref):
    mock_fetch.return_value = [
        MagicMock(level="INFO", message="hello", timestamp="2026-05-02T10:00:00Z")
    ]
    response = client.get("/api/v1/trainings/runs/abc-123/logs/?tail=20")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["message"] == "hello"
    mock_fetch.assert_called_once_with("abc-123", tail=20)


@patch("trainings.views.fetch_step_logs")
def test_training_run_logs_with_step_param_routes_to_step(mock_fetch, client, training_ref):
    mock_fetch.return_value = []
    response = client.get("/api/v1/trainings/runs/abc-123/logs/?step=train_model&tail=5")
    assert response.status_code == 200
    mock_fetch.assert_called_once_with("abc-123", "train_model", tail=5)


@patch("modelregistry.views.list_runs_for_model")
def test_local_model_runs_action_returns_summaries(mock_list_runs, client, local_model):
    summary = MagicMock(
        id="r1",
        status="completed",
        created_at="2026-05-01T10:00:00Z",
        pipeline_name="training_pipeline",
        model_name="my-existing-finetune",
        model_version=1,
    )
    summary.name = "run-1"
    mock_list_runs.return_value = [summary]
    response = client.get(f"/api/v1/local-models/{local_model.id}/runs/")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == "r1"
    mock_list_runs.assert_called_once()
