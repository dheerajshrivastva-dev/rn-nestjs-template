# 2FA Module

Two-factor authentication support. Currently implemented: **Email OTP** (default, always available). Schema is ready for TOTP and SMS OTP.

## Methods

| Method | Status | Notes |
|---|---|---|
| Email OTP | Implemented | Default method. OTP sent via email queue. |
| TOTP (Authenticator app) | Schema ready | Endpoints not yet built. `totpSecret` stored AES-encrypted. |
| SMS OTP | Schema ready | Endpoints not yet built. Requires `SMS_PROVIDER` configured. |
| Backup codes | Schema ready | 8 one-time codes, stored hashed. |

## Login Flow (Email OTP)

```
POST /auth/login  → { tempToken }          (2FA required)
POST /otp/resend  ← Bearer <tempToken>     (optional: resend OTP)
POST /auth/complete-2fa ← Bearer <tempToken>  body: { otp }
                  → { accessToken, refreshToken, user }
```

`tempToken` is a short-lived JWT (10 min) carrying `{ sub: userId, purpose: 'otp:login_2fa' }`. Mobile apps: store in memory and send as `Authorization: Bearer <tempToken>`. Web clients: cookie `temp_token` is set automatically.

## 2FA Setup / Status

Session management endpoints are on `/auth/*`. 2FA enable/disable is managed on the user entity (`is2FAEnabled`). No dedicated 2FA setup controller exists yet — extend when adding TOTP setup.

## `TwoFactorAuth` Entity Fields

| Field | Description |
|---|---|
| `userId` | FK to User |
| `isEnabled` | Master 2FA toggle |
| `preferredMethod` | `email` \| `totp` \| `sms` |
| `totpSecret` | AES-encrypted TOTP secret (null until set up) |
| `totpBackupCodes` | Array of bcrypt-hashed backup codes |
| `totpBackupCodesUsed` | Count of used backup codes |

## Biometric / PIN Login

Alternative to 2FA, not a replacement. Registered devices can skip the password+OTP flow entirely using an RSA challenge-response. See [AUTH.md](AUTH.md) for the biometric endpoints.

## `BIOMETRIC_EXPIRY_DAYS`

Biometric registrations expire after `BIOMETRIC_EXPIRY_DAYS` (default 90). Client must re-register after expiry.

## `BIOMETRIC_CHALLENGE_TTL_SECS`

Challenge nonce valid for `BIOMETRIC_CHALLENGE_TTL_SECS` (default 120 seconds).

## AES Secret

`AES_SECRET_KEY` (min 32 chars) encrypts TOTP secrets at rest. Required in env even if TOTP is not yet activated — set it before first migration.
