.PHONY: help init setup build up down restart logs migrate superuser clean status shell

COMPOSE := docker compose -f docker-compose.dev.yml
PROFILE ?= cpu

help:
	@echo "Commands:"
	@echo "  make init [PROFILE=cpu|gpu]  - Complete setup"
	@echo "  make build [PROFILE=cpu|gpu] - Build images"
	@echo "  make up [PROFILE=cpu|gpu]    - Start services"
	@echo "  make down                    - Stop services"
	@echo "  make logs [SERVICE=name]     - View logs"
	@echo "  make migrate                 - Run migrations"
	@echo "  make superuser               - Create superuser"
	@echo "  make shell                   - API shell"
	@echo "  make clean                   - Remove all"

setup:
	@[ -f .env.dev ] || cp .env.dev.example .env.dev
	@mkdir -p fair-app-data/{log,ramp,trainings,postgres,redis}

build:
	@$(COMPOSE) build api frontend predictor
	@$(COMPOSE) --profile $(PROFILE) build

init: setup build down
	@$(COMPOSE) up -d postgres redis
	@sleep 8
	@$(COMPOSE) run --rm api python manage.py migrate
	@$(COMPOSE) --profile $(PROFILE) up
	@echo "API: http://localhost:8200"
	@echo "Frontend: http://localhost:3500"

up:
	@$(COMPOSE) up -d api frontend predictor
	@$(COMPOSE) --profile $(PROFILE) up 

down:
	@$(COMPOSE) down --remove-orphans

restart:
	@$(COMPOSE) restart

logs:
ifdef SERVICE
	@$(COMPOSE) logs -f $(SERVICE)
else
	@$(COMPOSE) logs -f
endif

migrate:
	@$(COMPOSE) exec api python manage.py migrate

superuser:
	@$(COMPOSE) exec api python manage.py createsuperuser

status:
	@$(COMPOSE) ps

shell:
	@$(COMPOSE) exec api bash

clean:
	docker ps -a | grep fair | awk '{print $1}' | xargs sudo docker rm -f 2>/dev/null || true
	@$(COMPOSE) down -v --remove-orphans
