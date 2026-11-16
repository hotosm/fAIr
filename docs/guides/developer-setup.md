---
icon: lucide/terminal
description: Run the full fAIr stack locally, or the backend on its own for fast iteration.
---

# Developer setup

This page covers backend-only iteration and tooling. To run the full stack, and for the list of services, ports and dev credentials, see [Run locally](run-locally.md).

## Prerequisites

- Docker and Docker Compose for the full stack.
- For host-based backend work: [uv](https://docs.astral.sh/uv/), [just](https://github.com/casey/just), and Python 3.12 or newer.
- For host-based frontend work: [pnpm](https://pnpm.io/) and Node.js 20.19 or newer (22.12 or newer for Oxfmt).

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

To build datasets, train or predict from a host backend, start the other services too:

```bash
docker compose up -d postgres minio stac mlflow zenml
```

Point `backend/.env` at those services, see [Configuration](run-locally.md#configuration).

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

Backend tests mock `shared.integrations.zenml`, so they never reach a live ZenML server.

## Frontend

The frontend uses pnpm and Vite:

```bash
cd frontend
pnpm install
pnpm dev       # vite dev server
pnpm build     # type-check and build into dist/
pnpm preview   # serve the build
pnpm test      # vitest
pnpm coverage  # vitest with a coverage report
pnpm format    # oxfmt
pnpm format:check  # oxfmt, check only
```

`pnpm dev` serves the app at <http://127.0.0.1:3500> and reads `frontend/.env`; copy it from `.env.sample`. `Dockerfile.dev` runs the dev server in a container:

```bash
docker build -f Dockerfile.dev -t fair-frontend-dev .
docker run -p 3500:3500 -v $(pwd):/app fair-frontend-dev
```

Code conventions:

- File names are `kebab-case`.
- Imports use the `@/` alias (`@/components`, `@/hooks`) in place of relative paths.
- Oxfmt formats the source with `.oxfmtrc.json`. Its editor extension for VS Code is `oxc.oxc-vscode`.

## Git hooks

`just setup` in `backend/` installs the pre-commit hooks, which cover the backend and the frontend. If `git config --local --get core.hooksPath` prints `frontend/.husky/_`, clear it first:

```bash
git config --local --unset core.hooksPath
```

## Hot reload

Editing the host `./backend` source live in the containers is opt-in through `docker-compose.hotreload.yml`:

```bash
COMPOSE_FILE=docker-compose.yml:docker-compose.hotreload.yml docker compose up
```

`runserver` autoreloads the API; restart the worker to pick up task changes.

See [Architecture](../architecture/index.md) for how the services fit together.
