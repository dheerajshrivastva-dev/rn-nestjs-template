# Guards

## JwtAuthGuard

Registered globally in `app.module.ts`. Every route is protected by default.

```typescript
// Allow anonymous access on a route
@Public()
@Get('status')
```

Validates `Authorization: Bearer <token>` or `access_token` cookie. Sets `req.user` on success.

## TempTokenGuard

Used for OTP flows (2FA login, password reset). Validates short-lived temp tokens.

```typescript
@UseGuards(TempTokenGuard)
@Post('complete-2fa')
complete2FA(@CurrentTempUser() tempUser: TempUser) { ... }
```

Reads token from (in priority order): `Authorization: Bearer`, request body `tempToken`, cookie `temp_token`.

## RolesGuard

Checks `req.user.role` against `@Roles()`. `ADMIN` bypasses all role checks automatically.

```typescript
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Get('reports')
```

Must run after `JwtAuthGuard` (requires `req.user`). Does not apply to API key requests — those use `ScopesGuard`.

## ApiKeyGuard

Validates `X-API-Key` header. **Not** registered globally — apply per-controller or per-route.

```typescript
@UseGuards(ApiKeyGuard)
@Controller('webhooks')
```

On success sets `req.systemToken`, `req.apiKeyScopes`, and `req.user` (the issuing admin).

## JwtOrApiKeyGuard

Accepts either `Authorization: Bearer` JWT or `X-API-Key`. Try JWT first, fall back to API key.

```typescript
@UseGuards(JwtOrApiKeyGuard)
@Get('orders')
getOrders(@CurrentUser() user: User) { ... }
```

Respects `@Public()`. Use this to let both logged-in users and integrations hit the same endpoint.

## ScopesGuard

Enforces `@RequireScopes()` on API-key-authenticated requests. JWT users pass through without scope checks.

```typescript
@UseGuards(JwtOrApiKeyGuard, ScopesGuard)
@RequireScopes('orders:read')
@Get('orders')
```

Must run after `ApiKeyGuard` or `JwtOrApiKeyGuard` (requires `req.apiKeyScopes`).

## GoogleAuthGuard

Used only on the OAuth redirect routes. Initiates/handles Google OAuth flow.

```typescript
@UseGuards(GoogleAuthGuard)
@Get('auth/google')
```

## Guard Stack Examples

```typescript
// JWT-only, admin only
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)

// JWT or API key, with scope check
@UseGuards(JwtOrApiKeyGuard, ScopesGuard)
@RequireScopes('data:read')

// API key only, with scope check
@UseGuards(ApiKeyGuard, ScopesGuard)
@RequireScopes('webhooks:receive')

// 2FA / password reset flow
@UseGuards(TempTokenGuard)
```
