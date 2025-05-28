#!/bin/bash
# fAIr Application Management Script
# Last updated: 2025-05-28 08:44:39 UTC
# Maintained by: kshitijrajsharma

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - These can be overridden by .env files
APP_DIR="${APP_DIR:-/opt/fair-app}"
DATA_DIR="${DATA_DIR:-$APP_DIR/data}"
RAMP_DIR="${RAMP_HOME:-$DATA_DIR/ramp}"
TRAINING_DIR="${TRAINING_WORKSPACE:-$DATA_DIR/trainings}"
POSTGRES_DATA_DIR="${POSTGRES_DATA:-$DATA_DIR/postgres}"
REDIS_DATA_DIR="${REDIS_DATA:-$DATA_DIR/redis}"
APP_LOGS_DIR="${APP_LOGS:-$DATA_DIR/logs}"

ENV_PROD="$APP_DIR/.env.prod"
ENV_DEV="$APP_DIR/.env.dev"
COMPOSE_PROD="$APP_DIR/docker-compose.prod.yml"
COMPOSE_DEV="$APP_DIR/docker-compose.dev.yml"
SERVICE_NAME="fair-app.service"
PROFILE="cpu"  # Default profile (can be 'gpu' or 'cpu')
USER_NAME="${SUDO_USER:-$USER}"
GROUP_NAME="${SUDO_USER:-$USER}"
ENVIRONMENT="production"  # Default environment

# Function to display the header
show_header() {
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${BLUE}              FAIR AI Application               ${NC}"
  echo -e "${BLUE}                Management Tool                 ${NC}"
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${YELLOW}User: $USER_NAME     Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BLUE}Mode: ${GREEN}${ENVIRONMENT}${BLUE}    Profile: ${GREEN}${PROFILE}${NC}"
  echo -e "${BLUE}=================================================${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Check if running as root or with sudo for certain commands
check_privileges() {
  if [[ "$ENVIRONMENT" == "production" && "$EUID" -ne 0 ]]; then
    echo -e "${RED}Production mode requires root privileges. Please run as root or with sudo${NC}"
    exit 1
  fi
}

# Load environment variables from file
load_env() {
  local env_file="$ENV_PROD"
  if [[ "$ENVIRONMENT" == "development" ]]; then
    env_file="$ENV_DEV"
  fi
  
  if [ -f "$env_file" ]; then
    echo -e "${YELLOW}Loading environment from $env_file${NC}"
    export $(grep -v '^#' "$env_file" | xargs)
  fi
}

# Get appropriate compose file
get_compose_file() {
  if [[ "$ENVIRONMENT" == "development" ]]; then
    echo "$COMPOSE_DEV"
  else
    echo "$COMPOSE_PROD"
  fi
}

# Ensure directories exist and have correct permissions
ensure_directories() {
  # In dev mode, mostly just ensure base directory
  if [[ "$ENVIRONMENT" == "development" ]]; then
    if [ ! -d "$APP_DIR" ]; then
      echo -e "${YELLOW}Creating directory: $APP_DIR${NC}"
      mkdir -p "$APP_DIR"
    fi
    return 0
  fi
  
  # In production mode, create all directories with proper permissions
  for dir in "$APP_DIR" "$DATA_DIR" "$RAMP_DIR" "$TRAINING_DIR" "$POSTGRES_DATA_DIR" "$REDIS_DATA_DIR" "$APP_LOGS_DIR"; do
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
  echo -e "${GREEN}Setting up FAIR application in $ENVIRONMENT mode...${NC}"
  
  # Check for required commands
  for cmd in docker docker-compose; do
    if ! command_exists $cmd; then
      echo -e "${RED}Error: $cmd is not installed${NC}"
      exit 1
    fi
  done
  
  ensure_directories
  
  # Handle different environment setups
  if [[ "$ENVIRONMENT" == "development" ]]; then
    setup_development
  else
    setup_production
  fi
}

