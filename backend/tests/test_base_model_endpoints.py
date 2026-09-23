from unittest.mock import MagicMock, patch

import pystac
import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from modelregistry.models import BaseModel, LocalModel
from modelregistry.tasks import register_base_model
from shared.integrations.stac import serialize_item

BUNDLED_ENTRYPOINT = "models.demo.pipeline:predict"
SOURCE_CODE = {"href": "https://example.com/src", "mlm:entrypoint": BUNDLED_ENTRYPOINT}
VALID_ITEM = {
    "type": "Feature",
    "id": "test-basemodel",
    "properties": {"mlm:name": "test-basemodel"},
    "assets": {"source-code": SOURCE_CODE},
}


@pytest.fixture(autouse=True)
def _bundled_pipeline(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "modelregistry.views.importlib.util.find_spec",
        lambda name: object() if name == BUNDLED_ENTRYPOINT.split(":")[0] else None,
    )


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


@pytest.mark.parametrize(
    "entrypoint",
    [None, "json:loads", "models.demo.pipeline", "models.not_bundled.pipeline:predict"],
)
def test_register_rejects_unbundled_pipeline(admin: OsmUser, entrypoint: str | None) -> None:
    source = {"href": "https://example.com/src"}
    if entrypoint:
        source["mlm:entrypoint"] = entrypoint
    item = {**VALID_ITEM, "assets": {"source-code": source}}
    resp = _client(admin).post("/api/v1/base-models/", {"stac_item": item}, format="json")
    assert resp.status_code == 400
    assert "entrypoint" in str(resp.data) or "not in this backend image" in str(resp.data)
    assert not BaseModel.objects.exists()


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
    fetched = {
        "type": "Feature",
        "properties": {"mlm:name": "url-model"},
        "assets": {"source-code": SOURCE_CODE},
    }
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
    BaseModel.objects.create(name="m1", user=admin, status=BaseModel.Status.ACTIVE)
    resp = _client(user).get("/api/v1/base-models/")
    assert resp.status_code == 200
    assert resp.data["count"] == 1


def test_list_is_public_and_hides_private(admin: OsmUser) -> None:
    from shared.enums import Visibility

    BaseModel.objects.create(
        name="pub", user=admin, visibility=Visibility.PUBLIC, status=BaseModel.Status.ACTIVE
    )
    BaseModel.objects.create(name="priv", user=admin, visibility=Visibility.PRIVATE)
    resp = APIClient().get("/api/v1/base-models/")
    assert resp.status_code == 200
    names = {row["name"] for row in resp.data["results"]}
    assert names == {"pub"}


def test_retrieve_is_public(admin: OsmUser) -> None:
    model = BaseModel.objects.create(name="pub", user=admin, status=BaseModel.Status.ACTIVE)
    resp = APIClient().get(f"/api/v1/base-models/{model.id}/")
    assert resp.status_code == 200
    assert resp.data["name"] == "pub"
    assert "stac_item_id" in resp.data


def test_list_exposes_star_count(user: OsmUser, admin: OsmUser) -> None:
    from stars.models import Star

    model = BaseModel.objects.create(name="ramp", user=admin, status=BaseModel.Status.ACTIVE)
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
    bulk = {("base-models", "pb"): fake}
    with patch("modelregistry.views.bulk_get_cached_items", return_value=bulk):
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


def test_stac_asset_download_redirects_to_presigned(db, settings) -> None:
    settings.S3_CLIENT = MagicMock()
    settings.BUCKET_NAME = "fair-dev"
    settings.S3_CLIENT.list_objects_v2.return_value = {
        "Contents": [{"Key": "dev/downloads/base-models/dino/model/m.onnx"}]
    }
    with patch("shared.storage.presigned_get_url", return_value="https://fair-dev.s3/x?sig") as p:
        resp = APIClient().get("/api/v1/stac-assets/base-models/dino/model/")
    assert resp.status_code == 302
    assert resp["Location"] == "https://fair-dev.s3/x?sig"
    p.assert_called_once_with("dev/downloads/base-models/dino/model/m.onnx")


