---
icon: lucide/settings
description: The environment variables of the fAIr backend and frontend.
---

# Configuration

## Backend

`.env` is read by `pydantic-settings`. Empty values are treated as unset and fall back to defaults. Required vars raise at process boot if missing. `backend/env_example` mirrors the tables below.

### Core Django

| Name                     | Required | Default                 | Description                                                                                                                |
| ------------------------ | -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `DEBUG`                  | no       | `false`                 | Django debug mode. In prod (`false`), `SECRET_KEY` must be at least 32 chars and not contain `dev` or `unsafe`.            |
| `SECRET_KEY`             | yes      | (none)                  | Django secret. Strict length/strength check when `DEBUG=false`.                                                            |
| `DATABASE_URL`           | yes      | (none)                  | Postgres URL. Scheme must be `postgres`, `postgresql`, or `postgis`.                                                       |
| `DATABASE_SSL_MODE`      | no       | `null`                  | psycopg `sslmode`. Set to `require` for hosted Postgres.                                                                   |
| `ALLOWED_HOSTS`          | no       | `[]`                    | Comma-separated list.                                                                                                      |
| `CSRF_TRUSTED_ORIGINS`   | no       | `[]`                    | Comma-separated list.                                                                                                      |
| `CORS_ALLOWED_ORIGINS`   | no       | `[]`                    | Comma-separated list.                                                                                                      |
| `CORS_ALLOW_ALL_ORIGINS` | no       | `false`                 | Accept every origin. `DEBUG=true` turns this on as well.                                                                   |
| `SECURE_SSL_REDIRECT`    | no       | `true`                  | Force HTTPS redirect at the Django layer.                                                                                  |
| `FRONTEND_URL`           | yes      | (none)                  | Public URL of the SPA. Used in emails and CORS.                                                                            |
| `API_BASE_URL`           | yes      | (none)                  | Public URL of this backend (e.g. `http://localhost:8000/api/v1`).                                                          |
| `HOSTNAME`               | no       | `127.0.0.1`             | Added to `ALLOWED_HOSTS` when `DEBUG=false`. Container runtimes set this to the container name.                            |
| `SERVE_FRONTEND`         | no       | `false`                 | Serve the built SPA from this backend: WhiteNoise serves its assets and every non-API route returns `index.html`.          |
| `FRONTEND_DIST_DIR`      | no       | `backend/frontend_html` | Directory holding the built SPA, read when `SERVE_FRONTEND=true`. A relative value resolves against the working directory. |

### Authentication

`AUTH_PROVIDER` selects the auth backend. Both share one contract: `Authorization: Bearer <token>`. `hanko` (production) validates a per-user JWT issued by Hanko (sent via Bearer header or `hanko` cookie). `dev` (local only) compares the Bearer token against the static `FAIR_DEV_TOKEN`; anyone with the token gets full dev-user access.

With `AUTH_PROVIDER=hanko`, the `hotosm_auth` library reads the cookie, JWT and OSM variables straight from the environment. This backend reads `LOGIN_URL`, `LOGIN_INTERNAL_API_KEY` and `LOGIN_BACKEND_URL`, and checks `HANKO_API_URL`, `COOKIE_SECRET`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `JWT_AUDIENCE` and `OSM_REDIRECT_URI` at startup.

