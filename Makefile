include secrets/.env
export

DC=docker compose
BACKUP_DIR=backups
BACKUP_FILE=$(BACKUP_DIR)/$(POSTGRES_DB)_backup_$(shell date +%Y%m%d_%H%M%S).sql

# Production: build and run all services
prod:
	$(DC) up -d --build

# Development: use dev overrides for hot reload, code mounting, etc.
dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Bring all containers down
down:
	$(DC) down

# Stop all running containers
stop:
	$(DC) stop

# Show status of containers
ps:
	$(DC) ps

# Query the database
query:
	$(DC) exec -it db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

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

# Backup the PostgreSQL database to a timestamped file
backup:
	mkdir -p $(BACKUP_DIR)
	$(DC) exec db pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > $(BACKUP_FILE)
	@echo "✅ Database backed up to $(BACKUP_FILE)"

.PHONY: prod dev down stop ps logs rebuild frontend-dev backend-dev db-dev backup
