import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from modelregistry.models import BaseModel
from shared.enums import BaseModelStatus, Visibility


@pytest.fixture
def owner(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=101, username="owner")


def _make(name: str, user: OsmUser, status: str) -> BaseModel:
    return BaseModel.objects.create(
        name=name, user=user, status=status, visibility=Visibility.PUBLIC
    )


def _names(resp) -> set[str]:
    return {row["name"] for row in resp.json()["results"]}


def test_anonymous_sees_only_active(owner) -> None:
    _make("active-1", owner, BaseModelStatus.ACTIVE)
    _make("failed-1", owner, BaseModelStatus.FAILED)
    _make("registering-1", owner, BaseModelStatus.REGISTERING)
    assert _names(APIClient().get("/api/v1/base-models/")) == {"active-1"}


def test_owner_also_sees_their_own_failed(owner) -> None:
    _make("active-1", owner, BaseModelStatus.ACTIVE)
    _make("failed-mine", owner, BaseModelStatus.FAILED)
    api = APIClient()
    api.force_authenticate(user=owner)
    assert _names(api.get("/api/v1/base-models/")) == {"active-1", "failed-mine"}


def test_other_user_does_not_see_foreign_failed(owner) -> None:
    _make("active-1", owner, BaseModelStatus.ACTIVE)
    _make("failed-owner", owner, BaseModelStatus.FAILED)
    other = OsmUser.objects.create(osm_id=102, username="other")
    api = APIClient()
    api.force_authenticate(user=other)
    assert _names(api.get("/api/v1/base-models/")) == {"active-1"}


def test_admin_sees_all(owner) -> None:
    _make("active-1", owner, BaseModelStatus.ACTIVE)
    _make("failed-1", owner, BaseModelStatus.FAILED)
    admin = OsmUser.objects.create(osm_id=200, username="boss", is_staff=True)
    api = APIClient()
    api.force_authenticate(user=admin)
    assert _names(api.get("/api/v1/base-models/")) == {"active-1", "failed-1"}
