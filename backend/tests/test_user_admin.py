from unittest.mock import patch

import pytest
from django.test import Client

from accounts.deletion import DELETED_USER_OSM_ID
from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import BaseModel, LocalModel
from predictions.models import Prediction
from trainings.models import TrainingRunRef

USERS = "/django-admin/accounts/osmuser"


def test_password_link_on_change_page_opens_the_password_form(admin_site: Client) -> None:
    mapper = OsmUser.objects.create(osm_id=901, username="mapper")

    change_page = admin_site.get(f"{USERS}/{mapper.pk}/change/")
    password_page = admin_site.get(f"{USERS}/{mapper.pk}/password/")

    assert change_page.status_code == 200
    assert b'href="../password/"' in change_page.content
    assert password_page.status_code == 200


def test_add_creates_a_user_without_a_usable_password(admin_site: Client) -> None:
    response = admin_site.post(
        f"{USERS}/add/",
        {"username": "new.mapper", "osm_id": 902, "email": "", "usable_password": "false"},
    )

    assert response.status_code == 302
    created = OsmUser.objects.get(osm_id=902)
    assert created.username == "new.mapper"
    assert not created.has_usable_password()


def test_add_form_starts_with_password_login_disabled(admin_site: Client) -> None:
    form = admin_site.get(f"{USERS}/add/").context["adminform"].form

    assert form["usable_password"].value() == "false"


def test_long_username_with_spaces_is_saved(db) -> None:
    username = "Mapper With Spaces ".ljust(255, "x")
    mapper = OsmUser(osm_id=903, username=username)

    mapper.full_clean(exclude=["password"])
    mapper.save()


def _prediction(owner: OsmUser, run_id: str, status: str, visibility: str) -> Prediction:
    return Prediction.objects.create(
        zenml_run_id=run_id,
        local_model_stac_id="m",
        imagery={},
        primary_input="image",
        geometry={},
        zoom=19,
        status=status,
        visibility=visibility,
        user=owner,
    )


@patch("datasets.deletion.item_exists", return_value=False)
@patch("predictions.deletion.remove_dir")
def test_deleting_a_user_removes_private_data_and_keeps_public_data(
    mock_remove, mock_exists, admin_site: Client, user: OsmUser
) -> None:
    private_prediction = _prediction(user, "run-1", "completed", "private")
    public_prediction = _prediction(user, "run-2", "completed", "public")
    base = BaseModel.objects.create(name="base", user=user)
    draft = LocalModel.objects.create(name="draft", base_model=base, user=user)
    published = LocalModel.objects.create(
        name="published", base_model=base, stac_item_id="p-1", user=user
    )
    private_dataset = Dataset.objects.create(stac_id="d-1", title="D1", imagery={}, user=user)
    used_dataset = Dataset.objects.create(stac_id="d-2", title="D2", imagery={}, user=user)
    run = TrainingRunRef.objects.create(
        zenml_run_id="run-3",
        local_model=published,
        dataset=used_dataset,
        status="completed",
        user=user,
    )

    response = admin_site.post(f"{USERS}/{user.pk}/delete/", {"post": "yes"})

    assert response.status_code == 302
    assert not OsmUser.objects.filter(pk=user.pk).exists()
    gone = [private_prediction, draft, private_dataset]
    assert not any(type(row).objects.filter(pk=row.pk).exists() for row in gone)
    mock_remove.assert_called_once()
    for row in [public_prediction, base, published, used_dataset, run]:
        row.refresh_from_db()
        assert row.user_id == DELETED_USER_OSM_ID


@pytest.mark.parametrize("bulk", [False, True])
@pytest.mark.parametrize("blocked", ["running", "placeholder"])
def test_protected_users_are_not_deleted(
    admin_site: Client, user: OsmUser, bulk: bool, blocked: str
) -> None:
    if blocked == "running":
        _prediction(user, "run-4", "running", "private")
        target = user
    else:
        target = OsmUser.objects.create(osm_id=DELETED_USER_OSM_ID, username="Deleted user")

    if bulk:
        admin_site.post(
            f"{USERS}/",
            {"action": "delete_selected", "_selected_action": [target.pk], "post": "yes"},
        )
    else:
        admin_site.post(f"{USERS}/{target.pk}/delete/", {"post": "yes"})

    assert OsmUser.objects.filter(pk=target.pk).exists()
