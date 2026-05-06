from enum import StrEnum
from pathlib import Path
from typing import Annotated, Self

from pydantic import (
    AnyHttpUrl,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class AuthProvider(StrEnum):
    HANKO = "hanko"
    DEV = "dev"


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    # Core Django
    debug: bool = False
    secret_key: SecretStr

    # Database
    database_url: str
    database_ssl_mode: str | None = None
    db_pool_min_size: int = 4
    db_pool_max_size: int = 20
    db_pool_timeout: float = 30.0

    @field_validator("database_url")
    @classmethod
    def _check_database_url(cls, value: str) -> str:
        scheme = value.split("://", 1)[0]
        if scheme not in {"postgres", "postgresql", "postgis"}:
            raise ValueError(
                f"DATABASE_URL must use postgres/postgresql/postgis scheme, got '{scheme}'"
            )
        return value

    # HTTP / hosts / CORS
    allowed_hosts: Annotated[list[str], NoDecode] = Field(default_factory=list)
    csrf_trusted_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    secure_ssl_redirect: bool = True

    # Frontend / API URLs
    frontend_url: AnyHttpUrl
    api_base_url: AnyHttpUrl
    hostname: str = "127.0.0.1"

    # Authentication
    auth_provider: AuthProvider = AuthProvider.HANKO
    fair_dev_token: SecretStr | None = None
    # Hanko's OSM-connection callback still posts to this URI;
    osm_login_redirect_uri: AnyHttpUrl | None = None
    hanko_api_url: AnyHttpUrl | None = None
    cookie_secret: SecretStr | None = None
    cookie_domain: str | None = None
    cookie_secure: bool | None = None
    jwt_audience: str | None = None
    login_url: AnyHttpUrl = AnyHttpUrl("https://login.hotosm.org")
    login_internal_api_key: SecretStr | None = None
    login_backend_url: AnyHttpUrl | None = None

    # fair-py-ops (ZenML + STAC)
    # Required at call sites in P1+ (shared/integrations/zenml.py raises loud
    # when missing). Optional at module import so legacy code paths + CI boot.
    fair_zenml_store_url: AnyHttpUrl | None = None
    fair_zenml_store_api_key: SecretStr | None = None
    fair_stac_api_url: AnyHttpUrl | None = None
    fair_stac_api_key: SecretStr | None = None

    # Object storage (S3 / MinIO)
    bucket_name: str | None = None
    parent_bucket_folder: str = "dev"
    aws_region: str = "us-east-1"
    aws_access_key_id: SecretStr | None = None
    aws_secret_access_key: SecretStr | None = None
    aws_endpoint_url: AnyHttpUrl | None = None
    presigned_url_expiry: int = 900

    # DRF throttles
    user_rate_limit: str = "1000/h"
    anon_rate_limit: str = "100/h"
    training_rate_limit: str = "10/h"
    prediction_rate_limit: str = "50/h"

    # OSM raw-data API
    raw_data_api_url: AnyHttpUrl = AnyHttpUrl("https://api-prod.raw-data.hotosm.org/v1")

    # MapSwipe (off by default; required when enable_mapswipe=true)
    enable_mapswipe: bool = False
    mapswipe_backend_url: AnyHttpUrl | None = None
    mapswipe_manager_url: AnyHttpUrl | None = None
    mapswipe_web_url: AnyHttpUrl | None = None
    mapswipe_csrftoken_key: str | None = None
    mapswipe_fb_auth_url: AnyHttpUrl | None = None
    mapswipe_fb_username: str | None = None
    mapswipe_fb_password: SecretStr | None = None
    mapswipe_tutorial_id: str = "37"
    mapswipe_organization_id: int = 4
    mapswipe_verification_number: int = 3
    mapswipe_poll_interval: int = 10
    mapswipe_poll_timeout: int = 600

    # Email (SMTP)
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_use_tls: bool = True
    email_use_ssl: bool = False
    email_host_user: str = ""
    email_host_password: SecretStr = SecretStr("")
    default_from_email: str = "no-reply@fair.hotosm.org"

    # Operational
    log_path: Path = BASE_DIR / "logs"
    default_pagination_size: int = 50
    session_cookie_age: int = 3600
    cache_timeout_minutes: int = 5
    log_line_stream_truncate_value: int = 10

    # Sentry (off by default; set enable_sentry=true with a sentry_dsn to turn on)
    enable_sentry: bool = False
    sentry_dsn: SecretStr | None = None

    # Tunable polling / caching / processing knobs
    health_probe_timeout: float = 2.0
    prediction_sync_interval: int = 15
    training_sync_interval: int = 30
    stac_cache_ttl: int = 300
    stac_bulk_fetch_workers: int = 16
    pmtiles_min_zoom: int = 10
    pmtiles_max_zoom: int = 20

    @field_validator(
        "allowed_hosts",
        "csrf_trusted_origins",
        "cors_allowed_origins",
        mode="before",
    )
    @classmethod
    def _split_csv(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [item.strip() for item in value.split(",") if item.strip()]

    @model_validator(mode="after")
    def _check_auth_provider_fields(self) -> Self:
        if self.auth_provider is AuthProvider.HANKO:
            missing = [
                name
                for name, value in (
                    ("hanko_api_url", self.hanko_api_url),
                    ("cookie_secret", self.cookie_secret),
                )
                if not value
            ]
            if missing:
                raise ValueError(f"AUTH_PROVIDER=hanko requires: {', '.join(missing)}")
        if self.auth_provider is AuthProvider.DEV and not self.fair_dev_token:
            raise ValueError("AUTH_PROVIDER=dev requires: fair_dev_token")
        return self

    @model_validator(mode="after")
    def _check_mapswipe_fields(self) -> Self:
        if not self.enable_mapswipe:
            return self
        missing = [
            name
            for name, value in (
                ("mapswipe_csrftoken_key", self.mapswipe_csrftoken_key),
                ("mapswipe_fb_auth_url", self.mapswipe_fb_auth_url),
                ("mapswipe_fb_username", self.mapswipe_fb_username),
                ("mapswipe_fb_password", self.mapswipe_fb_password),
            )
            if not value
        ]
        if missing:
            raise ValueError(f"ENABLE_MAPSWIPE=true requires: {', '.join(missing)}")
        return self

    @model_validator(mode="after")
    def _check_sentry_fields(self) -> Self:
        if self.enable_sentry and not self.sentry_dsn:
            raise ValueError("ENABLE_SENTRY=true requires: sentry_dsn")
        return self

    @model_validator(mode="after")
    def _reject_weak_secret_in_prod(self) -> Self:
        if self.debug:
            return self
        secret = self.secret_key.get_secret_value()
        if len(secret) < 32 or "dev" in secret or "unsafe" in secret:
            raise ValueError("SECRET_KEY is too weak for production")
        return self


settings = Settings()  # raises on missing required env vars
