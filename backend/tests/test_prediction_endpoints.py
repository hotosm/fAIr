from datetime import UTC, datetime
from unittest.mock import patch

import pystac
import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from accounts.models import OsmUser
from predictions.models import Prediction


@pytest.fixture
def authed_user(db) -> OsmUser:
    return OsmUser.objects.create(osm_id=7, username="carol")


@pytest.fixture
def client(authed_user: OsmUser) -> APIClient:
    api = APIClient()
    api.force_authenticate(user=authed_user)
    return api


_LOCAL_MODEL_UUID = "3a0374bf-d73c-4b4d-b165-081ffa2a18ad"
_TMS_URL = "https://tile.example.com/{z}/{x}/{y}.png"
_BBOX = [85.5, 27.6, 85.51, 27.61]


def _bbox_polygon(bbox):
    w, s, e, n = bbox
    return {"type": "Polygon", "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]]}


def _damage_model(*input_names: str) -> pystac.Item:
    """A model declaring a numeric threshold, a free-form footprints URL and a choice of mode."""
    model = pystac.Item("damage", None, None, datetime.now(UTC), {})
    model.properties["mlm:input"] = [{"name": name} for name in input_names or ("image",)]
    model.properties["mlm:hyperparameters"] = {
        "inference.confidence_threshold": 0.5,
        "inference.buildings_geojson_uri": "",
        "inference.mode": "fast",
    }
    model.properties["fair:hyperparameters_spec"] = [
        {"key": "confidence_threshold", "type": "float", "default": 0.5, "description": "score"},
        {"key": "buildings_geojson_uri", "type": "str", "default": "", "description": "footprints"},
        {"key": "mode", "type": "str", "default": "fast", "values": ["fast", "full"]},
    ]
    return model


@pytest.fixture(autouse=True)
def _single_image_model():
    """Submissions read the model item; a test that needs another model patches `get_item` itself."""
    with patch("predictions.views.get_item", return_value=_damage_model()):
        yield


@patch("predictions.views.get_item", return_value=_damage_model())
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_creates_record_and_enqueues(
    mock_task, mock_item_exists, mock_get_item, client
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"confidence_threshold": 0.5},
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    assert Prediction.objects.count() == 1
    prediction = Prediction.objects.first()
    assert prediction is not None
    assert prediction.local_model_stac_id == _LOCAL_MODEL_UUID
    assert prediction.geometry == _bbox_polygon(_BBOX)
    assert prediction.zoom == 19
    mock_task.enqueue.assert_called_once()


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", side_effect=[False, True])
def test_prediction_submit_accepts_base_model(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "dinov3s-buildings",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    assert Prediction.objects.get().local_model_stac_id == "dinov3s-buildings"
    mock_task.enqueue.assert_called_once()


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", side_effect=[False, False])
def test_prediction_submit_404s_when_model_missing(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "ghost", "image_uri": _TMS_URL, "bbox": _BBOX, "zoom": 19},
        format="json",
    )
    assert response.status_code == 404
    assert Prediction.objects.count() == 0
    mock_task.enqueue.assert_not_called()


def test_prediction_submit_rejects_bad_bbox(client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": [85.51, 27.61, 85.5, 27.6],
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 400


def test_prediction_submit_rejects_zoom_out_of_range(client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 5,
        },
        format="json",
    )
    assert response.status_code == 400


_POLY = {
    "type": "Polygon",
    "coordinates": [[[85.5, 27.6], [85.51, 27.6], [85.51, 27.61], [85.5, 27.61], [85.5, 27.6]]],
}


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", return_value=True)
def test_prediction_submit_with_geometry_stores_it(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "geometry": _POLY,
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    prediction = Prediction.objects.get()
    assert prediction.geometry == _POLY
    mock_task.enqueue.assert_called_once()


@patch("predictions.views.submit_prediction")
@patch("predictions.views.item_exists", return_value=True)
def test_prediction_submit_bbox_is_stored_as_geometry(mock_item_exists, mock_task, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    prediction = Prediction.objects.get()
    assert prediction.geometry == _bbox_polygon(_BBOX)
    assert not hasattr(prediction, "bbox")


@patch("predictions.views.item_exists", return_value=True)
def test_prediction_submit_requires_bbox_or_geometry(mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": _LOCAL_MODEL_UUID, "image_uri": _TMS_URL, "zoom": 19},
        format="json",
    )
    assert response.status_code == 400


@patch("predictions.views.item_exists", return_value=True)
def test_prediction_submit_rejects_both_bbox_and_geometry(mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "geometry": _POLY,
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 400


@patch("predictions.views.item_exists", return_value=True)
def test_prediction_submit_rejects_invalid_geometry(mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": _LOCAL_MODEL_UUID,
            "image_uri": _TMS_URL,
            "geometry": {"type": "Point", "coordinates": [85.5, 27.6]},
            "zoom": 19,
        },
        format="json",
    )
    assert response.status_code == 400


@patch("predictions.views.get_item")
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_params_the_model_does_not_declare(
    mock_task, mock_item_exists, mock_get_item, client
):
    model = pystac.Item("damage", None, None, datetime.now(UTC), {})
    model.properties["mlm:input"] = [{"name": "image"}]
    model.properties["mlm:hyperparameters"] = {"inference.confidence_threshold": 0.5}
    model.properties["fair:hyperparameters_spec"] = [
        {"key": "confidence_threshold", "type": "float", "default": 0.5, "description": "minimum score"}
    ]
    mock_get_item.return_value = model
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "damage",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"confidence_threshold": 0.5, "buildings_geojson_uri": "https://data.example/buildings.geojson"},
        },
        format="json",
    )
    assert response.status_code == 400
    assert "buildings_geojson_uri" in response.json()["error"]["details"]["params"][0]
    assert Prediction.objects.count() == 0
    mock_task.enqueue.assert_not_called()


