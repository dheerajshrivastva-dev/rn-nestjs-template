# Complete Auth, 2FA & Session Management Flow (Updated Feb 2026)

## Implementation Status Legend

- ✅ **IMPLEMENTED** - Working in production code
- 🏗️ **SCHEMA READY** - DB/entity exists, endpoints not yet built
- ❌ **NOT IMPLEMENTED** - Planned but not started

---

## Overview

This document describes the complete authentication flow including:

- **Multi-identifier login** (email, phone, userId)
- **2FA with multiple methods** (Email OTP ✅, TOTP 🏗️, SMS OTP 🏗️)
- **Biometric / PIN login** (Android/iOS hardware-bound — optional, quick login) ✅
- **Rate limiting & account lockout** (3 failed attempts → temp lock) ✅
- **Trusted devices** (skip 2FA for 30 days) 🏗️
- **Password reset with 2FA verification** ✅
- **Session revocation** (logout from specific devices or all devices) ✅
- **Recovery / Backup codes** (8 one-time codes generated at 2FA setup) 🏗️

---

## Role System

```
SUPER_ADMIN (companyId: NULL, hierarchyLevel: 0) — requires 2FA
    └── Company A
        └── SUPER (companyId: A, hierarchyLevel: 1)
            ├── DISTRIBUTOR 1 (companyId: A, hierarchyLevel: 2)
            │   └── RETAILER 1 (companyId: A, hierarchyLevel: 3)
            └── DISTRIBUTOR 2 (companyId: A, hierarchyLevel: 2)
                └── RETAILER 2 (companyId: A, hierarchyLevel: 3)
```

| Role | Level | companyId | parentUserId |
|------|-------|-----------|--------------|
| SUPER_ADMIN | 0 | NULL | NULL |
| SUPER | 1 | set | NULL |
| DISTRIBUTOR | 2 | set | SUPER |
| RETAILER | 2 or 3 | set | SUPER or DISTRIBUTOR |

---

## 1. Login Flow

**Endpoint**: `POST /api/v1/auth/login` ✅

### Request

```json
{
  "identifier": "+919876543210",
  "password": "Password@123",
  "deviceInfo": {
    "deviceName": "Samsung Galaxy S24",
    "deviceType": "mobile",
    "deviceFingerprint": "sha256hash...",
    "userAgent": "demiAdmin/Android"
  }
}
```

`identifier` accepts: email | phone | userId (e.g. `ABCSUO2750126011234`)

### Flow

```
1. Rate limit check (per identifier):
   - 3 failed in 15 min → lock 15 min → 429
   - 5 failed in 1 hour → lock 1 hour → 429
   - 10 failed in 24 hours → account suspended → 403

2. Find user by identifier → 404 if not found (logged as failed attempt)

3. Verify password (bcrypt.compare) → 401 if invalid, log + increment counter

4. Check user status:
   - INACTIVE → 401 "Account pending approval"
   - SUSPENDED → 401 "Account suspended"

5. Check 2FA:
   A. 2FA NOT enabled → skip to step 6 (issue tokens directly)
   B. 2FA enabled → go to "Login with 2FA" flow below

6. Generate tokens:
   - Access token: JWT, 15 min expiry, unique JTI
   - Refresh token: JWT, 7 day expiry

7. Create session record (user_sessions table):
   - Hashed refresh token
   - Device info, IP, fingerprint
   - Token family for rotation tracking

8. Update user: lastLoginAt, lastLoginIp, reset failed attempts

9. Return tokens + user
```

### Response (no 2FA)

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "John Distributor",
    "email": "john@company-a.com",
    "role": "super",
    "status": "ACTIVE"
  }
}
```

---

## 2. Login with 2FA

Same `POST /api/v1/auth/login` ✅, but returns a `tempToken` instead of full tokens.

### Step 1 — Credentials → Temp Token

```
5. (2FA enabled) Check trusted device:
   - Compare deviceFingerprint against trusted sessions 🏗️
   - If trusted AND not expired → skip 2FA, issue full tokens directly
   - If not trusted → continue below

6. Determine method:
   - Check user's primaryMethod from TwoFactorAuth record
   - TOTP → return prompt (no OTP sent)       [endpoint: POST /api/v1/otp/verify]
   - Email OTP → generate OTP, send email    ✅
   - SMS OTP → send SMS                       🏗️ (SMS service not integrated)

7. Generate tempToken (10 min expiry):
   - JWT with payload: { userId, purpose: "otp:login_2fa" }
   - Does NOT grant access to protected routes
