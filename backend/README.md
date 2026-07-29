# fAIr Backend

Thin coordination layer for the fAIr AI-Assisted Mapping platform. Owns the public REST API, the user database, and the orchestration of dataset builds, training runs and predictions. ML pipelines and STAC catalog operations live in [fair-py-ops](https://github.com/hotosm/fAIr-models) and run on a ZenML stack.

Model code lives in per-model docker images that the ZenML orchestrator pulls.

## Quick start

The compose file at the repository root runs this backend and everything it
depends on. See [docs/Docker-installation.md](../docs/Docker-installation.md).

### Running the backend on the host

Useful when iterating on backend code. Start the dependencies in docker, then
run Django outside it:

```bash
cd ..
docker compose up -d postgres minio stac mlflow zenml
cd backend
just setup                 
cp env_example .env      
just migrate
just run                   
just worker               tasks
```

The two sample files differ only in host names: the root `env_example` uses
compose service names (`postgres`, `minio`, `stac`, `zenml`), while
`backend/env_example` uses `localhost` with the ports those services publish.

OpenAPI schema at `/api/schema/`, Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/`.

## Environment

`.env` is read by `pydantic-settings`. Empty values are treated as unset and fall back to defaults. Required vars raise at process boot if missing. `SecretStr` values are masked in tracebacks. `env_example` mirrors the tables below.

### Core Django

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `DEBUG` | no | `false` | Django debug mode. In prod (`false`), `SECRET_KEY` must be at least 32 chars and not contain `dev` or `unsafe`. |
| `SECRET_KEY` | yes | (none) | Django secret. Strict length/strength check when `DEBUG=false`. |
| `DATABASE_URL` | yes | (none) | Postgres URL. Scheme must be `postgres`, `postgresql`, or `postgis`. |
| `DATABASE_SSL_MODE` | no | `null` | psycopg `sslmode`. Set to `require` for hosted Postgres. |
| `ALLOWED_HOSTS` | no | `[]` | Comma-separated list. |
| `CSRF_TRUSTED_ORIGINS` | no | `[]` | Comma-separated list. |
| `CORS_ALLOWED_ORIGINS` | no | `[]` | Comma-separated list. |
| `SECURE_SSL_REDIRECT` | no | `true` | Force HTTPS redirect at the Django layer. |
| `FRONTEND_URL` | yes | (none) | Public URL of the SPA. Used in emails and CORS. |
| `API_BASE_URL` | yes | (none) | Public URL of this backend (e.g. `http://localhost:8000/api/v1`). |
| `HOSTNAME` | no | `127.0.0.1` | Used by the OpenAPI server URL. |

### Authentication

`AUTH_PROVIDER` selects the auth backend. Both share one contract: `Authorization: Bearer <token>`. `hanko` (production) validates a per-user JWT issued by Hanko (sent via Bearer header or `hanko` cookie). `dev` (local only) compares the Bearer token against the static `FAIR_DEV_TOKEN`; anyone with the token gets full dev-user access. Same header in dev and prod, only the issuer differs.

`GET` on datasets, local-models, and predictions is open to anonymous callers for rows with `visibility="public"`. Owner-scoped lifecycle data (AOIs, trainings, feedback, notifications) and every write require Bearer auth.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `AUTH_PROVIDER` | no | `hanko` | One of `hanko`, `dev`. |
| `FAIR_DEV_TOKEN` | when `AUTH_PROVIDER=dev` | `null` | Static dev token. Generate with `openssl rand -hex 32`. Never commit. |
| `HANKO_API_URL` | when `AUTH_PROVIDER=hanko` | `null` | Hanko backend URL. |
| `COOKIE_SECRET` | when `AUTH_PROVIDER=hanko` | `null` | Used to verify Hanko-signed cookies. |
| `COOKIE_DOMAIN` | no | `null` | Cookie scope domain. |
| `COOKIE_SECURE` | no | `null` | Force `Secure` cookie flag. |
| `JWT_AUDIENCE` | no | `null` | Expected `aud` claim. |
| `LOGIN_URL` | no | `https://login.hotosm.org` | HOT login portal URL. |
| `LOGIN_INTERNAL_API_KEY` | no | `null` | Server-to-server key against the login portal. |
| `LOGIN_BACKEND_URL` | no | `null` | Login portal backend URL. |
| `OSM_LOGIN_REDIRECT_URI` | no | `null` | Required only when Hanko's "connect existing OSM account" flow is enabled. |

### fair-py-ops (ZenML + STAC)

`FAIR_*` values are read by this backend. The `ZENML_STORE_*` values are read by
the `zenml` library itself when it opens a connection, so both sets point at the
same server. Authenticate with either an API key or a username and password.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `FAIR_ZENML_STORE_URL` | yes (at runtime) | `null` | URL of the deployed ZenML server. Optional at boot, raises loud at first call site. |
| `FAIR_STAC_API_URL` | yes (at runtime) | `null` | URL of the STAC API root (eoapi-stac-fastapi). Trailing slashes are stripped. |
| `FAIR_STAC_API_KEY` | prod | `null` | Bearer token for the STAC Transactions extension. |
| `ZENML_STORE_URL` | yes (at runtime) | `null` | Same server as `FAIR_ZENML_STORE_URL`. |
| `ZENML_STORE_API_KEY` | one of the two | `null` | Service-account key. Mint with `zenml service-account create fair-backend`. |
| `ZENML_STORE_USERNAME` | one of the two | `null` | Username, paired with `ZENML_STORE_PASSWORD`. The compose stack's default user is `default` with an empty password. |
| `ZENML_STORE_PASSWORD` | with username | `null` | Password for the above. |

### Object storage (S3 / MinIO)

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `BUCKET_NAME` | yes (at runtime) | `null` | S3 / MinIO bucket. |
| `PARENT_BUCKET_FOLDER` | no | `dev` | Per-environment prefix inside the bucket. |
| `AWS_REGION` | no | `us-east-1` | S3 region. |
| `AWS_ACCESS_KEY_ID` | yes (at runtime) | `null` | |
| `AWS_SECRET_ACCESS_KEY` | yes (at runtime) | `null` | |
| `AWS_ENDPOINT_URL` | no | `null` | Set for non-AWS S3 (MinIO, Cloudflare R2, etc.). |
| `PRESIGNED_URL_EXPIRY` | no | `900` | Presigned-URL TTL in seconds. |

### Rate limits + database pool

DRF throttle scopes use `<count>/<period>`, e.g. `1000/h`. Use the Django-native pool OR PgBouncer, not both.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `USER_RATE_LIMIT` | no | `1000/h` | Authenticated requests. |
| `ANON_RATE_LIMIT` | no | `100/h` | Anonymous requests. |
| `TRAINING_RATE_LIMIT` | no | `10/h` | Training submission throttle. |
| `PREDICTION_RATE_LIMIT` | no | `50/h` | Prediction submission throttle. |
| `DB_POOL_MIN_SIZE` | no | `4` | Django 5.1+ native PostgreSQL connection pool minimum. |
| `DB_POOL_MAX_SIZE` | no | `20` | Pool maximum. |
| `DB_POOL_TIMEOUT` | no | `30` | Seconds to wait for a free connection. |

### OSM raw-data API

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `RAW_DATA_API_URL` | no | `https://api-prod.raw-data.hotosm.org/v1` | HOT Raw Data API root. |

### Mapswipe

Off by default. When `ENABLE_MAPSWIPE=false`, `POST /api/v1/predictions/<id>/mapswipe/` returns 503. The `/api/v1/health/` endpoint reports `mapswipe.reachable` when enabled.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `ENABLE_MAPSWIPE` | no | `false` | Master toggle. |
| `MAPSWIPE_BACKEND_URL` | no | `null` | Mapswipe backend URL. |
| `MAPSWIPE_MANAGER_URL` | no | `null` | Mapswipe manager URL. |
| `MAPSWIPE_WEB_URL` | no | `null` | Mapswipe web app URL. |
| `MAPSWIPE_CSRFTOKEN_KEY` | when `ENABLE_MAPSWIPE=true` | `null` | CSRF cookie name on the Mapswipe backend. |
| `MAPSWIPE_FB_AUTH_URL` | when `ENABLE_MAPSWIPE=true` | `null` | Firebase auth endpoint. |
| `MAPSWIPE_FB_USERNAME` | when `ENABLE_MAPSWIPE=true` | `null` | Firebase service-account username. |
| `MAPSWIPE_FB_PASSWORD` | when `ENABLE_MAPSWIPE=true` | `null` | Firebase service-account password. |
| `MAPSWIPE_TUTORIAL_ID` | no | `37` | Mapswipe tutorial ID injected into pushed projects. |
| `MAPSWIPE_ORGANIZATION_ID` | no | `4` | Mapswipe organization ID. |
| `MAPSWIPE_VERIFICATION_NUMBER` | no | `3` | Number of crowd verifications required per tile. |
| `MAPSWIPE_POLL_INTERVAL` | no | `10` | Seconds between Mapswipe push-status polls. |
| `MAPSWIPE_POLL_TIMEOUT` | no | `600` | Maximum total seconds to wait for a Mapswipe push. |

### Email

Only checked when `DEBUG=false`.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `EMAIL_HOST` | no | `smtp.gmail.com` | SMTP host. |
| `EMAIL_PORT` | no | `587` | SMTP port. |
| `EMAIL_USE_TLS` | no | `true` | STARTTLS. |
| `EMAIL_USE_SSL` | no | `false` | Implicit TLS (mutually exclusive with `EMAIL_USE_TLS`). |
| `EMAIL_HOST_USER` | no | `""` | SMTP username. |
| `EMAIL_HOST_PASSWORD` | no | `""` | SMTP password. |
| `DEFAULT_FROM_EMAIL` | no | `no-reply@fair.hotosm.org` | `From:` header for outbound mail. |

### Logging + pagination

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `LOG_PATH` | no | `./logs` | Directory for rotating log files. |
| `DEFAULT_PAGINATION_SIZE` | no | `50` | DRF page size. |
| `SESSION_COOKIE_AGE` | no | `3600` | Session cookie TTL in seconds. |
| `CACHE_TIMEOUT_MINUTES` | no | `5` | Default LocMem cache TTL for non-STAC entries. |
| `LOG_LINE_STREAM_TRUNCATE_VALUE` | no | `10` | Per-step log-line truncation factor for streamed pipeline logs. |

### Operational tuning

All have safe defaults; only set to override.

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `HEALTH_PROBE_TIMEOUT` | no | `2.0` | Seconds each HTTP probe waits before marking a dependency unreachable in `GET /api/v1/health/`. |
| `PREDICTION_SYNC_INTERVAL` | no | `15` | Seconds between prediction-status poll re-enqueues. |
| `TRAINING_SYNC_INTERVAL` | no | `30` | Seconds between training-status poll re-enqueues. |
| `STAC_CACHE_TTL` | no | `300` | Seconds the LocMem cache holds a STAC item before re-fetching. Raise in prod for lower STAC load; lower in dev to see property changes faster. |
| `STAC_BULK_FETCH_WORKERS` | no | `16` | Thread pool size for parallel STAC item fetches when `?expand=stac` is used on list endpoints. |
| `PMTILES_MIN_ZOOM` | no | `10` | Min zoom passed to `tippecanoe` for PMTiles generation. |
| `PMTILES_MAX_ZOOM` | no | `20` | Max zoom passed to `tippecanoe` for PMTiles generation. |

## Worker process

Background work uses Django's built-in `django.tasks` framework with the [`django-tasks-db`](https://github.com/RealOrangeOne/django-tasks-db) backend (Postgres-backed, no Redis required).

```bash
just worker   # runs python manage.py db_worker
```

## Tests, lint, types

```bash
just test                  # pytest
just lint                  # pre-commit run --all-files (ruff + format + ty + uv-lock-check + commitizen)
```

Tests under `backend/tests/` import across apps and mock `shared.integrations.zenml`; nothing hits a live ZenML server. For end-to-end checks against a running stack, run [`test.py`](../test.py), which drives the public API end to end.
