---
icon: lucide/terminal
description: Run the full fAIr stack locally, or the backend on its own for fast iteration.
---

# Developer setup

This page covers running fAIr for development. For a guided Docker install, see [Run locally](run-locally.md).

## Prerequisites

- Docker and Docker Compose for the full stack.
- For host-based backend work: [uv](https://docs.astral.sh/uv/), [just](https://github.com/casey/just), and Python 3.12 or newer.
- For host-based frontend work: [pnpm](https://pnpm.io/).

## Full stack

Build and run the whole stack from source with [Run locally](run-locally.md). The rest of this page covers backend-only iteration and tooling.

## Backend only

For faster iteration, run Postgres in Docker and the backend on the host. This uses `backend/.env`, with Postgres on port `5434`.

```bash
docker compose up -d postgres
cd backend
cp env_example .env    # create backend/.env from the example
just migrate
just run       # runserver on :8000
just worker    # separate shell, runs async jobs
```

The worker is required for any async flow (dataset build, training, prediction), since those run as background jobs.

## Ports

The API is on `8000` and Postgres on `5434`. The full list of services, ports, URLs, and dev credentials is in [Run locally](run-locally.md#services).

## Backend tooling

The backend uses **uv** for packages, **ruff** for lint and format, **ty** for types, and **pytest** for tests. The `just` recipes wrap the common tasks:

```bash
just setup     # install dependencies and hooks
just lint      # ruff, ty, pre-commit
just test      # pytest
just run       # runserver
just worker    # background job worker
just migrate   # apply migrations
```

Async jobs use `django_tasks`: define a `@task()` in `<app>/tasks.py` and enqueue it; the worker is `manage.py db_worker`.

## Frontend

The frontend uses pnpm and Vite:

```bash
cd frontend
pnpm install
pnpm dev       # vite dev server
pnpm build     # type-check and build
pnpm test      # vitest
```

## Hot reload

Editing the host `./backend` source live in the containers is opt-in through `docker-compose.hotreload.yml`:

```bash
COMPOSE_FILE=docker-compose.yml:docker-compose.hotreload.yml docker compose up
```

`runserver` autoreloads the API; restart the worker to pick up task changes.

See [Architecture](../architecture/index.md) for how the services fit together.
