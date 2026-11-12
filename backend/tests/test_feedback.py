import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from feedback.models import Feedback
from modelregistry.models import BaseModel, LocalModel

URL = "/api/v1/feedback/"
TREE = {"type": "Point", "coordinates": [-13.298, 8.494]}
FREETOWN_BBOX = "-13.30,8.49,-13.29,8.50"


def _feature(action: str = "accept", stac_id: str = "unet-tree-segmentation") -> dict:
    return {
        "type": "Feature",
        "geometry": TREE,
        "properties": {"stac_id": stac_id, "action": action, "comments": "", "config": {}},
    }


def _client_for(user: OsmUser) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture(autouse=True)
def models(admin_user: OsmUser) -> None:
    for stac_id in ["unet-tree-segmentation", "dinov3s-buildings"]:
        BaseModel.objects.create(name=stac_id, stac_item_id=stac_id, user=admin_user)


def test_signed_out_caller_is_refused(anon_client, db) -> None:
    assert anon_client.post(URL, _feature(), format="json").status_code == 401
    assert anon_client.get(URL).status_code == 401


def test_create_records_the_caller_as_owner(client, user) -> None:
    response = client.post(URL, _feature("reject"), format="json")

    assert response.status_code == 201
    properties = response.json()["properties"]
    assert properties["action"] == "reject"
    assert properties["user"] == {"osm_id": user.osm_id, "username": user.username}
    assert Feedback.objects.get(id=properties["id"]).user == user


def test_list_filters_by_model_user_and_bbox(client, admin_client, user, other_user) -> None:
    client.post(URL, _feature(), format="json")
    client.post(URL, _feature(stac_id="dinov3s-buildings"), format="json")
    _client_for(other_user).post(URL, _feature(), format="json")
    far_away = _feature()
    far_away["geometry"] = {"type": "Point", "coordinates": [85.3, 27.7]}
    client.post(URL, far_away, format="json")

    response = admin_client.get(
        URL,
        {
            "stac_id": "unet-tree-segmentation",
            "user": user.osm_id,
            "in_bbox": FREETOWN_BBOX,
            "limit": 500,
        },
    )

    assert response.status_code == 200
    features = response.json()["results"]["features"]
    assert [feature["properties"]["user"]["osm_id"] for feature in features] == [user.osm_id]
    assert features[0]["properties"]["stac_id"] == "unet-tree-segmentation"


def test_owner_can_change_and_delete_a_mark(client) -> None:
    feedback_id = client.post(URL, _feature(), format="json").json()["properties"]["id"]

    patched = client.patch(
        f"{URL}{feedback_id}/", {"properties": {"action": "reject"}}, format="json"
    )
    assert patched.status_code == 200
    assert Feedback.objects.get(id=feedback_id).action == "reject"

    assert client.delete(f"{URL}{feedback_id}/").status_code == 204
    assert not Feedback.objects.filter(id=feedback_id).exists()


@pytest.mark.parametrize("method", ["patch", "delete"])
def test_model_owner_cannot_change_another_users_mark(client, other_user, method: str) -> None:
    feedback_id = client.post(URL, _feature(), format="json").json()["properties"]["id"]
    BaseModel.objects.filter(stac_item_id="unet-tree-segmentation").update(user=other_user)

    response = getattr(_client_for(other_user), method)(
        f"{URL}{feedback_id}/", {"properties": {"action": "reject"}}, format="json"
    )

    assert response.status_code == 403
    assert Feedback.objects.get(id=feedback_id).action == "accept"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("stac_id", "no-such-model"),
        ("config", ["not", "an", "object"]),
        ("config", {"image_uri": "x" * 4081}),
        ("comments", "x" * 1001),
    ],
)
def test_invalid_properties_are_refused(client, field: str, value) -> None:
    feature = _feature()
    feature["properties"][field] = value

    response = client.post(URL, feature, format="json")

    assert response.status_code == 400
    assert list(response.json()["error"]["details"]) == [field]
    assert not Feedback.objects.exists()


def test_marks_are_visible_to_their_author_model_owner_and_admin(
    client, user, other_user, admin_user
) -> None:
    client.post(URL, _feature(), format="json")

    def visible_to(viewer: OsmUser) -> int:
        return len(_client_for(viewer).get(URL).json()["results"]["features"])

    assert visible_to(user) == 1
    assert visible_to(other_user) == 0
    assert visible_to(admin_user) == 1
    BaseModel.objects.filter(stac_item_id="unet-tree-segmentation").update(user=other_user)
    assert visible_to(other_user) == 1


def test_config_at_the_size_limit_is_accepted(client) -> None:
    feature = _feature()
    feature["properties"]["config"] = {"image_uri": "x" * 4080}

    assert client.post(URL, feature, format="json").status_code == 201


def test_local_model_owner_sees_marks_on_their_model(client, user, other_user) -> None:
    base = BaseModel.objects.get(stac_item_id="unet-tree-segmentation")
    LocalModel.objects.create(
        name="my-trees", base_model=base, stac_item_id="my-trees-v1", user=other_user
    )

    assert client.post(URL, _feature(stac_id="my-trees-v1"), format="json").status_code == 201
    features = _client_for(other_user).get(URL).json()["results"]["features"]
    assert [feature["properties"]["user"]["osm_id"] for feature in features] == [user.osm_id]
