import pytest
from django.contrib.gis.geos import Polygon
from rest_framework.test import APIClient

from accounts.models import OsmUser
from feedback.models import Feedback

FEEDBACK_URL = "/api/v1/feedback/"

_POLYGON_GEOJSON = {
    "type": "Polygon",
    "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
}


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


@pytest.fixture
def other_client(other_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=other_user)
    return api


def _make_feedback(user: OsmUser, **overrides) -> Feedback:
    defaults = {
        "stac_id": "stac-1",
        "geom": Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326),
        "action": Feedback.Action.ACCEPT,
        "user": user,
    }
    defaults.update(overrides)
    return Feedback.objects.create(**defaults)


def _features(payload: dict) -> list:
    """Unwrap a paginated GeoJSON FeatureCollection list response."""
    results = payload.get("results", payload)
    if isinstance(results, dict) and "features" in results:
        return results["features"]
    return results


def test_feedback_requires_authentication(db):
    response = APIClient().get(FEEDBACK_URL)
    assert response.status_code == 401


def test_feedback_create_sets_request_user(client, authed_user):
    response = client.post(
        FEEDBACK_URL,
        data={
            "type": "Feature",
            "geometry": _POLYGON_GEOJSON,
            "properties": {
                "stac_id": "stac-1",
                "action": "accept",
                "comments": "looks right",
            },
        },
        format="json",
    )

    assert response.status_code == 201
    feature = response.json()
    assert feature["properties"]["stac_id"] == "stac-1"
    assert feature["properties"]["action"] == "accept"
    assert feature["properties"]["user"]["osm_id"] == authed_user.osm_id
    assert feature["geometry"]["type"] == "Polygon"
    assert Feedback.objects.count() == 1
    assert Feedback.objects.get().user == authed_user


def test_feedback_create_rejects_invalid_geometry(client):
    response = client.post(
        FEEDBACK_URL,
        data={
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": "not-coordinates"},
            "properties": {"stac_id": "stac-1", "action": "accept"},
        },
        format="json",
    )

    assert response.status_code == 400


def test_feedback_create_rejects_unknown_action(client):
    response = client.post(
        FEEDBACK_URL,
        data={
            "type": "Feature",
            "geometry": _POLYGON_GEOJSON,
            "properties": {"stac_id": "stac-1", "action": "maybe"},
        },
        format="json",
    )

    assert response.status_code == 400


def test_feedback_list_filters_by_stac_id_and_action(client, authed_user):
    _make_feedback(authed_user, stac_id="stac-1")
    _make_feedback(authed_user, stac_id="stac-2", action=Feedback.Action.REJECT)

    response = client.get(FEEDBACK_URL, {"stac_id": "stac-1"})
    assert response.status_code == 200
    features = _features(response.json())
    assert len(features) == 1
    assert features[0]["properties"]["stac_id"] == "stac-1"

    response = client.get(FEEDBACK_URL, {"action": "reject"})
    assert response.status_code == 200
    features = _features(response.json())
    assert len(features) == 1
    assert features[0]["properties"]["stac_id"] == "stac-2"


def test_feedback_readable_by_other_users(other_client, authed_user):
    feedback = _make_feedback(authed_user)

    response = other_client.get(f"{FEEDBACK_URL}{feedback.id}/")
    assert response.status_code == 200
    assert response.json()["properties"]["user"]["osm_id"] == authed_user.osm_id


def test_feedback_update_denied_for_non_owner(other_client, authed_user):
    feedback = _make_feedback(authed_user)

    response = other_client.patch(
        f"{FEEDBACK_URL}{feedback.id}/",
        data={"properties": {"comments": "hijacked"}},
        format="json",
    )

    assert response.status_code == 403
    feedback.refresh_from_db()
    assert feedback.comments == ""


def test_feedback_owner_can_update_and_delete(client, authed_user):
    feedback = _make_feedback(authed_user)

    response = client.patch(
        f"{FEEDBACK_URL}{feedback.id}/",
        data={"properties": {"comments": "updated"}},
        format="json",
    )
    assert response.status_code == 200
    feedback.refresh_from_db()
    assert feedback.comments == "updated"

    response = client.delete(f"{FEEDBACK_URL}{feedback.id}/")
    assert response.status_code == 204
    assert Feedback.objects.count() == 0
