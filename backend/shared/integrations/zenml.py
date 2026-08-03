import tempfile
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from fair.client import FairClient, UserScopedFairClient
from fair.zenml.runs import (
    LogEntry,
    RunStatus,
    RunSummary,
)
from fair.zenml.runs import (
    fetch_run_logs as _fetch_run_logs,
)
from fair.zenml.runs import (
    fetch_step_logs as _fetch_step_logs,
)
from fair.zenml.runs import (
    get_run_status as _get_run_status,
)
from fair.zenml.runs import (
    is_terminal as _is_terminal,
)
from fair.zenml.runs import (
    list_runs_for_model as _list_runs_for_model,
)

__all__ = [
    "LogEntry",
    "RunStatus",
    "RunSummary",
    "fetch_run_logs",
    "fetch_step_logs",
    "for_user",
    "get_master_client",
    "get_run_status",
    "is_terminal",
    "list_runs_for_model",
    "reset_master_client",
]


def _required_setting(name: str) -> str:
    value = getattr(settings, name, None)
    if not value:
        raise RuntimeError(f"settings.{name} is required for ZenML/STAC operations but is unset")
    return str(value)


@lru_cache(maxsize=1)
def _config_dir() -> Path:
    base = Path(tempfile.gettempdir()) / "fair-config"
    base.mkdir(parents=True, exist_ok=True)
    return base


@lru_cache(maxsize=1)
def get_master_client() -> FairClient:
    """Process-wide FairClient. setup() runs once per worker."""
    client = FairClient(
        zenml_store_url=_required_setting("FAIR_ZENML_STORE_URL"),
        stac_api_url=_required_setting("FAIR_STAC_API_URL"),
        stac_api_key=getattr(settings, "FAIR_STAC_API_KEY", None),
        user_id="fair-backend",
        config_dir=str(_config_dir()),
        upload_artifacts=True,
    )
    client.setup()
    return client


def reset_master_client() -> None:
    get_master_client.cache_clear()


def for_user(user_id: str) -> UserScopedFairClient:
    return get_master_client().with_user(user_id)


def get_run_status(run_id: str) -> RunStatus:
    return _get_run_status(run_id)


def fetch_run_logs(run_id: str, *, tail: int = 1000) -> list[LogEntry]:
    return _fetch_run_logs(run_id, tail=tail)


def fetch_step_logs(run_id: str, step_name: str, *, tail: int = 1000) -> list[LogEntry]:
    return _fetch_step_logs(run_id, step_name, tail=tail)


def list_runs_for_model(model_name: str, *, limit: int = 50) -> list[RunSummary]:
    return _list_runs_for_model(model_name, limit=limit)


def is_terminal(status: RunStatus) -> bool:
    return _is_terminal(status)
