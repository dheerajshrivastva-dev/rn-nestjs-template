# Decorators

## `@CurrentUser()`

Param decorator. Returns the authenticated user from `req.user`.

Works for both JWT auth and API key auth (in the API key case, `req.user` is set to the token's issuing admin by `ApiKeyGuard` / `JwtOrApiKeyGuard`).

```typescript
@Get('profile')
getProfile(@CurrentUser() user: User) { ... }
```

## `@CurrentTempUser()`

Param decorator. Returns the decoded temp token payload from `req.tempUser`. Use on routes protected by `TempTokenGuard`.

```typescript
@UseGuards(TempTokenGuard)
@Post('complete-2fa')
complete2FA(@CurrentTempUser() tempUser: TempUser) {
  // tempUser: { sub, email, role, purpose, ... }
}
```

## `@Public()`

Marks a route as public — bypasses `JwtAuthGuard`. Also respected by `JwtOrApiKeyGuard`.

```typescript
@Public()
@Post('auth/login')
```

## `@OptionalAuth()`

Route works with or without authentication. If a valid token is present, `req.user` is populated. If no token or invalid token, the request proceeds with `req.user = undefined`.

```typescript
@OptionalAuth()
@Get('feed')
getFeed(@CurrentUser() user?: User) { ... }
```

## `@Roles(...roles)`

Declares required roles for RolesGuard.

```typescript
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Get('admin/data')
```

`ADMIN` role bypasses RolesGuard automatically — no need to include it in every `@Roles()` call unless you want to document intent.

## `@RequireScopes(...scopes)`

Declares required API key scopes for `ScopesGuard`. Only affects API-key-authenticated requests.

```typescript
@UseGuards(JwtOrApiKeyGuard, ScopesGuard)
@RequireScopes('reports:read')
@Get('reports')
```

## `@ApiKeyScopes()`

Param decorator. Injects `req.apiKeyScopes` into the handler parameter. Returns `undefined` for JWT users.

```typescript
@Get('data')
getData(@ApiKeyScopes() scopes: string[] | undefined) {
  // scopes is undefined for JWT users, string[] for API key users
}
```
