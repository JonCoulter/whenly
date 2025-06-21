DC=docker compose

# Production: build and run all services
prod:
	$(DC) up -d --build

# Development: use dev overrides for hot reload, code mounting, etc.
dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Bring all containers down and remove volumes
down:
	$(DC) down -v

# Stop all running containers
stop:
	$(DC) stop

# Show status of containers
ps:
	$(DC) ps

# Tail logs for all services
logs:
	$(DC) logs -f

# Force rebuild all images
rebuild:
	$(DC) build --no-cache

# Run only the frontend dev container
frontend-dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build frontend

# Run only the backend dev container
backend-dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend

# Run only the db dev container
db-dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build db

.PHONY: prod dev down stop ps logs rebuild frontend-dev backend-dev db-dev 