```

### Response

```json
{
  "tempToken": "eyJ...",
  "message": "2FA code required",
  "otpSent": true,
  "otp": "123456"
}
```

> `otp` field only appears in development mode.

### Step 2 — Verify 2FA Code

**Endpoint**: `POST /api/v1/auth/complete-2fa` ✅

Uses `Authorization: Bearer <tempToken>` header (TempTokenGuard).

```json
{
  "code": "123456"
}
```

### Verification Logic

```
a) Email OTP / SMS OTP:
   - Find OTP record by userId + type LOGIN_2FA
   - Check not expired (10 min window)
   - bcrypt.compare OTP code
   - Mark OTP as used

b) TOTP (Authenticator App): 🏗️
   - Decrypt user's TOTP secret
   - Verify using TOTP algorithm (30-second window, ±1 step drift)

c) Backup/Recovery Code: 🏗️
   - Iterate backupCodes array
   - bcrypt.compare each stored hash
   - If match → mark code as used (isUsed = true)
   - If 0 remaining → force 2FA re-setup

d) Biometric (fingerprint/PIN as 2FA): ✅
   - Handled separately via /auth/biometric-login
   - Can return tempToken if 2FA also required
```

### Response (complete-2fa success)

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "John Distributor",
    "role": "super",
    "status": "ACTIVE"
  }
}
```

---

## 3. Biometric / PIN Login (Quick Login)

This is an **optional, device-local quick-access mechanism** — it replaces typing a password on repeat logins. It is NOT a standalone authentication method; it authenticates via the server using a hardware-backed RSA key pair.

> **IMPORTANT**: PIN and fingerprint serve the same purpose (quick login). PIN is a local fallback when fingerprint hardware fails. Both ultimately call the same biometric-login API.

### Setup Flow (After First Password Login)

**Endpoint**: `POST /api/v1/auth/biometric-setup` ✅

Triggered by `PinSetupScreen` after successful password login.

```
1. App generates RSA key pair:
   - Private key → Android Keystore / iOS Secure Enclave (never leaves device)
   - Public key → sent to server

2. POST /auth/biometric-setup {
     deviceFingerprint, deviceName, publicKey (PEM)
   }

3. Server stores UserBiometric record:
   - publicKey, deviceFingerprint, deviceName
   - expiresAt = now + 90 days
   - isActive = true
```

#### PIN Storage (Client-Side Only)

- PIN (4–6 digits) is **hashed locally** with a fixed app salt: `demigod_pin_v1_2026`
- Hash stored in **Keychain** (secure OS storage, no biometric lock required)
- **PIN never sent to server** — it only gates the biometric API call
- Max **3 PIN attempts** before biometric data is wiped → forced password login

### Quick Login Flow (Cold App Start)

```
App Launch
├─ Tokens in storage AND biometric key pair exists?
│   └─ YES → Show BiometricLoginScreen
│       ├─ Auto-prompt fingerprint sensor
│       │    1. POST /auth/biometric-challenge → server returns random nonce
│       │    2. Sign nonce with device private key (OS shows fingerprint prompt)
│       │    3. POST /auth/biometric-login { challenge, signature, deviceFingerprint }
│       │    4. Server verifies RSA signature with stored public key
│       │    5a. Returns accessToken + refreshToken → App unlocked
│       │    5b. Returns tempToken (if 2FA also required) → Navigate to 2FA screen
│       │
│       ├─ OR Enter PIN (4–6 digits)
│       │    1. Hash PIN locally
│       │    2. Compare with stored hash (local check)
│       │    3. If match → call same biometric-challenge + biometric-login API
│       │    4. Same result as fingerprint path above
│       │
│       └─ OR "Use password instead" → Full LoginScreen
│
└─ NO → Show Full LoginScreen
```

**Endpoint**: `POST /api/v1/auth/biometric-challenge` ✅

```json
{
  "userId": "optional",
  "email": "optional",
  "deviceFingerprint": "unique-device-id"
}
```

Response: `{ "challenge": "random-nonce" }`

**Endpoint**: `POST /api/v1/auth/biometric-login` ✅

```json
{
  "email": "john@company-a.com",
  "deviceFingerprint": "unique-device-id",
  "challenge": "nonce-from-challenge-endpoint",
  "signature": "base64-encoded-rsa-signature",
  "deviceInfo": { "deviceName": "...", "userAgent": "..." }
}
```

### Biometric as a 2FA Option

When `twoFactorEnabled = true` AND the user has a registered device:

