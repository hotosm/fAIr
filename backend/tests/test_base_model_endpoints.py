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


@patch("modelregistry.views.register_base_model")
def test_register_creates_row_and_returns_202(mock_task, admin: OsmUser) -> None:
    resp = _client(admin).post("/api/v1/base-models/", {"stac_item": VALID_ITEM}, format="json")
    assert resp.status_code == 202
    base_model = BaseModel.objects.get(name="test-basemodel")
    assert base_model.status == BaseModel.Status.REGISTERING
    assert base_model.user_id == admin.osm_id
    assert base_model.category_id == "other"
    item = mock_task.enqueue.call_args.kwargs["stac_item"]
    assert item["properties"]["mlm:name"] == "test-basemodel"
    assert item["properties"]["fair:category"] == "other"


@patch("modelregistry.views.register_base_model")
def test_register_stores_category(mock_task, admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item": VALID_ITEM, "category": "buildings"},
        format="json",
    )
    assert resp.status_code == 202
    assert BaseModel.objects.get(name="test-basemodel").category_id == "buildings"
    item = mock_task.enqueue.call_args.kwargs["stac_item"]
    assert item["properties"]["fair:category"] == "buildings"


@patch("modelregistry.views.register_base_model")
def test_register_with_inference_endpoint_sets_asset(mock_task, admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/",
        {"stac_item": VALID_ITEM, "inference_endpoint": "https://predict.example.com/m"},
        format="json",
    )
    assert resp.status_code == 202
    asset = mock_task.enqueue.call_args.kwargs["stac_item"]["assets"]["mlm:inference-endpoint"]
    assert asset["href"] == "https://predict.example.com/m"
    assert asset["roles"] == ["mlm:inference-endpoint"]


@patch("modelregistry.views.register_base_model")
def test_register_without_inference_endpoint_leaves_item(mock_task, admin: OsmUser) -> None:
    resp = _client(admin).post("/api/v1/base-models/", {"stac_item": VALID_ITEM}, format="json")
    assert resp.status_code == 202
    item = mock_task.enqueue.call_args.kwargs["stac_item"]
    assert "mlm:inference-endpoint" not in item.get("assets", {})


def test_register_rejects_missing_mlm_name(admin: OsmUser) -> None:
    resp = _client(admin).post(
        "/api/v1/base-models/", {"stac_item": {"properties": {}}}, format="json"
    )
    assert resp.status_code == 400
    assert not BaseModel.objects.exists()


@patch("modelregistry.views.register_base_model")
def test_register_from_url_stores_fetched_item(
    mock_task, admin: OsmUser, monkeypatch: pytest.MonkeyPatch
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
    assert BaseModel.objects.get(name="url-model").category_id == "roads"
    item = mock_task.enqueue.call_args.kwargs["stac_item"]
    assert item["properties"]["mlm:name"] == "url-model"
    assert item["properties"]["fair:category"] == "roads"


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


def test_list_exposes_star_count(user: OsmUser, admin: OsmUser) -> None:
    from stars.models import Star

    model = BaseModel.objects.create(name="ramp", user=admin)
    Star.objects.create(target_id=model.name, user=user)
    resp = _client(user).get("/api/v1/base-models/")
    assert resp.status_code == 200
    row = next(m for m in resp.data["results"] if m["name"] == "ramp")
    assert row["star_count"] == 1
    assert row["is_starred"] is True


def test_register_task_stores_stac_item_id(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin)
    with patch("modelregistry.tasks.for_user") as mock_for_user:
        mock_for_user.return_value.register_base_model.return_value = "dino-v2"
        register_base_model.func(base_model_id=base_model.id, stac_item=VALID_ITEM)
    base_model.refresh_from_db()
    assert base_model.stac_item_id == "dino-v2"
    assert base_model.status == BaseModel.Status.ACTIVE


@patch("modelregistry.views.set_item_properties")
def test_base_model_pin_sets_db_flag_and_stac(mock_stac, admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="pin-me", user=admin, stac_item_id="pin-me")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{base_model.id}/pin/", {"is_pinned": True}, format="json"
    )
    assert resp.status_code == 200
    assert resp.data["is_pinned"] is True
    base_model.refresh_from_db()
    assert base_model.is_pinned is True
    collection, item_id, props = mock_stac.call_args.args
    assert collection == "base-models"
    assert item_id == "pin-me"
    assert props == {"fair:pinned": True}


@patch("modelregistry.views.set_item_properties")
@patch(
    "modelregistry.views.get_cached_item",
    return_value={"geometry": {"type": "Point", "coordinates": [-13.23723, 8.47532]}},
)
def test_base_model_pin_writes_imagery_and_location_to_stac(
    mock_get, mock_stac, admin: OsmUser
) -> None:
    base_model = BaseModel.objects.create(name="pin-me", user=admin, stac_item_id="pin-me")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{base_model.id}/pin/",
        {
            "is_pinned": True,
            "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
            "pinned_location": {"type": "Point", "coordinates": [-13.23723, 8.47532]},
        },
        format="json",
    )
    assert resp.status_code == 200
    props = mock_stac.call_args.args[2]
    assert props["fair:pinned"] is True
    assert props["fair:source_imagery"] == "https://tiles.example/{z}/{x}/{y}.png"
    assert props["fair:preview_location"] == {"type": "Point", "coordinates": [-13.23723, 8.47532]}
    # place/country reverse-geocoded from the location (kept consistent)
    assert props["fair:preview_country"]
    assert props["fair:preview_place"]
    assert props["fair:preview_country_code"]


