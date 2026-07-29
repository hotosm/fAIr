from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from modelregistry.tasks import register_base_model

VALID_ITEM = {
    "type": "Feature",
    "id": "test-basemodel",
    "properties": {"mlm:name": "test-basemodel"},
    "assets": {},
}


class _FakeResponse:
    def __init__(self, payload: dict) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


@pytest.fixture
def user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=41, username="mapper")


@pytest.fixture
def admin(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=42, username="boss", is_staff=True)


def _client(u: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=u)
    return api


def test_register_requires_admin(user: OsmUser) -> None:
    resp = _client(user).post("/api/v1/base-models/", {"stac_item": VALID_ITEM}, format="json")
    assert resp.status_code == 403
    assert not BaseModel.objects.exists()


def test_register_creates_row_and_returns_202(admin: OsmUser) -> None:
    resp = _client(admin).post("/api/v1/base-models/", {"stac_item": VALID_ITEM}, format="json")
    assert resp.status_code == 202
    base_model = BaseModel.objects.get(name="test-basemodel")
    assert base_model.status == BaseModel.Status.REGISTERING
    assert base_model.user_id == admin.osm_id
    assert base_model.category == BaseModel.Category.OTHER
    assert base_model.stac_item == VALID_ITEM


def test_register_stores_category(admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item": VALID_ITEM, "category": "buildings"},
        format="json",
    )
    assert resp.status_code == 202
    assert BaseModel.objects.get(name="test-basemodel").category == "buildings"


def test_register_rejects_missing_mlm_name(admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/", {"stac_item": {"properties": {}}}, format="json"
    )
    assert resp.status_code == 400
    assert not BaseModel.objects.exists()


def test_register_from_url_stores_fetched_item(
    admin: OsmUser, monkeypatch: pytest.MonkeyPatch
) -> None:
    fetched = {"type": "Feature", "properties": {"mlm:name": "url-model"}, "assets": {}}
    monkeypatch.setattr(
        "modelregistry.views.httpx.get",
        lambda *args, **kwargs: _FakeResponse(fetched),
    )
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item_url": "https://example.com/item.json", "category": "roads"},
        format="json",
    )
    assert resp.status_code == 202
    base_model = BaseModel.objects.get(name="url-model")
    assert base_model.stac_item == fetched
    assert base_model.category == "roads"


def test_register_rejects_both_sources(admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item": VALID_ITEM, "stac_item_url": "https://example.com/item.json"},
        format="json",
    )
    assert resp.status_code == 400
    assert not BaseModel.objects.exists()


def test_register_rejects_neither_source(admin: OsmUser) -> None:
    resp = _client(admin).post("/api/v1/base-models/", {"category": "buildings"}, format="json")
    assert resp.status_code == 400
    assert not BaseModel.objects.exists()


def test_register_rejects_unreachable_url(admin: OsmUser, monkeypatch: pytest.MonkeyPatch) -> None:
    import httpx

    def _raise(*args, **kwargs):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("modelregistry.views.httpx.get", _raise)
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item_url": "https://example.com/item.json"},
        format="json",
    )
    assert resp.status_code == 400
    assert not BaseModel.objects.exists()


def test_list_visible_to_authenticated(user: OsmUser, admin: OsmUser) -> None:
    BaseModel.objects.create(name="m1", user=admin)
    resp = _client(user).get("/api/v1/base-models/")
    assert resp.status_code == 200
    assert resp.data["count"] == 1


def test_list_is_public_and_hides_private(admin: OsmUser) -> None:
    from shared.enums import Visibility

    BaseModel.objects.create(name="pub", user=admin, visibility=Visibility.PUBLIC)
    BaseModel.objects.create(name="priv", user=admin, visibility=Visibility.PRIVATE)
    resp = APIClient().get("/api/v1/base-models/")
    assert resp.status_code == 200
    names = {row["name"] for row in resp.data["results"]}
    assert names == {"pub"}


def test_retrieve_is_public(admin: OsmUser) -> None:
    model = BaseModel.objects.create(name="pub", user=admin)
    resp = APIClient().get(f"/api/v1/base-models/{model.id}/")
    assert resp.status_code == 200
    assert resp.data["name"] == "pub"
    assert "stac_item_id" in resp.data


def test_register_task_stores_stac_item_id(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin, stac_item=VALID_ITEM)
    with patch("modelregistry.tasks.for_user") as mock_for_user:
        mock_for_user.return_value.register_base_model.return_value = "dino-v2"
        register_base_model.func(base_model_id=base_model.id)
    base_model.refresh_from_db()
    assert base_model.stac_item_id == "dino-v2"
    assert base_model.status == BaseModel.Status.ACTIVE


def test_categories_endpoint_is_public(db) -> None:
    resp = APIClient().get("/api/v1/base-models/categories/")
    assert resp.status_code == 200
    values = {c["value"] for c in resp.data}
    assert {"buildings", "solar-panels", "other"} <= values


def test_local_model_has_category(admin: OsmUser) -> None:
    model = LocalModel.objects.create(name="lm1", user=admin)
    assert model.category == LocalModel.Category.OTHER
    resp = _client(admin).get(f"/api/v1/local-models/{model.id}/")
    assert resp.status_code == 200
    assert resp.data["category"] == "other"