```
Biometric login success
├─ 2FA NOT required → full tokens returned ✅
└─ 2FA required (e.g. new device, untrusted) → tempToken returned
    └─ Navigate to OTP/TOTP screen for second factor
```

This means biometric replaces password in the first factor, but does not bypass a required second factor unless the device is trusted.

### Attempt Limits & Lockout

| Method | Max Attempts | Action on Lockout |
|--------|--------------|-------------------|
| PIN | 3 failures | Biometric data cleared, force password login |
| Fingerprint | 5 failures | Fingerprint button hidden, PIN still available |

### Revoke Biometric

**Endpoint**: `POST /api/v1/auth/biometric-revoke` ✅

Disables biometric for the current device. Useful for "remove this device" flows.

---

## 4. Password Reset Flow

### Step 1 — Request Reset

**Endpoint**: `POST /api/v1/auth/forgot-password` ✅

```json
{ "email": "john@company-a.com" }
```

```
1. Find user by email (always return success, never reveal if email exists)
2. Generate 6-digit email OTP (10 min expiry)
3. Send password reset email
4. Generate tempToken: { userId, purpose: "otp:password_reset" }
5. Return tempToken
```

Response:
```json
{
  "tempToken": "eyJ...",
  "message": "If account exists, you'll receive a password reset email"
}
```

### Step 2 — Verify OTP + Set New Password

**Endpoint**: `POST /api/v1/auth/reset-password` ✅

```json
{
  "tempToken": "eyJ...",
  "emailOtp": "123456",
  "newPassword": "NewPassword@123"
}
```

```
1. Verify tempToken (purpose: "otp:password_reset")
2. Verify email OTP (bcrypt, check expiry)
3. Validate new password strength

4a. If 2FA NOT enabled:
    - Hash + save new password
    - Invalidate all sessions (logout everywhere)
    - Mark OTP as used
    - Return success

4b. If 2FA IS enabled:
    - Store hashed new password temporarily
    - Generate new tempToken: { userId, purpose: "otp:password_reset_step2_2fa_pending" }
    - Send 2FA code (TOTP prompt / SMS / Email OTP based on primaryMethod)
    - Return "2FA required" response
```

### Step 3 — Verify 2FA to Complete Reset (if 2FA enabled)

**Endpoint**: `POST /api/v1/auth/reset-password/verify-2fa`

```json
{
  "tempToken": "...",
  "code": "123456"
}
```

```
1. Verify tempToken (purpose: "otp:password_reset_step2_2fa_pending")
2. Verify 2FA code (TOTP / OTP / backup code)
3. Apply stored new password
4. Invalidate all sessions
5. Send "password changed" security email
```

> **Why require 2FA for password reset?** Prevents an attacker who stole only the email from bypassing 2FA by resetting the password.

---

## 5. 2FA Setup

### Option A — Email OTP (Default / Always Available) ✅

Email OTP is always enabled as a fallback. No explicit setup needed. Controlled by `emailOtpFallbackEnabled` in `TwoFactorAuth` entity.

### Option B — TOTP (Authenticator App) 🏗️

Infrastructure complete, endpoints not yet built.

**Endpoint**: `POST /api/v1/users/me/2fa/setup/totp` *(not yet implemented)*

```
1. Generate TOTP secret (base32, 32 bytes)
2. Encrypt secret (AES-256-GCM)
3. Generate QR code: otpauth://totp/AppName:user@email.com?secret=...&issuer=AppName
4. Generate 8 recovery/backup codes → hash each with bcrypt → store in TwoFactorAuth.backupCodes
5. Return QR code + manual entry key + backup codes
```

**Verify & Activate TOTP**: `POST /api/v1/users/me/2fa/verify/totp` *(not yet implemented)*

```
1. Verify submitted TOTP code
2. Set totpEnabled = true, totpVerified = true, primaryMethod = 'totp', isEnabled = true
3. Update user.twoFactorEnabled = true
```

### Option C — SMS OTP 🏗️

Schema complete, SMS service not yet integrated.

**Endpoint**: `POST /api/v1/users/me/2fa/setup/mobile-otp` *(not yet implemented)*

---

## 6. Recovery / Backup Codes

When 2FA is enabled (TOTP or SMS), **8 one-time recovery codes** are generated.

### At Setup Time

```
1. Generate 8 codes (format: XXXX-XXXX-XX, 10 chars)
2. bcrypt.hash each code
3. Store in TwoFactorAuth.backupCodes as JSONB array:
   [
     { code: "<bcrypt_hash>", isUsed: false, usedAt: null },
     ...
   ]
4. TwoFactorAuth.backupCodesRemaining = 8
```

