# fAIr Development Setup with Docker

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose
- Git
- 4GB+ RAM (8GB+ for GPU training)

## Quick Start

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
./setup.sh
```

GPU profile:

```bash
./setup.sh gpu
```

## Manual Setup

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
make init
make init PROFILE=gpu
```

## Access

- Frontend: <http://localhost:3500>
- API: <http://localhost:8200/api>
- API Docs: <http://localhost:8200/api/swagger>

## Configuration

On first run, `.env.dev` is created from `.env.dev.example`. Update it for:

- OpenStreetMap OAuth (`OSM_CLIENT_ID`, `OSM_CLIENT_SECRET`)
- Email settings
- Frontend URL

Default ports (edit `docker-compose.dev.yml` if needed):

- 3500: Frontend
- 8200: API
- 5434: PostgreSQL
- 6378: Redis

## Common Commands

```bash
make up
make down
make restart
make status
make logs
make logs SERVICE=api
make migrate
make superuser
make collectstatic
make shell
make clean
```

## Troubleshooting

Logs:

```bash
make logs SERVICE=api
make logs SERVICE=frontend
make logs SERVICE=postgres
```

Reset:

```bash
make clean
./setup.sh
```

Ports in use: edit `docker-compose.dev.yml` and change port mappings.

Build cache issues:

```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

## GPU Support

Install NVIDIA Container Toolkit, then:

```bash
./setup.sh gpu
make init PROFILE=gpu
```

## Next Steps

- Create admin user: `make superuser`
- Open frontend: <http://localhost:3500>
- Use API docs: <http://localhost:8200/api/swagger>

## Help

- [docs](../docs)
- <https://github.com/hotosm/fAIr/issues>
