#!/bin/bash
# fAIr Application Management Script - Development Only

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(pwd)"
DATA_DIR="${DATA_DIR:-$(pwd)/fair-app-data}"
RAMP_DIR="${RAMP_HOME:-$(pwd)/fair-app-data/ramp}"
TRAINING_DIR="${TRAINING_WORKSPACE:-$(pwd)/fair-app-data/trainings}"
POSTGRES_DATA_DIR="${POSTGRES_DATA:-$(pwd)/fair-app-data/postgres}"
REDIS_DATA_DIR="${REDIS_DATA:-$(pwd)/fair-app-data/redis}"
LOG_PATH_DIR="${LOG_PATH:-$(pwd)/fair-app-data/logs}"
ENV_FILE="$(pwd)/.env.dev"
COMPOSE_FILE="$(pwd)/docker-compose.dev.yml"
PROFILE="${PROFILE:-cpu}"  # Default profile (can be 'gpu' or 'cpu')
USER_NAME="${USER}"

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-dev_pg_pass}"


# Header
show_header() {
  echo -e "${BLUE}==============================================${NC}"
  echo -e "${BLUE}         fAIr AI Application (DEV)            ${NC}"
  echo -e "${BLUE}             Management Tool                  ${NC}"
  echo -e "${BLUE}==============================================${NC}"
  echo -e "${YELLOW}User: $USER_NAME     Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BLUE}Profile: ${GREEN}${PROFILE}${NC}"
  echo -e "${BLUE}==============================================${NC}"
}

# Command exists check
command_exists() {
  command -v "$1" &> /dev/null
}

# Ensure directories exist
ensure_directories() {
  for dir in "$APP_DIR" "$DATA_DIR" "$RAMP_DIR" "$TRAINING_DIR" "$POSTGRES_DATA_DIR" "$REDIS_DATA_DIR" "$LOG_PATH_DIR"; do
    [ -d "$dir" ] || mkdir -p "$dir"
  done
}

# Load environment variables from file
load_env() {
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

# Setup function
setup() {
  show_header
  echo -e "${GREEN}Setting up fAIr development environment...${NC}"

  for cmd in docker docker-compose; do
    if ! command_exists $cmd; then
      echo -e "${RED}Error: $cmd is not installed${NC}"
      exit 1
    fi
  done

  ensure_directories

  if [ -f "docker-compose.dev.yml" ]; then
    cp docker-compose.dev.yml $COMPOSE_FILE
  elif [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}docker-compose.dev.yml not found. Please provide a dev compose file.${NC}"
    exit 1
  fi

  # Create env file if it doesn't exist
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating development environment file...${NC}"
    cat > "$ENV_FILE" <<EOF
# Auto-generated .env.dev from manage-dev.sh

ENV_FILE=$ENV_FILE

DEBUG=True

# Database configuration
POSTGRES_DB=ai
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379

TAG=develop

# Mount points
DATA_DIR=$DATA_DIR
RAMP_HOME=$RAMP_DIR
TRAINING_WORKSPACE=$TRAINING_DIR
LOG_PATH=$LOG_PATH_DIR
POSTGRES_DATA=$POSTGRES_DATA_DIR
REDIS_DATA=$REDIS_DATA_DIR

# Application configuration
SECRET_KEY=dev_secret_key
DATABASE_URL=postgis://postgres:$POSTGRES_PASSWORD@postgres:5432/ai
CELERY_BROKER_URL="redis://redis:6379/0"
CELERY_RESULT_BACKEND="redis://redis:6379/0"

OSM_CLIENT_ID=dev_osm_client_id
OSM_CLIENT_SECRET=dev_osm_client_secret
OSM_URL=https://www.openstreetmap.org
OSM_SCOPE=read_prefs
OSM_LOGIN_REDIRECT_URI=http://localhost:8000/authenticate/
OSM_SECRET_KEY=dev_osm_secret_key

ALLOWED_ORIGINS="http://localhost:3000/,localhost:3000"
FRONTEND_URL=http://localhost:3000

EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@localhost
EMAIL_USE_TLS=False
EMAIL_USE_SSL=False
EOF
  fi

  echo -e "${GREEN}Setup completed! You can now start the application with:${NC}"
  echo -e "${YELLOW}./manage-dev.sh start${NC}"
}

# Start application
start() {
  show_header
  echo -e "${GREEN}Starting fAIr development application...${NC}"
  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE --profile $PROFILE up -d
  sleep 3
  wait_for_api_healthy_with_logs
  status
  echo -e "${YELLOW}Initializing application (migrations, web server)...${NC}"
  initialize_app
}

# Stop application
stop() {
  show_header
  echo -e "${YELLOW}Stopping fAIr development application...${NC}"
  docker compose -f $COMPOSE_FILE down
}

# Restart application
restart() {
  show_header
  echo -e "${YELLOW}Restarting fAIr development application...${NC}"
  stop
  start
}

# Status
status() {
  show_header
  echo -e "${GREEN}Container Status:${NC}"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pgsql|redis|api|worker|flower|frontend|dev|db)" || true
}

