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

# Completely resets the database and restores the latest backup
restore-clean:
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
		echo "🗑 Dropping and recreating database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB);"; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "CREATE DATABASE $(POSTGRES_DB);"; \
		echo "📥 Restoring from: $$PREVIOUS_BACKUP"; \
		cat $$PREVIOUS_BACKUP | $(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB); \
		echo "🔄 Resetting sequences..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\
DO \$\$ \
DECLARE \
    seq RECORD; \
BEGIN \
    FOR seq IN \
        SELECT pg_class.relname AS sequence_name, \
               pg_namespace.nspname AS schema_name, \
               t.relname AS table_name, \
               a.attname AS column_name \
        FROM pg_class \
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace \
        JOIN pg_depend ON pg_depend.objid = pg_class.oid \
        JOIN pg_class t ON pg_depend.refobjid = t.oid \
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = pg_depend.refobjsubid \
        WHERE pg_class.relkind = 'S' \
          AND pg_namespace.nspname = 'public' \
    LOOP \
        EXECUTE format( \
            'SELECT setval(%I, COALESCE((SELECT MAX(%I) FROM %I), 1))', \
            seq.sequence_name, seq.column_name, seq.table_name \
        ); \
    END LOOP; \
END \
\$\$;"; \
		echo "✅ Restore complete."
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
		echo "🗑 Dropping and recreating database $(POSTGRES_DB)..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB);"; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d postgres -c "CREATE DATABASE $(POSTGRES_DB);"; \
		echo "📥 Restoring from: $(FILE)"; \
		cat $(FILE) | $(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB); \
		echo "🔄 Resetting sequences..."; \
		$(DC) exec -T db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\
DO \$\$ \
DECLARE \
    seq RECORD; \
BEGIN \
    FOR seq IN \
        SELECT pg_class.relname AS sequence_name, \
               pg_namespace.nspname AS schema_name, \
               t.relname AS table_name, \
               a.attname AS column_name \
        FROM pg_class \
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace \
        JOIN pg_depend ON pg_depend.objid = pg_class.oid \
        JOIN pg_class t ON pg_depend.refobjid = t.oid \
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = pg_depend.refobjsubid \
        WHERE pg_class.relkind = 'S' \
          AND pg_namespace.nspname = 'public' \
    LOOP \
        EXECUTE format( \
            'SELECT setval(%I, COALESCE((SELECT MAX(%I) FROM %I), 1))', \
            seq.sequence_name, seq.column_name, seq.table_name \
        ); \
    END LOOP; \
END \
\$\$;"; \
		echo "✅ Restore complete."; \
	else \
		echo "❌ Restore canceled."; \
	fi


.PHONY: prod dev down stop ps logs rebuild frontend-dev backend-dev db-dev backup restore-clean restore-from
