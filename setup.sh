#!/usr/bin/env bash
set -e

echo "Setup"

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "See: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

PROFILE="${1:-cpu}"
if [[ "$PROFILE" != "cpu" && "$PROFILE" != "gpu" ]]; then
    echo "Invalid profile. Use 'cpu' or 'gpu'"
    echo "Usage: ./setup.sh [cpu|gpu]"
    exit 1
fi

echo "Profile: $PROFILE"

if [ ! -f .env.dev ]; then
    echo "Creating .env.dev"
    cp .env.dev.example .env.dev
    echo "Created .env.dev. Update it with your OSM credentials."
fi

echo "Creating data directories"
mkdir -p fair-app-data/{log,ramp,trainings,postgres,redis}
echo "Data directories created"

echo "Building images"
docker compose -f docker-compose.dev.yml build api frontend predictor
docker compose -f docker-compose.dev.yml --profile "$PROFILE" build
echo "Images built"

echo "Stopping containers"
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

echo "Starting PostgreSQL and Redis"
docker compose -f docker-compose.dev.yml up -d postgres redis
echo "Waiting for database"
sleep 10
echo "Database and Redis are ready"

echo "Running migrations"
docker compose -f docker-compose.dev.yml run --rm api python manage.py migrate
echo "Migrations completed"

echo "Collecting static files"
docker compose -f docker-compose.dev.yml run --rm api python manage.py collectstatic --noinput
echo "Static files collected"

echo "Starting services"
docker compose -f docker-compose.dev.yml --profile "$PROFILE" up -d

echo "Done"
echo "Access"
echo "  Frontend: http://localhost:3500"
echo "  API:      http://localhost:8200/api"
echo "  API Docs: http://localhost:8200/api/swagger"
echo "Logs"
echo "  make logs"
echo "  make logs SERVICE=api"
echo "Other commands"
echo "  make down"
echo "  make restart"
echo "  make superuser"
echo "  make shell"
echo "  make clean"
echo "Tip: Edit .env.dev for OSM credentials and settings"