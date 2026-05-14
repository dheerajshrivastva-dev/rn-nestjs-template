# Database Migrations Guide

This guide explains how to work with TypeORM migrations in the DEMI backend project.

## Overview

We use **TypeORM migrations** to manage database schema changes safely. Migrations are versioned SQL changes that can be applied and reverted.

**Important:** `synchronize: false` is set in production. Always use migrations instead of auto-sync.

## Current Migration Structure

All migrations are located in `src/database/migrations/` and execute in timestamp order:

1. **CreateAddressTable** - Base table with no dependencies
2. **CreateCompanyTable** - Depends on Address (FK: address_id)
3. **CreateAgentTable** - Depends on Company (FK: company_id with CASCADE delete)
4. **CreateClientTable** - Depends on User & Company (FK: agent_id, company_id)
5. **CreateOtpTables** - Independent tables (otps, otp_rate_limits)

## Migration Commands

### View Migration Status
```bash
pnpm run migration:show
```
Shows which migrations have been applied (`[X]`) or are pending (`[ ]`).

### Run Pending Migrations
```bash
pnpm run migration:run
```
Applies all pending migrations in timestamp order.

### Revert Last Migration
```bash
pnpm run migration:revert
```
Rolls back the most recently applied migration using its `down()` method.

### Generate New Migration (From Entity Changes)
```bash
pnpm run migration:generate src/database/migrations/YourMigrationName
```
Compares entities with current database schema and auto-generates migration.

**Example:**
```bash
# After adding a new field to User entity
pnpm run migration:generate src/database/migrations/AddPhoneVerifiedToAgent
pnpm run migration:run
```

### Create Empty Migration (For Manual SQL)
```bash
pnpm run migration:create src/database/migrations/YourMigrationName
```
Creates an empty migration file with `up()` and `down()` methods.

## Writing Migrations

### Use TypeORM API (Recommended)

**Good:**
```typescript
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddEmailToCompany1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'secondary_email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('companies', 'secondary_email');
  }
}
```

### Avoid Raw SQL

**Avoid (unless necessary):**
```typescript
// Only use raw SQL for operations TypeORM doesn't support
await queryRunner.query(`
  CREATE TYPE "status_enum" AS ENUM ('active', 'inactive');
`);
```

## Migration Best Practices

### 1. Always Write Both `up()` and `down()`
Every migration must be reversible:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Apply changes
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // Revert changes (opposite of up)
}
```

### 2. Handle Foreign Keys Properly
Drop foreign keys before dropping tables:
```typescript
public async down(queryRunner: QueryRunner): Promise<void> {
  const table = await queryRunner.getTable('clients');
  const foreignKey = table.foreignKeys.find(
    (fk) => fk.columnNames.indexOf('agent_id') !== -1,
  );
  if (foreignKey) {
    await queryRunner.dropForeignKey('clients', foreignKey);
  }
  await queryRunner.dropTable('clients');
}
```

### 3. Create Migrations in Dependency Order
When creating multiple migrations, ensure dependencies are created first:
- Base tables (no FK) → Tables with FK → Junction/Link tables

### 4. Test Migrations Locally
Always test both `up()` and `down()` before committing:
```bash
pnpm run migration:run     # Apply
pnpm run migration:revert  # Rollback
pnpm run migration:run     # Re-apply to ensure idempotency
```

### 5. Never Modify Existing Migrations
Once a migration is in production:
- ❌ Don't edit it
- ✅ Create a new migration to make changes

### 6. Use Transactions
TypeORM wraps migrations in transactions automatically. If any query fails, all changes are rolled back.

## Common Migration Patterns

### Add a Column
```typescript
await queryRunner.addColumn(
  'agents',
  new TableColumn({
    name: 'department',
    type: 'varchar',
    length: '100',
    isNullable: true,
  }),
);
```

### Remove a Column
```typescript
await queryRunner.dropColumn('agents', 'department');
```

### Add an Index
```typescript
await queryRunner.createIndex(
  'agents',
  new TableIndex({
    name: 'IDX_AGENT_EMAIL',
    columnNames: ['email'],
  }),
);
```

### Add a Foreign Key
```typescript
await queryRunner.createForeignKey(
  'orders',
  new TableForeignKey({
    columnNames: ['client_id'],
    referencedColumnNames: ['id'],
    referencedTableName: 'clients',
    onDelete: 'CASCADE',
  }),
);
```

### Create an Enum Type
```typescript
await queryRunner.query(`
  CREATE TYPE "order_status_enum" AS ENUM (
    'pending',
    'completed',
    'cancelled'
  );
`);
```

### Rename a Table
```typescript
await queryRunner.renameTable('old_table_name', 'new_table_name');
```

## Production Deployment Workflow

### Option 1: Manual Migration Run
```bash
# On production server
pnpm run migration:run
pnpm run start:prod
```

### Option 2: Auto-run on App Start (Use with Caution)
Set in `.env`:
```env
DB_MIGRATIONS_RUN=true
```

This runs migrations automatically when the app starts. **Not recommended for production** as it can cause downtime.

## Troubleshooting

### Migration Failed Mid-way
TypeORM uses transactions, so partial changes are automatically rolled back. Fix the migration and re-run.

### "No migrations to run"
All migrations are already applied. Use `pnpm run migration:show` to verify.

### Entity Changes Not Detected
Ensure:
1. Entity file is saved
2. Entity is imported in a module
3. Database connection is working

### Enum Type Already Exists Error
Drop the enum type first in `down()`:
```typescript
await queryRunner.query(`DROP TYPE IF EXISTS "status_enum"`);
```

## Migration Naming Conventions

Use descriptive names that indicate the change:
- `CreateUserTable`
- `AddEmailIndexToAgent`
- `RemoveDeprecatedFieldsFromClient`
- `UpdateCompanyAddressRelation`

## Files and Configuration

- **Migrations:** `src/database/migrations/*.ts`
- **Config (NestJS):** `src/config/database.config.ts`
- **Config (CLI):** `src/config/typeorm.config.ts`
- **Scripts:** `package.json` (migration:*)

## Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [NestJS Database Documentation](https://docs.nestjs.com/techniques/database)

---

**Remember:** Migrations are your source of truth for database schema. Keep them organized, tested, and never modify applied migrations.
