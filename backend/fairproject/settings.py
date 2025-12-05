import os
from socket import gethostbyname, gethostname
from urllib.parse import urlparse

import boto3
import dj_database_url
import environ
from corsheaders.defaults import default_headers

env = environ.Env()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file = os.environ.get("ENV_FILE", ".env")
env_path = os.path.join(BASE_DIR, env_file)
if os.path.exists(env_path):
    environ.Env.read_env(env_path)

DEBUG = env.bool("DEBUG", default=False)

if DEBUG:
    SECRET_KEY = env("SECRET_KEY", default="dev-unsafe-key-change-in-production-12345")
else:
    SECRET_KEY = env("SECRET_KEY")

LOG_PATH = env("LOG_PATH", default=os.path.join(BASE_DIR, "logs"))
os.makedirs(LOG_PATH, exist_ok=True)

TRAINING_WORKSPACE = env(
    "TRAINING_WORKSPACE", default=os.path.join(BASE_DIR, "training")
)
PREDICTION_WORKSPACE = env(
    "PREDICTION_WORKSPACE", default=os.path.join(BASE_DIR, "prediction")
)


FRONTEND_URL = env("FRONTEND_URL", default="https://fair-dev.hotosm.org")
API_BASE_URL = env("API_BASE_URL", default="https://fair-dev.hotosm.org/api/v1")
HOSTNAME = env("HOSTNAME", default="https://fair-dev.hotosm.org")

EXPORT_TOOL_API_URL = env(
    "EXPORT_TOOL_API_URL", default="https://api-prod.raw-data.hotosm.org/v1"
)

if env("GDAL_LIBRARY_PATH", default=None):
    GDAL_LIBRARY_PATH = env("GDAL_LIBRARY_PATH")


OSM_CLIENT_ID = env("OSM_CLIENT_ID", default="debug-client-id")
OSM_CLIENT_SECRET = env("OSM_CLIENT_SECRET", default="debug-client-secret")
OSM_SECRET_KEY = env("OSM_SECRET_KEY", default="debug-secret-key")

OSM_URL = env("OSM_URL", default="https://www.openstreetmap.org")
OSM_SCOPE = env("OSM_SCOPE", default="read_prefs")
OSM_LOGIN_REDIRECT_URI = env(
    "OSM_LOGIN_REDIRECT_URI",
    default="http://127.0.0.1:8000/api/v1/auth/callback/" if DEBUG else None,
)

# =============================================================================
# Authentication Provider
# =============================================================================
# Options: "legacy" (OSM OAuth direct) or "hanko" (Hanko SSO + OSM linking)
AUTH_PROVIDER = env("AUTH_PROVIDER", default="legacy")

# Hanko SSO Configuration (when AUTH_PROVIDER="hanko")
if AUTH_PROVIDER == "hanko":
    HANKO_API_URL = env("HANKO_API_URL")
    COOKIE_SECRET = env("COOKIE_SECRET")
    COOKIE_DOMAIN = env("COOKIE_DOMAIN", default=None)
    COOKIE_SECURE = env.bool("COOKIE_SECURE", default=not DEBUG)
    JWT_AUDIENCE = env("JWT_AUDIENCE", default=None)

    # Login service URL for redirects
    LOGIN_URL = env("LOGIN_URL", default="https://login.hotosm.org")

    # OSM OAuth for Hanko (reuse existing OSM credentials)
    OSM_REDIRECT_URI = env(
        "OSM_REDIRECT_URI",
        default="http://127.0.0.1:8000/api/v1/auth/osm/callback/" if DEBUG else None,
    )


USE_S3_TO_UPLOAD_MODELS = env.bool("USE_S3_TO_UPLOAD_MODELS", default=False)


if USE_S3_TO_UPLOAD_MODELS:
    BUCKET_NAME = env("BUCKET_NAME", default="fair-dev")
    PARENT_BUCKET_FOLDER = env("PARENT_BUCKET_FOLDER", default="dev")
    AWS_REGION = env("AWS_REGION", default="us-east-1")
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default=None)
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default=None)
    PRESIGNED_URL_EXPIRY = env.int("PRESIGNED_URL_EXPIRY", default=3600)

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        S3_CLIENT = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
    else:
        S3_CLIENT = boto3.client("s3")