def test_stac_asset_download_404_for_unknown_collection_or_asset(db) -> None:
    assert APIClient().get("/api/v1/stac-assets/ghost/x/model/").status_code == 404
    assert APIClient().get("/api/v1/stac-assets/base-models/x/readme/").status_code == 404


def test_stac_asset_download_404_when_object_missing(db, settings) -> None:
    settings.S3_CLIENT = MagicMock()
    settings.S3_CLIENT.list_objects_v2.return_value = {}
    assert APIClient().get("/api/v1/stac-assets/base-models/x/model/").status_code == 404


def test_mirror_and_relink_rewrites_only_downloadable_assets(settings) -> None:
    settings.API_BASE_URL = "https://dev.example/api/v1"
    item = MagicMock()
    item.assets = {
        "model": pystac.Asset(href="http://minio:9000/zenml/base-models/x/model/m.onnx"),
        "readme": pystac.Asset(href="https://github.com/readme"),
    }
    backend = MagicMock()
    backend.get_item.return_value = item
    with (
        patch("shared.integrations.stac._backend", return_value=backend),
        patch("shared.integrations.stac._stream_href_to_bucket") as mock_stream,
        patch("shared.integrations.stac.invalidate_stac_cache"),
    ):
        from shared.integrations.stac import mirror_and_relink_assets

        mirror_and_relink_assets("base-models", "x")
    assert (
        item.assets["model"].href == "https://dev.example/api/v1/stac-assets/base-models/x/model/"
    )
    assert item.assets["readme"].href == "https://github.com/readme"
    mock_stream.assert_called_once()
    backend.publish_item.assert_called_once()


def _stac_item_dict(item_id: str = "meta-model") -> dict:
    from datetime import UTC, datetime

    item = pystac.Item(
        id=item_id,
        geometry={"type": "Point", "coordinates": [0, 0]},
        bbox=[0, 0, 0, 0],
        datetime=datetime.now(UTC),
        properties={"title": "Old title", "description": "Old", "mlm:name": item_id},
    )
    return item.to_dict()


def _stac_item(*_: object) -> pystac.Item:
    return pystac.Item.from_dict(_stac_item_dict())


def test_serialized_facet_cannot_rebuild_a_stac_item() -> None:
    # The cache facet drops top-level `type`/`id`, so _merge_validate_write must
    # validate the full item from get_item, never the get_cached_item facet.
    facet = serialize_item(pystac.Item.from_dict(_stac_item_dict()))
    with pytest.raises(pystac.errors.STACTypeError):
        pystac.Item.from_dict(facet)


@patch("modelregistry.views.set_item_properties")
@patch("modelregistry.views.get_item", side_effect=_stac_item)
@patch("fair.stac.validators.validate_item", return_value=[])
def test_base_model_metadata_edits_title_description_and_preview(
    mock_validate, mock_get, mock_set, admin: OsmUser
) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    preview = {
        "center": [1.0, 2.0],
        "zoom": {"recommended": 19},
        "imagery": {"url": "https://t/{z}/{x}/{y}"},
    }
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/metadata/",
        {"title": "New title", "description": "New description", "fair_preview": preview},
        format="json",
    )
    assert resp.status_code == 200
    props = mock_set.call_args.args[2]
    assert props["title"] == "New title"
    assert props["description"] == "New description"
    assert props["fair:preview"] == preview
    mock_get.assert_called_once_with("base-models", "meta-model")
    validated = mock_validate.call_args.args[0]
    assert isinstance(validated, pystac.Item)
    assert validated.properties["title"] == "New title"
    assert validated.properties["fair:preview"] == preview