### Delivery 🏗️

> **Design Decision (to implement)**: Backup codes should be:
> 1. Displayed **once** in the app at setup (user downloads/screenshots)
> 2. Optionally downloadable as a `.txt` file from the app
> 3. **NOT emailed** (security risk — email could be compromised)
> 4. Re-generable via `POST /api/v1/users/me/2fa/backup-codes/regenerate` *(not yet implemented)*

**Sample `.txt` content** (when downloaded):
```
Demigod Recovery Codes
Generated: 2026-02-19
Account: john@company-a.com

ABCD-EFGH-IJ
KLMN-OPQR-ST
UVWX-YZAB-CD
EFGH-IJKL-MN
OPQR-STUV-WX
YZAB-CDEF-GH
IJKL-MNOP-QR
STUV-WXYZ-AB

Each code can only be used ONCE.
Store these codes in a safe place.
```

### Using a Backup Code at Login

When all other 2FA methods fail (lost phone, no authenticator access):

```
POST /api/v1/auth/complete-2fa
{
  "code": "ABCD-EFGH-IJ",
  "method": "backup_code"
}

Flow:
1. Iterate TwoFactorAuth.backupCodes array
2. bcrypt.compare submitted code against each stored hash
3. If match found AND isUsed = false:
   - Mark code as isUsed = true, usedAt = now
   - Decrement backupCodesRemaining
   - Issue full session tokens
4. If backupCodesRemaining = 0 → return 403 with instructions to contact support
```

> **Status**: 🏗️ Schema complete, endpoint logic not yet implemented.

### Regenerating Backup Codes 🏗️

**Endpoint**: `POST /api/v1/users/me/2fa/backup-codes/regenerate` *(not yet implemented)*

Requires: current password + current 2FA code. Invalidates all previous backup codes.

---

## 7. Token Refresh

**Endpoint**: `POST /api/v1/auth/refresh` ✅

```json
{ "refreshToken": "eyJ..." }
```

```
1. Decode refresh token → extract JTI + userId
2. Find session by JTI (isActive = true)
3. If not found → possible reuse attack → 401
4. Check session not expired
5. bcrypt.compare provided token against session.refreshTokenHash
6. Check tokenVersion matches → if stale version: reuse detected → revoke family → 401
7. Token rotation:
   - New access token (15 min)
   - New refresh token (7 days)
   - New JTI
8. Update session: new hash, incremented tokenVersion, same tokenFamily
9. Return new token pair
```

---

## 8. Session Management

### Get Active Sessions ✅

**Endpoint**: `GET /api/v1/users/me/sessions`

```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "deviceName": "Samsung Galaxy S24",
      "deviceType": "mobile",
      "isCurrent": true,
      "isTrusted": false,
      "createdAt": "2026-02-19T10:30:00Z",
      "lastActivityAt": "2026-02-19T14:45:00Z"
    }
  ]
}
```

### Logout Single Session ✅

**Endpoint**: `DELETE /api/v1/users/me/sessions/:sessionId`

### Logout All Devices ✅

**Endpoint**: `POST /api/v1/auth/logout-all`

### Trusted Device (Mark as Safe for 30 Days) 🏗️

Endpoint not yet built. Schema supports it via `UserSession.isTrusted`.

---

## 9. Rate Limiting Rules

### Login Attempts (Per Identifier)

| Threshold | Window | Action |
|-----------|--------|--------|
| 3 failures | 15 min | Lock 15 min |
| 5 failures | 1 hour | Lock 1 hour |
| 10 failures | 24 hours | Account suspended (requires admin unlock) |

### OTP Verification

| Threshold | Action |
|-----------|--------|
| 5 failed OTP attempts | Temp token invalidated, re-login required |

### Password Reset (Per Email)

| Threshold | Window | Action |
|-----------|--------|--------|
| 3 requests | 15 min | Block 15 min |
| 5 requests | 1 hour | Block 1 hour |

---

## 10. Database Schema

