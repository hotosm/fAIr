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


def test_new_user_lists_no_states(user: OsmUser) -> None:
    response = _client_for(user).get(URL)

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_create_then_retrieve_returns_saved_state(user: OsmUser) -> None:
    client = _client_for(user)
    state = {"try_fair": {"model": "dinov3s-buildings", "zoom": 19}}

    created = client.post(URL, {"state": state}, format="json")
    fetched = client.get(f"{URL}{created.json()['pid']}/")

    assert created.status_code == 201
    assert fetched.status_code == 200
    assert fetched.json()["state"] == state
    assert UserState.objects.get(pid=created.json()["pid"]).user == user


def test_user_keeps_several_states(user: OsmUser) -> None:
    client = _client_for(user)
    client.post(URL, {"state": {"view": 1}}, format="json")
    client.post(URL, {"state": {"view": 2}}, format="json")

    states = [row["state"] for row in client.get(URL).json()["results"]]

    assert sorted(state["view"] for state in states) == [1, 2]


def test_patch_replaces_state_and_advances_timestamp(user: OsmUser) -> None:
    client = _client_for(user)
    created = client.post(URL, {"state": {"old": True, "kept": 1}}, format="json").json()

    replaced = client.patch(f"{URL}{created['pid']}/", {"state": {"new": True}}, format="json")

    assert replaced.status_code == 200
    assert replaced.json()["state"] == {"new": True}
    assert datetime.fromisoformat(replaced.json()["timestamp"]) > datetime.fromisoformat(
        created["timestamp"]
    )


def test_put_is_not_allowed(user: OsmUser) -> None:
    client = _client_for(user)
    pid = client.post(URL, {"state": {"a": 1}}, format="json").json()["pid"]

    response = client.put(f"{URL}{pid}/", {"state": {"a": 2}}, format="json")

    assert response.status_code == 405
    assert UserState.objects.get(pid=pid).state == {"a": 1}


def test_delete_removes_own_state(user: OsmUser) -> None:
    client = _client_for(user)
    pid = client.post(URL, {"state": {"a": 1}}, format="json").json()["pid"]

    response = client.delete(f"{URL}{pid}/")

    assert response.status_code == 204
    assert not UserState.objects.filter(pid=pid).exists()


def test_user_field_in_body_is_ignored(user: OsmUser, other_user: OsmUser) -> None:
    response = _client_for(user).post(URL, {"state": {"a": 1}, "user": other_user.osm_id}, format="json")

    assert UserState.objects.get(pid=response.json()["pid"]).user == user


def test_other_users_states_are_invisible(user: OsmUser, other_user: OsmUser) -> None:
    pid = _client_for(user).post(URL, {"state": {"secret": 1}}, format="json").json()["pid"]
    other_client = _client_for(other_user)

    assert other_client.get(URL).json()["results"] == []
    assert other_client.get(f"{URL}{pid}/").status_code == 404
    assert other_client.patch(f"{URL}{pid}/", {"state": {}}, format="json").status_code == 404
    assert other_client.delete(f"{URL}{pid}/").status_code == 404
    assert UserState.objects.get(pid=pid).state == {"secret": 1}


@pytest.mark.parametrize("state", [[1, {"zoom": 19}], "text", "", 5, 0, True, False])
def test_non_object_state_is_stored_unchanged(user: OsmUser, state: object) -> None:
    client = _client_for(user)

    created = client.post(URL, {"state": state}, format="json")
    assert created.status_code == 201
    fetched = client.get(f"{URL}{created.json()['pid']}/").json()["state"]

    assert fetched == state
    assert type(fetched) is type(state)


@pytest.mark.parametrize("shape", ["object", "string"])
def test_state_over_size_limit_is_rejected(
    user: OsmUser, max_state_bytes: int, shape: str
) -> None:
    blob = "x" * max_state_bytes
    oversized = {"blob": blob} if shape == "object" else blob

    response = _client_for(user).post(URL, {"state": oversized}, format="json")

    assert response.status_code == 400
    assert not UserState.objects.exists()


