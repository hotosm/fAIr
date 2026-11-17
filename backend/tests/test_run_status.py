from types import SimpleNamespace
from unittest.mock import patch

import pytest

from shared.enums import PipelineRunStatus
from shared.run_status import get_run_status, is_terminal


@pytest.mark.parametrize(
    ("zenml_status", "status"),
    [
        ("initializing", PipelineRunStatus.RUNNING),
        ("provisioning", PipelineRunStatus.RUNNING),
        ("running", PipelineRunStatus.RUNNING),
        ("paused", PipelineRunStatus.RUNNING),
        ("resuming", PipelineRunStatus.RUNNING),
        ("stopping", PipelineRunStatus.RUNNING),
        ("completed", PipelineRunStatus.COMPLETED),
        ("failed", PipelineRunStatus.FAILED),
        ("stopped", PipelineRunStatus.CANCELLED),
    ],
)
def test_each_zenml_run_status_maps_to_one_of_ours(zenml_status: str, status: PipelineRunStatus) -> None:
    with patch("zenml.client.Client") as client:
        client.return_value.get_pipeline_run.return_value = SimpleNamespace(status=zenml_status)
        assert get_run_status("run-1") == status


def test_an_unknown_zenml_status_fails_loudly() -> None:
    with patch("zenml.client.Client") as client:
        client.return_value.get_pipeline_run.return_value = SimpleNamespace(status="teleporting")
        with pytest.raises(RuntimeError, match="teleporting"):
            get_run_status("run-1")


@pytest.mark.parametrize(
    ("status", "terminal"),
    [
        (PipelineRunStatus.SUBMITTED, False),
        (PipelineRunStatus.RUNNING, False),
        (PipelineRunStatus.COMPLETED, True),
        (PipelineRunStatus.FAILED, True),
        (PipelineRunStatus.CANCELLED, True),
    ],
)
def test_only_completed_failed_and_cancelled_are_terminal(status: PipelineRunStatus, terminal: bool) -> None:
    assert is_terminal(status) is terminal
