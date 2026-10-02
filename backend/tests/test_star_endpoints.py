import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from stars.models import Star

STARS_URL = "/api/v1/stars/"


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=42, username="alice")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


@pytest.fixture
def anon_client(db) -> APIClient:
    return APIClient()


def test_star_get_requires_target_id(anon_client):
    response = anon_client.get(STARS_URL)
    assert response.status_code == 400
    assert "target_id" in response.json()["detail"]


def test_star_post_requires_target_id(anon_client):
    response = anon_client.post(STARS_URL)
    assert response.status_code == 400


def test_anonymous_star_dedupes_repeat_clicks(anon_client):
    response = anon_client.post(f"{STARS_URL}?target_id=model-1")
    assert response.status_code == 201
    payload = response.json()
    assert payload == {
        "target_id": "model-1",
        "starred": True,
        "count": 1,
        "created": True,
    }

    # Same client (same IP + user agent) starring again must not double-count
    response = anon_client.post(f"{STARS_URL}?target_id=model-1")
    assert response.status_code == 200
    payload = response.json()
    assert payload["created"] is False
    assert payload["count"] == 1


def test_distinct_anonymous_clients_count_separately(anon_client):
    anon_client.post(f"{STARS_URL}?target_id=model-1")
    response = anon_client.post(
        f"{STARS_URL}?target_id=model-1",
        HTTP_USER_AGENT="a-different-browser",
    )

    assert response.status_code == 201
    assert response.json()["count"] == 2


def test_authenticated_star_state(client, authed_user, anon_client):
    response = client.post(f"{STARS_URL}?target_id=model-2")
    assert response.status_code == 201
    assert Star.objects.get(target_id="model-2").user == authed_user

    response = client.get(STARS_URL, {"target_id": "model-2"})
    assert response.status_code == 200
    assert response.json() == {"target_id": "model-2", "count": 1, "starred": True}

    # An anonymous viewer sees the count but is not the one who starred
    response = anon_client.get(STARS_URL, {"target_id": "model-2"})
    assert response.status_code == 200
    assert response.json() == {"target_id": "model-2", "count": 1, "starred": False}


def test_authenticated_unstar(client):
    client.post(f"{STARS_URL}?target_id=model-3")

    response = client.delete(f"{STARS_URL}?target_id=model-3")
    assert response.status_code == 204

    response = client.get(STARS_URL, {"target_id": "model-3"})
    assert response.json() == {"target_id": "model-3", "count": 0, "starred": False}


def test_anonymous_unstar_removes_only_own_star(client, anon_client):
    client.post(f"{STARS_URL}?target_id=model-4")
    anon_client.post(f"{STARS_URL}?target_id=model-4")
    assert Star.objects.filter(target_id="model-4").count() == 2

    response = anon_client.delete(f"{STARS_URL}?target_id=model-4")
    assert response.status_code == 204

    response = anon_client.get(STARS_URL, {"target_id": "model-4"})
    assert response.json() == {"target_id": "model-4", "count": 1, "starred": False}
