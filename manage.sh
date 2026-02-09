#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="${APP_DIR:-/opt/fAIr-app}"
DATA_DIR="${DATA_DIR:-/opt/fAIr-app/data}"
RAMP_DIR="${RAMP_HOME:-/opt/fAIr-app/data/ramp}"
TRAINING_DIR="${TRAINING_WORKSPACE:-/opt/fAIr-app/data/trainings}"
POSTGRES_DATA_DIR="${POSTGRES_DATA:-/opt/fAIr-app/data/postgres}"
REDIS_DATA_DIR="${REDIS_DATA:-/opt/fAIr-app/data/redis}"
LOG_PATH_DIR="${LOG_PATH:-/opt/fAIr-app/data/logs}"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
SERVICE_NAME="fAIr-app.service"
PROFILE="${PROFILE:-gpu}"
USER_NAME="${SUDO_USER:-$USER}"
GROUP_NAME="${SUDO_USER:-$USER}"

command_exists() {
  command -v "$1" &> /dev/null
}

check_privileges() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
  fi
}

load_env() {
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

ensure_directories() {
  for dir in "$APP_DIR" "$DATA_DIR" "$RAMP_DIR" "$TRAINING_DIR" "$POSTGRES_DATA_DIR" "$REDIS_DATA_DIR" "$LOG_PATH_DIR"; do
    if [ ! -d "$dir" ]; then
      mkdir -p "$dir"
    fi
    chown -R $USER_NAME:$GROUP_NAME "$dir"
  done
}

setup() {
  echo -e "${GREEN}Setting up fAIr application...${NC}"
  
  for cmd in docker docker-compose; do
      echo -e "${RED}$cmd is not installed${NC}"
      echo -e "${RED}Error: $cmd is not installed${NC}"
      exit 1
    fi
  done
  
  ensure_directories
  if [ -f "docker-compose.prod.yml" ]; then
    cp docker-compose.prod.yml $COMPOSE_FILE
  fi

start() {
  check_privileges
  systemctl start $SERVICE_NAME
  sleep 5
  status
  
  initialize_app
}

initialize_app() {
  run_migrations
  
  if [ $? -ne 0 ]; then
    return 1
  fi
  
  docker exec -d api bash -c "gunicorn fairproject.wsgi:application --bind 0.0.0.0:8000 --workers=4 --timeout=120"
  
  docker exec api bash -c "touch /app/ready"
}

run_migrations() {
  docker exec api bash -c "python manage.py makemigrations" || { 
    docker logs api --tail 50;
    return 1; 
  }
  
  docker exec api bash -c "python manage.py makemigrations login" || echo -e "${YELLOW}No changes in login app${NC}"
  docker exec api bash -c "python manage.py makemigrations core" || echo -e "${YELLOW}No changes in core app${NC}"
  
  docker exec api bash -c "python manage.py migrate" || { 
    docker logs api --tail 50;
    return 1; 
  }
  
  return 0
}

stop() {
  check_privileges
  
  systemctl stop $SERVICE_NAME
}

restart() {
  check_privileges
  
  stop
  
  start
}

status() {
  systemctl status $SERVICE_NAME --no-pager || true
  
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pgsql|redis|api|worker|flower)"
}

logs() {
  local service=$1
  
  if [ -z "$service" ]; then
    docker compose -f $COMPOSE_FILE logs --tail=100 -f
  else
    docker compose -f $COMPOSE_FILE logs --tail=100 -f $service
  fi
}

services() {
  docker compose -f $COMPOSE_FILE config --services
}

migrations() {
  check_privileges
  
  if ! docker ps | grep -q "api"; then
    return 1
  fi
  
  run_migrations
}

createsuperuser() {
  check_privileges
  
  if ! docker ps | grep -q "api"; then
    return 1
  fi
  
  docker exec -it api bash -c "python manage.py createsuperuser"
}

backup() {
  check_privileges
  local backup_dir="/opt/backups/fAIr-$(date +%Y%m%d-%H%M%S)"
  
  mkdir -p $backup_dir
  
  docker exec pgsql pg_dump -U postgres ai > "$backup_dir/database.sql"
  
  cp $ENV_FILE "$backup_dir/.env.production"
  cp $COMPOSE_FILE "$backup_dir/docker-compose.prod.yml"
  
  if docker exec api bash -c "ls -la /app/*/migrations/*.py" &>/dev/null; then
    mkdir -p "$backup_dir/migrations"
    docker exec api bash -c "tar -czvf - /app/*/migrations/" > "$backup_dir/migrations.tar.gz"
  fi
  
  cat > "$backup_dir/backup-info.txt" <<EOF
fAIr AI Application Backup
Date: $(date '+%Y-%m-%d %H:%M:%S')
User: $USER_NAME
Profile: $PROFILE
Version: $(docker inspect --format='{{index .Config.Labels "org.opencontainers.image.version"}}' $(docker ps --filter "name=api" --format "{{.Image}}") 2>/dev/null || echo "unknown")
EOF
  
}

update() {
  check_privileges
  
  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE --profile $PROFILE pull
  
  systemctl restart $SERVICE_NAME
  
  sleep 3
  status
  
  read -p "Do you want to run database migrations after the update? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    migrations
  fi
}

show_help() {
  echo -e "Usage: $0 [options] command"
  echo -e ""
  echo -e "Options:"
  echo -e "  ${BLUE}-p, --profile${NC}     - Set profile (cpu|gpu), default: gpu"
  echo -e "  ${BLUE}-d, --dir${NC}         - Set base directory, default: /opt/fAIr-app"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}setup${NC}           - Set up the application"
  echo -e "  ${GREEN}start${NC}           - Start the application"
  echo -e "  ${GREEN}stop${NC}            - Stop the application"
  echo -e "  ${GREEN}restart${NC}         - Restart the application"
  echo -e "  ${GREEN}status${NC}          - Check application status"
  echo -e "  ${GREEN}logs [service]${NC}  - View application logs (optionally specify a service name)"
  echo -e "  ${GREEN}services${NC}        - List available services"
  echo -e "  ${GREEN}migrations${NC}      - Run Django database migrations"
  echo -e "  ${GREEN}createsuperuser${NC} - Create a Django superuser account"
  echo -e "  ${GREEN}backup${NC}          - Create a backup of the application"
  echo -e "  ${GREEN}update${NC}          - Update the application images"
  echo -e ""
  echo -e "Examples:"
  echo -e "  ${YELLOW}$0 setup${NC}              - Set up the application"
  echo -e "  ${YELLOW}$0 -p cpu start${NC}       - Start with CPU profile"
  echo -e "  ${YELLOW}$0 migrations${NC}         - Run database migrations"
  echo -e "  ${YELLOW}$0 services${NC}           - List available services"
  echo -e "  ${YELLOW}$0 logs api${NC}           - View logs for backend API"
}

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
      DATA_DIR="$APP_DIR/data"
      ENV_FILE="$APP_DIR/.env.production"
      COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
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
  services)
    services
    ;;
  migrations)
    migrations
    ;;
  createsuperuser)
    createsuperuser
    ;;
  backup)
    backup
    ;;
  update)
    update
    ;;
  *)
    show_help
    exit 0
    ;;
esac

exit 0