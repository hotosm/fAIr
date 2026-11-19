from django.contrib import admin, messages
from django.db.models import Model
from fair.zenml.runs import fetch_run_logs, fetch_step_logs
from rest_framework.exceptions import NotFound

from shared.enums import PipelineRunStatus
from shared.exceptions import RunAlreadyFinishedException
from shared.run_status import TERMINAL_STATUSES, is_terminal
from shared.serializers import LogEntrySerializer, RunLogsQuerySerializer

_ERROR_LEVELS = {"40", "50", "ERROR", "CRITICAL"}
RUN_GONE_ERROR = "The pipeline run no longer exists in ZenML."


def mark_cancelled(model: type[Model], pk: int) -> bool:
    """Cancel the row unless it already finished; True when it was cancelled."""
    cancelled = (
        model.objects.filter(pk=pk)
        .exclude(status__in=TERMINAL_STATUSES)
        .update(status=PipelineRunStatus.CANCELLED)
    )
    return cancelled > 0


def run_is_gone(run_id: str) -> bool:
    from zenml.client import Client

    return Client().list_pipeline_runs(id=run_id, size=1, hydrate=False).total == 0


def run_failure_reason(run_id: str) -> str:
    try:
        entries = fetch_run_logs(run_id)
    except RuntimeError as exc:  # fair raises when the stack has no log store; report that instead
        return f"Run failed; its logs could not be read: {exc}"
    errors = (e.message for e in entries if e.level in _ERROR_LEVELS)
    return next(errors, "Run failed; ZenML logged no error.")


def read_run_logs(run_id: str, query_params) -> list[dict]:
    query = RunLogsQuerySerializer(data=query_params)
    query.is_valid(raise_exception=True)
    params = query.validated_data
    tail, since = params["tail"], params.get("since")
    try:
        if params.get("step"):
            entries = fetch_step_logs(run_id, params["step"], tail=tail, since=since)
        else:
            entries = fetch_run_logs(run_id, tail=tail, since=since)
    except KeyError as exc:  # fair raises KeyError naming the available steps for an unknown step
        raise NotFound(exc.args[0]) from exc
    data = [{"level": e.level, "message": e.message, "timestamp": e.timestamp} for e in entries]
    return LogEntrySerializer(data, many=True).data


def stop_pipeline_run(run_id: str) -> None:
    from zenml.client import Client
    from zenml.exceptions import IllegalOperationError
    from zenml.utils.run_utils import stop_run

    try:
        stop_run(Client().get_pipeline_run(run_id), graceful=False)
    except IllegalOperationError as exc:  # ZenML refuses to stop a run that already ended
        raise RunAlreadyFinishedException(str(exc)) from exc


@admin.action(description="Stop selected runs", permissions=["change"])
def stop_runs(modeladmin, request, queryset) -> None:
    for run in queryset:
        if not run.zenml_run_id or is_terminal(run.status):
            messages.warning(request, f"{run}: no active run to stop.")
            continue
        try:
            stop_pipeline_run(run.zenml_run_id)
        except RunAlreadyFinishedException as exc:
            messages.warning(request, f"{run.zenml_run_id}: {exc}")
            continue
        if mark_cancelled(type(run), run.pk):
            modeladmin.after_cancel(run.pk)
            messages.info(request, f"Cancelled {run.zenml_run_id}.")
        else:
            messages.warning(request, f"{run.zenml_run_id}: finished before it could be cancelled.")
