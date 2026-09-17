from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import OsmUser
from notifications.models import Banner, UserNotification

BANNERS_URL = "/api/v1/banners/"
NOTIFICATIONS_URL = "/api/v1/notifications/me/"


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=42, username="alice")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


@pytest.fixture
def other_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=43, username="bob")


def test_banner_list_is_public_and_hides_unstarted_banners(db):
    now = timezone.now()
    Banner.objects.create(message="live now", start_date=now - timedelta(days=1))
    Banner.objects.create(message="coming soon", start_date=now + timedelta(days=1))

    response = APIClient().get(BANNERS_URL)

    assert response.status_code == 200
    messages = [banner["message"] for banner in response.json()["results"]]
    assert messages == ["live now"]


def test_banner_serializer_exposes_displayable_state(db):
    now = timezone.now()
    Banner.objects.create(
        message="expired",
        start_date=now - timedelta(days=2),
        end_date=now - timedelta(days=1),
    )

    response = APIClient().get(BANNERS_URL)

    assert response.status_code == 200
    banners = response.json()["results"]
    assert len(banners) == 1
    # Started-but-expired banners are still listed, flagged not displayable
    assert banners[0]["is_displayable"] is False


def test_notifications_require_authentication(db):
    response = APIClient().get(NOTIFICATIONS_URL)
    assert response.status_code == 401


def test_notifications_list_only_own(client, authed_user, other_user):
    UserNotification.objects.create(user=authed_user, message="for alice")
    UserNotification.objects.create(user=other_user, message="for bob")

    response = client.get(NOTIFICATIONS_URL)

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    assert payload["results"][0]["message"] == "for alice"
    assert payload["results"][0]["is_read"] is False


def test_mark_read_sets_read_state(client, authed_user):
    notification = UserNotification.objects.create(user=authed_user, message="hi")

    response = client.post(f"{NOTIFICATIONS_URL}{notification.id}/mark-read/")

    assert response.status_code == 200
    body = response.json()
    assert body["is_read"] is True
    assert body["read_at"] is not None
    notification.refresh_from_db()
    assert notification.is_read is True
    assert notification.read_at is not None


def test_mark_read_scoped_to_own_notifications(client, other_user):
    notification = UserNotification.objects.create(user=other_user, message="not yours")

    response = client.post(f"{NOTIFICATIONS_URL}{notification.id}/mark-read/")

    assert response.status_code == 404
    notification.refresh_from_db()
    assert notification.is_read is False


def test_mark_all_read_updates_only_own_unread(client, authed_user, other_user):
    UserNotification.objects.create(user=authed_user, message="one")
    UserNotification.objects.create(user=authed_user, message="two")
    other_notification = UserNotification.objects.create(user=other_user, message="other")

    response = client.post(f"{NOTIFICATIONS_URL}mark-all-read/")

    assert response.status_code == 200
    assert response.json() == {"detail": "ok"}
    assert UserNotification.objects.filter(user=authed_user, is_read=False).count() == 0
    other_notification.refresh_from_db()
    assert other_notification.is_read is False