# Logs
logs() {
  show_header
  local service=$1
  if [ -z "$service" ]; then
    echo -e "${GREEN}Showing logs for all services (Ctrl+C to exit):${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=100 -f
  else
    echo -e "${GREEN}Showing logs for $service (Ctrl+C to exit):${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=100 -f $service
  fi
}

wait_for_api_healthy_with_logs() {
  echo -e "${YELLOW}Waiting for backend-api to be healthy... Showing logs below (Ctrl+C to stop viewing logs)${NC}"

  # Start logs in background, save PID
  docker compose -f $COMPOSE_FILE logs -f api &
  LOGS_PID=$!

  local retries=60
  while [[ $retries -gt 0 ]]; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' api 2>/dev/null)
    if [[ "$health_status" == "healthy" ]]; then
      echo -e "${GREEN}backend-api is healthy!${NC}"
      kill $LOGS_PID 2>/dev/null
      wait $LOGS_PID 2>/dev/null
      return 0
    fi
    sleep 2
    retries=$((retries-1))
  done

  echo -e "${RED}backend-api did not become healthy in time.${NC}"
  kill $LOGS_PID 2>/dev/null
  wait $LOGS_PID 2>/dev/null
  docker logs api
  exit 1
}

# Initialize application
initialize_app() {
  echo -e "${YELLOW}Running migrations...${NC}"
  run_migrations
  if [ $? -ne 0 ]; then
    echo -e "${RED}Migrations failed. Application may not function correctly.${NC}"
    return 1
  fi
  echo -e "${YELLOW}Starting dev server in API container...${NC}"
  docker exec -d api bash -c "python manage.py runserver 0.0.0.0:8000"
  echo -e "${GREEN}Application initialized successfully!${NC}"
}

# Run migrations
run_migrations() {
  docker exec api bash -c "python manage.py makemigrations" || echo -e "${YELLOW}makemigrations failed (possibly no changes)${NC}"
  docker exec api bash -c "python manage.py makemigrations core login" || echo -e "${YELLOW}makemigrations failed (possibly no changes)${NC}"
  docker exec api bash -c "python manage.py migrate" || {
    echo -e "${RED}Migration failed!${NC}"
    docker logs api --tail 50
    return 1
  }
  return 0
}

# Run migrations directly
migrations() {
  show_header
  if ! docker ps | grep -q "api"; then
    echo -e "${RED}API container is not running. Please start the application first.${NC}"
    return 1
  fi
  run_migrations
  echo -e "${GREEN}Migrations completed.${NC}"
}

# Create superuser
createsuperuser() {
  show_header
  if ! docker ps | grep -q "api"; then
    echo -e "${RED}API container is not running. Please start the application first.${NC}"
    return 1
  fi
  docker exec -it api bash -c "python manage.py createsuperuser"
}

# Help
show_help() {
  show_header
  echo -e "Usage: $0 [options] command"
  echo -e ""
  echo -e "Options:"
  echo -e "  ${BLUE}-p, --profile${NC}   - Set profile (cpu|gpu), default: gpu"
  echo -e "  ${BLUE}-d, --dir${NC}       - Set base directory (defaults to current directory)"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}setup${NC}           - Set up the development environment"
  echo -e "  ${GREEN}start${NC}           - Start the app stack"
  echo -e "  ${GREEN}stop${NC}            - Stop the app stack"
  echo -e "  ${GREEN}restart${NC}         - Restart the app stack"
  echo -e "  ${GREEN}status${NC}          - Show container status"
  echo -e "  ${GREEN}logs [service]${NC}  - View logs, optionally for a service"
  echo -e "  ${GREEN}migrations${NC}      - Run Django database migrations"
  echo -e "  ${GREEN}createsuperuser${NC} - Create a Django superuser account"
  echo -e ""
  echo -e "Examples:"
  echo -e "  ${YELLOW}$0 setup${NC}                - Set up"
  echo -e "  ${YELLOW}$0 -p cpu start${NC}         - Start with CPU profile"
  echo -e "  ${YELLOW}$0 migrations${NC}           - Run migrations"
  echo -e "  ${YELLOW}$0 logs api${NC}             - Show backend API logs"
}

# Parse options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -p|--profile)
      PROFILE="$2"
      if [[ "$PROFILE" != "cpu" && "$PROFILE" != "gpu" ]]; then
        echo -e "${RED}Invalid profile. Use 'cpu' or 'gpu'${NC}"
        exit 1
      fi
      shift 2
      ;;
    -d|--dir)
      APP_DIR="$2"
      DATA_DIR="$APP_DIR/fair-app-data"
      ENV_FILE="$APP_DIR/.env.dev"
      COMPOSE_FILE="$APP_DIR/docker-compose.dev.yml"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

load_env

case "$1" in
  setup)
    setup
    ;;
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    restart
    ;;
  status)
    status
    ;;
  logs)
    logs $2
    ;;
  migrations)
    migrations
    ;;
  createsuperuser)
    createsuperuser
    ;;
  *)
    show_help
    exit 0
    ;;
esac

exit 0