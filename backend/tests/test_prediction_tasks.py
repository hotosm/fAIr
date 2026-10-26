from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from django.test import override_settings
from upath import UPath

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
        imagery={"image": _TILEJSON_URL},
        primary_input="image",
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


def test_submit_forwards_the_prediction_params_to_the_pipeline(prediction: Prediction) -> None:
    prediction.params = {"confidence_threshold": 0.3}
    prediction.save(update_fields=["params"])
    client = MagicMock()
    client.submit_predict.return_value = "run-1"
    with (
        patch("predictions.tasks._materialize_prediction_input", return_value={"image": "s3://bucket/in"}),
        patch("predictions.tasks.for_user", return_value=client),
        patch("predictions.tasks.sync_prediction_status"),
    ):
        submit_prediction.call(prediction_id=prediction.id)

    assert client.submit_predict.call_args.kwargs["params"] == {"confidence_threshold": 0.3}
    assert client.submit_predict.call_args.kwargs["input_images"] == {"image": "s3://bucket/in"}


def _post_pre_prediction(prediction: Prediction) -> Prediction:
    prediction.imagery = {
        "post": "https://tiles.example/post/{z}/{x}/{y}",
        "pre": "https://tiles.example/pre/{z}/{x}/{y}",
    }
    prediction.primary_input = "post"
    prediction.save(update_fields=["imagery", "primary_input"])
    return prediction


def _downloads_by_url(tmp_path: Path, tiles_by_input: dict[str, list[str]]):
    def download(url: str, *args) -> dict[str, Path]:
        name = "post" if "/post/" in url else "pre"
        files = {}
        for tile in tiles_by_input[name]:
            files[tile] = tmp_path / name / tile
            files[tile].parent.mkdir(parents=True, exist_ok=True)
            files[tile].write_bytes(f"{name}-{tile}".encode())
        return files

    return download


def _in_memory(uri: str) -> UPath:
    return UPath(f"memory://{uri.split('://', 1)[1]}")


def test_each_input_stages_only_the_tiles_every_input_has(prediction: Prediction, tmp_path: Path) -> None:
    tiles = {"post": ["OAM-1-1-19.tif", "OAM-2-1-19.tif"], "pre": ["OAM-1-1-19.tif"]}
    with (
        patch("predictions.tasks._download_input_tiles", side_effect=_downloads_by_url(tmp_path, tiles)),
        patch("predictions.tasks.UPath", side_effect=_in_memory),
    ):
        chips_by_input = _materialize_prediction_input(_post_pre_prediction(prediction))

    assert set(chips_by_input) == {"post", "pre"}
    for name, prefix in chips_by_input.items():
        assert prefix.endswith(f"/input/{name}")
        staged = UPath(prefix) / "OAM-1-1-19.tif"
        assert staged.read_bytes() == f"{name}-OAM-1-1-19.tif".encode()
        assert not (UPath(prefix) / "OAM-2-1-19.tif").exists()


def test_inputs_without_a_shared_tile_fail_before_staging(prediction: Prediction, tmp_path: Path) -> None:
    tiles = {"post": ["OAM-1-1-19.tif"], "pre": ["OAM-2-1-19.tif"]}
    with (
        patch("predictions.tasks._download_input_tiles", side_effect=_downloads_by_url(tmp_path, tiles)),
        patch("predictions.tasks.UPath", side_effect=_in_memory),
        pytest.raises(RuntimeError, match="no tile has imagery for every input"),
    ):
        _materialize_prediction_input(_post_pre_prediction(prediction))