EPOCHS_LIMIT = env.int("EPOCHS_LIMIT", default=20)
BATCH_SIZE_LIMIT = env.int("BATCH_SIZE_LIMIT", default=8)

YOLO_EPOCHS_LIMIT = env.int("YOLO_EPOCHS_LIMIT", default=200)
YOLO_BATCH_SIZE_LIMIT = env.int("YOLO_BATCH_SIZE_LIMIT", default=8)

RAMP_EPOCHS_LIMIT = env.int("RAMP_EPOCHS_LIMIT", default=40)
RAMP_BATCH_SIZE_LIMIT = env.int("RAMP_BATCH_SIZE_LIMIT", default=8)


SUPPORTED_TRAINING_ZOOM_LEVELS = env.list(
    "SUPPORTED_TRAINING_ZOOM_LEVELS", default=[18, 19, 20, 21]
)

TRAINING_WORKSPACE_DOWNLOAD_LIMIT = env.int(
    "TRAINING_WORKSPACE_DOWNLOAD_LIMIT", default=200
)

FGB_MAX_BBOX_AREA_KM2 = env.float("FGB_MAX_BBOX_AREA_KM2", default=10000.0)
FGB_MAX_BBOX_DIMENSION_KM = env.float("FGB_MAX_BBOX_DIMENSION_KM", default=500.0)
FGB_MAX_FEATURES_LIMIT = env.int("FGB_MAX_FEATURES_LIMIT", default=50000)
FGB_REQUEST_TIMEOUT = env.int("FGB_REQUEST_TIMEOUT", default=60)
FGB_USE_ARROW_FOR_STREAMING = env.bool("FGB_USE_ARROW_FOR_STREAMING", default=True)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "leaflet",
    "rest_framework",
    "rest_framework_gis",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "celery",
    "django_celery_results",
    "django_q",
    "core",
    "login",
]

# Add Hanko user mapping app when using Hanko SSO
if AUTH_PROVIDER == "hanko":
    INSTALLED_APPS.append("hotosm_auth_django")

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Add Hanko middleware when using Hanko SSO
if AUTH_PROVIDER == "hanko":
    MIDDLEWARE.insert(
        MIDDLEWARE.index("django.contrib.auth.middleware.AuthenticationMiddleware"),
        "hotosm_auth.integrations.django.HankoAuthMiddleware",
    )

ROOT_URLCONF = "fairproject.urls"
WSGI_APPLICATION = "fairproject.wsgi.application"

if DEBUG:
    ALLOWED_HOSTS = ["*"]
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    CSRF_TRUSTED_ORIGINS = []
else:
    ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=ALLOWED_HOSTS)

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = env.int("SESSION_COOKIE_AGE", default=3600)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"

DEFAULT_PAGINATION_SIZE = env.int("DEFAULT_PAGINATION_SIZE", default=50)

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.BasicAuthentication",
        "login.authentication.OsmAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": DEFAULT_PAGINATION_SIZE,
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
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


default_db_url = "postgis://admin:password@localhost:5432/fair"

DATABASE_URL = env("DATABASE_URL", default=default_db_url)

DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=env.int("DB_CONN_MAX_AGE", default=500),
        conn_health_checks=True,
    )
}