# Setup development environment
setup_development() {
  # Copy files if provided
  if [ -f "docker-compose.dev.yml" ]; then
    cp docker-compose.dev.yml $COMPOSE_DEV
  else
    echo -e "${YELLOW}Warning: docker-compose.dev.yml not found in current directory.${NC}"
    echo -e "${YELLOW}Please manually copy it to $APP_DIR${NC}"
  fi
  
  # Create env file if it doesn't exist
  if [ ! -f "$ENV_DEV" ]; then
    echo -e "${YELLOW}Creating development environment file...${NC}"
    cat > $ENV_DEV <<EOF
# Database configuration
POSTGRES_DB=ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin

# Redis configuration 
REDIS_PASSWORD=
REDIS_USER=redis

# Application paths
DATA_DIR=./fair-app/data
RAMP_HOME=\${DATA_DIR}/ramp
TRAINING_WORKSPACE=\${DATA_DIR}/trainings
APP_LOGS=\${DATA_DIR}/logs
POSTGRES_DATA=\${DATA_DIR}/postgres
REDIS_DATA=\${DATA_DIR}/redis
EOF
  fi
  
  echo -e "${GREEN}Development setup completed! You can now start the application with:${NC}"
  echo -e "${YELLOW}$0 -e dev start${NC}"
  
  read -p "Would you like to start the application now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    start
    
    echo -e "\n${YELLOW}Running initial database migrations...${NC}"
    migrations
  fi
}

# Setup production environment
setup_production() {
  # Copy files if provided
  if [ -f "docker-compose.prod.yml" ]; then
    cp docker-compose.prod.yml $COMPOSE_PROD
  else
    echo -e "${YELLOW}Warning: docker-compose.prod.yml not found in current directory.${NC}"
    echo -e "${YELLOW}Please manually copy it to $APP_DIR${NC}"
  fi
  
  # Create env file if it doesn't exist
  if [ ! -f "$ENV_PROD" ]; then
    echo -e "${YELLOW}Creating production environment file...${NC}"
    cat > $ENV_PROD <<EOF
# Database configuration
POSTGRES_DB=ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Redis configuration
REDIS_PASSWORD=$(openssl rand -base64 16)
REDIS_USER=redis

# Flower configuration
FLOWER_USER=admin
FLOWER_PASSWORD=$(openssl rand -base64 12)

# Application version
TAG=latest

# Application paths
DATA_DIR=/opt/fair-app/data
RAMP_HOME=\${DATA_DIR}/ramp
TRAINING_WORKSPACE=\${DATA_DIR}/trainings
APP_LOGS=\${DATA_DIR}/logs
POSTGRES_DATA=\${DATA_DIR}/postgres
REDIS_DATA=\${DATA_DIR}/redis
EOF
  fi
  
  # Create systemd service
  cat > /etc/systemd/system/$SERVICE_NAME <<EOF
[Unit]
Description=FAIR Application Stack
Documentation=https://github.com/hotosm/fair-ai
After=docker.service
Requires=docker.service
 
[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_PROD

# User and Group that will run the service
User=$USER_NAME
Group=$GROUP_NAME

# Ensure directories exist
ExecStartPre=/bin/mkdir -p \${RAMP_HOME} \${TRAINING_WORKSPACE} \${APP_LOGS} \${POSTGRES_DATA} \${REDIS_DATA}
ExecStartPre=/bin/chown -R $USER_NAME:$GROUP_NAME \${RAMP_HOME} \${TRAINING_WORKSPACE} \${APP_LOGS} \${POSTGRES_DATA} \${REDIS_DATA}

# Start using GPU or CPU profile as needed
ExecStart=/usr/bin/docker compose -f $COMPOSE_PROD --profile $PROFILE up -d
ExecStop=/usr/bin/docker compose -f $COMPOSE_PROD down

# Restart policy
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

  # Reload systemd
  systemctl daemon-reload
  systemctl enable $SERVICE_NAME
  
  echo -e "${GREEN}Production setup completed! You can now start the application with:${NC}"
  echo -e "${YELLOW}sudo systemctl start $SERVICE_NAME${NC}"
  echo -e "${GREEN}or${NC}"
  echo -e "${YELLOW}sudo $0 start${NC}"
  
  read -p "Would you like to start the application now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    start
    
    echo -e "\n${YELLOW}Running initial database migrations...${NC}"
    migrations
  fi
}

# Start application
start() {
  show_header
  local compose_file=$(get_compose_file)
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    check_privileges
    echo -e "${GREEN}Starting FAIR application in production mode...${NC}"
    systemctl start $SERVICE_NAME
    sleep 5
    status
  else
    echo -e "${GREEN}Starting FAIR application in development mode...${NC}"
    docker compose -f $compose_file --profile $PROFILE up -d
    status
  fi
}

# Stop application
stop() {
  show_header
  local compose_file=$(get_compose_file)
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    check_privileges
    echo -e "${YELLOW}Stopping FAIR application in production mode...${NC}"
    systemctl stop $SERVICE_NAME
  else
    echo -e "${YELLOW}Stopping FAIR application in development mode...${NC}"
    docker compose -f $compose_file down
  fi
}

# Restart application
restart() {
  show_header
  local compose_file=$(get_compose_file)
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    check_privileges
    echo -e "${YELLOW}Restarting FAIR application in production mode...${NC}"
    systemctl restart $SERVICE_NAME
    sleep 5
    status
  else
    echo -e "${YELLOW}Restarting FAIR application in development mode...${NC}"
    docker compose -f $compose_file down
    docker compose -f $compose_file --profile $PROFILE up -d
    status
  fi
}

# Check application status
status() {
  show_header
  local compose_file=$(get_compose_file)
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${GREEN}FAIR Application Status (Production):${NC}"
    systemctl status $SERVICE_NAME --no-pager || true
  else
    echo -e "${GREEN}FAIR Application Status (Development):${NC}"
  fi
  
  echo -e "\n${GREEN}Container Status:${NC}"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pgsql|redis|api|worker|flower)"
}

