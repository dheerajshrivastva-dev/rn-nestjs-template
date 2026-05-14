# RBAC

Role-based access control using `UserRole` enum + `RolesGuard`.

## Roles

| `UserRole` | Value | Access |
|---|---|---|
| `ADMIN` | `admin` | Full access. Bypasses `RolesGuard` automatically. |
| `MANAGER` | `manager` | Elevated access to management features. |
| `USER` | `user` | Standard end-user access. |

## How RolesGuard Works

1. `JwtAuthGuard` runs first (global) — sets `req.user`.
2. `RolesGuard` reads `@Roles()` metadata from the handler.
3. If no `@Roles()` → allow.
4. If `req.user.role === ADMIN` → allow (always).
5. Otherwise check if user's role is in the required list.

`RolesGuard` is **not** registered globally. Apply it per-controller or per-route.

## Patterns

```typescript
// Admin-only controller
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/system')
export class SystemController { ... }

// Mixed roles on a controller, override per route
@UseGuards(RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
@Controller('reports')
export class ReportsController {
  @Get()
  list() { ... }  // inherits MANAGER | ADMIN

  @Get('summary')
  @Roles(UserRole.USER)  // overrides — USER can access summary
  summary() { ... }
}

// JWT or API key, with roles + scopes
@UseGuards(JwtOrApiKeyGuard, RolesGuard, ScopesGuard)
@Roles(UserRole.MANAGER)
@RequireScopes('data:export')
@Get('export')
```

## API Key Users and Roles

When a request authenticates via `X-API-Key`, `ApiKeyGuard` sets `req.user` to the admin who issued the token. That means `RolesGuard` will see `ADMIN` role and allow all role-gated routes. Use `ScopesGuard` + `@RequireScopes()` to restrict what API key integrations can do independently of role.
