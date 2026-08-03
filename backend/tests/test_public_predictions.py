import pytest
from rest_framework.test import APIClient

from accounts.models import OsmUser
from predictions.models import Prediction
from shared.enums import Visibility

_TMS = "https://tiles.example.com/{z}/{x}/{y}"
_BBOX = [85.51678, 27.63133, 85.52323, 27.63743]


@pytest.fixture
def owner(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=8, username="dave")


def _prediction(owner: OsmUser, visibility: str) -> Prediction:
    return Prediction.objects.create(
        local_model_stac_id="m-1",
        image_uri=_TMS,
        bbox=_BBOX,
        zoom=19,
        visibility=visibility,
        user=owner,
    )


def test_public_list_shows_only_public(owner: OsmUser) -> None:
    public = _prediction(owner, Visibility.PUBLIC)
    _prediction(owner, Visibility.PRIVATE)
    resp = APIClient().get("/api/v1/public-predictions/")
    assert resp.status_code == 200
    assert [p["id"] for p in resp.data["results"]] == [public.id]


def test_public_retrieve_public_ok(owner: OsmUser) -> None:
    public = _prediction(owner, Visibility.PUBLIC)
    resp = APIClient().get(f"/api/v1/public-predictions/{public.id}/")
    assert resp.status_code == 200
    assert resp.data["visibility"] == Visibility.PUBLIC


def test_public_retrieve_private_is_404(owner: OsmUser) -> None:
    private = _prediction(owner, Visibility.PRIVATE)
    resp = APIClient().get(f"/api/v1/public-predictions/{private.id}/")
    assert resp.status_code == 404