database_url = urlparse(DATABASE_URL)
if database_url.scheme in ["postgres", "postgresql", "postgis"]:
    ssl_mode = "disable" if DEBUG else "require"
    DATABASES["default"]["OPTIONS"] = {
        "sslmode": env("DATABASE_SSL_MODE", default=ssl_mode),
        **DATABASES["default"].get("OPTIONS", {}),
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "/api_static/"
MEDIA_URL = "/media/"
STATIC_ROOT = os.path.join(BASE_DIR, "api_static")
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {module} {message}", "style": "{"},
        "simple": {"format": "{levelname} {message}", "style": "{"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {"handlers": ["console"]},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "core": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

if not DEBUG:
    LOGGING["handlers"]["file"] = {
        "level": "INFO",
        "class": "logging.FileHandler",
        "filename": os.path.join(LOG_PATH, "django.log"),
        "formatter": "verbose",
    }
    LOGGING["handlers"]["mail_admins"] = {
        "level": "ERROR",
        "class": "django.utils.log.AdminEmailHandler",
    }
    LOGGING["loggers"]["django"]["handlers"].extend(["file", "mail_admins"])
    LOGGING["loggers"]["core"]["handlers"].append("file")

if DEBUG:
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://127.0.0.1:6379/0")

Q_CLUSTER = {
    "name": "DjangORM",
    "workers": env.int("Q_CLUSTER_WORKERS", default=4),
    "retry": env.int("Q_CLUSTER_RETRY", default=360),
    "max_retires": env.int("Q_CLUSTER_MAX_RETRIES", default=1),
    "recycle": env.int("Q_CLUSTER_RECYCLE", default=50),
    "queue_limit": env.int("Q_CLUSTER_QUEUE_LIMIT", default=50),
    "timeout": env.int("Q_CLUSTER_TIMEOUT", default=300),
    "label": "Django Q",
    "orm": "default",
}


AUTH_USER_MODEL = "login.OsmUser"

SPECTACULAR_SETTINGS = {
    "TITLE": "fAIr API",
    "DESCRIPTION": """
## AI-Assisted Mapping

fAIr enables AI-powered mapping using aerial imagery.

### Authentication
Most endpoints require authentication using OSM OAuth2:
1. Get access token: `POST /api/v1/auth/login/`
2. Use token in header: `access-token: YOUR_TOKEN`

### Typical Workflow
1. **Create Dataset**: Define imagery source
2. **Create AOI**: Define mapping area with polygon
3. **Add Labels**: Either fetch from OSM or upload GeoJSON
4. **Create Model**: Initialize AI model
5. **Run Training**: Train model
6. **Run Prediction**: Run inference on new areas
7. **Submit Feedback**: Accept/reject predictions
    """,
    "VERSION": "v1",
    "CONTACT": {"name": "HOT Tech Team", "email": "sysadmin@hotosm.org"},
    "LICENSE": {"name": "AGPL-3.0", "url": "https://www.gnu.org/licenses/agpl-3.0.en.html"},
    "TERMS_OF_SERVICE": "https://www.hotosm.org/privacy",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
        "displayOperationId": False,
        "filter": True,
        "tagsSorter": "alpha",
        "operationsSorter": "alpha",
    },
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "SECURITY": [{"OsmAuth": []}],
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "OsmAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "access-token",
                "description": "OSM OAuth2 access token obtained from /api/v1/auth/login/",
            }
        }
    },
    "DISABLE_ERRORS_AND_WARNINGS": False,
    "PREPROCESSING_HOOKS": [],
    "POSTPROCESSING_HOOKS": [],
    "ENUM_NAME_OVERRIDES": {},
    "SERVERS": [],
    "SCHEMA_COERCE_PATH_PK": True,
    "SCHEMA_COERCE_METHOD_NAMES": {},
}

RAMP_HOME = env("RAMP_HOME", default=None)
if RAMP_HOME:
    os.environ["RAMP_HOME"] = RAMP_HOME

YOLO_HOME = env("YOLO_HOME", default=BASE_DIR)

os.makedirs(TRAINING_WORKSPACE, exist_ok=True)
os.makedirs(PREDICTION_WORKSPACE, exist_ok=True)

LOG_LINE_STREAM_TRUNCATE_VALUE = env.int("LOG_LINE_STREAM_TRUNCATE_VALUE", default=10)

TEST_RUNNER = "tests.test_runners.NoDestroyTestRunner"

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = env(
        "EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend"
    )
    EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
    EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-reply@fair.hotosm.org")
    FAIL_EMAIL_SILENTLY = env.bool("FAIL_EMAIL_SILENTLY", default=True)

CACHE_TIMEOUT_MINUTES = env.int("CACHE_TIMEOUT_MINUTES", default=5)

RATELIMIT_ENABLE = not DEBUG
RATELIMIT_USE_CACHE = "default"
RATELIMIT_VIEW = "core.ratelimit.ratelimit_key_from_user"

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_CACHE_URL", default=CELERY_RESULT_BACKEND),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

TRAINING_RATE_LIMIT = env("TRAINING_RATE_LIMIT", default="10/h")
PREDICTION_RATE_LIMIT = env("PREDICTION_RATE_LIMIT", default="50/h")
API_RATE_LIMIT = env("API_RATE_LIMIT", default="1000/h")


def extract_domain(url):
    return urlparse(url).hostname


