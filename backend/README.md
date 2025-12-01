![example workflow](https://github.com/omranlm/TDB/actions/workflows/backend_build.yml/badge.svg)

## Backend is created with [Django](https://www.djangoproject.com/)

This project was bootstrapped with [Geodjango Template](https://github.com/itskshitiz321/geodjangotemplate.git)

#### For Quickly Getting Started

**Note:** Depending upon your OS and Env installation will vary, This project tightly depends on [Tensorflow](https://www.tensorflow.org/install/pip) with GPU support so accordingly build your development environment

### Install UV

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Sync proj

```bash
uv sync
```

### Make sure you have postgresql installed with postgis extension enabled

#### Configure .env:

    Create .env in the root backend project , and add the credentials as provided on .env_sample , Export your secret key and database url to your env

    Export your database url
    ```
    export DATABASE_URL=postgis://postgres:postgres@localhost:5432/ai
    ```

    You will need more env variables (Such as Ramp home, Training Home) that can be found on ```.sample_env```

#### Now change your username, password and db name in settings.py accordingly to your database

    uv run python manage.py makemigrations login core
    uv run python manage.py migrate
    uv run python manage.py runserver

### Now server will be available in your 8000 port on web, you can check out your localhost:8000/admin for admin panel

To login on admin panel, create your superuser and login with your credentials restarting the server

    python manage.py createsuperuser

## Authentication

fAIr uses oauth2.0 Authentication using [osm-login-python](https://github.com/kshitijrajsharma/osm-login-python)

1. Get your login Url
   Hit `/api/v1/auth/login/ `
   - URL will give you login URL which you can use to provide your osm credentials and authorize fAIr
   - After successful login you will get access-token that you can use across all osm login required endpoints in fAIr
2. Check authentication by getting back your data
   Hit `/api/v1/auth/me/`
   - URL requires access-token as header and in return you will see your osm username, id and image url

## Start Celery Workers

Sync workers environment:

```bash
uv sync --group base-workers
```

Basic worker:

```bash
uv run celery -A fairproject worker --loglevel=INFO -Q ramp_training,yolo_training
```

With auto-reload (development):

```bash
uv run watchmedo auto-restart -d . -p '*.py' --recursive -- celery -A fairproject worker --loglevel=INFO -Q ramp_training,yolo_training
```

## Start Background Tasks

```bash
uv run python manage.py qcluster
```

## Run Tests

```bash
uv run python manage.py test
```

# Docker Development

See [docker-setup.md](../docs/Docker-installation.md) for Docker setup with hot-reload enabled.
