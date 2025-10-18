#!/bin/bash
# fAIr Application Management Script - Production Only

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
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
PROFILE="${PROFILE:-gpu}"  # Default profile (can be 'gpu' or 'cpu')
USER_NAME="${SUDO_USER:-$USER}"
GROUP_NAME="${SUDO_USER:-$USER}"


POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!#$%^&*()_+\-=' | head -c16)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!#$%^&*()_+\-=' | head -c16)}"

# Function to display the header
show_header() {
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${BLUE}              fAIr AI Application               ${NC}"
  echo -e "${BLUE}                Management Tool                 ${NC}"
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${YELLOW}User: $USER_NAME     Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BLUE}Profile: ${GREEN}${PROFILE}${NC}"
  echo -e "${BLUE}=================================================${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Check if running as root or with sudo
check_privileges() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
  fi
}

# Load environment variables from file
load_env() {
  if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Loading environment from $ENV_FILE${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

# Ensure directories exist and have correct permissions
ensure_directories() {
  for dir in "$APP_DIR" "$DATA_DIR" "$RAMP_DIR" "$TRAINING_DIR" "$POSTGRES_DATA_DIR" "$REDIS_DATA_DIR" "$LOG_PATH_DIR"; do
    if [ ! -d "$dir" ]; then
      echo -e "${YELLOW}Creating directory: $dir${NC}"
      mkdir -p "$dir"
    fi
    chown -R $USER_NAME:$GROUP_NAME "$dir"
  done
}

# Setup function
setup() {
  check_privileges
  show_header
  echo -e "${GREEN}Setting up fAIr application...${NC}"
  
  # Check for required commands
  for cmd in docker docker-compose; do
    if ! command_exists $cmd; then
      echo -e "${RED}Error: $cmd is not installed${NC}"
      exit 1
    fi
  done
  
  ensure_directories
  
  # Copy files if provided
  if [ -f "docker-compose.prod.yml" ]; then
    cp docker-compose.prod.yml $COMPOSE_FILE
  else
    echo -e "${YELLOW}Warning: docker-compose.prod.yml not found in current directory.${NC}"
    echo -e "${YELLOW}Please manually copy it to $APP_DIR${NC}"
  fi
  
  # Create env file if it doesn't exist
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating environment file...${NC}"
  cat > "$ENV_FILE" <<EOF
# Auto-generated .env from manage.sh configuration

ENV_FILE=$ENV_FILE

# Database configuration
POSTGRES_DB=ai
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Flower configuration
FLOWER_USER=admin
FLOWER_PASSWORD=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!#$%^&*()_+\-=' | head -c16)

# Application version
TAG=develop

# Mount points
DATA_DIR=$DATA_DIR
RAMP_HOME=$RAMP_DIR
TRAINING_WORKSPACE=$TRAINING_DIR
LOG_PATH=$LOG_PATH_DIR
POSTGRES_DATA=$POSTGRES_DATA_DIR
REDIS_DATA=$REDIS_DATA_DIR


## Application configuration

SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!#$%^&*()_+\-=' | head -c16)


DATABASE_URL=postgis://postgres:$POSTGRES_PASSWORD@postgres:5432/ai

CELERY_BROKER_URL="redis://redis:6379/0"
CELERY_RESULT_BACKEND="redis://redis:6379/0"


OSM_CLIENT_ID=replace_with_your_osm_client_id
OSM_CLIENT_SECRET=replace_with_your_osm_client_secret
OSM_URL=https://www.openstreetmap.org
OSM_SCOPE=read_prefs
OSM_LOGIN_REDIRECT_URI=https://fair-dev.hotosm.org/authenticate/
OSM_SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!#$%^&*()_+\-=' | head -c16)

ALLOWED_ORIGINS="https://fair-dev.hotosm.org/,fair-dev.hotosm.org"
FRONTEND_URL=https://fair-dev.hotosm.org


EMAIL_HOST=your.smtp.server
EMAIL_PORT=587
EMAIL_HOST_USER=your_smptp_user
EMAIL_HOST_PASSWORD=your_smtp_password
DEFAULT_FROM_EMAIL=noreply@youremail.com
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False

EOF
  fi
  
  # Create systemd service
  cat > /etc/systemd/system/$SERVICE_NAME <<EOF
[Unit]
Description=fAIr Application Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
User=$USER_NAME
Group=$GROUP_NAME
ExecStartPre=/bin/mkdir -p \${RAMP_HOME} \${TRAINING_WORKSPACE} \${LOG_PATH} \${POSTGRES_DATA} \${REDIS_DATA}
ExecStartPre=/bin/chown -R $USER_NAME:$GROUP_NAME \${RAMP_HOME} \${TRAINING_WORKSPACE} \${LOG_PATH} \${POSTGRES_DATA} \${REDIS_DATA}
ExecStart=/usr/bin/docker compose -f $COMPOSE_FILE --env-file $ENV_FILE --profile $PROFILE up -d
ExecStop=/usr/bin/docker compose -f $COMPOSE_FILE down
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

  # Reload systemd
  systemctl daemon-reload
  systemctl enable $SERVICE_NAME
  
  echo -e "${GREEN}Setup completed! You can now start the application with:${NC}"
  echo -e "${YELLOW}sudo systemctl start $SERVICE_NAME${NC}"
  echo -e "${GREEN}or${NC}"
  echo -e "${YELLOW}sudo $0 start${NC}"
  
  read -p "Would you like to start the application now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    start
  fi
}

# Start application
start() {
  check_privileges
  show_header
  echo -e "${GREEN}Starting fAIr application...${NC}"
  systemctl start $SERVICE_NAME
  sleep 5
  status
  
  # Initialize application
  echo -e "\n${YELLOW}Initializing application...${NC}"
  initialize_app
}

# Initialize application (migrations and start web server)
initialize_app() {
  echo -e "${YELLOW}Running migrations...${NC}"
  run_migrations
  
  # Check if migrations were successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}Migrations failed. Application may not function correctly.${NC}"
    echo -e "${YELLOW}Check the logs and fix any issues before continuing.${NC}"
    return 1
  fi
  
  # Start the web server in the API container
  echo -e "${YELLOW}Starting web server...${NC}"
  docker exec -d api bash -c "gunicorn fairproject.wsgi:application --bind 0.0.0.0:8000 --workers=4 --timeout=120"
  
  # Mark container as ready for health checks
  docker exec api bash -c "touch /app/ready"
  
  echo -e "${GREEN}Application initialized successfully!${NC}"
}

# Run migrations directly
run_migrations() {
  # Make migrations for all apps
  echo -e "${YELLOW}Making migrations...${NC}"
  docker exec api bash -c "python manage.py makemigrations" || { 
    echo -e "${RED}Failed to make migrations. Container output:${NC}"; 
    docker logs api --tail 50;
    return 1; 
  }
  
  # Make specific app migrations
  echo -e "${YELLOW}Making app-specific migrations...${NC}"
  docker exec api bash -c "python manage.py makemigrations login" || echo -e "${YELLOW}No changes in login app${NC}"
  docker exec api bash -c "python manage.py makemigrations core" || echo -e "${YELLOW}No changes in core app${NC}"
  
  # Apply migrations
  echo -e "${YELLOW}Applying migrations...${NC}"
  docker exec api bash -c "python manage.py migrate" || { 
    echo -e "${RED}Failed to apply migrations. Container output:${NC}"; 
    docker logs api --tail 50;
    return 1; 
  }
  
  return 0
}

# Stop application
stop() {
  check_privileges
  show_header
  echo -e "${YELLOW}Stopping fAIr application...${NC}"
  
  systemctl stop $SERVICE_NAME
}

# Restart application
restart() {
  check_privileges
  show_header
  echo -e "${YELLOW}Restarting fAIr application...${NC}"
  
  # Stop the application
  stop
  
  # Start the application
  start
}

# Check application status
status() {
  show_header
  echo -e "${GREEN}fAIr Application Status:${NC}"
  systemctl status $SERVICE_NAME --no-pager || true
  
  echo -e "\n${GREEN}Container Status:${NC}"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pgsql|redis|api|worker|flower)"
}

# View application logs
logs() {
  show_header
  local service=$1
  
  if [ -z "$service" ]; then
    echo -e "${GREEN}Showing logs for all services (press Ctrl+C to exit):${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=100 -f
  else
    echo -e "${GREEN}Showing logs for $service (press Ctrl+C to exit):${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=100 -f $service
  fi
}

# Switch between CPU and GPU profiles
switch_profile() {
  check_privileges
  show_header
  local new_profile=$1
  if [[ "$new_profile" != "cpu" && "$new_profile" != "gpu" ]]; then
    echo -e "${RED}Invalid profile. Use 'cpu' or 'gpu'${NC}"
    return 1
  fi
  
  echo -e "${YELLOW}Switching to $new_profile profile...${NC}"
  
  # Stop the service
  systemctl stop $SERVICE_NAME
  
  # Update service file
  sed -i "s/--profile [a-z]*/--profile $new_profile/g" /etc/systemd/system/$SERVICE_NAME
  
  # Update global variable
  PROFILE=$new_profile
  
  # Reload systemd and restart
  systemctl daemon-reload
  systemctl start $SERVICE_NAME
  
  echo -e "${GREEN}Switched to $new_profile profile${NC}"
  sleep 5
  status
  
  # Initialize application with new profile
  echo -e "\n${YELLOW}Initializing application with new profile...${NC}"
  initialize_app
}

# Run Django migrations (external command)
migrations() {
  check_privileges
  show_header
  echo -e "${GREEN}Running Django database migrations...${NC}"
  
  # Check if API container is running
  if ! docker ps | grep -q "api"; then
    echo -e "${RED}ERROR: API container is not running. Please start the application first:${NC}"
    echo -e "${YELLOW}$0 start${NC}"
    return 1
  fi
  
  # Run migrations
  run_migrations

  echo -e "${GREEN}Migrations completed successfully!${NC}"
}

# Create a superuser
createsuperuser() {
  check_privileges
  show_header
  echo -e "${GREEN}Creating Django superuser...${NC}"
  
  # Check if API container is running
  if ! docker ps | grep -q "api"; then
    echo -e "${RED}ERROR: API container is not running. Please start the application first:${NC}"
    echo -e "${YELLOW}$0 start${NC}"
    return 1
  fi
  
  # Interactive superuser creation
  docker exec -it api bash -c "python manage.py createsuperuser"
  
  echo -e "${GREEN}Superuser created successfully!${NC}"
}

# Backup application data
backup() {
  check_privileges
  show_header
  local backup_dir="/opt/backups/fAIr-$(date +%Y%m%d-%H%M%S)"
  echo -e "${GREEN}Creating backup in $backup_dir...${NC}"
  
  mkdir -p $backup_dir
  
  # Backup database
  echo -e "${YELLOW}Backing up database...${NC}"
  docker exec pgsql pg_dump -U postgres ai > "$backup_dir/database.sql"
  
  # Backup configuration
  echo -e "${YELLOW}Backing up configuration...${NC}"
  cp $ENV_FILE "$backup_dir/.env.production"
  cp $COMPOSE_FILE "$backup_dir/docker-compose.prod.yml"
  
  # Backup migrations (optional)
  if docker exec api bash -c "ls -la /app/*/migrations/*.py" &>/dev/null; then
    echo -e "${YELLOW}Backing up migrations...${NC}"
    mkdir -p "$backup_dir/migrations"
    docker exec api bash -c "tar -czvf - /app/*/migrations/" > "$backup_dir/migrations.tar.gz"
  fi
  
  # Create a backup info file
  cat > "$backup_dir/backup-info.txt" <<EOF
fAIr AI Application Backup
Date: $(date '+%Y-%m-%d %H:%M:%S')
User: $USER_NAME
Profile: $PROFILE
Version: $(docker inspect --format='{{index .Config.Labels "org.opencontainers.image.version"}}' $(docker ps --filter "name=api" --format "{{.Image}}") 2>/dev/null || echo "unknown")
EOF
  
  echo -e "${GREEN}Backup created in $backup_dir${NC}"
}

# Update application images
update() {
  check_privileges
  show_header
  echo -e "${GREEN}Updating fAIr application images...${NC}"
  
  # Pull latest images
  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE --profile $PROFILE pull
  
  # Restart
  systemctl restart $SERVICE_NAME
  
  echo -e "${GREEN}Update completed.${NC}"
  sleep 3
  status
  
  # Ask about running migrations
  read -p "Do you want to run database migrations after the update? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    migrations
  fi
}

# Show help
show_help() {
  show_header
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
  echo -e "  ${GREEN}switch {cpu|gpu}${NC}- Switch between cpu and gpu profiles"
  echo -e "  ${GREEN}migrations${NC}      - Run Django database migrations"
  echo -e "  ${GREEN}createsuperuser${NC} - Create a Django superuser account"
  echo -e "  ${GREEN}backup${NC}          - Create a backup of the application"
  echo -e "  ${GREEN}update${NC}          - Update the application images"
  echo -e ""
  echo -e "Examples:"
  echo -e "  ${YELLOW}$0 setup${NC}              - Set up the application"
  echo -e "  ${YELLOW}$0 -p cpu start${NC}       - Start with CPU profile"
  echo -e "  ${YELLOW}$0 migrations${NC}         - Run database migrations"
  echo -e "  ${YELLOW}$0 switch gpu${NC}         - Switch to GPU profile"
  echo -e "  ${YELLOW}$0 logs api${NC}           - View logs for backend API"
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

# Load environment variables
load_env

# Process commands
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
  switch)
    switch_profile $2
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