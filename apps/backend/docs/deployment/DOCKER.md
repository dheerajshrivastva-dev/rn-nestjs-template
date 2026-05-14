# Docker — Production

Production deployment uses `docker-compose.prod.yml`. PostgreSQL and Redis are expected to be externally managed (e.g., Coolify, managed cloud services).

## Build and Run

```bash
# From monorepo root
docker compose -f apps/backend/docker-compose.prod.yml up -d --build

# Logs
docker logs forge-app-prod -f

# Health check
curl http://localhost:3000/api/v1/health
```

## Environment

All env vars are injected at runtime. Copy `apps/backend/.env.example` and fill required values. See [ENV_VARS.md](../setup/ENV_VARS.md) for the full reference.

Critical production values:
- `NODE_ENV=production`
- `DB_SYNC=false` — never enable in production
- `DB_MIGRATIONS_RUN=true` — or run migrations manually before deploy
- Strong secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AES_SECRET_KEY`

## Resource Limits

Default: 1200 MB memory limit, 512 MB reservation. Adjust in `docker-compose.prod.yml` under `deploy.resources`.

## Healthcheck

Container health is checked via `GET /api/v1/health` every 30 seconds. 3 consecutive failures restart the container.

## Logging

Log driver: `local` with 20 MB rotation, 14 files, compression. Adjust under `logging` in `docker-compose.prod.yml`.

## Dev Stack

For local development, use the dev compose file instead — see [setup/DOCKER.md](../setup/DOCKER.md).
