from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from django.db import connection, connections
from django.test import override_settings
from django_tasks_db.models import DBTaskResult
from upath import UPath

from accounts.models import OsmUser
from predictions.models import Prediction
from fair.zenml.runs import LogEntry

from predictions.tasks import (
    MAX_POST_RUN_ATTEMPTS,
    _materialize_prediction_input,
    submit_prediction,
    sync_prediction_status,
)
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
@patch("predictions.tasks.remove_dir")
def test_failed_submission_marks_prediction_failed_and_deletes_its_tiles(
    mock_remove, prediction: Prediction
) -> None:
    with patch(
        "predictions.tasks._materialize_prediction_input", side_effect=RuntimeError("no tiles")
    ):
        submit_prediction.enqueue(prediction_id=prediction.id)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == "RuntimeError: no tiles"
    mock_remove.assert_called_once()


@override_settings(
    TASKS={"default": {"BACKEND": "django_tasks.backends.immediate.ImmediateBackend"}}
)
@patch("predictions.tasks.remove_dir", side_effect=OSError("still exists after delete"))
def test_failed_submission_survives_a_refused_tile_delete(_, prediction: Prediction) -> None:
    with patch(
        "predictions.tasks._materialize_prediction_input", side_effect=RuntimeError("no tiles")
    ):
        submit_prediction.enqueue(prediction_id=prediction.id)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == "RuntimeError: no tiles"


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