if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = False
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True
    cors_origins = env.list("CORS_ALLOWED_ORIGINS", default=[])
    CORS_ALLOWED_ORIGINS = cors_origins.copy()

    if FRONTEND_URL and FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)

CORS_ALLOW_HEADERS = list(default_headers) + [
    "access-token",
    "authorization",
    "content-type",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOWED_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_PREFLIGHT_MAX_AGE = 86400


def get_allowed_hosts():
    hosts = ["localhost", "127.0.0.1", "0.0.0.0"]
    hostname = env("HOSTNAME", default="127.0.0.1")
    if hostname not in hosts:
        hosts.append(hostname)

    # Always include explicitly configured hosts
    configured_hosts = env.list("ALLOWED_HOSTS", default=[])
    hosts.extend(configured_hosts)

    if DEBUG:
        try:
            hosts.extend([gethostname(), gethostbyname(gethostname())])
        except Exception:
            pass
    else:
        production_hosts = env.list("ALLOWED_HOSTS", default=[])
        hosts.extend(production_hosts)

        if FRONTEND_URL:
            frontend_domain = extract_domain(FRONTEND_URL)
            if frontend_domain:
                hosts.append(frontend_domain)

        if "CORS_ALLOWED_ORIGINS" in locals():
            cors_domains = [extract_domain(url) for url in CORS_ALLOWED_ORIGINS if url]
            hosts.extend(filter(None, cors_domains))

    return list(set(filter(None, hosts)))


ALLOWED_HOSTS = get_allowed_hosts()

if not DEBUG:
    required_env_vars = [
        "SECRET_KEY",
        "DATABASE_URL",
        "ALLOWED_HOSTS",
        "OSM_CLIENT_ID",
        "OSM_CLIENT_SECRET",
        "OSM_SECRET_KEY",
    ]
    missing_vars = [var for var in required_env_vars if not env(var, default=None)]
    if missing_vars:
        raise ValueError(
            f"Required environment variables missing in production: {', '.join(missing_vars)}"
        )

    if "dev" in SECRET_KEY or "unsafe" in SECRET_KEY or len(SECRET_KEY) < 32:
        raise ValueError("Insecure SECRET_KEY detected in production")


### Mapswipe block 


MAPSWIPE_BACKEND_URL = env("MAPSWIPE_BACKEND_URL", default="https://backend-2.mapswipe.dev.togglecorp.com")
MAPSWIPE_MANAGER_URL = env("MAPSWIPE_MANAGER_URL", default="https://manager-2.mapswipe.dev.togglecorp.com")
MAPSWIPE_WEB_URL = env("MAPSWIPE_WEB_URL", default="https://web-app-2.mapswipe.dev.togglecorp.com")

MAPSWIPE_CSRFTOKEN_KEY= env("MAPSWIPE_CSRFTOKEN_KEY", default='MAPSWIPE-ALPHA-2-CSRFTOKEN')

# XXX: For the key, go to the managers dashboard login page, open th network tab, after login you can see the key in the network tab
# MAPSWIPE_FB_AUTH_URL=https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MAPSWIPE_FB_AUTH_URL = env("MAPSWIPE_FB_AUTH_URL", default=None)

# web-app login credentials
MAPSWIPE_FB_USERNAME = env("MAPSWIPE_FB_USERNAME", default=None)
MAPSWIPE_FB_PASSWORD = env("MAPSWIPE_FB_PASSWORD", default=None)

ENABLE_MASPSWIPE_INTEGRATION = env.bool("ENABLE_MAPSWIPE_INTEGRATION", default=(MAPSWIPE_CSRFTOKEN_KEY and MAPSWIPE_FB_AUTH_URL and MAPSWIPE_FB_USERNAME and MAPSWIPE_FB_PASSWORD))


MAPSWIPE_ORGANIZATION_ID = env.int("MAPSWIPE_ORGANIZATION_ID", default=4)


MAPSWIPE_POLL_INTERVAL = env.int("MAPSWIPE_POLL_INTERVAL", default=10)
MAPSWIPE_POLL_TIMEOUT = env.int("MAPSWIPE_POLL_TIMEOUT", default=600)

ENABLE_FAIR_PREDICTOR = env.bool("ENABLE_FAIR_PREDICTOR", default=True) # for standalone fairpredictor module , you can enable this to test in the dev in production fairpredictor can be deployed independently