@patch("modelregistry.views.set_item_properties")
@patch("modelregistry.views.get_item", side_effect=_stac_item)
@patch("fair.stac.validators.validate_item", return_value=["mlm:tasks is a required property"])
def test_base_model_metadata_rejects_invalid_edit(
    mock_validate, mock_get, mock_set, admin: OsmUser
) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/metadata/", {"title": "New"}, format="json"
    )
    assert resp.status_code == 400
    mock_set.assert_not_called()


def test_base_model_metadata_requires_admin(user: OsmUser) -> None:
    model = BaseModel.objects.create(name="meta-model", user=user, stac_item_id="meta-model")
    resp = _client(user).patch(
        f"/api/v1/base-models/{model.id}/metadata/", {"title": "New"}, format="json"
    )
    assert resp.status_code == 403


@patch("modelregistry.views.set_item_properties")
@patch("modelregistry.views.get_item", side_effect=_stac_item)
@patch("fair.stac.validators.validate_item", return_value=[])
def test_base_model_stac_patch_merges_arbitrary_properties(
    mock_validate, mock_get, mock_set, admin: OsmUser
) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/stac/",
        {
            "properties": {
                "fair:source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
                "fair:preview_location": {"type": "Point", "coordinates": [85.3, 27.7]},
                "description": "Synced",
            }
        },
        format="json",
    )
    assert resp.status_code == 200
    collection, item_id, props = mock_set.call_args.args
    assert collection == "base-models"
    assert item_id == "meta-model"
    assert props["fair:source_imagery"] == "https://tiles.example/{z}/{x}/{y}.png"
    assert props["fair:preview_location"] == {"type": "Point", "coordinates": [85.3, 27.7]}
    assert props["description"] == "Synced"
    mock_get.assert_called_once_with("base-models", "meta-model")
    validated = mock_validate.call_args.args[0]
    assert isinstance(validated, pystac.Item)
    assert validated.properties["fair:source_imagery"] == "https://tiles.example/{z}/{x}/{y}.png"


@patch("modelregistry.views.set_item_properties")
@patch("modelregistry.views.get_item", side_effect=_stac_item)
@patch("fair.stac.validators.validate_item", return_value=["mlm:tasks is a required property"])
def test_base_model_stac_patch_rejects_invalid_merge(
    mock_validate, mock_get, mock_set, admin: OsmUser
) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/stac/", {"properties": {"title": "x"}}, format="json"
    )
    assert resp.status_code == 400
    mock_set.assert_not_called()


def test_base_model_stac_patch_rejects_empty_properties(admin: OsmUser) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/stac/", {"properties": {}}, format="json"
    )
    assert resp.status_code == 400


def test_base_model_stac_patch_requires_published_item(admin: OsmUser) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin)
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/stac/", {"properties": {"title": "x"}}, format="json"
    )
    assert resp.status_code == 400


def test_base_model_stac_patch_requires_admin(user: OsmUser) -> None:
    model = BaseModel.objects.create(name="meta-model", user=user, stac_item_id="meta-model")
    resp = _client(user).patch(
        f"/api/v1/base-models/{model.id}/stac/", {"properties": {"title": "x"}}, format="json"
    )
    assert resp.status_code == 403


def test_register_task_infra_error_records_infrastructure_message(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin)
    with patch("modelregistry.tasks.for_user") as mock_for_user:
        mock_for_user.return_value.register_base_model.side_effect = TimeoutError("connect timeout")
        with pytest.raises(TimeoutError):
            register_base_model.func(base_model_id=base_model.id, stac_item=VALID_ITEM)
    base_model.refresh_from_db()
    assert base_model.status == BaseModel.Status.FAILED
    assert "infrastructure" in base_model.error.lower()


def test_register_task_user_error_keeps_raw_message(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin)
    with patch("modelregistry.tasks.for_user") as mock_for_user:
        mock_for_user.return_value.register_base_model.side_effect = ValueError("bad weights url")
        with pytest.raises(ValueError):
            register_base_model.func(base_model_id=base_model.id, stac_item=VALID_ITEM)
    base_model.refresh_from_db()
    assert base_model.status == BaseModel.Status.FAILED
    assert base_model.error == "bad weights url"