@pytest.mark.parametrize(
    "buildings_geojson_uri",
    [
        "file:///etc/passwd",
        "https://169.254.169.254/latest/meta-data/",
        "https://10.0.0.5/{z}/{x}/{y}",
        "https://[::1",
    ],
)
@patch("predictions.views.get_item", return_value=_damage_model())
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_a_url_param_that_is_not_a_public_url(
    mock_task, mock_item_exists, mock_get_item, client, buildings_geojson_uri
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "damage",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"buildings_geojson_uri": buildings_geojson_uri},
        },
        format="json",
    )
    assert response.status_code == 400
    assert "params" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@pytest.mark.parametrize("buildings_geojson_uri", ["https://data.example/buildings.geojson", ""])
@patch("predictions.views.get_item", return_value=_damage_model())
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_accepts_a_public_or_empty_url_param(
    mock_task, mock_item_exists, mock_get_item, client, buildings_geojson_uri
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "damage",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"buildings_geojson_uri": buildings_geojson_uri},
        },
        format="json",
    )
    assert response.status_code == 202, response.json()


@patch("predictions.views.get_item", return_value=_damage_model())
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_accepts_a_str_param_value_from_its_declared_values(
    mock_task, mock_item_exists, mock_get_item, client
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "damage",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"mode": "full"},
        },
        format="json",
    )
    assert response.status_code == 202, response.json()


@patch("predictions.views.get_item", return_value=_damage_model())
@patch("predictions.views.item_exists", side_effect=[False, True])
@patch("predictions.views.submit_prediction")
def test_prediction_submit_reads_params_spec_from_the_base_model_when_no_local_model_matches(
    mock_task, mock_item_exists, mock_get_item, client
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={
            "model_stac_id": "damage",
            "image_uri": _TMS_URL,
            "bbox": _BBOX,
            "zoom": 19,
            "params": {"confidence_threshold": 0.5},
        },
        format="json",
    )
    assert response.status_code == 202, response.json()
    mock_get_item.assert_called_once_with("base-models", "damage")


@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_stores_an_image_uri_longer_than_200_characters(
    mock_task, mock_item_exists, client
):
    image_uri = f"{_TMS_URL}?url=https://cogs.example/{'a' * 250}.tif"
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "m", "image_uri": image_uri, "bbox": _BBOX, "zoom": 19},
        format="json",
    )
    assert response.status_code == 202, response.json()
    assert Prediction.objects.get().imagery == {"image": image_uri}


@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_imagery_on_a_private_host(mock_task, mock_item_exists, client):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "m", "image_uri": "http://10.0.0.5/{z}/{x}/{y}.png", "bbox": _BBOX, "zoom": 19},
        format="json",
    )
    assert response.status_code == 400
    assert "image_uri" in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


