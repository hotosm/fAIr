# fAIr Development Setup

## Prerequisites

- Docker Engine or Docker Desktop, with Docker Compose 2.23.1 or newer
  (`docker compose version`)
- Git
- 4GB+ RAM

## Quick start

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
cp env_example .env
docker compose up
```

Open <http://localhost:8000>. The first boot pulls images and seeds the model
catalog, so it takes a few minutes; later starts are quick.

This runs the API, the frontend, a background worker, and the full dependency
set: Postgres with PostGIS, MinIO, a STAC catalog, MLflow, and a ZenML server.
To run from source instead, run `docker compose build` first.

## Verifying the installation

`test.py` at the repository root walks the whole flow one request at a time:
area of interest, dataset build, training, promotion, prediction.

```bash
uv run test.py
```

It prints each step as it passes and exits non-zero on the first failure. Point
it at a stack on other ports with `--api`, `--stac`, and `--minio`.

## Services

| Service               | URL                                    | Credentials                 |
| --------------------- | -------------------------------------- | --------------------------- |
| fAIr frontend and API | <http://localhost:8000>                | Bearer `dev-token`          |
| Swagger UI            | <http://localhost:8000/api/docs/>      |                             |
| ReDoc                 | <http://localhost:8000/api/redoc/>     |                             |
| OpenAPI schema        | <http://localhost:8000/api/schema/>    |                             |
| Health probes         | <http://localhost:8000/api/v1/health/> |                             |
| ZenML                 | <http://localhost:8080>                | `default`, empty password   |
| STAC                  | <http://localhost:8082/collections>    |                             |
| MLflow                | <http://localhost:5000>                |                             |
| MinIO console         | <http://localhost:9001>                | `minioadmin` / `minioadmin` |
| PostgreSQL            | `localhost:5434`                       | `admin` / `password`        |

All v1 routes are under `/api/v1/`. Versioning uses DRF `NamespaceVersioning`,
so `request.version` is set per request and `/api/v2/` is one URL line away when
needed.

Every published port is overridable, so the stack can coexist with other
services:

```bash
API_PORT=8100 POSTGRES_PORT=5544 docker compose up
```

The docker network name is pinned to `fair-net`, because the ZenML orchestrator
attaches training containers to it by name. Two copies of the stack on one host
need that name changed as well.

## Configuration

The root `.env` is read by `pydantic-settings`; required vars raise at boot if
missing. `env_example` holds working defaults for the compose setup, using
compose service names as hosts.

To run Django on the host against the containerised dependencies, use
`backend/env_example` instead, which points at `localhost` and the published
ports. See [backend/README.md](../backend/README.md) for every variable.

## Notes

Prediction results are returned as presigned MinIO URLs signed for the
in-network `minio` host, so they do not resolve from a browser. Add
`127.0.0.1 minio` to `/etc/hosts` to open them directly.

Training runs spawn containers through the host Docker socket, which is mounted
into the worker.

## Help

- [Backend docs](../backend/README.md)
- <https://github.com/hotosm/fAIr/issues>
