.PHONY: help init setup build up down restart logs migrate superuser collectstatic clean status shell test

COMPOSE := docker compose -f docker-compose.dev.yml
PROFILE ?= cpu

ifneq ($(filter logs,$(MAKECMDGOALS)),)
	SERVICE_ARG := $(word 2,$(MAKECMDGOALS))
	$(eval $(SERVICE_ARG):;@:)
endif

help:
	@echo "Commands:"
	@echo "  make init [PROFILE=cpu|gpu]"
	@echo "  make setup"
	@echo "  make build [PROFILE=cpu|gpu]"
	@echo "  make up [PROFILE=cpu|gpu]"
	@echo "  make down"
	@echo "  make restart"
	@echo "  make status"
	@echo "  make logs [service]"
	@echo "  make shell"
	@echo "  make migrate"
	@echo "  make superuser"
	@echo "  make collectstatic"
	@echo "  make clean"

setup:
	@echo "Setup"
	@[ -f .env.dev ] || cp .env.dev.example .env.dev
	@mkdir -p fair-app-data/{log,ramp,trainings,postgres,redis}

build:
	@echo "Build"
	@$(COMPOSE) build api frontend predictor
	@$(COMPOSE) --profile $(PROFILE) build

init: setup build down
	@echo "Init"
	@$(COMPOSE) up -d postgres redis
	@echo "Waiting for database"
	@sleep 10
	@$(COMPOSE) run --rm api python manage.py migrate
	@$(COMPOSE) run --rm api python manage.py collectstatic --noinput
	@$(COMPOSE) --profile $(PROFILE) up -d
	@echo "Done"
	@echo "Frontend: http://localhost:3500"
	@echo "API:      http://localhost:8200"
	@echo "API Docs: http://localhost:8200/api/docs"

up:
	@echo "Up"
	@$(COMPOSE) --profile $(PROFILE) up -d

down:
	@echo "Down"
	@$(COMPOSE) down --remove-orphans
	@docker ps -q --filter network=fair-network | xargs -r docker rm -f >/dev/null 2>&1 || true
	@docker network rm fair-network >/dev/null 2>&1 || true

restart:
	@echo "Restart"
	@$(COMPOSE) restart

logs:
	@if [ -n "$(SERVICE_ARG)" ]; then $(COMPOSE) logs -f $(SERVICE_ARG); else $(COMPOSE) logs -f; fi

migrate:
	@echo "Migrate"
	@$(COMPOSE) exec api python manage.py migrate

collectstatic:
	@echo "Collectstatic"
	@$(COMPOSE) exec api python manage.py collectstatic --noinput

superuser:
	@echo "Superuser"
	@$(COMPOSE) exec api python manage.py createsuperuser

status:
	@$(COMPOSE) ps

shell:
	@$(COMPOSE) exec api bash

clean:
	@echo "Clean"
	@$(COMPOSE) down -v --remove-orphans
	@docker ps -q --filter network=fair-network | xargs -r docker rm -f >/dev/null 2>&1 || true
	@docker network rm fair-network >/dev/null 2>&1 || true
	@echo "Removing data directories"
	@rm -rf fair-app-data