| Name                     | Required                   | Default                              | Description                                                                                             |
| ------------------------ | -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `AUTH_PROVIDER`          | no                         | `hanko`                              | One of `hanko`, `dev`.                                                                                  |
| `FAIR_DEV_TOKEN`         | when `AUTH_PROVIDER=dev`   | `null`                               | Static dev token. Generate with `openssl rand -hex 32`. Never commit.                                   |
| `HANKO_API_URL`          | when `AUTH_PROVIDER=hanko` | `null`                               | Hanko backend URL.                                                                                      |
| `COOKIE_SECRET`          | when `AUTH_PROVIDER=hanko` | `null`                               | Used to verify Hanko-signed cookies. At least 32 characters.                                            |
| `COOKIE_DOMAIN`          | no                         | inferred from `HANKO_API_URL`        | Cookie scope domain. Inferred as the last two host labels, or `localhost`.                              |
| `COOKIE_SECURE`          | no                         | `true` when `HANKO_API_URL` is https | `Secure` cookie flag. Only `true` turns it on.                                                          |
| `JWT_AUDIENCE`           | no                         | `null`                               | Expected `aud` claim.                                                                                   |
| `LOGIN_URL`              | no                         | `https://login.hotosm.org`           | HOT login portal URL.                                                                                   |
| `LOGIN_INTERNAL_API_KEY` | no                         | `null`                               | Server-to-server key against the login portal.                                                          |
| `LOGIN_BACKEND_URL`      | no                         | `null`                               | Login portal backend URL.                                                                               |
| `OSM_REDIRECT_URI`       | no                         | `{HANKO_API_URL}/auth/osm/callback`  | OSM OAuth callback for the connect-OSM-account flow. Set it when the app path differs from the default. |
| `COOKIE_SAMESITE`        | no                         | `lax`                                | `SameSite` flag of the auth cookie.                                                                     |
| `JWT_ISSUER`             | no                         | `auto`                               | Expected `iss` claim. `auto` means `HANKO_API_URL`.                                                     |
| `OSM_CLIENT_ID`          | no                         | `null`                               | OSM OAuth client. Setting it with `OSM_CLIENT_SECRET` turns the connect-OSM-account flow on.            |
| `OSM_CLIENT_SECRET`      | no                         | `null`                               | Secret of the OSM OAuth client.                                                                         |
| `OSM_SCOPES`             | no                         | `read_prefs`                         | Space-separated OSM OAuth scopes.                                                                       |
| `OSM_API_URL`            | no                         | `https://www.openstreetmap.org`      | OSM API root.                                                                                           |
| `ADMIN_EMAILS`           | no                         | `""`                                 | Comma-separated Hanko emails allowed to use the `/api/admin/` user-mapping routes.                      |

### fair-py-ops (ZenML + STAC)

`FAIR_*` values are read by this backend. The `ZENML_STORE_*` values are read by
the `zenml` library itself when it opens a connection, so both sets point at the
same server.

| Name                   | Required         | Default | Description                                                                                                         |
| ---------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `FAIR_ZENML_STORE_URL` | yes              | (none)  | URL of the deployed ZenML server.                                                                                   |
| `FAIR_STAC_API_URL`    | yes              | (none)  | URL of the STAC API root (eoapi-stac-fastapi). Trailing slashes are stripped.                                       |
| `FAIR_STAC_API_KEY`    | prod             | `null`  | Bearer token for the STAC Transactions extension.                                                                   |
| `FAIR_STAC_DSN`        | prod             | `null`  | pgstac Postgres DSN. When set, STAC writes go to pgstac directly, so the API can be read-only.                      |
| `ZENML_STORE_URL`      | yes (at runtime) | `null`  | Same server as `FAIR_ZENML_STORE_URL`.                                                                              |
| `ZENML_STORE_API_KEY`  | one of the two   | `null`  | Service-account key. Mint with `zenml service-account create fair-backend`.                                         |
| `ZENML_STORE_USERNAME` | one of the two   | `null`  | Username, paired with `ZENML_STORE_PASSWORD`. The compose stack's default user is `default` with an empty password. |
| `ZENML_STORE_PASSWORD` | with username    | `null`  | Password for the above.                                                                                             |

### Object storage (S3 / MinIO)

| Name                    | Required         | Default     | Description                                      |
| ----------------------- | ---------------- | ----------- | ------------------------------------------------ |
| `BUCKET_NAME`           | yes              | (none)      | S3 / MinIO bucket.                               |
| `PARENT_BUCKET_FOLDER`  | no               | `dev`       | Per-environment prefix inside the bucket.        |
| `AWS_REGION`            | no               | `us-east-1` | S3 region.                                       |
| `AWS_ACCESS_KEY_ID`     | yes (at runtime) | `null`      |                                                  |
| `AWS_SECRET_ACCESS_KEY` | yes (at runtime) | `null`      |                                                  |
| `AWS_ENDPOINT_URL`      | no               | `null`      | Set for non-AWS S3 (MinIO, Cloudflare R2, etc.). |
| `PRESIGNED_URL_EXPIRY`  | no               | `900`       | Presigned-URL TTL in seconds.                    |

### Rate limits and database pool

DRF throttle scopes use `<count>/<period>`, e.g. `1000/h`. Use the Django pool or PgBouncer, not both.