# View application logs
logs() {
  show_header
  local compose_file=$(get_compose_file)
  local service=$1
  
  if [ -z "$service" ]; then
    echo -e "${GREEN}Showing logs for all services (press Ctrl+C to exit):${NC}"
    docker compose -f $compose_file logs --tail=100 -f
  else
    echo -e "${GREEN}Showing logs for $service (press Ctrl+C to exit):${NC}"
    docker compose -f $compose_file logs --tail=100 -f $service
  fi
}

# Switch between CPU and GPU profiles
switch_profile() {
  show_header
  local new_profile=$1
  if [[ "$new_profile" != "cpu" && "$new_profile" != "gpu" ]]; then
    echo -e "${RED}Invalid profile. Use 'cpu' or 'gpu'${NC}"
    return 1
  fi
  
  echo -e "${YELLOW}Switching to $new_profile profile...${NC}"
  local compose_file=$(get_compose_file)
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    check_privileges
    # Stop the service
    systemctl stop $SERVICE_NAME
    
    # Update service file
    sed -i "s/--profile [a-z]*/--profile $new_profile/g" /etc/systemd/system/$SERVICE_NAME
    
    # Reload systemd and restart
    systemctl daemon-reload
    systemctl start $SERVICE_NAME
  else
    # For development, just restart with the new profile
    docker compose -f $compose_file down
    PROFILE=$new_profile
    docker compose -f $compose_file --profile $new_profile up -d
  fi
  
  echo -e "${GREEN}Switched to $new_profile profile${NC}"
  sleep 3
  status
}

# Run Django migrations
migrations() {
  show_header
  echo -e "${GREEN}Running Django database migrations...${NC}"
  
  # Wait for API container to be ready
  echo -e "${YELLOW}Waiting for API container to be ready...${NC}"
  local max_attempts=30
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if docker ps | grep -q "api" && docker exec api bash -c "python -c 'import sys; sys.exit(0)'" >/dev/null 2>&1; then
      break
    fi
    echo -n "."
    attempt=$((attempt+1))
    sleep 2
  done
  
  if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}API container not ready after $max_attempts attempts. Please check for errors.${NC}"
    return 1
  fi
  
  echo -e "\n${GREEN}Running migrations...${NC}"
  
  # Make migrations for all apps
  echo -e "${YELLOW}Making migrations...${NC}"
  docker exec api bash -c "python manage.py makemigrations" || { echo -e "${RED}Failed to make migrations${NC}"; return 1; }
  
  # Make specific app migrations
  echo -e "${YELLOW}Making app-specific migrations...${NC}"
  docker exec api bash -c "python manage.py makemigrations login" || echo -e "${YELLOW}No changes in login app${NC}"
  docker exec api bash -c "python manage.py makemigrations core" || echo -e "${YELLOW}No changes in core app${NC}"
  
  # Apply migrations
  echo -e "${YELLOW}Applying migrations...${NC}"
  docker exec api bash -c "python manage.py migrate" || { echo -e "${RED}Failed to apply migrations${NC}"; return 1; }
  
  echo -e "${GREEN}Migrations completed successfully!${NC}"
}

# Create a superuser
createsuperuser() {
  show_header
  echo -e "${GREEN}Creating Django superuser...${NC}"
  
  # Interactive superuser creation
  docker exec -it api bash -c "python manage.py createsuperuser"
  
  echo -e "${GREEN}Superuser created successfully!${NC}"
}

