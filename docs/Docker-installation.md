# fAIr Development Setup with docker

## Prerequisites

- Docker & Docker Compose
- Make

## Quick Start

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
make init
```

First run creates `.env.dev`. Edit it with your OSM credentials, then run `make init` again.

**GPU workers:**

```bash
make init PROFILE=gpu
```

## Access

- Frontend: http://localhost:3500
- API: http://localhost:8200
- Docs: http://localhost:8200/api/docs

## Commands

```bash
make init              # Complete setup
make build             # Build images
make up                # Start services
make down              # Stop services
make logs              # View logs
make logs SERVICE=api  # Specific service
make migrate           # Run migrations
make superuser         # Create admin user
make shell             # API container shell
make clean             # Remove all
```

## Configuration

Edit `.env.dev`:

- OSM credentials: [Get here](https://www.openstreetmap.org/oauth2/applications)

## Hot Reload

All code changes auto-reload (Django, Vite, Celery watchdog).

## Troubleshooting

**Reset database:**

```bash
make clean
make init
```

**Check status:**

```bash
make status
```
