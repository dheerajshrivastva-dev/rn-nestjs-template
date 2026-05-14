# Auth Module

Handles login, JWT tokens, session tracking, Google OAuth, biometric login, and password flows.

## Login Flow

```
POST /auth/login  →  {identifier, password}
```

**Without 2FA**: returns `{ accessToken, refreshToken, user }` + sets HTTP-only cookies.

**With 2FA enabled**: returns `{ tempToken, message }` + sets `temp_token` cookie. Client must complete via `/auth/complete-2fa`.

## Token Structure

| Token | Lifetime | Secret |
|---|---|---|
| Access | `JWT_ACCESS_EXPIRATION` (default 15m) | `JWT_SECRET` |
| Refresh | `JWT_REFRESH_EXPIRATION` (default 7d) | `JWT_REFRESH_SECRET` |

Access token payload: `{ sub, email, role, jti, iat }`. JTI is unique per session — used for revocation.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login with email + password |
| `POST` | `/auth/complete-2fa` | TempToken | Verify OTP, issue tokens |
| `POST` | `/auth/refresh` | Public | Rotate access + refresh tokens |
| `POST` | `/auth/logout` | JWT | Revoke current session |
| `POST` | `/auth/change-password` | JWT | Change password |
| `POST` | `/auth/forgot-password` | Public | Send reset OTP, return tempToken |
| `POST` | `/auth/reset-password` | TempToken | Verify OTP, set new password |
| `GET` | `/auth/sessions` | JWT | List active sessions |
| `DELETE` | `/auth/sessions/:id` | JWT | Revoke a specific session |
| `DELETE` | `/auth/sessions` | JWT | Revoke all other sessions |
| `POST` | `/auth/biometric-setup` | JWT | Register device for biometric login |
| `POST` | `/auth/biometric-challenge` | Public | Get a nonce to sign |
| `POST` | `/auth/biometric-login` | Public | Login with signed challenge |
| `GET` | `/auth/biometrics` | JWT | List biometric registrations |
| `POST` | `/auth/biometric-revoke` | JWT | Remove a biometric registration |
| `GET` | `/auth/google` | Public | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | Public | OAuth callback → redirect |

## Token Delivery

Tokens are returned in both **response body** (for mobile/API clients) and **HTTP-only cookies** (for web clients):

- Cookie `access_token` — 15m, `httpOnly`, `sameSite=strict`
- Cookie `refresh_token` — 7d, `httpOnly`, `sameSite=strict`
- Cookie `temp_token` — 10m, for 2FA / password-reset flows

Mobile clients: read from response body, store in Keychain/Keystore, send as `Authorization: Bearer <token>`.

## Password Reset Flow

```
POST /auth/forgot-password  → { tempToken }
POST /auth/reset-password   ← Bearer <tempToken>  body: { otp, newPassword }
```

## Biometric Flow

```
POST /auth/biometric-setup     ← JWT  body: { publicKey, deviceFingerprint, ... }
                               → { biometricToken }  (store in Keychain)

POST /auth/biometric-challenge ← { deviceFingerprint }
                               → { challenge, expiresAt }  (valid 2 min)

POST /auth/biometric-login     ← { deviceFingerprint, signature, challenge, ... }
                               → { accessToken, refreshToken, user }
```

Device RSA keypair: private key stays in device Keychain, public key registered on server. Server verifies challenge signature.

## Rate Limiting

| Endpoint | Limit |
|---|---|
| `/auth/login` | 15 requests / 15 min |
| `/auth/forgot-password` | 5 requests / 15 min |
| `/auth/biometric-login` | 10 requests / 5 min |

Progressive lockout thresholds in `AUTH_RL_*` env vars (see `ENV_VARS.md`).

## Session Limits

`AUTH_MAX_SESSIONS` (default 10) — oldest session evicted when exceeded.

## Google OAuth

Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`. After successful OAuth, redirects to `FRONTEND_URL/dashboard` with auth cookies set.
