import copy
import json
from datetime import UTC, datetime
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import pystac
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import Client
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.deletion import delete_base_model
from modelregistry.models import BaseModel, LocalModel
from modelregistry.tasks import register_base_model
from shared.enums import Visibility
from shared.integrations.stac import BASE_MODELS_COLLECTION
from trainings.models import TrainingRunRef

DRIFT = "modelregistry.management.commands.check_stac_drift"
ITEM = {
    "type": "Feature",
    "id": "dino",
    "properties": {"mlm:name": "dino"},
    "assets": {
        "source-code": {
            "href": "https://example.com/src",
            "mlm:entrypoint": "models.demo.pipeline:predict",
        }
    },
}


@pytest.fixture(autouse=True)
def _bundled_pipeline(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("modelregistry.views.importlib.util.find_spec", lambda name: object())


@pytest.fixture
def owner(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=51, username="mapper")


@pytest.fixture
def admin(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=52, username="boss", is_staff=True)


@pytest.fixture
def base_model(admin: OsmUser) -> BaseModel:
    return BaseModel.objects.create(
        name="dino",
        stac_item_id="dino",
        user=admin,
        is_pinned=True,
        status=BaseModel.Status.ACTIVE,
    )


@pytest.fixture
def dataset(owner: OsmUser) -> Dataset:
    return Dataset.objects.create(
        stac_id="banepa",
        title="Banepa",
        imagery={"image": "https://t.example/{z}/{x}/{y}"},
        primary_input="image",
        user=owner,
        status=Dataset.Status.BUILT,
        visibility=Visibility.PUBLIC,
    )


def _client(user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def _item(item_id: str, **properties: object) -> pystac.Item:
    return pystac.Item(item_id, None, None, datetime.now(UTC), properties)


@patch("modelregistry.deletion.item_exists", return_value=True)
@patch("modelregistry.deletion.get_master_client")
def test_admin_deletes_base_model_with_its_stac_versions(
    mock_client, mock_exists, admin: OsmUser, base_model: BaseModel
) -> None:
    response = _client(admin).delete(f"/api/v1/base-models/{base_model.id}/")

    assert response.status_code == 204
    mock_client.return_value.delete_base_model.assert_called_once_with("dino")
    assert not BaseModel.objects.exists()


@patch("modelregistry.deletion.get_master_client")
def test_non_admin_cannot_delete_base_model(
    mock_client, owner: OsmUser, base_model: BaseModel
) -> None:
    response = _client(owner).delete(f"/api/v1/base-models/{base_model.id}/")

    assert response.status_code == 403
    mock_client.assert_not_called()
    assert BaseModel.objects.exists()


@patch("modelregistry.deletion.get_master_client")
def test_base_model_with_local_models_is_kept(
    mock_client, admin: OsmUser, base_model: BaseModel
) -> None:
    LocalModel.objects.create(name="banepa", base_model=base_model, user=admin)

    response = _client(admin).delete(f"/api/v1/base-models/{base_model.id}/")

    assert response.status_code == 409
    mock_client.assert_not_called()
    assert BaseModel.objects.exists()


@patch("modelregistry.deletion.item_exists", return_value=False)
@patch("modelregistry.deletion.get_master_client")
def test_base_model_row_without_stac_item_is_still_deleted(
    mock_client, mock_exists, admin: OsmUser, base_model: BaseModel
) -> None:
    response = _client(admin).delete(f"/api/v1/base-models/{base_model.id}/")

    assert response.status_code == 204
    mock_client.assert_not_called()
    assert not BaseModel.objects.exists()


@patch("modelregistry.deletion.item_exists", return_value=True)
@patch("modelregistry.deletion.get_master_client")
def test_stac_failure_keeps_the_base_model_row(
    mock_client, mock_exists, base_model: BaseModel
) -> None:
    mock_client.return_value.delete_base_model.side_effect = RuntimeError("cluster unreachable")

    with pytest.raises(RuntimeError):
        delete_base_model(base_model)

    assert BaseModel.objects.filter(pk=base_model.pk).exists()


@patch("modelregistry.deletion.get_master_client")
def test_registering_base_model_is_kept(mock_client, admin: OsmUser, base_model: BaseModel) -> None:
    BaseModel.objects.filter(pk=base_model.pk).update(status=BaseModel.Status.REGISTERING)

    response = _client(admin).delete(f"/api/v1/base-models/{base_model.id}/")

    assert response.status_code == 409
    mock_client.assert_not_called()


@patch("datasets.deletion.get_master_client")
def test_building_dataset_is_kept(mock_client, owner: OsmUser, dataset: Dataset) -> None:
    Dataset.objects.filter(pk=dataset.pk).update(status=Dataset.Status.BUILDING)

    response = _client(owner).delete(f"/api/v1/datasets/{dataset.id}/")

    assert response.status_code == 409
    mock_client.assert_not_called()


@patch("datasets.deletion.item_exists", return_value=True)
@patch("datasets.deletion.get_master_client")
def test_owner_deletes_dataset_with_its_stac_versions(
    mock_client, mock_exists, owner: OsmUser, dataset: Dataset
) -> None:
    response = _client(owner).delete(f"/api/v1/datasets/{dataset.id}/")

    assert response.status_code == 204
    mock_client.return_value.delete_dataset.assert_called_once_with("banepa")
    assert not Dataset.objects.exists()


@patch("datasets.deletion.get_master_client")
def test_other_user_cannot_delete_dataset(mock_client, dataset: Dataset) -> None:
    stranger = OsmUser.objects.create(osm_id=53, username="stranger")

    response = _client(stranger).delete(f"/api/v1/datasets/{dataset.id}/")

    assert response.status_code == 403
    mock_client.assert_not_called()
    assert Dataset.objects.exists()


@patch("datasets.deletion.get_master_client")
def test_dataset_used_by_a_training_run_is_kept(
    mock_client, owner: OsmUser, dataset: Dataset, base_model: BaseModel
) -> None:
    local_model = LocalModel.objects.create(name="banepa", base_model=base_model, user=owner)
    TrainingRunRef.objects.create(
        local_model=local_model, base_model_stac_id="dino", dataset=dataset, user=owner
    )

    response = _client(owner).delete(f"/api/v1/datasets/{dataset.id}/")

    assert response.status_code == 409
    mock_client.assert_not_called()
    assert Dataset.objects.exists()


@pytest.mark.parametrize("is_pinned", [True, False])
def test_registration_writes_the_row_pin_onto_the_item(admin: OsmUser, is_pinned: bool) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin, is_pinned=is_pinned)
    published: dict = {}

    def register(path: str, **kwargs: object) -> str:
        published.update(json.loads(Path(path).read_text()))
        return "dino"

    with (
        patch("modelregistry.tasks.for_user") as mock_for_user,
        patch("modelregistry.tasks.mirror_stac_assets_task"),
    ):
        mock_for_user.return_value.register_base_model.side_effect = register
        register_base_model.func(base_model_id=base_model.id, stac_item=copy.deepcopy(ITEM))

    assert published["properties"]["fair:pinned"] is is_pinned


def test_registration_refreshes_the_cache_of_the_published_item(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="yolo-waste", user=admin)
    with (
        patch("modelregistry.tasks.for_user") as mock_client,
        patch("modelregistry.tasks.invalidate_stac_cache") as mock_invalidate,
        patch("modelregistry.tasks.mirror_stac_assets_task"),
    ):
        mock_client.return_value.register_base_model.return_value = "yolo_waste"
        register_base_model.func(base_model_id=base_model.id, stac_item=copy.deepcopy(ITEM))

    mock_invalidate.assert_called_once_with(BASE_MODELS_COLLECTION, "yolo_waste")


def _run_drift(out: StringIO, base_models=(), local_models=(), datasets=()) -> None:
    with (
        patch(f"{DRIFT}.list_base_models", return_value=list(base_models)),
        patch(f"{DRIFT}.list_local_models", return_value=list(local_models)),
        patch(f"{DRIFT}.list_datasets", return_value=list(datasets)),
    ):
        call_command("check_stac_drift", stdout=out)


def test_drift_check_passes_when_rows_and_items_agree(
    base_model: BaseModel, dataset: Dataset
) -> None:
    out = StringIO()
    _run_drift(
        out,
        base_models=[_item("dino", **{"fair:pinned": True}), _item("dino-v1", deprecated=True)],
        datasets=[_item("banepa")],
    )

    assert "no drift" in out.getvalue()


@pytest.mark.parametrize(
    ("base_models", "datasets", "finding"),
    [
        ([_item("dino", **{"fair:pinned": False})], [_item("banepa")], "row pinned=True"),
        ([_item("dino", **{"fair:pinned": True})], [], "datasets/banepa: row"),
        (
            [_item("dino", **{"fair:pinned": True})],
            [_item("banepa"), _item("orphan")],
            "datasets/orphan: STAC item has no row",
        ),
    ],
    ids=["pin differs", "row without item", "item without row"],
)
def test_drift_check_fails_on_each_kind_of_drift(
    base_model: BaseModel, dataset: Dataset, base_models, datasets, finding: str
) -> None:
    out = StringIO()
    with pytest.raises(CommandError, match="1 drift finding"):
        _run_drift(out, base_models=base_models, datasets=datasets)

    assert finding in out.getvalue()


def test_drift_check_ignores_a_dataset_still_building(owner: OsmUser) -> None:
    Dataset.objects.create(
        stac_id="pending",
        title="Pending",
        imagery={"image": "https://t.example/{z}/{x}/{y}"},
        primary_input="image",
        user=owner,
        status=Dataset.Status.BUILDING,
    )

    out = StringIO()
    _run_drift(out)

    assert "no drift" in out.getvalue()


@pytest.fixture
def admin_site(db) -> Client:
    superuser = OsmUser.objects.create(osm_id=54, username="root", is_staff=True, is_superuser=True)
    client = Client()
    client.force_login(superuser)
    return client


@patch("modelregistry.deletion.item_exists", return_value=True)
@patch("modelregistry.deletion.get_master_client")
def test_admin_site_delete_removes_base_model_stac_versions(
    mock_client, mock_exists, admin_site: Client, base_model: BaseModel
) -> None:
    url = f"/django-admin/modelregistry/basemodel/{base_model.id}/delete/"

    admin_site.post(url, {"post": "yes"})

    mock_client.return_value.delete_base_model.assert_called_once_with("dino")
    assert not BaseModel.objects.exists()


@patch("modelregistry.deletion.get_master_client")
def test_admin_site_keeps_a_registering_base_model(
    mock_client, admin_site: Client, base_model: BaseModel
) -> None:
    BaseModel.objects.filter(pk=base_model.pk).update(status=BaseModel.Status.REGISTERING)

    response = admin_site.post(
        "/django-admin/modelregistry/basemodel/",
        {"action": "delete_selected", "_selected_action": [base_model.id], "post": "yes"},
        follow=True,
    )

    assert response.status_code == 403
    mock_client.assert_not_called()
    assert BaseModel.objects.exists()


def test_admin_site_changelist_edits_save_without_touching_stac(
    admin_site: Client, base_model: BaseModel
) -> None:
    response = admin_site.post(
        "/django-admin/modelregistry/basemodel/",
        {
            "form-TOTAL_FORMS": "1",
            "form-INITIAL_FORMS": "1",
            "form-0-id": base_model.id,
            "form-0-status": "active",
            "form-0-visibility": "private",
            "_save": "Save",
        },
    )

    assert response.status_code == 302
    base_model.refresh_from_db()
    assert base_model.visibility == "private"


def test_a_pin_made_during_registration_reaches_the_new_item(admin: OsmUser) -> None:
    base_model = BaseModel.objects.create(name="dino", user=admin, is_pinned=False)

    def register(path: str, **kwargs: object) -> str:
        BaseModel.objects.filter(pk=base_model.pk).update(is_pinned=True)
        return "dino"

    with (
        patch("modelregistry.tasks.for_user") as mock_for_user,
        patch("modelregistry.tasks.set_item_property") as mock_set,
        patch("modelregistry.tasks.mirror_stac_assets_task"),
    ):
        mock_for_user.return_value.register_base_model.side_effect = register
        register_base_model.func(base_model_id=base_model.id, stac_item=copy.deepcopy(ITEM))

    mock_set.assert_called_once_with(BASE_MODELS_COLLECTION, "dino", "fair:pinned", True)


def test_stac_patch_cannot_set_the_pin(admin: OsmUser, base_model: BaseModel) -> None:
    response = _client(admin).patch(
        f"/api/v1/base-models/{base_model.id}/stac/",
        {"properties": {"fair:pinned": False}},
        format="json",
    )

    assert response.status_code == 400
    assert "fair:pinned" in json.dumps(response.json())


@patch("datasets.deletion.item_exists", return_value=True)
@patch("datasets.deletion.get_master_client")
def test_admin_site_delete_removes_dataset_stac_versions(
    mock_client, mock_exists, admin_site: Client, dataset: Dataset
) -> None:
    admin_site.post(f"/django-admin/datasets/dataset/{dataset.id}/delete/", {"post": "yes"})

    mock_client.return_value.delete_dataset.assert_called_once_with("banepa")
    assert not Dataset.objects.exists()


def test_admin_site_cannot_delete_local_models(
    admin_site: Client, admin: OsmUser, base_model: BaseModel
) -> None:
    local_model = LocalModel.objects.create(name="banepa", base_model=base_model, user=admin)

    response = admin_site.post(
        f"/django-admin/modelregistry/localmodel/{local_model.id}/delete/", {"post": "yes"}
    )

    assert response.status_code == 403
    assert LocalModel.objects.exists()


@pytest.mark.parametrize(("action", "pinned"), [("pin", True), ("unpin", False)])
@patch("modelregistry.views._merge_validate_write")
def test_admin_site_pin_actions_write_the_row_and_stac(
    mock_write, admin_site: Client, base_model: BaseModel, action: str, pinned: bool
) -> None:
    admin_site.post(
        "/django-admin/modelregistry/basemodel/",
        {"action": action, "_selected_action": [base_model.id]},
    )

    base_model.refresh_from_db()
    assert base_model.is_pinned is pinned
    mock_write.assert_called_once_with(BASE_MODELS_COLLECTION, "dino", {"fair:pinned": pinned})


def _change_form(admin_site: Client, base_model: BaseModel, admin: OsmUser, **stac: str):
    form = {"status": "active", "visibility": "public", "user": admin.osm_id}
    form.update({"stac_title": "Old", "stac_description": "Same", **stac})
    return admin_site.post(f"/django-admin/modelregistry/basemodel/{base_model.id}/change/", form)


@patch("modelregistry.admin.get_item", return_value=_item("dino", title="Old", description="Same"))
@patch("modelregistry.admin._validate_merge")
@patch("modelregistry.admin._apply_metadata")
def test_admin_site_edits_the_stac_title_and_preview(
    mock_apply, mock_validate, mock_get, admin_site: Client, admin: OsmUser, base_model: BaseModel
) -> None:
    preview = {"center": [1, 2], "zoom": {"recommended": 19}, "imagery": {"url": "u"}}

    response = _change_form(
        admin_site, base_model, admin, stac_title="New", stac_preview=json.dumps(preview)
    )

    assert response.status_code == 302
    mock_apply.assert_called_once_with(
        BASE_MODELS_COLLECTION, "dino", {"title": "New", "fair_preview": preview}
    )


@patch("modelregistry.admin.get_item", return_value=_item("dino", title="Old", description="Same"))
@patch("modelregistry.admin._validate_merge", side_effect=ValidationError({"stac": ["bad"]}))
@patch("modelregistry.admin._apply_metadata")
def test_admin_site_shows_a_schema_error_and_saves_nothing(
    mock_apply, mock_validate, mock_get, admin_site: Client, admin: OsmUser, base_model: BaseModel
) -> None:
    response = _change_form(admin_site, base_model, admin, stac_title="New")

    assert response.status_code == 200
    assert "bad" in response.content.decode()
    mock_apply.assert_not_called()


@patch("modelregistry.admin.get_item", return_value=_item("dino", title="Old", description="Same"))
@patch("modelregistry.admin._apply_metadata")
def test_admin_site_refuses_to_clear_a_stac_field(
    mock_apply, mock_get, admin_site: Client, admin: OsmUser, base_model: BaseModel
) -> None:
    response = _change_form(admin_site, base_model, admin, stac_title="")

    assert response.status_code == 200
    assert "cannot be cleared" in response.content.decode()
    mock_apply.assert_not_called()


@patch(
    "modelregistry.admin.get_item",
    return_value=_item("dino", title="Old", description="line one\nline two"),
)
@patch("modelregistry.admin._apply_metadata")
def test_admin_site_ignores_line_ending_only_description_changes(
    mock_apply, mock_get, admin_site: Client, admin: OsmUser, base_model: BaseModel
) -> None:
    response = _change_form(admin_site, base_model, admin, stac_description="line one\r\nline two")

    assert response.status_code == 302
    mock_apply.assert_not_called()
