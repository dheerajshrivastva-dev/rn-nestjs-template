# Forge Backend

NestJS 11 + TypeORM + PostgreSQL API server. Part of the `rn-nestjs-template` monorepo.

## Quick Start

```bash
# 1. Install dependencies (from monorepo root)
pnpm install

# 2. Copy and fill environment variables
cp apps/backend/.env.example apps/backend/.env

# 3. Start dev infrastructure (Postgres, Redis, Mailpit, MinIO, etc.)
pnpm --filter forge-backend dev:db:up

# 4. Run database migrations
pnpm --filter forge-backend migration:run

# 5. Start the API server
pnpm --filter forge-backend start:dev
```

API available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api/docs`

## Scripts

| Script | Description |
|---|---|
| `start:dev` | Watch mode dev server |
| `start:prod` | Production server (`dist/main`) |
| `build` | Compile TypeScript |
| `test` | Unit tests |
| `test:e2e` | End-to-end tests |
| `test:cov` | Coverage report |
| `dev:db:up` | Start Docker dev stack |
| `dev:db:down` | Stop Docker dev stack |
| `migration:generate` | Generate migration from entity diff |
| `migration:run` | Apply pending migrations |
| `migration:revert` | Revert last migration |

## Documentation

- [Full docs index](docs/README.md)
- [Setup: Docker](docs/setup/DOCKER.md)
- [Setup: Environment Variables](docs/setup/ENV_VARS.md)
- [Setup: Migrations](docs/setup/MIGRATIONS.md)
