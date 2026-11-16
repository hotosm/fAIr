import pytest
from pydantic import ValidationError

from config.env import Settings

_REQUIRED = {
    "SECRET_KEY": "dev",
    "DEBUG": "true",
    "DATABASE_URL": "postgis://u:p@localhost:5432/fair",
    "FRONTEND_URL": "http://localhost:3500",
    "API_BASE_URL": "http://localhost:8000/api/v1",
    "AUTH_PROVIDER": "dev",
    "FAIR_DEV_TOKEN": "token",
    "FAIR_ZENML_STORE_URL": "http://localhost:8080",
    "FAIR_STAC_API_URL": "http://localhost:8082",
    "BUCKET_NAME": "fair-data",
}


@pytest.mark.parametrize("missing", ["FAIR_ZENML_STORE_URL", "FAIR_STAC_API_URL", "BUCKET_NAME"])
def test_startup_fails_without_pipeline_storage_settings(monkeypatch, missing: str) -> None:
    for name, value in _REQUIRED.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv(missing)

    with pytest.raises(ValidationError, match=missing.lower()):
        Settings(_env_file=None)  # type: ignore[call-arg]
