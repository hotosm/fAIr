from shared.enums import PipelineRunStatus

# ZenML rejects cached, skipped, retrying and retried for a run (PipelineRunSchema.update_status).
_FROM_ZENML = {
    "initializing": PipelineRunStatus.RUNNING,
    "provisioning": PipelineRunStatus.RUNNING,
    "running": PipelineRunStatus.RUNNING,
    "paused": PipelineRunStatus.RUNNING,
    "resuming": PipelineRunStatus.RUNNING,
    "stopping": PipelineRunStatus.RUNNING,
    "completed": PipelineRunStatus.COMPLETED,
    "failed": PipelineRunStatus.FAILED,
    "stopped": PipelineRunStatus.CANCELLED,
}
TERMINAL_STATUSES = (
    PipelineRunStatus.COMPLETED,
    PipelineRunStatus.FAILED,
    PipelineRunStatus.CANCELLED,
)


def is_terminal(status: str) -> bool:
    return status in TERMINAL_STATUSES


def get_run_status(run_id: str) -> PipelineRunStatus:
    """The run's status in this backend's terms; raises on an unmapped ZenML status."""
    from zenml.client import Client

    raw = str(Client().get_pipeline_run(run_id, hydrate=False).status)
    try:
        return _FROM_ZENML[raw]
    except KeyError as exc:  # a new ZenML state must be mapped on purpose, so fail loudly
        raise RuntimeError(f"Unmapped ZenML run status {raw!r} for run {run_id}") from exc
