import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from datasets.models import Dataset
from modelregistry.models import BaseModel, LocalModel
from predictions.models import Prediction
from trainings.models import TrainingRunRef

IMAGERY = {"image": "https://tiles.example/{z}/{x}/{y}.png"}


def _client_for(user: OsmUser | None) -> APIClient:
    client = APIClient()
    if user:
        client.force_authenticate(user=user)
    return client


def _names(client: APIClient, query: str) -> set[str]:
    return {row["name"] for row in client.get(f"/api/v1/local-models/?{query}").json()["results"]}


@pytest.fixture
def models(user: OsmUser, other_user: OsmUser) -> None:
    base = BaseModel.objects.create(name="base", stac_item_id="base", user=user)
    for owner, name, stac_item_id, visibility in [
        (user, "mine-public", "mine-public-v1", "public"),
        (user, "mine-private", "mine-private-v1", "private"),
        (user, "mine-draft", "", "public"),
        (other_user, "theirs-private", "theirs-private-v1", "private"),
        (other_user, "theirs-draft", "", "public"),
    ]:
        LocalModel.objects.create(
            name=name, base_model=base, stac_item_id=stac_item_id, visibility=visibility, user=owner
        )


def test_owner_lists_their_published_models_and_their_drafts(models, user: OsmUser) -> None:
    client = _client_for(user)

    assert _names(client, f"user={user.osm_id}") == {"mine-public", "mine-private"}
    assert _names(client, "published=false") == {"mine-draft"}
    assert _names(client, f"published=all&user={user.osm_id}") == {
        "mine-public",
        "mine-private",
        "mine-draft",
    }


@pytest.mark.parametrize("viewer", ["other_user", "anonymous"])
def test_others_see_only_published_public_models(
    models, request, user: OsmUser, viewer: str
) -> None:
    client = _client_for(None if viewer == "anonymous" else request.getfixturevalue(viewer))

    assert _names(client, f"user={user.osm_id}") == {"mine-public"}
    assert _names(client, f"published=false&user={user.osm_id}") == set()
    assert _names(client, f"published=all&user={user.osm_id}") == {"mine-public"}


def test_admins_do_not_list_other_users_drafts(models, admin_user: OsmUser) -> None:
    admin = _client_for(admin_user)

    assert _names(admin, "published=false") == set()
    assert _names(admin, "published=all") == {"mine-public", "mine-private", "theirs-private"}


def test_published_filter_rejects_other_values(client) -> None:
    assert client.get("/api/v1/local-models/?published=maybe").status_code == 400


def _dataset(owner: OsmUser, title: str, visibility: str) -> Dataset:
    return Dataset.objects.create(
        stac_id=title,
        title=title,
        imagery=IMAGERY,
        primary_input="image",
        category_id="trees",
        visibility=visibility,
        user=owner,
    )


def _prediction(owner: OsmUser, title: str, visibility: str) -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id="m",
        imagery=IMAGERY,
        primary_input="image",
        geometry={},
        zoom=19,
        description=title,
        visibility=visibility,
        user=owner,
    )


@pytest.mark.parametrize(
    ("path", "make", "label"),
    [("datasets", _dataset, "title"), ("predictions", _prediction, "description")],
)
@pytest.mark.parametrize(
    ("viewer", "expected"),
    [("user", {"public", "private"}), ("other_user", {"public"}), (None, {"public"})],
)
def test_my_list_shows_private_rows_only_to_their_owner(
    request,
    user: OsmUser,
    other_user: OsmUser,
    path: str,
    make,
    label: str,
    viewer: str | None,
    expected: set[str],
) -> None:
    make(user, "public", "public")
    make(user, "private", "private")
    make(other_user, "theirs", "public")
    client = _client_for(request.getfixturevalue(viewer) if viewer else None)

    rows = client.get(f"/api/v1/{path}/?user={user.osm_id}").json()["results"]

    assert {row[label] for row in rows} == expected


def test_datasets_filter_by_category(client, user: OsmUser) -> None:
    _dataset(user, "trees", "public")
    Dataset.objects.create(
        stac_id="roofs",
        title="roofs",
        imagery=IMAGERY,
        primary_input="image",
        category_id="buildings",
        user=user,
    )

    rows = client.get("/api/v1/datasets/?category=trees").json()["results"]

    assert [row["title"] for row in rows] == ["trees"]


def test_training_runs_list_only_the_callers_own(user: OsmUser, other_user: OsmUser) -> None:
    base = BaseModel.objects.create(name="base", stac_item_id="base", user=user)
    draft = LocalModel.objects.create(name="draft", base_model=base, user=user)
    TrainingRunRef.objects.create(local_model=draft, base_model_stac_id="base", user=user)

    mine = _client_for(user).get(f"/api/v1/trainings/?user={user.osm_id}").json()
    theirs = _client_for(other_user).get(f"/api/v1/trainings/?user={user.osm_id}").json()

    assert (mine["count"], theirs["count"]) == (1, 0)


def test_a_draft_cannot_be_made_public(models, user: OsmUser) -> None:
    draft = LocalModel.objects.get(name="mine-draft")
    LocalModel.objects.filter(pk=draft.pk).update(visibility="private")

    response = _client_for(user).post(f"/api/v1/local-models/{draft.id}/publish/")

    assert response.status_code == 409
    draft.refresh_from_db()
    assert draft.visibility == "private"


@pytest.mark.parametrize("viewer", ["other_user", "anonymous"])
def test_another_users_draft_cannot_be_opened_by_id(models, request, viewer: str) -> None:
    draft = LocalModel.objects.get(name="mine-draft")
    client = _client_for(None if viewer == "anonymous" else request.getfixturevalue(viewer))

    assert client.get(f"/api/v1/local-models/{draft.id}/").status_code == 404