### user_sessions (✅ implemented)

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti VARCHAR(100) UNIQUE NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  token_family VARCHAR(100),
  token_version INT DEFAULT 1,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  device_fingerprint VARCHAR(64),
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT true,
  is_trusted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(100)
);
```

### user_biometrics (✅ implemented)

```sql
CREATE TABLE user_biometrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(64),
  device_name VARCHAR(255),
  public_key TEXT NOT NULL,         -- RSA PEM public key
  pending_challenge TEXT,           -- Random nonce awaiting signature
  challenge_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,             -- 90 days from setup
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMP
);
```

### two_factor_auth (🏗️ schema ready)

```sql
CREATE TABLE two_factor_auth (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  primary_method VARCHAR(20),       -- 'totp' | 'mobile_otp' | 'email_otp'
  is_enabled BOOLEAN DEFAULT false,
  totp_secret_encrypted TEXT,       -- AES-256-GCM encrypted
  totp_enabled BOOLEAN DEFAULT false,
  totp_verified BOOLEAN DEFAULT false,
  backup_codes JSONB,               -- [{code, isUsed, usedAt}, ...]
  backup_codes_used INT DEFAULT 0,
  backup_codes_remaining INT DEFAULT 8,
  mobile_otp_enabled BOOLEAN DEFAULT false,
  mobile_otp_phone VARCHAR(20),
  mobile_otp_phone_verified BOOLEAN DEFAULT false,
  email_otp_fallback_enabled BOOLEAN DEFAULT true,
  remember_device_enabled BOOLEAN DEFAULT true,
  remember_device_duration_days INT DEFAULT 30,
  failed_totp_attempts INT DEFAULT 0,
  totp_locked_until TIMESTAMP,
  last_verified_at TIMESTAMP
);
```

### login_attempts (✅ implemented)

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  identifier_type VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN DEFAULT false,
  failure_reason VARCHAR(100),
  consecutive_failures INT DEFAULT 0,
  was_blocked BOOLEAN DEFAULT false,
  is_suspicious BOOLEAN DEFAULT false,
  suspicion_flags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Full Auth Decision Tree

```
POST /auth/login
│
├─ Rate limit exceeded? → 429
├─ User not found? → 401 (logged)
├─ Wrong password? → 401 (logged, counter++)
├─ User INACTIVE/SUSPENDED? → 401
│
├─ 2FA disabled?
│   └─ YES → Issue tokens → ✅ Done
│
└─ 2FA enabled?
    ├─ Device trusted? (isTrusted session exists) 🏗️
    │   └─ YES → Issue tokens → ✅ Done (skip 2FA)
    │
    └─ NO → Return tempToken
        │
        ├─ POST /auth/complete-2fa (Email OTP) ✅
        ├─ POST /auth/complete-2fa (TOTP) 🏗️
        ├─ POST /auth/complete-2fa (SMS OTP) 🏗️
        └─ POST /auth/complete-2fa (Backup Code) 🏗️
            │
            └─ All 2FA methods exhausted?
                └─ Contact support / admin unlock
```

---

## 12. What's Implemented vs Pending

### ✅ Fully Working

| Feature | Endpoint |
|---------|----------|
| Email/Phone/UserId + Password login | `POST /auth/login` |
| 2FA via Email OTP | `POST /auth/complete-2fa` |
| OTP resend | `POST /otp/resend` |
| Password reset (email OTP) | `POST /auth/forgot-password` + `POST /auth/reset-password` |
| Change password | `POST /auth/change-password` |
| Token refresh with rotation | `POST /auth/refresh` |
| Logout single session | `POST /auth/logout` |
| Logout all sessions | `POST /auth/logout-all` |
| Biometric (fingerprint) login | `POST /auth/biometric-challenge` + `POST /auth/biometric-login` |
| Biometric setup (register key pair) | `POST /auth/biometric-setup` |
| Biometric revoke | `POST /auth/biometric-revoke` |
| PIN login (client-side + biometric API) | Client only |
| Google OAuth2 | `GET /auth/google` |
| Rate limiting on login | Built into login flow |

### 🏗️ Schema Ready, Endpoints Pending

| Feature | Notes |
|---------|-------|
| TOTP 2FA setup | QR code + secret generation + verification |
| SMS OTP 2FA | SMS service not integrated |
| Backup/recovery codes | Generation + verification at login |
| Backup code regeneration | Requires password + 2FA |
| Trusted device management | Mark/unmark + list trusted devices |
| List active sessions UI | GET sessions endpoint exists but not wired to frontend |
| Revoke specific session | DELETE session endpoint exists |

### ❌ Not Yet Planned

| Feature |
|---------|
| WebAuthn / FIDO2 |
| Suspicious activity email alerts |
| Login history display (UI) |
| Emergency admin unlock flow (UI) |
| Email verification flow (UI) |
| Phone number verification flow (UI) |
