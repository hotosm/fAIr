import os
from typing import Any
from urllib.parse import urlparse

import boto3
import dj_database_url
from corsheaders.defaults import default_headers
from pydantic import SecretStr

from config.env import AuthProvider, settings


def _secret(value: SecretStr | None) -> str | None:
    return value.get_secret_value() if value else None


def _str(value: Any | None) -> str | None:
    return str(value) if value else None


BASE_DIR = settings.model_config["env_file"].parent  # type: ignore[index]

DEBUG = settings.debug
SECRET_KEY = settings.secret_key.get_secret_value()

if settings.enable_sentry:
    import sentry_sdk

    sentry_sdk.init(dsn=settings.sentry_dsn.get_secret_value())

LOG_PATH = str(settings.log_path)
os.makedirs(LOG_PATH, exist_ok=True)

FRONTEND_URL = str(settings.frontend_url)
API_BASE_URL = str(settings.api_base_url)
HOSTNAME = settings.hostname

RAW_DATA_API_URL = str(settings.raw_data_api_url)

AUTH_PROVIDER = settings.auth_provider.value

FAIR_DEV_TOKEN = _secret(settings.fair_dev_token)

if settings.auth_provider is AuthProvider.HANKO:
    HANKO_API_URL = _str(settings.hanko_api_url)
    COOKIE_SECRET = _secret(settings.cookie_secret)
    COOKIE_DOMAIN = settings.cookie_domain
    COOKIE_SECURE = settings.cookie_secure if settings.cookie_secure is not None else not DEBUG
    JWT_AUDIENCE = settings.jwt_audience
    LOGIN_URL = str(settings.login_url)
    OSM_REDIRECT_URI = _str(settings.osm_login_redirect_uri)
    LOGIN_INTERNAL_API_KEY = _secret(settings.login_internal_api_key) or ""
    LOGIN_BACKEND_URL = _str(settings.login_backend_url) or LOGIN_URL

    if LOGIN_INTERNAL_API_KEY:
        from hotosm_auth import remote_pat_resolver
        from hotosm_auth_django import init_auth_django

        init_auth_django(
            app_name="fair",
            pat_resolver=remote_pat_resolver(
                login_url=LOGIN_BACKEND_URL,
                internal_key=LOGIN_INTERNAL_API_KEY,
            ),
        )

FAIR_ZENML_STORE_URL = _str(settings.fair_zenml_store_url)
FAIR_ZENML_STORE_API_KEY = _secret(settings.fair_zenml_store_api_key)
# AnyHttpUrl appends a trailing slash when the URL carries no path, which would
# double up against the "/collections/..." suffixes appended at every call site.
FAIR_STAC_API_URL = (
    _str(settings.fair_stac_api_url).rstrip("/") if settings.fair_stac_api_url else None
)
FAIR_STAC_API_KEY = _secret(settings.fair_stac_api_key)

KNATIVE_SERVICE_TEMPLATE = str(BASE_DIR / "modelregistry" / "knative-service.yaml")

BUCKET_NAME = settings.bucket_name
PARENT_BUCKET_FOLDER = settings.parent_bucket_folder
AWS_REGION = settings.aws_region
AWS_ACCESS_KEY_ID = _secret(settings.aws_access_key_id)
AWS_SECRET_ACCESS_KEY = _secret(settings.aws_secret_access_key)
AWS_ENDPOINT_URL = _str(settings.aws_endpoint_url)
PRESIGNED_URL_EXPIRY = settings.presigned_url_expiry

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    S3_CLIENT = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        endpoint_url=AWS_ENDPOINT_URL,
    )
else:
    S3_CLIENT = boto3.client("s3", region_name=AWS_REGION, endpoint_url=AWS_ENDPOINT_URL)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.postgres",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django_tasks",
    "django_tasks_db",
    "rest_framework",
    "rest_framework_gis",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "accounts",
    "datasets",
    "modelregistry",
    "trainings",
    "predictions",
    "feedback",
    "notifications",
    "stars",
    "system",
]

if settings.auth_provider is AuthProvider.HANKO:
    INSTALLED_APPS.append("hotosm_auth_django")

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Optional deployment of frontend dist from the server
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if settings.auth_provider is AuthProvider.HANKO:
    MIDDLEWARE.insert(
        MIDDLEWARE.index("django.contrib.auth.middleware.AuthenticationMiddleware"),
        "hotosm_auth_django.HankoAuthMiddleware",
    )

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

