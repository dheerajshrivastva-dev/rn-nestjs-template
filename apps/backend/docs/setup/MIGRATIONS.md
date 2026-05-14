# Migrations

TypeORM CLI. Config at `src/config/typeorm.config.ts` — entities in `src/**/*.entity.ts`, migrations in `src/database/migrations/`.

## Commands

```bash
# Generate a migration from entity diff
pnpm --filter forge-backend migration:generate src/database/migrations/MigrationName

# Run all pending migrations
pnpm --filter forge-backend migration:run

# Revert the last applied migration
pnpm --filter forge-backend migration:revert

# Create a blank migration file
pnpm --filter forge-backend migration:create src/database/migrations/MigrationName

# Show migration status (applied / pending)
pnpm --filter forge-backend migration:show
```

## Notes

- `DB_SYNC=true` auto-syncs schema at startup — dev convenience, **never production**.
- `DB_MIGRATIONS_RUN=true` runs pending migrations on every startup — useful for containers.
- Migration files are timestamped: `1700000000000-MigrationName.ts`. Commit them.
- Always review generated migrations before running — TypeORM can generate destructive diffs (e.g., drop then recreate columns on type changes).
