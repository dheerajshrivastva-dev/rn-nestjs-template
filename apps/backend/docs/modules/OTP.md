# OTP Module

Generates, verifies, and rate-limits one-time passwords. Used internally by Auth for 2FA and password reset flows.

## OTP Types

| `OtpType` | Used by |
|---|---|
| `login_2fa` | `POST /auth/login` → 2FA flow |
| `email_verification` | Email verification on registration |
| `phone_verification` | Phone number verification |
| `password_reset` | `POST /auth/forgot-password` |
| `two_factor_setup` | TOTP setup (schema ready) |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/otp/resend` | TempToken | Resend OTP for the current flow |

The `resend` endpoint reads the OTP type from the `tempToken` payload — no need to pass it explicitly. The token's `purpose` field encodes the type (e.g., `otp:login_2fa`).

## OTP Verification

Verification is **internal** — there is no public `/otp/verify` endpoint. Each flow (2FA login, password reset) verifies the OTP inline within its own endpoint (`/auth/complete-2fa`, `/auth/reset-password`).

## Config

| Variable | Default | Description |
|---|---|---|
| `OTP_VALIDITY_MINUTES` | `10` | OTP expiry |
| `OTP_MAX_ATTEMPTS` | `5` | Failed attempts before OTP is invalidated |
| `OTP_RATE_LIMIT_COUNT` | `5` | Max OTP sends per window |
| `OTP_RATE_LIMIT_WINDOW_MINUTES` | `10` | Rate limit window |
| `OTP_COOLDOWN_MINUTES` | `15` | Cooldown after hitting rate limit |

## Storage

OTPs are stored hashed (bcrypt). Previous pending OTPs for the same `(recipientId, otpType)` pair are invalidated when a new one is generated.

## Development

In `NODE_ENV=development`, the generated OTP code is returned in the API response body for testing without a real email/SMS provider.
