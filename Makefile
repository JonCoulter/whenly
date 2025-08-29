include secrets/.env
export

SHELL := /bin/bash

DC=docker compose
BACKUP_DIR=backups
BACKUP_FILE=$(BACKUP_DIR)/$(POSTGRES_DB)_backup_$(shell date +%Y%m%d_%H%M%S).sql

# Production: build frontend and run all services
prod:
	$(DC) -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Development: build frontend and use dev overrides for hot reload, code mounting, etc.
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
backend-dev: build-frontend
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend

# Run only the db dev container
db-dev:
	$(DC) -f docker-compose.yml -f docker-compose.dev.yml up -d --build db

# Backup the PostgreSQL database to a timestamped file
backup:
	mkdir -p $(BACKUP_DIR)
	$(DC) exec db pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > $(BACKUP_FILE)
	@echo "✅ Database backed up to $(BACKUP_FILE)"

# Completely resets the database and restores the latest backup
restore-latest:
	@echo "⚠️  WARNING: This will DELETE all current data in $(POSTGRES_DB) and restore from backup"
	@read -p "Type 'yes' to proceed: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🔎 Capturing most recent pre-restore backup..."; \
		PREVIOUS_BACKUP=$$(ls -t backups/*.sql 2>/dev/null | head -n 1); \
		make backup; \
		if [ -z "$$PREVIOUS_BACKUP" ]; then \
			echo "❌ No previous backup file found. Aborting restore."; \
			exit 1; \
		fi; \
		echo "🔒 Terminating active connections to database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(POSTGRES_DB)';"; \
		echo "🗑 Dropping and recreating database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB);"; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "CREATE DATABASE $(POSTGRES_DB);"; \
		echo "📥 Restoring from: $$PREVIOUS_BACKUP"; \
		cat $$PREVIOUS_BACKUP | $(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB); \
		echo "🔄 Resetting sequences..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f scripts/reset_sequences.sql; \
		echo "✅ Restore complete."; \
	else \
		echo "❌ Restore canceled."; \
	fi


# Completely resets the database and restores from a specific backup file
restore-from:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ FILE argument required. Usage: make restore-from FILE=backups/your_backup.sql"; \
		exit 1; \
	fi; \
	if [ ! -f "$(FILE)" ]; then \
		echo "❌ Backup file '$(FILE)' not found."; \
		exit 1; \
	fi; \
	echo "⚠️  WARNING: This will DELETE all current data in $(POSTGRES_DB) and restore from $(FILE)"; \
	read -p "Type 'yes' to proceed: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🔒 Terminating active connections to database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(POSTGRES_DB)';"; \
		echo "🗑 Dropping and recreating database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB);"; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "CREATE DATABASE $(POSTGRES_DB);"; \
		echo "📥 Restoring from: $(FILE)"; \
		cat $(FILE) | $(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB); \
		echo "🔄 Resetting sequences..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f scripts/reset_sequences.sql; \
		echo "✅ Restore complete."; \
	else \
		echo "❌ Restore canceled."; \
	fi

.PHONY: prod dev down stop ps logs rebuild frontend-dev backend-dev db-dev backup restore-latest restore-from
