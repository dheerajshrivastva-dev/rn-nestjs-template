# Audit Module

Audit logging, system health monitoring, and maintenance mode.

## Endpoints

All require JWT + `ADMIN` role unless noted.

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/audit/logs` | `ADMIN` | Paginated audit logs with filters |
| `GET` | `/audit/health` | `ADMIN` | System health (DB, Redis, queues) |
| `PATCH` | `/audit/maintenance` | `ADMIN` | Enable/disable maintenance mode |
| `GET` | `/audit/maintenance` | `ADMIN` | Current maintenance mode status |

Query params for `/audit/logs`: `action`, `userId`, `from`, `to`, `page`, `pageSize`.

## Logging from Code

```typescript
await auditService.log({
  action: AuditAction.USER_CREATED,
  actorId: user.id,
  targetId: newUser.id,
  targetType: 'User',
  metadata: { role: newUser.role },
  ipAddress: req.ip,
});
```

## `AuditAction` Enum

Key actions (extend as needed):

| Category | Actions |
|---|---|
| Auth | `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_RESET` |
| System Tokens | `SYSTEM_TOKEN_CREATED`, `SYSTEM_TOKEN_REVOKED`, `SYSTEM_TOKEN_ROTATED` |
| Users | `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_ROLE_CHANGED`, `USER_STATUS_CHANGED` |

Full enum is the source of truth: [audit-log.entity.ts](../../src/modules/audit/entities/audit-log.entity.ts).

## `AuditLog` Entity Fields

| Field | Type | Description |
|---|---|---|
| `id` | uuid | |
| `action` | enum | `AuditAction` value |
| `actorId` | uuid | User who performed the action |
| `targetId` | varchar | Entity affected (nullable) |
| `targetType` | varchar | Entity type label (e.g., `User`) |
| `metadata` | jsonb | Arbitrary context |
| `ipAddress` | varchar | Request IP |
| `createdAt` | timestamp | |

## System Health

`GET /audit/health` returns status of:
- PostgreSQL connection
- Redis connection
- Bull queue depths (email, sms, push)
- App uptime and version

## Maintenance Mode

Toggling maintenance mode (`PATCH /audit/maintenance`) sends a push notification to all `ADMIN` users immediately.
