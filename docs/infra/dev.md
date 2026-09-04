# fAIr dev environment

> Temporary setup. This Compose-on-EC2 deployment will be replaced by a k3s
> deployment once all the Helm charts are stable.

The dev environment is a single EC2 instance running the whole fAIr stack with
Docker Compose, fronted by Caddy (automatic TLS). It tracks the `develop`
branch: CI builds the images on every push, and a redeploy pulls them.

- App: https://dev.ai.hotosm.org (frontend + API, hanko login)
- STAC: https://stac.dev.ai.hotosm.org
- Access: `ssh fair-dev`

## Layout on the box

Everything lives in `/opt/fAIr-app` (a `develop` checkout):

| File                     | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `docker-compose.yml`     | base stack (api, worker, postgres, minio, stac, mlflow, zenml, frontend) |
| `docker-compose.dev.yml` | dev override: Caddy ingress, restart policies, the inline Caddyfile      |
| `.env`                   | all runtime config and secrets (not in git)                              |

`.env` sets `COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml`, so plain
`docker compose` commands pick up both files. The stack is managed by the
`fAIr-app` systemd unit and starts on boot.

## Deploy / redeploy

Pull the latest images and restart. Migrations run automatically on start.

```bash
ssh fair-dev
cd /opt/fAIr-app
git pull
docker compose pull
sudo systemctl restart fAIr-app
```

## Start / stop / status

Lifecycle is managed by systemd.

```bash
sudo systemctl start fAIr-app
sudo systemctl stop fAIr-app
sudo systemctl status fAIr-app
```

## Logs

Check container status and follow a service. Services: `api`, `worker`,
`caddy`, `stac`, `zenml`, `mlflow`, `postgres`, `minio`.

```bash
cd /opt/fAIr-app
sudo docker compose ps
sudo docker compose logs -f api
```

## Editing config (`.env`)

`.env` is the single source of truth, grouped into labeled blocks (Core,
Database, Auth, CORS, ZenML & STAC, Object storage, Frontend, Ports, Caddy).

Apply changes by restarting (or recreate a single service with
`docker compose up -d <service>`).

```bash
sudo systemctl restart fAIr-app
```

Common changes:

- **Django / API**: `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`.
- **Auth (hanko)**: `AUTH_PROVIDER`, `HANKO_API_URL`, `LOGIN_URL`, `COOKIE_*`,
  `OSM_LOGIN_REDIRECT_URI`.
- **Frontend** (`VITE_*`, baked into `config.js` at container start): after any
  change restart `api` too, it serves the SPA and caches `config.js` at boot.
- **Domain**: `PUBLIC_DOMAIN`, `FRONTEND_URL`, `API_BASE_URL`, `ALLOWED_HOSTS`,
  `CSRF_TRUSTED_ORIGINS`, plus the domains in the Caddyfile.

## Where to change what

- **Service/image/port wiring**: `docker-compose.yml` (base) and
  `docker-compose.dev.yml` (dev-only overrides).
- **Ingress, TLS, domains**: the `configs.caddyfile` block in
  `docker-compose.dev.yml`. mlflow/zenml/minio subdomains are commented out
  (kept internal); uncomment to expose them once DNS + auth are in place.
- **Runtime config / secrets**: `.env`.
- **Lifecycle**: `infra/systemd/fAIr-app.service`.

## Access the database

Postgres is bound to `127.0.0.1:5434` on the box. Open an SSH tunnel from your
machine.

```bash
ssh -L 5434:localhost:5434 fair-dev
```

While the tunnel is open, connect locally with a client. Use the credentials
from `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).

```bash
psql "postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:5434/<POSTGRES_DB>"
```

## Internal services (mlflow, zenml, minio)

Not exposed publicly. Tunnel to them: mlflow on `localhost:5000`, zenml on
`localhost:8080`, minio console on `localhost:9001`.

```bash
ssh -L 5000:localhost:5000 -L 8080:localhost:8080 -L 9001:localhost:9001 fair-dev
```

## Notes

- Training runs on the instance GPU (Docker default runtime is nvidia; ZenML
  spawns the training container on the same Docker network).
- Dev data lives on the instance disk in Docker volumes; the shared EFS is not
  used by dev.
