import json
from datetime import datetime

import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from config.env import Settings
from userstate.models import UserState
from userstate.views import BODY_OVERHEAD_BYTES

URL = "/api/v1/user-state/"


@pytest.fixture
def alice(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=2001, username="alice")


@pytest.fixture
def bob(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=2002, username="bob")


@pytest.fixture
def admin(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=2003, username="root", is_staff=True)


@pytest.fixture
def max_state_bytes(settings) -> int:
    settings.USER_STATE_MAX_BYTES = 4096
    return settings.USER_STATE_MAX_BYTES


def _client_for(user: OsmUser) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", URL),
        ("post", URL),
        ("get", f"{URL}1/"),
        ("put", f"{URL}1/"),
        ("patch", f"{URL}1/"),
        ("delete", f"{URL}1/"),
    ],
)
def test_anonymous_requests_are_rejected(method: str, path: str, db) -> None:
    response = getattr(APIClient(), method)(path, {"state": {}}, format="json")

    assert response.status_code == 401


def test_new_user_lists_no_states(alice: OsmUser) -> None:
    response = _client_for(alice).get(URL)

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_create_then_retrieve_returns_saved_state(alice: OsmUser) -> None:
    client = _client_for(alice)
    state = {"try_fair": {"model": "dinov3s-buildings", "zoom": 19}}

    created = client.post(URL, {"state": state}, format="json")
    fetched = client.get(f"{URL}{created.json()['pid']}/")

    assert created.status_code == 201
    assert fetched.status_code == 200
    assert fetched.json()["state"] == state
    assert UserState.objects.get(pid=created.json()["pid"]).user == alice


def test_user_keeps_several_states(alice: OsmUser) -> None:
    client = _client_for(alice)
    client.post(URL, {"state": {"view": 1}}, format="json")
    client.post(URL, {"state": {"view": 2}}, format="json")

    states = [row["state"] for row in client.get(URL).json()["results"]]

    assert sorted(state["view"] for state in states) == [1, 2]


def test_put_replaces_state_and_advances_timestamp(alice: OsmUser) -> None:
    client = _client_for(alice)
    created = client.post(URL, {"state": {"old": True, "kept": 1}}, format="json").json()

    replaced = client.put(f"{URL}{created['pid']}/", {"state": {"new": True}}, format="json")

    assert replaced.status_code == 200
    assert replaced.json()["state"] == {"new": True}
    assert datetime.fromisoformat(replaced.json()["timestamp"]) > datetime.fromisoformat(
        created["timestamp"]
    )


def test_delete_removes_own_state(alice: OsmUser) -> None:
    client = _client_for(alice)
    pid = client.post(URL, {"state": {"a": 1}}, format="json").json()["pid"]

    response = client.delete(f"{URL}{pid}/")

    assert response.status_code == 204
    assert not UserState.objects.filter(pid=pid).exists()


def test_user_field_in_body_is_ignored(alice: OsmUser, bob: OsmUser) -> None:
    response = _client_for(alice).post(URL, {"state": {"a": 1}, "user": bob.osm_id}, format="json")

    assert UserState.objects.get(pid=response.json()["pid"]).user == alice


def test_other_users_states_are_invisible(alice: OsmUser, bob: OsmUser) -> None:
    pid = _client_for(alice).post(URL, {"state": {"secret": 1}}, format="json").json()["pid"]
    bob_client = _client_for(bob)

    assert bob_client.get(URL).json()["results"] == []
    assert bob_client.get(f"{URL}{pid}/").status_code == 404
    assert bob_client.put(f"{URL}{pid}/", {"state": {}}, format="json").status_code == 404
    assert bob_client.patch(f"{URL}{pid}/", {"state": {}}, format="json").status_code == 404
    assert bob_client.delete(f"{URL}{pid}/").status_code == 404
    assert UserState.objects.get(pid=pid).state == {"secret": 1}