@patch("modelregistry.views.set_item_properties")
def test_base_model_pin_skips_stac_when_unpublished(mock_stac, admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="pin-me", user=admin)
    resp = _client(admin).patch(
        f"/api/v1/base-models/{base_model.id}/pin/", {"is_pinned": True}, format="json"
    )
    assert resp.status_code == 200
    base_model.refresh_from_db()
    assert base_model.is_pinned is True
    mock_stac.assert_not_called()


def test_base_model_pin_rejects_invalid_location(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="pin-me", user=admin, stac_item_id="pin-me")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{base_model.id}/pin/",
        {"is_pinned": True, "pinned_location": {"type": "Polygon", "coordinates": []}},
        format="json",
    )
    assert resp.status_code == 400


def test_base_model_pin_blocks_non_admin(user: OsmUser, admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="pin-me", user=admin, stac_item_id="pin-me")
    resp = _client(user).patch(
        f"/api/v1/base-models/{base_model.id}/pin/", {"is_pinned": True}, format="json"
    )
    assert resp.status_code == 403


def test_base_model_expand_stac_inlines_item(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin, stac_item_id="dino-v1")
    fake_item = {"id": "dino-v1", "properties": {"mlm:name": "dino"}, "assets": {}}
    with patch("modelregistry.views.get_cached_item", return_value=fake_item) as mock_get:
        resp = _client(admin).get(f"/api/v1/base-models/{base_model.id}/?expand=stac")
    assert resp.status_code == 200
    assert resp.data["stac"] == fake_item
    mock_get.assert_called_once_with("base-models", "dino-v1")


def test_base_model_default_response_has_null_stac(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin, stac_item_id="dino-v1")
    with patch("modelregistry.views.get_cached_item") as mock_get:
        resp = _client(admin).get(f"/api/v1/base-models/{base_model.id}/")
    assert resp.status_code == 200
    assert resp.data["stac"] is None
    mock_get.assert_not_called()


def test_pinned_models_returns_base_and_local(admin: OsmUser) -> None:
    base = BaseModel.objects.create(
        name="pinned-base", user=admin, stac_item_id="pb", is_pinned=True, visibility="public"
    )
    LocalModel.objects.create(
        name="pinned-local", base_model=base, user=admin, is_pinned=True, visibility="public"
    )
    BaseModel.objects.create(name="unpinned-base", user=admin, is_pinned=False)
    resp = _client(admin).get("/api/v1/pinned-models/")
    assert resp.status_code == 200
    assert resp.data["count"] == 2
    by_type = {(r["model_type"], r["name"]) for r in resp.data["results"]}
    assert ("base", "pinned-base") in by_type
    assert ("local", "pinned-local") in by_type
    assert all("unpinned" not in r["name"] for r in resp.data["results"])


def test_pinned_models_is_public(db) -> None:
    from rest_framework.test import APIClient

    resp = APIClient().get("/api/v1/pinned-models/")
    assert resp.status_code == 200
    assert "results" in resp.data


def test_pinned_models_expand_stac_inlines(admin: OsmUser) -> None:
    BaseModel.objects.create(
        name="pinned-base", user=admin, stac_item_id="pb", is_pinned=True, visibility="public"
    )
    fake = {"id": "pb", "properties": {"fair:pinned": True}, "assets": {}}
    with patch("modelregistry.views.bulk_get_cached_items", return_value={("base-models", "pb"): fake}):
        resp = _client(admin).get("/api/v1/pinned-models/?expand=stac")
    assert resp.status_code == 200
    row = next(r for r in resp.data["results"] if r["name"] == "pinned-base")
    assert row["stac"] == fake


def test_local_model_has_category(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino-base", user=admin, stac_item_id="dino-base")
    model = LocalModel.objects.create(name="lm1", base_model=base_model, user=admin)
    assert model.category_id == "other"
    resp = _client(admin).get(f"/api/v1/local-models/{model.id}/")
    assert resp.status_code == 200
    assert resp.data["category"] == "other"
    assert resp.data["base_model"] == base_model.id
    assert resp.data["base_model_name"] == "dino-base"


def test_local_models_filter_by_base_model(admin: OsmUser) -> None:
    base_a = BaseModel.objects.create(name="base-a", user=admin, stac_item_id="base-a")
    base_b = BaseModel.objects.create(name="base-b", user=admin, stac_item_id="base-b")
    LocalModel.objects.create(name="lm-a", base_model=base_a, user=admin)
    LocalModel.objects.create(name="lm-b", base_model=base_b, user=admin)
    assert base_a.local_models.count() == 1
    resp = _client(admin).get(f"/api/v1/local-models/?base_model={base_a.id}")
    assert resp.status_code == 200
    names = {row["name"] for row in resp.data["results"]}
    assert names == {"lm-a"}


def test_category_list_is_public(db) -> None:
    resp = APIClient().get("/api/v1/categories/")
    assert resp.status_code == 200
    assert {"buildings", "other", "roads"} <= {c["slug"] for c in resp.data["results"]}


def test_category_create_requires_admin(user: OsmUser, admin: OsmUser) -> None:
    from modelregistry.models import Category

    body = {"slug": "cars", "label": "Cars"}
    assert _client(user).post("/api/v1/categories/", body, format="json").status_code == 403
    resp = _client(admin).post("/api/v1/categories/", body, format="json")
    assert resp.status_code == 201
    assert Category.objects.filter(slug="cars").exists()


def test_category_delete_blocked_when_in_use(admin: OsmUser) -> None:
    BaseModel.objects.create(name="b1", user=admin, category_id="buildings")
    resp = _client(admin).delete("/api/v1/categories/buildings/")
    assert resp.status_code == 409


def test_category_delete_unused_ok(admin: OsmUser) -> None:
    resp = _client(admin).delete("/api/v1/categories/trees/")
    assert resp.status_code == 204
