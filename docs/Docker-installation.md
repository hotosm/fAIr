# fAIr Development Setup

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose
- Git
- 4GB+ RAM
- A running fair-py-ops dev stack (kind cluster + ZenML + STAC API + MinIO + MLflow).( TODO : Add a single command up to set everything up)

## Quick start

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
docker compose up postgres -d
cp backend/.env.example backend/.env
# fill in real values, see backend/README.md for which vars are required
docker compose up api worker
```

The `frontend` service runs under the `dev` profile (`docker compose --profile dev up frontend`).

## Default ports

- 3500: Frontend
- 8000: API
- 5434: PostgreSQL (host)

## Endpoints

- Frontend: <http://localhost:3500>
- API root: <http://localhost:8000/api/>
- OpenAPI schema: <http://localhost:8000/api/schema/>
- Swagger UI: <http://localhost:8000/api/docs/>
- ReDoc: <http://localhost:8000/api/redoc/>
- Health probes: <http://localhost:8000/api/v1/health/>

All v1 routes are under `/api/v1/`. Versioning uses DRF `NamespaceVersioning`, so `request.version` is set per request and `/api/v2/` is one URL line away when needed.

## Configuration

`backend/.env` is read by `pydantic-settings`. Required vars raise at boot if missing. See [backend/README.md](../backend/README.md) for a concise overview and `backend/.env.example` for the annotated source of truth.

## Help

- [Backend docs](../backend/README.md)
- <https://github.com/hotosm/fAIr/issues>