def test_is_infra_error_walks_cause_chain() -> None:
    from modelregistry.tasks import _is_infra_error

    try:
        try:
            raise TimeoutError("[Errno 110] Connection timed out")
        except TimeoutError as root:
            raise RuntimeError("knative install check failed") from root
    except RuntimeError as wrapped:
        assert _is_infra_error(wrapped) is True
    assert _is_infra_error(ValueError("stac item missing mlm:name")) is False


def test_is_infra_error_matches_urllib3_style_name() -> None:
    from modelregistry.tasks import _is_infra_error

    class MaxRetryError(Exception):  # not an OSError subclass: matched by name only
        pass

    assert _is_infra_error(MaxRetryError("pool timed out")) is True


def test_local_model_stac_patch_requires_admin(user: OsmUser) -> None:
    base = BaseModel.objects.create(name="base-lm", user=user, stac_item_id="base-lm")
    model = LocalModel.objects.create(name="lm", base_model=base, user=user, stac_item_id="lm")
    resp = _client(user).patch(
        f"/api/v1/local-models/{model.id}/stac/", {"properties": {"title": "x"}}, format="json"
    )
    assert resp.status_code == 403


def test_base_model_stac_patch_rejects_identity_keys(admin: OsmUser) -> None:
    model = BaseModel.objects.create(name="meta-model", user=admin, stac_item_id="meta-model")
    resp = _client(admin).patch(
        f"/api/v1/base-models/{model.id}/stac/",
        {"properties": {"mlm:name": "renamed", "description": "ok"}},
        format="json",
    )
    assert resp.status_code == 400


def _admin_action(admin_user: OsmUser, queryset) -> list[str]:
    from django.contrib.admin.sites import AdminSite
    from django.contrib.messages.storage.fallback import FallbackStorage
    from django.test import RequestFactory

    from modelregistry.admin import BaseModelAdmin

    request = RequestFactory().post("/")
    request.user = admin_user
    request.session = {}
    storage = FallbackStorage(request)
    request._messages = storage
    BaseModelAdmin(BaseModel, AdminSite()).register_in_stac(request, queryset)
    return [str(m) for m in storage]


@patch("modelregistry.tasks.register_base_model")
@patch("shared.integrations.stac.get_item")
def test_admin_reregister_enqueues_full_stac_item(mock_get, mock_task, admin: OsmUser) -> None:
    item = _stac_item_dict()
    item["assets"]["source-code"] = SOURCE_CODE
    mock_get.return_value = pystac.Item.from_dict(item)
    base = BaseModel.objects.create(name="m", user=admin, stac_item_id=item["id"])

    _admin_action(admin, BaseModel.objects.filter(id=base.id))

    enqueued = mock_task.enqueue.call_args.kwargs["stac_item"]
    assert enqueued["id"] == item["id"] and enqueued["type"] == "Feature"
    pystac.Item.from_dict(enqueued)  # a real item, unlike the cached facet
    base.refresh_from_db()
    assert base.status == BaseModel.Status.REGISTERING


@patch("modelregistry.tasks.register_base_model")
@patch("shared.integrations.stac.get_item")
def test_admin_reregister_skips_unbundled_pipeline(mock_get, mock_task, admin: OsmUser) -> None:
    item = _stac_item_dict()
    item["assets"]["source-code"] = {"href": "https://example.com/src", "mlm:entrypoint": "json:loads"}
    mock_get.return_value = pystac.Item.from_dict(item)
    base = BaseModel.objects.create(name="m", user=admin, stac_item_id=item["id"])

    messages = _admin_action(admin, BaseModel.objects.filter(id=base.id))

    mock_task.enqueue.assert_not_called()
    assert any("entrypoint" in m for m in messages)