if DEBUG:
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    CSRF_TRUSTED_ORIGINS: list[str] = []
else:
    SECURE_SSL_REDIRECT = settings.secure_ssl_redirect
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = settings.csrf_trusted_origins or settings.allowed_hosts

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = settings.session_cookie_age
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"

DEFAULT_PAGINATION_SIZE = settings.default_pagination_size

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.OsmAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": DEFAULT_PAGINATION_SIZE,
    "EXCEPTION_HANDLER": "shared.exceptions.custom_exception_handler",
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.NamespaceVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": settings.user_rate_limit,
        "anon": settings.anon_rate_limit,
        "training_submit": settings.training_rate_limit,
        "prediction_submit": settings.prediction_rate_limit,
    },
}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "libraries": {
                "staticfiles": "django.templatetags.static",
            },
        },
    },
]

DATABASE_URL = str(settings.database_url)
DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=0,
        conn_health_checks=True,
    )
}

database_url = urlparse(DATABASE_URL)
if database_url.scheme in ("postgres", "postgresql", "postgis"):
    ssl_mode = settings.database_ssl_mode or ("disable" if DEBUG else "require")
    DATABASES["default"]["OPTIONS"] = {
        "sslmode": ssl_mode,
        "pool": {
            "min_size": settings.db_pool_min_size,
            "max_size": settings.db_pool_max_size,
            "timeout": settings.db_pool_timeout,
        },
        **DATABASES["default"].get("OPTIONS", {}),
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/api_static/"
MEDIA_URL = "/media/"
STATIC_ROOT = str(BASE_DIR / "api_static")
MEDIA_ROOT = str(BASE_DIR / "media")

SERVE_FRONTEND = settings.serve_frontend
FRONTEND_DIST_DIR = settings.frontend_dist_dir
if SERVE_FRONTEND:
    WHITENOISE_ROOT = str(FRONTEND_DIST_DIR)
    WHITENOISE_INDEX_FILE = True

_logger_handlers: list[str] = ["console"] if DEBUG else ["console", "file"]
_log_handlers: dict[str, Any] = {
    "console": {
        "level": "DEBUG" if DEBUG else "INFO",
        "class": "logging.StreamHandler",
        "formatter": "simple",
    },
}
if not DEBUG:
    _log_handlers["file"] = {
        "level": "INFO",
        "class": "logging.FileHandler",
        "filename": os.path.join(LOG_PATH, "django.log"),
        "formatter": "verbose",
    }

LOGGING: dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {module} {message}", "style": "{"},
        "simple": {"format": "{levelname} {message}", "style": "{"},
    },
    "handlers": _log_handlers,
    "root": {"handlers": ["console"]},
    "loggers": {
        "django": {"handlers": _logger_handlers, "level": "INFO", "propagate": False},
        "core": {"handlers": _logger_handlers, "level": "INFO", "propagate": False},
    },
}

if DEBUG:
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

TASKS = {
    "default": {
        "BACKEND": "django_tasks_db.backend.DatabaseBackend",
    },
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "fair-locmem",
    },
}

CACHE_TIMEOUT_MINUTES = settings.cache_timeout_minutes
LOG_LINE_STREAM_TRUNCATE_VALUE = settings.log_line_stream_truncate_value

HEALTH_PROBE_TIMEOUT = settings.health_probe_timeout
PREDICTION_SYNC_INTERVAL = settings.prediction_sync_interval
TRAINING_SYNC_INTERVAL = settings.training_sync_interval
STAC_CACHE_TTL = settings.stac_cache_ttl
STAC_BULK_FETCH_WORKERS = settings.stac_bulk_fetch_workers
PMTILES_MIN_ZOOM = settings.pmtiles_min_zoom
PMTILES_MAX_ZOOM = settings.pmtiles_max_zoom

AUTH_USER_MODEL = "accounts.OsmUser"