| Name                    | Required | Default  | Description                                            |
| ----------------------- | -------- | -------- | ------------------------------------------------------ |
| `USER_RATE_LIMIT`       | no       | `1000/h` | Authenticated requests.                                |
| `ANON_RATE_LIMIT`       | no       | `100/h`  | Anonymous requests.                                    |
| `TRAINING_RATE_LIMIT`   | no       | `10/h`   | Training submission throttle.                          |
| `PREDICTION_RATE_LIMIT` | no       | `50/h`   | Prediction submission throttle.                        |
| `DB_POOL_MIN_SIZE`      | no       | `4`      | Django 5.1+ native PostgreSQL connection pool minimum. |
| `DB_POOL_MAX_SIZE`      | no       | `20`     | Pool maximum.                                          |
| `DB_POOL_TIMEOUT`       | no       | `30`     | Seconds to wait for a free connection.                 |

### OSM raw-data API

| Name               | Required | Default                                   | Description            |
| ------------------ | -------- | ----------------------------------------- | ---------------------- |
| `RAW_DATA_API_URL` | no       | `https://api-prod.raw-data.hotosm.org/v1` | HOT Raw Data API root. |

### Email

Only checked when `DEBUG=false`.

| Name                  | Required | Default                    | Description                                             |
| --------------------- | -------- | -------------------------- | ------------------------------------------------------- |
| `EMAIL_HOST`          | no       | `smtp.gmail.com`           | SMTP host.                                              |
| `EMAIL_PORT`          | no       | `587`                      | SMTP port.                                              |
| `EMAIL_USE_TLS`       | no       | `true`                     | STARTTLS.                                               |
| `EMAIL_USE_SSL`       | no       | `false`                    | Implicit TLS (mutually exclusive with `EMAIL_USE_TLS`). |
| `EMAIL_HOST_USER`     | no       | `""`                       | SMTP username.                                          |
| `EMAIL_HOST_PASSWORD` | no       | `""`                       | SMTP password.                                          |
| `DEFAULT_FROM_EMAIL`  | no       | `no-reply@fair.hotosm.org` | `From:` header for outbound mail.                       |

### Pagination and sessions

| Name                      | Required | Default   | Description                                                                                                             |
| ------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DEFAULT_PAGINATION_SIZE` | no       | `50`      | DRF page size.                                                                                                          |
| `SESSION_COOKIE_AGE`      | no       | `3600`    | Session cookie TTL in seconds.                                                                                          |
| `USER_STATE_MAX_BYTES`    | no       | `2097152` | Largest saved user state in bytes of compact JSON; a request body over this plus 1024 bytes is rejected before parsing. |

### Sentry

| Name            | Required                  | Default | Description                                                           |
| --------------- | ------------------------- | ------- | --------------------------------------------------------------------- |
| `ENABLE_SENTRY` | no                        | `false` | Send errors to Sentry. Install the SDK with `uv sync --group sentry`. |
| `SENTRY_DSN`    | when `ENABLE_SENTRY=true` | `null`  | Sentry project DSN.                                                   |

### Operational tuning

| Name                            | Required | Default | Description                                                                                                                                    |
| ------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `HEALTH_PROBE_TIMEOUT`          | no       | `2.0`   | Seconds each HTTP probe waits before marking a dependency unreachable in `GET /api/v1/health/`.                                                |
| `PREDICTION_SYNC_INTERVAL`      | no       | `15`    | Seconds between prediction-status poll re-enqueues.                                                                                            |
| `DELETE_PREDICTION_INPUT_TILES` | no       | `true`  | When true, deletes a map request's staged input tiles from object storage once its run ends or its submission fails.                           |
| `TRAINING_SYNC_INTERVAL`        | no       | `30`    | Seconds between training-status poll re-enqueues.                                                                                              |
| `STAC_CACHE_TTL`                | no       | `300`   | Seconds the shared cache holds a STAC item before re-fetching. Raise in prod for lower STAC load; lower in dev to see property changes faster. |
| `STAC_BULK_FETCH_WORKERS`       | no       | `16`    | Thread pool size for parallel STAC item fetches when `?expand=stac` is used on list endpoints.                                                 |
| `PMTILES_MIN_ZOOM`              | no       | `10`    | Min zoom passed to `tippecanoe` for PMTiles generation.                                                                                        |
| `PMTILES_MAX_ZOOM`              | no       | `20`    | Max zoom passed to `tippecanoe` for PMTiles generation.                                                                                        |

## Frontend

The frontend reads `VITE_*` variables at build time and from `config.js` at container start; the runtime value wins. [`frontend/.env.sample`](https://github.com/hotosm/fAIr/blob/develop/frontend/.env.sample) describes each one. Restart the Vite dev server, or the container and the `api` service that serves `config.js`, after a change.