def test_patch_updates_own_state(user: OsmUser) -> None:
    client = _client_for(user)
    pid = client.post(URL, {"state": {"zoom": 19}}, format="json").json()["pid"]

    response = client.patch(f"{URL}{pid}/", {"state": {"zoom": 20}}, format="json")

    assert response.status_code == 200
    assert UserState.objects.get(pid=pid).state == {"zoom": 20}


@pytest.mark.parametrize("body", [{"state": None}, {}])
def test_null_or_missing_state_is_rejected(user: OsmUser, body: dict) -> None:
    response = _client_for(user).post(URL, body, format="json")

    assert response.status_code == 400
    assert not UserState.objects.exists()


def test_pid_in_body_is_ignored(user: OsmUser) -> None:
    client = _client_for(user)
    first = client.post(URL, {"state": {"a": 1}}, format="json").json()["pid"]

    second = client.post(URL, {"state": {"b": 2}, "pid": first}, format="json").json()["pid"]

    assert second != first
    assert UserState.objects.get(pid=first).state == {"a": 1}


def test_state_exactly_at_size_limit_is_accepted(user: OsmUser, max_state_bytes: int) -> None:
    envelope = len(json.dumps({"blob": ""}, separators=(",", ":")).encode())
    at_limit = {"blob": "x" * (max_state_bytes - envelope)}

    response = _client_for(user).post(URL, {"state": at_limit}, format="json")

    assert response.status_code == 201


def test_default_limit_accepts_a_500_kb_state(user: OsmUser, settings) -> None:
    settings.USER_STATE_MAX_BYTES = Settings.model_fields["user_state_max_bytes"].default

    response = _client_for(user).post(URL, {"state": {"blob": "x" * 500_000}}, format="json")

    assert response.status_code == 201


def test_oversized_body_is_rejected_before_parsing(user: OsmUser, max_state_bytes: int) -> None:
    body = json.dumps({"state": {"blob": "x" * (max_state_bytes + BODY_OVERHEAD_BYTES)}})

    response = _client_for(user).generic("POST", URL, body, content_type="application/json")

    assert response.status_code == 400
    assert "Request body must be at most" in json.dumps(response.json())
    assert not UserState.objects.exists()


def test_admin_lists_every_users_states(user: OsmUser, other_user: OsmUser, admin_user: OsmUser) -> None:
    _client_for(user).post(URL, {"state": {"owner": "alice"}}, format="json")
    _client_for(other_user).post(URL, {"state": {"owner": "bob"}}, format="json")

    owners = {row["state"]["owner"] for row in _client_for(admin_user).get(URL).json()["results"]}

    assert owners == {"alice", "bob"}


def test_admin_reads_updates_and_deletes_another_users_state(
    user: OsmUser, admin_user: OsmUser
) -> None:
    pid = _client_for(user).post(URL, {"state": {"a": 1}}, format="json").json()["pid"]
    admin_client = _client_for(admin_user)

    assert admin_client.get(f"{URL}{pid}/").json()["state"] == {"a": 1}
    assert admin_client.patch(f"{URL}{pid}/", {"state": {"a": 2}}, format="json").status_code == 200
    assert UserState.objects.get(pid=pid).state == {"a": 2}
    assert UserState.objects.get(pid=pid).user == user
    assert admin_client.delete(f"{URL}{pid}/").status_code == 204
    assert not UserState.objects.filter(pid=pid).exists()


def test_list_returns_the_most_recently_saved_state_first(user: OsmUser) -> None:
    client = _client_for(user)
    first = client.post(URL, {"state": {"name": "first"}}, format="json").json()["pid"]
    client.post(URL, {"state": {"name": "second"}}, format="json")
    client.patch(f"{URL}{first}/", {"state": {"name": "first, edited"}}, format="json")

    names = [row["state"]["name"] for row in client.get(URL).json()["results"]]

    assert names == ["first, edited", "second"]