SPECTACULAR_SETTINGS = {
    "TITLE": "fAIr API",
    "DESCRIPTION": "AI-Assisted Mapping",
    "VERSION": "2.0.0",
    "SERVERS": [{"url": API_BASE_URL, "description": "Configured API base."}],
    "CONTACT": {"name": "HOT Tech Team", "email": "sysadmin@hotosm.org"},
    "LICENSE": {"name": "AGPL-3.0", "url": "https://www.gnu.org/licenses/agpl-3.0.en.html"},
    "TERMS_OF_SERVICE": "https://www.hotosm.org/privacy",
    "SERVE_INCLUDE_SCHEMA": False,
    "TAGS": [
        {"name": "accounts", "description": "User auth, profile, email verification."},
        {"name": "datasets", "description": "Dataset records."},
        {"name": "aois", "description": "Areas of interest, drawn polygons."},
        {"name": "local-models", "description": "Backend-managed local (finetuned) models."},
        {"name": "trainings", "description": "Submit + monitor finetune runs."},
        {"name": "predictions", "description": "Submit, poll, publish, deliver predictions."},
        {"name": "public-predictions", "description": "Anonymous read of published predictions."},
        {"name": "feedback", "description": "Per-feature accept/reject feedback."},
        {"name": "banners", "description": "Site-wide announcement banners."},
        {"name": "notifications", "description": "Per-user notification feed."},
        {"name": "workspace", "description": "S3 listing + presigned URLs."},
        {"name": "stars", "description": "Anonymous-friendly star/unstar."},
        {"name": "system", "description": "Health + dependency probes."},
    ],
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
        "filter": True,
        "tagsSorter": "alpha",
        "operationsSorter": "alpha",
    },
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "SCHEMA_PATH_PREFIX_TRIM": True,
    "ENUM_NAME_OVERRIDES": {
        "PipelineRunStatus": "shared.enums.PipelineRunStatus.choices",
        "DatasetStatus": "shared.enums.DatasetStatus.choices",
        "LocalModelStatus": "shared.enums.LocalModelStatus.choices",
        "BaseModelStatus": "shared.enums.BaseModelStatus.choices",
    },
}

TEST_RUNNER = "tests.test_runners.NoDestroyTestRunner"

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = settings.email_host
    EMAIL_PORT = settings.email_port
    EMAIL_USE_TLS = settings.email_use_tls
    EMAIL_USE_SSL = settings.email_use_ssl
    EMAIL_HOST_USER = settings.email_host_user
    EMAIL_HOST_PASSWORD = settings.email_host_password.get_secret_value()
    DEFAULT_FROM_EMAIL = settings.default_from_email


def _extract_domain(url: str) -> str | None:
    return urlparse(url).hostname


if DEBUG or settings.cors_allow_all_origins:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOWED_ORIGINS = list(settings.cors_allowed_origins)
    frontend_origin = FRONTEND_URL.rstrip("/") if FRONTEND_URL else None
    if frontend_origin and frontend_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(frontend_origin)

CORS_ALLOW_HEADERS = [
    *default_headers,
    "authorization",
    "content-type",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOWED_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_PREFLIGHT_MAX_AGE = 86400


def _build_allowed_hosts() -> list[str]:
    if DEBUG:
        return ["*"]
    hosts: set[str] = {"localhost", "127.0.0.1", "0.0.0.0", HOSTNAME}
    hosts.update(settings.allowed_hosts)
    frontend_domain = _extract_domain(FRONTEND_URL)
    if frontend_domain:
        hosts.add(frontend_domain)
    hosts.update(filter(None, (_extract_domain(o) for o in settings.cors_allowed_origins)))
    return sorted(filter(None, hosts))


ALLOWED_HOSTS = _build_allowed_hosts()

ENABLE_MAPSWIPE = settings.enable_mapswipe
MAPSWIPE_BACKEND_URL = _str(settings.mapswipe_backend_url)
MAPSWIPE_MANAGER_URL = _str(settings.mapswipe_manager_url)
MAPSWIPE_WEB_URL = _str(settings.mapswipe_web_url)
MAPSWIPE_CSRFTOKEN_KEY = settings.mapswipe_csrftoken_key
MAPSWIPE_FB_AUTH_URL = _str(settings.mapswipe_fb_auth_url)
MAPSWIPE_FB_USERNAME = settings.mapswipe_fb_username
MAPSWIPE_FB_PASSWORD = _secret(settings.mapswipe_fb_password)
MAPSWIPE_TUTORIAL_ID = settings.mapswipe_tutorial_id
MAPSWIPE_ORGANIZATION_ID = settings.mapswipe_organization_id
MAPSWIPE_VERIFICATION_NUMBER = settings.mapswipe_verification_number
MAPSWIPE_POLL_INTERVAL = settings.mapswipe_poll_interval
MAPSWIPE_POLL_TIMEOUT = settings.mapswipe_poll_timeout

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
