# Whenly – Effortless Group Scheduling

Whenly helps groups easily find a time to meet by syncing with Google Calendar and collecting everyone's availability.

## Features

- Group scheduling with availability grid
- Google Calendar integration
- Responsive frontend (React + MUI)
- RESTful backend (Flask + PostgreSQL)
- Dynamic meta tags for social sharing and SEO
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

Start all services (frontend, backend, db) with automatic frontend build:

```sh
make dev
```

Or use the Makefile for granular control:

```sh
make frontend-dev
make backend-dev
make db-dev
```

### Production

Build frontend and run all services:

```sh
make prod
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
- `scripts/test_social_sharing.py`: Test social sharing meta tags
- `backup_db.sh`, `prune_backups.sh`: Manage DB backups

## Social Sharing & SEO

Whenly automatically generates dynamic meta tags for event URLs to ensure proper social sharing and SEO. When someone shares an event link on platforms like Facebook, Twitter, or Slack, the correct event information will be displayed.

### How it Works

1. **Middleware Interception**: The backend middleware intercepts requests to event URLs (`/e/:eventId`)
2. **Event Data Retrieval**: Fetches event details from the database
3. **Meta Tag Generation**: Creates appropriate meta tags including:
   - `title`: Event name with "Whenly" suffix
   - `description`: Event description with creator name and meeting details
   - `og:title`, `og:description`, `og:url`, `og:image`: Open Graph tags for Facebook/LinkedIn
   - `twitter:title`, `twitter:description`, `twitter:image`: Twitter Card tags
4. **HTML Injection**: Injects the meta tags into the HTML response before sending to the browser/crawler

### Testing Social Sharing

Use the provided test script to validate meta tags:

```bash
# Test with a specific event
python scripts/test_social_sharing.py http://localhost:5000 your-event-id

# Test with different social media crawlers
python scripts/test_social_sharing.py http://localhost:5000 your-event-id
```

**Note**: The frontend is automatically built when you run `make dev` or `make prod`. If the frontend build fails, the middleware will use a fallback HTML template that still provides all the necessary meta tags for social sharing.

### Manual Testing

You can also test manually with these tools:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Deployment

- Frontend served by Nginx (see [`nginx.conf`](frontend/nginx.conf))
- Backend served by Gunicorn (see [`backend/Dockerfile`](backend/Dockerfile))

## License

MIT