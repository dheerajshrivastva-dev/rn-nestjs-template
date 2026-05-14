# Docker Dev Stack

```bash
# Start all services
pnpm --filter forge-backend dev:db:up

# Stop
pnpm --filter forge-backend dev:db:down

# View logs
pnpm --filter forge-backend dev:db:logs
```

## Services

| Service | Port | UI | Credentials |
|---|---|---|---|
| PostgreSQL 16 | `5432` | Adminer → `:8080` | `postgres` / `postgres123` |
| Redis 7 | `6380` | Redis Commander → `:8081` | password: `redis123` |
| Mailpit (SMTP) | `1025` | Web UI → `:8025` | none |
| MinIO (S3) | `9000` | Console → `:9001` | `minioadmin` / `minioadmin123` |
| Jaeger (tracing) | — | UI → `:16686` | none |
| Adminer (DB UI) | — | `:8080` | — |

> Redis is mapped to **6380** (not 6379) to avoid conflicts with a local Redis instance.

## Recommended `.env` values for dev

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=forge_db

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redis123

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_PROVIDER=smtp
```
