import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from predictions.models import Prediction
from shared.enums import Visibility

_SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}


@pytest.fixture
def owner(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=51, username="gita")


def _prediction(owner: OsmUser, description: str, visibility: str = Visibility.PRIVATE) -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id="dinov3s-buildings",
        image_uri="https://tile.example.com/{z}/{x}/{y}.png",
        geometry=_SQUARE,
        zoom=19,
        user=owner,
        description=description,
        visibility=visibility,
    )


def test_prediction_search_matches_description_and_hides_others_private_rows(owner: OsmUser) -> None:
    _prediction(owner, "Banepa buildings after the flood")
    _prediction(owner, "Kathmandu solid waste")
    _prediction(OsmUser.objects.create(osm_id=52, username="hari"), "Banepa private survey")
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get("/api/v1/predictions/?search=BANEPA")

    assert [row["description"] for row in response.json()["results"]] == ["Banepa buildings after the flood"]


def test_public_prediction_search_only_returns_public_rows(owner: OsmUser) -> None:
    _prediction(owner, "Banepa buildings", visibility=Visibility.PUBLIC)
    _prediction(owner, "Kathmandu solid waste", visibility=Visibility.PUBLIC)
    _prediction(owner, "Private waste audit")

    response = APIClient().get("/api/v1/public-predictions/?search=waste")

    assert [row["description"] for row in response.json()["results"]] == ["Kathmandu solid waste"]
