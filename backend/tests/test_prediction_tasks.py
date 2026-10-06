from unittest.mock import patch

import pytest
from django.test import override_settings

from accounts.models import OsmUser
from predictions.models import Prediction
from predictions.tasks import _materialize_prediction_input, submit_prediction
from shared.enums import PipelineRunStatus

_TILEJSON_URL = "https://imagery.example.com/WebMercatorQuad/tilejson.json?assets=visual"
_SQUARE = {
    "type": "Polygon",
    "coordinates": [[[85.5, 27.6], [85.502, 27.6], [85.502, 27.602], [85.5, 27.602], [85.5, 27.6]]],
}


@pytest.fixture
def prediction(db) -> Prediction:
    user = OsmUser.objects.create(osm_id=11, username="dana")
    return Prediction.objects.create(
        local_model_stac_id="dinov3s-buildings",
        image_uri=_TILEJSON_URL,
        geometry=_SQUARE,
        zoom=19,
        user=user,
    )


@override_settings(
    TASKS={"default": {"BACKEND": "django_tasks.backends.immediate.ImmediateBackend"}}
)
def test_failed_submission_marks_prediction_failed(prediction: Prediction) -> None:
    with patch(
        "predictions.tasks._materialize_prediction_input", side_effect=RuntimeError("no tiles")
    ):
        submit_prediction.enqueue(prediction_id=prediction.id)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED


class _DownloadRequested(Exception):
    pass


def test_tilejson_input_requests_tilejson_resolution_and_at_least_one_tile(
    prediction: Prediction,
) -> None:
    requested: dict = {}

    async def download_tiles(**kwargs) -> str:
        requested.update(kwargs)
        raise _DownloadRequested

    with (
        patch("geomltoolkits.downloader.tms.download_tiles", download_tiles),
        pytest.raises(_DownloadRequested),
    ):
        _materialize_prediction_input(prediction)

    assert requested["is_tilejson"] is True
    assert requested["max_failures"] == 3


def test_aoi_without_a_whole_tile_fails_before_downloading(prediction: Prediction) -> None:
    prediction.geometry = {
        "type": "Polygon",
        "coordinates": [
            [[85.5, 27.6], [85.5001, 27.6], [85.5001, 27.6001], [85.5, 27.6001], [85.5, 27.6]]
        ],
    }

    with pytest.raises(ValueError, match="covers no whole tile"):
        _materialize_prediction_input(prediction)