@pytest.mark.parametrize("state", [[1, {"zoom": 19}], "text", "", 5, 0, True, False])
def test_non_object_state_is_stored_unchanged(alice: OsmUser, state: object) -> None:
    client = _client_for(alice)

    created = client.post(URL, {"state": state}, format="json")
    assert created.status_code == 201
    fetched = client.get(f"{URL}{created.json()['pid']}/").json()["state"]

    assert fetched == state
    assert type(fetched) is type(state)


@pytest.mark.parametrize("shape", ["object", "string"])
def test_state_over_size_limit_is_rejected(
    alice: OsmUser, max_state_bytes: int, shape: str
) -> None:
    blob = "x" * max_state_bytes
    oversized = {"blob": blob} if shape == "object" else blob

    response = _client_for(alice).post(URL, {"state": oversized}, format="json")

    assert response.status_code == 400
    assert not UserState.objects.exists()


def test_patch_updates_own_state(alice: OsmUser) -> None:
    client = _client_for(alice)
    pid = client.post(URL, {"state": {"zoom": 19}}, format="json").json()["pid"]

    response = client.patch(f"{URL}{pid}/", {"state": {"zoom": 20}}, format="json")

    assert response.status_code == 200
    assert UserState.objects.get(pid=pid).state == {"zoom": 20}


@pytest.mark.parametrize("body", [{"state": None}, {}])
def test_null_or_missing_state_is_rejected(alice: OsmUser, body: dict) -> None:
    response = _client_for(alice).post(URL, body, format="json")

    assert response.status_code == 400
    assert not UserState.objects.exists()


def test_pid_in_body_is_ignored(alice: OsmUser) -> None:
    client = _client_for(alice)
    first = client.post(URL, {"state": {"a": 1}}, format="json").json()["pid"]

    second = client.post(URL, {"state": {"b": 2}, "pid": first}, format="json").json()["pid"]

    assert second != first
    assert UserState.objects.get(pid=first).state == {"a": 1}


def test_state_exactly_at_size_limit_is_accepted(alice: OsmUser, max_state_bytes: int) -> None:
    envelope = len(json.dumps({"blob": ""}, separators=(",", ":")).encode())
    at_limit = {"blob": "x" * (max_state_bytes - envelope)}

    response = _client_for(alice).post(URL, {"state": at_limit}, format="json")

    assert response.status_code == 201


def test_default_limit_accepts_a_500_kb_state(alice: OsmUser, settings) -> None:
    settings.USER_STATE_MAX_BYTES = Settings.model_fields["user_state_max_bytes"].default

    response = _client_for(alice).post(URL, {"state": {"blob": "x" * 500_000}}, format="json")

    assert response.status_code == 201


def test_oversized_body_is_rejected_before_parsing(alice: OsmUser, max_state_bytes: int) -> None:
    body = json.dumps({"state": {"blob": "x" * (max_state_bytes + BODY_OVERHEAD_BYTES)}})

    response = _client_for(alice).generic("POST", URL, body, content_type="application/json")

    assert response.status_code == 400
    assert "Request body must be at most" in json.dumps(response.json())
    assert not UserState.objects.exists()


def test_admin_lists_every_users_states(alice: OsmUser, bob: OsmUser, admin: OsmUser) -> None:
    _client_for(alice).post(URL, {"state": {"owner": "alice"}}, format="json")
    _client_for(bob).post(URL, {"state": {"owner": "bob"}}, format="json")

    owners = {row["state"]["owner"] for row in _client_for(admin).get(URL).json()["results"]}

    assert owners == {"alice", "bob"}


def test_admin_reads_updates_and_deletes_another_users_state(
    alice: OsmUser, admin: OsmUser
) -> None:
    pid = _client_for(alice).post(URL, {"state": {"a": 1}}, format="json").json()["pid"]
    admin_client = _client_for(admin)

    assert admin_client.get(f"{URL}{pid}/").json()["state"] == {"a": 1}
    assert admin_client.patch(f"{URL}{pid}/", {"state": {"a": 2}}, format="json").status_code == 200
    assert UserState.objects.get(pid=pid).state == {"a": 2}
    assert UserState.objects.get(pid=pid).user == alice
    assert admin_client.delete(f"{URL}{pid}/").status_code == 204
    assert not UserState.objects.filter(pid=pid).exists()
