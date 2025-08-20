# Whenly – Effortless Group Scheduling

Whenly helps groups easily find a time to meet by syncing with Google Calendar and collecting everyone's availability.

## Features

- Group scheduling with availability grid
- Google Calendar integration
- Responsive frontend (React + MUI)
- RESTful backend (Flask + PostgreSQL)
- Dockerized for easy deployment
- Database backup/restore scripts

## Project Structure

```
.
├── backend/      # Flask backend API
│   ├── app.py
│   ├── models.py
│   ├── config.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── ...
├── frontend/     # React frontend
│   ├── src/
│   ├── package.json
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── ...
├── scripts/      # Utility scripts
├── secrets/      # Environment/config files (not tracked)
├── docker-compose.yml
├── Makefile
└── README.md
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for local frontend dev)
- Python 3.11 (for local backend dev)
- PostgreSQL

### Environment Variables

#### Backend

See [`backend/README.md`](backend/README.md) for required `.env` variables (CORS, OAuth, etc).

#### Frontend

See [`frontend/README.md`](frontend/README.md) for required `.env` variables (API URLs, callback URLs).

### Local Development

Start all services (frontend, backend, db):

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Or use the Makefile for granular control:

```sh
make frontend-dev
make backend-dev
make db-dev
```

### Production

Build and run with:

```sh
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### Database Backup & Restore

Backup:

```sh
make backup
```

Restore latest backup:

```sh
make restore-latest
```

See [`Makefile`](Makefile) for more options.

## Scripts

- `scripts/reset_sequences.sql`: Resets DB sequences after restore
- `backup_db.sh`, `prune_backups.sh`: Manage DB backups

## Deployment

- Frontend served by Nginx (see [`nginx.conf`](frontend/nginx.conf))
- Backend served by Gunicorn (see [`backend/Dockerfile`](backend/Dockerfile))

## License

MIT