@patch("predictions.tasks.delete_input_tiles")
@patch(
    "shared.run_endpoints.fetch_run_logs",
    return_value=[
        LogEntry(level="20", message="Node `run_inference` started (status: running)"),
        LogEntry(level="40", message="Job for step `run_inference` failed: exit_code=137"),
        LogEntry(level="40", message="The following steps failed: run_inference"),
    ],
)
@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.FAILED)
def test_a_failed_run_records_the_first_error_zenml_logged(
    _status, _logs, _delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == "Job for step `run_inference` failed: exit_code=137"


@patch("predictions.tasks.delete_input_tiles")
@patch(
    "shared.run_endpoints.fetch_run_logs",
    side_effect=RuntimeError("active ZenML stack has no log_store; cannot fetch run logs."),
)
@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.FAILED)
def test_a_failed_run_without_readable_logs_says_so_and_still_cleans_up(
    _status, _logs, delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.error == "Run failed; its logs could not be read: active ZenML stack has no log_store; cannot fetch run logs."
    delete.assert_called_once()


@patch("predictions.tasks.get_run_status", side_effect=ConnectionError("ZenML server unreachable"))
def test_a_poll_that_cannot_reach_zenml_keeps_the_next_poll_queued(_status, prediction: Prediction) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    with pytest.raises(ConnectionError):
        sync_prediction_status.call(prediction_id=prediction.pk)

    queued = DBTaskResult.objects.filter(
        task_path=sync_prediction_status.module_path, status="READY", args_kwargs__kwargs={"prediction_id": prediction.pk}
    )
    assert queued.count() == 1


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.run_is_gone", return_value=True)
@patch("predictions.tasks.get_run_status", side_effect=KeyError("No pipeline run with this ID found"))
def test_a_run_zenml_no_longer_has_is_marked_failed_and_polling_stops(
    _status, _gone, delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    sync_prediction_status.call(prediction_id=prediction.pk)
    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == "The pipeline run no longer exists in ZenML."
    assert _status.call_count == 1
    delete.assert_called_once()


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.run_is_gone", return_value=False)
@patch("predictions.tasks.get_run_status", side_effect=KeyError("404 from a proxy"))
def test_a_404_for_a_run_zenml_still_lists_leaves_the_row_running(
    _status, _gone, delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    with pytest.raises(KeyError):
        sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == "running"
    delete.assert_not_called()


@pytest.mark.parametrize(("listed", "gone"), [(0, True), (1, False)])
def test_run_is_gone_only_when_zenml_lists_no_run_with_that_id(listed: int, gone: bool) -> None:
    from shared.run_endpoints import run_is_gone

    with patch("zenml.client.Client") as client:
        client.return_value.list_pipeline_runs.return_value.total = listed
        assert run_is_gone("2f1c0d7e-0000-4000-8000-000000000000") is gone

    client.return_value.list_pipeline_runs.assert_called_once_with(
        id="2f1c0d7e-0000-4000-8000-000000000000", size=1, hydrate=False
    )


@pytest.mark.parametrize("zenml_says", [PipelineRunStatus.RUNNING, PipelineRunStatus.COMPLETED, PipelineRunStatus.FAILED])
@patch("predictions.tasks.run_failure_reason", return_value="boom")
@patch("predictions.tasks.post_process_prediction")
def test_a_cancel_during_a_poll_wins_whatever_zenml_reports(
    post_process, _reason, zenml_says, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    def cancel_while_polling(_run_id: str) -> str:
        Prediction.objects.filter(pk=prediction.pk).update(status=PipelineRunStatus.CANCELLED)
        return zenml_says

    with patch("predictions.tasks.get_run_status", side_effect=cancel_while_polling):
        sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.CANCELLED
    assert prediction.error == ""
    assert prediction.results_ready is False
    post_process.assert_not_called()


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.run_is_gone", return_value=True)
def test_a_run_that_vanishes_during_a_cancel_stays_cancelled(_gone, _delete, prediction: Prediction) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(zenml_run_id="run-1", status="running")

    def cancel_then_404(_run_id: str) -> str:
        Prediction.objects.filter(pk=prediction.pk).update(status=PipelineRunStatus.CANCELLED)
        raise KeyError("No pipeline run with this ID found")

    with patch("predictions.tasks.get_run_status", side_effect=cancel_then_404):
        sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.CANCELLED
    assert prediction.error == ""


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.run_is_gone", return_value=True)
@patch("predictions.tasks.get_run_status", side_effect=KeyError("No pipeline run with this ID found"))
def test_a_completed_run_awaiting_outputs_whose_run_is_gone_fails_once(
    status, _gone, delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(
        zenml_run_id="run-1", status=PipelineRunStatus.COMPLETED, results_ready=False
    )

    sync_prediction_status.call(prediction_id=prediction.pk)
    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == "The pipeline run no longer exists in ZenML."
    assert status.call_count == 1
    delete.assert_called_once()


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.run_failure_reason", return_value="boom")
@patch("predictions.tasks.post_process_prediction")
@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.FAILED)
def test_a_completed_run_awaiting_outputs_keeps_its_status_when_zenml_says_failed(
    _status, _post, _reason, _delete, prediction: Prediction
) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(
        zenml_run_id="run-1", status=PipelineRunStatus.COMPLETED, results_ready=False
    )

    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.COMPLETED
    assert prediction.error == ""


def _awaiting_outputs(prediction: Prediction, attempts: int = 0) -> None:
    Prediction.objects.filter(pk=prediction.pk).update(
        zenml_run_id="run-1",
        status=PipelineRunStatus.COMPLETED,
        results_ready=False,
        post_run_attempts=attempts,
    )


@pytest.mark.django_db(transaction=True, available_apps=["accounts", "predictions", "django_tasks_db"])
@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.COMPLETED)
@patch("predictions.tasks.post_process_prediction")
def test_a_poll_leaves_the_outputs_to_the_worker_already_writing_them(
    post_process, _status, prediction: Prediction
) -> None:
    _awaiting_outputs(prediction)
    other_worker = connections.create_connection("default")
    try:
        with other_worker.cursor() as cursor:
            cursor.execute("BEGIN")
            cursor.execute("SELECT id FROM predictions_prediction WHERE id = %s FOR UPDATE", [prediction.pk])
            with connection.cursor() as own:
                own.execute("SET lock_timeout = '2s'")
            sync_prediction_status.call(prediction_id=prediction.pk)
            cursor.execute("ROLLBACK")
    finally:
        other_worker.close()
        with connection.cursor() as own:
            own.execute("RESET lock_timeout")

    prediction.refresh_from_db()
    post_process.assert_not_called()
    assert prediction.results_ready is False


@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.COMPLETED)
@patch("predictions.tasks.post_process_prediction", side_effect=OSError("bucket unreachable"))
def test_a_failed_post_run_is_counted_and_retried_by_the_next_poll(
    _post, _status, prediction: Prediction
) -> None:
    _awaiting_outputs(prediction, attempts=MAX_POST_RUN_ATTEMPTS - 1)

    with pytest.raises(OSError):
        sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    assert prediction.status == PipelineRunStatus.COMPLETED
    assert prediction.post_run_attempts == MAX_POST_RUN_ATTEMPTS
    assert DBTaskResult.objects.filter(
        task_path=sync_prediction_status.module_path, status="READY", args_kwargs__kwargs={"prediction_id": prediction.pk}
    ).exists()


@patch("predictions.tasks.delete_input_tiles")
@patch("predictions.tasks.get_run_status", return_value=PipelineRunStatus.COMPLETED)
@patch("predictions.tasks.post_process_prediction")
def test_a_post_run_that_keeps_failing_ends_the_map_request_as_failed(
    post_process, _status, delete_tiles, prediction: Prediction
) -> None:
    _awaiting_outputs(prediction, attempts=MAX_POST_RUN_ATTEMPTS)

    sync_prediction_status.call(prediction_id=prediction.pk)

    prediction.refresh_from_db()
    post_process.assert_not_called()
    assert prediction.status == PipelineRunStatus.FAILED
    assert prediction.error == f"Writing the results failed {MAX_POST_RUN_ATTEMPTS} times."
    assert prediction.is_finished
    delete_tiles.assert_called_once()