_POST_URL = "https://tile.example.com/post/{z}/{x}/{y}.png"
_PRE_URL = "https://tile.example.com/pre/{z}/{x}/{y}.png"


@patch("predictions.views.get_item", return_value=_damage_model("rgb", "dsm"))
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_takes_the_model_first_input_as_primary_whatever_the_request_order(
    mock_task, mock_item_exists, mock_get_item, client
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "damage", "imagery": {"dsm": _PRE_URL, "rgb": _POST_URL}, "bbox": _BBOX, "zoom": 18},
        format="json",
    )
    assert response.status_code == 202, response.json()
    prediction = Prediction.objects.get()
    assert prediction.imagery == {"rgb": _POST_URL, "dsm": _PRE_URL}
    assert prediction.primary_input == "rgb"
    assert Prediction.objects.get().primary_imagery == _POST_URL
    assert response.json()["image_uri"] == _POST_URL


@pytest.mark.parametrize(
    "imagery",
    [{"post": _POST_URL}, {"image": _POST_URL}, {"post": _POST_URL, "pre": _PRE_URL, "extra": _PRE_URL}],
)
@patch("predictions.views.get_item", return_value=_damage_model("post", "pre"))
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_imagery_that_does_not_match_the_model_inputs(
    mock_task, mock_item_exists, mock_get_item, client, imagery
):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "damage", "imagery": imagery, "bbox": _BBOX, "zoom": 18},
        format="json",
    )
    assert response.status_code == 400
    assert "['post', 'pre']" in response.json()["error"]["details"]["imagery"][0]
    mock_task.enqueue.assert_not_called()


@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_image_uri_for_a_model_whose_input_is_not_named_image(
    mock_task, mock_item_exists, client
):
    with patch("predictions.views.get_item", return_value=_damage_model("rgb")):
        response = client.post(
            "/api/v1/predictions/submit/",
            data={"model_stac_id": "m", "image_uri": _TMS_URL, "bbox": _BBOX, "zoom": 19},
            format="json",
        )
    assert response.status_code == 400
    assert "['rgb']" in response.json()["error"]["details"]["imagery"][0]
    mock_task.enqueue.assert_not_called()


@pytest.mark.parametrize(
    ("data", "field"),
    [
        ({"imagery": {"image": _TMS_URL}, "image_uri": _TMS_URL}, "imagery"),
        ({}, "imagery"),
        ({"imagery": {"Post Image": _TMS_URL}}, "imagery"),
        ({"imagery": {"image": "http://10.0.0.5/{z}/{x}/{y}.png"}}, "imagery"),
    ],
)
@patch("predictions.views.item_exists", return_value=True)
@patch("predictions.views.submit_prediction")
def test_prediction_submit_rejects_invalid_imagery(mock_task, mock_item_exists, client, data, field):
    response = client.post(
        "/api/v1/predictions/submit/",
        data={"model_stac_id": "m", "bbox": _BBOX, "zoom": 19, **data},
        format="json",
    )
    assert response.status_code == 400
    assert field in response.json()["error"]["details"]
    mock_task.enqueue.assert_not_called()


@override_settings(ENABLE_MAPSWIPE=True)
@patch("predictions.views.presigned_get_url", return_value="https://s3.example/prediction.geojson")
@patch("shared.integrations.mapswipe.MapswipeClient")
def test_mapswipe_project_shows_the_imagery_of_the_first_model_input(
    mock_client_class, mock_presign, client, authed_user
):
    prediction = Prediction.objects.create(
        local_model_stac_id="damage",
        imagery={"post": _POST_URL, "pre": _PRE_URL},
        primary_input="post",
        geometry=_bbox_polygon(_BBOX),
        zoom=18,
        results_ready=True,
        user=authed_user,
    )
    mapswipe = mock_client_class.return_value
    mapswipe.create_validation_project.return_value = ("project-1", "asset-1")

    response = client.post(
        f"/api/v1/predictions/{prediction.id}/mapswipe/",
        data={
            "topic": "Damage",
            "region": "Bhote Koshi",
            "description": "Validate graded buildings",
            "instruction": "Tap each damaged building",
            "look_for": "damaged buildings",
            "project_number": 1,
        },
        format="json",
    )

    assert response.status_code == 201, response.json()
    assert mapswipe.update_project.call_args.kwargs["tms_url"] == _POST_URL
