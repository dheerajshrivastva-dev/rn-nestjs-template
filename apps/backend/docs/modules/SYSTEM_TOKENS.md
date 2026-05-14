# System Tokens Module

Long-lived API keys for machine-to-machine integrations (CI pipelines, Zapier, webhooks, etc.). Only `ADMIN` users can issue tokens.

## Key Format

```
stk_live_<random40chars>
```

Prefix `stk_live_` is stored as `keyPrefix` for display. The full key is SHA-256 hashed and stored as `keyHash` — the plaintext is **never persisted** and returned only once on creation or rotation.

## Endpoints

All endpoints under `/auth/system-tokens`. Require `ADMIN` role.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/system-tokens` | Create a token. Returns plaintext key once. |
| `GET` | `/auth/system-tokens` | List all tokens issued by current admin |
| `GET` | `/auth/system-tokens/:id` | Get single token |
| `PATCH` | `/auth/system-tokens/:id` | Update name, description, scopes, expiry, IP whitelist |
| `DELETE` | `/auth/system-tokens/:id` | Revoke (soft delete) |
| `POST` | `/auth/system-tokens/:id/rotate` | Invalidate + issue new key with same settings |

## Using a Token

Send in request header:
```
X-API-Key: stk_live_<key>
```

## Scopes

Free-form strings. Define whatever permission granularity fits your app. Examples:
```
orders:read   orders:write
users:read    users:write
webhooks:receive
```

Scopes are enforced by `ScopesGuard` — see [GUARDS.md](../common/GUARDS.md).

## Protecting a Route

```typescript
// Accept JWT users OR API key integrations
@UseGuards(JwtOrApiKeyGuard, ScopesGuard)
@RequireScopes('orders:read')
@Get('orders')
getOrders(@CurrentUser() user: User, @ApiKeyScopes() scopes?: string[]) { ... }
```

JWT users pass through ScopesGuard without scope checks (they rely on RolesGuard). Only API key requests are scope-checked.

## IP Whitelist

Optional. If `allowedIps` is set on the token, requests from non-matching IPs are rejected by `ApiKeyGuard`.

## Usage Tracking

Each validated request updates `lastUsedAt` and `usageCount` on the token record (fire-and-forget — never blocks the request).

## Token Entity Fields

| Field | Description |
|---|---|
| `id` | UUID |
| `issuedByUserId` | FK to issuing admin |
| `name` | Human label (e.g., "Zapier Integration") |
| `keyHash` | SHA-256 hex of plaintext key |
| `keyPrefix` | First ~12 chars for display |
| `scopes` | `string[]` in JSONB |
| `expiresAt` | null = never expires |
| `isActive` | false after revoke/rotate |
| `allowedIps` | Optional IP whitelist |
| `lastUsedAt` | Last successful use |
| `usageCount` | Total successful uses |
