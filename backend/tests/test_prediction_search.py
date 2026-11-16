from rest_framework.test import APIClient

from accounts.models import OsmUser
from predictions.models import Prediction
from shared.enums import Visibility

_SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}


def _prediction(user: OsmUser, description: str, visibility: str = Visibility.PRIVATE) -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id="dinov3s-buildings",
        imagery={"image": "https://tile.example.com/{z}/{x}/{y}.png"},
        primary_input="image",
        geometry=_SQUARE,
        zoom=19,
        user=user,
        description=description,
        visibility=visibility,
    )


def test_prediction_search_matches_description_and_hides_others_private_rows(user: OsmUser) -> None:
    _prediction(user, "Banepa buildings after the flood")
    _prediction(user, "Kathmandu solid waste")
    _prediction(OsmUser.objects.create(osm_id=52, username="hari"), "Banepa private survey")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/predictions/?search=BANEPA")

    assert [row["description"] for row in response.json()["results"]] == ["Banepa buildings after the flood"]


def test_anonymous_prediction_search_only_returns_public_rows(user: OsmUser) -> None:
    _prediction(user, "Banepa buildings", visibility=Visibility.PUBLIC)
    _prediction(user, "Kathmandu solid waste", visibility=Visibility.PUBLIC)
    _prediction(user, "Private waste audit")

    response = APIClient().get("/api/v1/predictions/?search=waste")

    assert [row["description"] for row in response.json()["results"]] == ["Kathmandu solid waste"]