# Backup application data
backup() {
  check_privileges
  show_header
  local backup_dir="/opt/backups/fair-$(date +%Y%m%d-%H%M%S)"
  echo -e "${GREEN}Creating backup in $backup_dir...${NC}"
  
  mkdir -p $backup_dir
  
  # Backup database
  echo -e "${YELLOW}Backing up database...${NC}"
  docker exec pgsql pg_dump -U postgres ai > "$backup_dir/database.sql"
  
  # Backup configuration
  echo -e "${YELLOW}Backing up configuration...${NC}"
  cp $ENV_PROD "$backup_dir/.env.prod"
  if [ -f "$ENV_DEV" ]; then
    cp $ENV_DEV "$backup_dir/.env.dev"
  fi
  cp $COMPOSE_PROD "$backup_dir/docker-compose.prod.yml"
  if [ -f "$COMPOSE_DEV" ]; then
    cp $COMPOSE_DEV "$backup_dir/docker-compose.dev.yml"
  fi
  
  # Backup migrations (optional)
  if docker exec api bash -c "ls -la /app/*/migrations/*.py" &>/dev/null; then
    echo -e "${YELLOW}Backing up migrations...${NC}"
    mkdir -p "$backup_dir/migrations"
    docker exec api bash -c "tar -czvf - /app/*/migrations/" > "$backup_dir/migrations.tar.gz"
  fi
  
  # Create a backup info file
  cat > "$backup_dir/backup-info.txt" <<EOF
FAIR AI Application Backup
Date: $(date '+%Y-%m-%d %H:%M:%S')
User: $USER_NAME
Environment: $ENVIRONMENT
Profile: $PROFILE
Version: $(docker inspect --format='{{index .Config.Labels "org.opencontainers.image.version"}}' $(docker ps --filter "name=api" --format "{{.Image}}") 2>/dev/null || echo "unknown")
EOF
  
  echo -e "${GREEN}Backup created in $backup_dir${NC}"
}

# Update application images
update() {
  show_header
  local compose_file=$(get_compose_file)
  echo -e "${GREEN}Updating FAIR application images...${NC}"
  
  # Pull latest images
  docker compose -f $compose_file pull
  
  # Restart
  if [[ "$ENVIRONMENT" == "production" ]]; then
    check_privileges
    systemctl restart $SERVICE_NAME
  else
    docker compose -f $compose_file down
    docker compose -f $compose_file --profile $PROFILE up -d
  fi
  
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
  echo -e "Usage: $0 [options] command [args]"
  echo -e ""
  echo -e "Options:"
  echo -e "  ${BLUE}-e, --environment${NC} - Set environment (dev|prod), default: production"
  echo -e "  ${BLUE}-p, --profile${NC}     - Set profile (cpu|gpu), default: gpu"
  echo -e "  ${BLUE}-d, --dir${NC}         - Set base directory, default: /opt/fair-app"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}setup${NC}           - Set up the application"
  echo -e "  ${GREEN}start${NC}           - Start the application"
  echo -e "  ${GREEN}stop${NC}            - Stop the application"
  echo -e "  ${GREEN}restart${NC}         - Restart the application"
  echo -e "  ${GREEN}status${NC}          - Check application status"
  echo -e "  ${GREEN}logs${NC}            - View application logs (optionally specify a service name)"
  echo -e "  ${GREEN}switch${NC}          - Switch between cpu and gpu profiles"
  echo -e "  ${GREEN}migrations${NC}      - Run Django database migrations"
  echo -e "  ${GREEN}createsuperuser${NC} - Create a Django superuser account"
  echo -e "  ${GREEN}backup${NC}          - Create a backup of the application"
  echo -e "  ${GREEN}update${NC}          - Update the application images"
  echo -e ""
  echo -e "Examples:"
  echo -e "  ${YELLOW}$0 setup${NC}                   - Set up production environment"
  echo -e "  ${YELLOW}$0 -e dev setup${NC}            - Set up development environment"
  echo -e "  ${YELLOW}$0 -e dev -p cpu start${NC}     - Start development with CPU profile"
  echo -e "  ${YELLOW}$0 migrations${NC}              - Run database migrations"
  echo -e "  ${YELLOW}$0 switch gpu${NC}              - Switch to GPU profile"
  echo -e "  ${YELLOW}$0 logs backend-api${NC}        - View logs for backend API"
}

# Parse options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "prod" && 
            "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "dev" ]]; then
        echo -e "${RED}Invalid environment. Use 'dev' or 'prod'${NC}"
        exit 1
      fi
      if [[ "$ENVIRONMENT" == "prod" ]]; then
        ENVIRONMENT="production"
      elif [[ "$ENVIRONMENT" == "dev" ]]; then
        ENVIRONMENT="development"
      fi
      shift 2
      ;;
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
      ENV_PROD="$APP_DIR/.env.prod"
      ENV_DEV="$APP_DIR/.env.dev"
      COMPOSE_PROD="$APP_DIR/docker-compose.prod.yml"
      COMPOSE_DEV="$APP_DIR/docker-compose.dev.yml"
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