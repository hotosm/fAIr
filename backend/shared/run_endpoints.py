from rest_framework.exceptions import NotFound

from shared.exceptions import RunAlreadyFinishedException
from shared.integrations.zenml import fetch_run_logs, fetch_step_logs
from shared.serializers import LogEntrySerializer, RunLogsQuerySerializer


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


def stop_pipeline_run(run_id: str, *, graceful: bool) -> None:
    from zenml.client import Client
    from zenml.exceptions import IllegalOperationError
    from zenml.utils.run_utils import stop_run

    try:
        stop_run(Client().get_pipeline_run(run_id), graceful=graceful)
    except IllegalOperationError as exc:  # ZenML refuses to stop a run that already ended
        raise RunAlreadyFinishedException(str(exc)) from exc
