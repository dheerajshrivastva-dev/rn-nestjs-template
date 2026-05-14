# Authentication Architecture Summary

This document summarizes the authentication mechanisms implemented in the EMI Management System.

## Two Authentication Systems

### 1. User Authentication (JWT-based)
**Used by:** User Mobile App (React Native)

**Flow:**
1. User logs in with email/phone + password
2. If 2FA enabled → OTP verification required
3. Server issues:
   - Access Token (JWT, 15 min expiry)
   - Refresh Token (JWT, 7 days, stored in DB)
4. Access token used for all API calls: `Authorization: Bearer <token>`
5. Refresh token used to get new access token when expired

**Security Features:**
- Short-lived access tokens (15 min)
- Refresh token rotation on each refresh
- 2FA with OTP for sensitive operations
- Rate limiting: 5 failed login attempts → 15 min lockout
- Max 5 concurrent sessions per user
- Device fingerprinting (IP, user-user)
- Auto-revoke all sessions on password change

---

### 2. Device Authentication (Signature-based)
**Used by:** Client Device App (React Native with Device Owner)

**Why Signature-based?**
- Devices don't have "users" that log in
- Need stateless, secure communication without sessions
- Mutual authentication (device verifies server, server verifies device)
- No credentials to steal (uses cryptographic keys)

## Zero-Touch Provisioning Flow

### Phase 1: User Creates Client Record

```
User App:
1. Create client with IMEI, client info, documents
2. Server generates 256-char uniqueCode
3. Server returns QR code containing:
   {
     "uniqueCode": "256-char-string",
     "companyId": "uuid",
     "imei1": "123456789012345",
     "imei2": "optional",
     "serverUrl": "https://api.yourservice.com"
   }
4. User shows QR code to customer
```

### Phase 2: Device Registration

```
Customer Device:
1. Scans QR code
2. Generates RSA-2048 key pair (public + private)
3. Stores private key in Android Keystore (hardware-backed)
4. Collects device info (actual IMEI, model, Android version, etc.)
5. Calls POST /api/v1/clients/register-device with:
   - uniqueCode (from QR)
   - Device's public key
   - Actual device info

Server:
1. Validates uniqueCode
2. Compares user's IMEI vs device's actual IMEI
   - If match → Continue
   - If mismatch → Return warning, require confirmation
3. Generates server's RSA-2048 key pair
4. Generates deviceUniqueCode (256 chars)
5. Stores:
   - Device's public key
   - Server's key pair (private key encrypted)
   - deviceUniqueCode
6. Returns to device:
   - deviceUniqueCode
   - Server's public key
   - clientId
```

### Phase 3: Secure Communication

**Every API call from device:**

```
Device:
1. Prepare request (method, path, body)
2. Add timestamp (ISO-8601)
3. Create payload: method + path + timestamp + body
4. Sign payload with device's private key (RSA-SHA256)
5. Send request with headers:
   - X-Device-Unique-Code: deviceUniqueCode
   - X-Client-Id: clientId
   - X-Timestamp: timestamp
   - X-Signature: signature

Server:
1. Fetch client record by clientId
2. Verify deviceUniqueCode matches
3. Check timestamp (reject if > 5 min old - replay attack prevention)
4. Reconstruct payload: method + path + timestamp + body
5. Verify signature using device's public key
6. If valid → Process request
7. If invalid → Log failed auth, return 401

Server Response:
1. Create response payload
2. Sign with server's private key
3. Return with signature in headers

Device:
1. Verify server's signature using server's public key
2. If valid → Process response
3. If invalid → Reject, show security alert
```

## Why This Approach?

### User Authentication (JWT)
✅ Standard for mobile apps with user login
✅ Short-lived tokens minimize risk
✅ Refresh tokens allow revocation
✅ 2FA adds extra security layer

### Device Authentication (Signatures)
✅ **No session state** - scales horizontally
✅ **Mutual authentication** - both parties verify each other
✅ **No credentials to steal** - uses cryptographic keys
✅ **Replay attack prevention** - timestamp validation
✅ **Key compromise detection** - failed auth tracking
✅ **Hardware-backed security** - Android Keystore
✅ **Cannot be impersonated** - device and server both verify signatures

## Security Highlights

### Against Common Attacks:

1. **Man-in-the-Middle (MITM)**
   - Certificate pinning on device
   - Mutual signature verification
   
2. **Replay Attacks**
   - Timestamp validation (5-minute window)
   - Signature includes timestamp
   
3. **Key Compromise**
   - Private keys encrypted at rest
   - Android Keystore hardware protection
   - Key rotation every 90 days
   - Failed auth tracking (10 failures → deactivate)
   
4. **Device Impersonation**
   - 256-char cryptographically secure codes
   - IMEI validation
   - Signature verification
   
5. **Server Impersonation**
   - Device verifies server's signature
   - Certificate pinning

## Database Changes

### Updated `clients` Table:
```sql
-- Added fields:
uniqueCode VARCHAR(256)              -- For QR code
deviceUniqueCode VARCHAR(256)        -- For API auth
devicePublicKey TEXT                 -- Device's public key
serverPublicKey TEXT                 -- Server's public key
serverPrivateKey TEXT                -- Encrypted
actualImei1, actualImei2 VARCHAR(20) -- Actual from device
deviceRegisteredAt TIMESTAMP
imeiMismatch BOOLEAN
imeiChangedAt TIMESTAMP
```

### New `device_auth_logs` Table:
```sql
-- Logs all device authentication attempts
clientId, endpoint, method
deviceUniqueCode, signatureValid
status (success/invalid_signature/expired_timestamp/replay_attack)
ipAddress, userAgent
```

## API Endpoints Added

```
# Device Registration
POST /api/v1/clients/register-device
POST /api/v1/clients/register-device/confirm

# Device Communication (all require signature auth)
POST /api/v1/clients/:id/sync
POST /api/v1/clients/:id/heartbeat
GET  /api/v1/clients/:id/commands
POST /api/v1/clients/:id/command-ack

# User APIs
GET  /api/v1/clients/:id/qr-code  # Regenerate QR if needed
```

## Business Rules

1. **uniqueCode expires after 7 days** if device not registered
2. **One-time use**: uniqueCode can only be used once
3. **IMEI uniqueness**: One IMEI = one client at a time
4. **IMEI mismatch**: Requires user confirmation + user notification
5. **Signature timeout**: 5-minute window to prevent replay attacks
6. **Failed auth limit**: 10 consecutive failures → auto-deactivate + alert user
7. **Rate limiting**: 100 requests/minute per deviceUniqueCode
8. **Key rotation**: Recommended every 90 days
9. **Root detection**: Warn on rooted devices

## Implementation Notes

### Device Side (React Native):
```javascript
// 1. Generate key pair on registration
const { publicKey, privateKey } = await generateRSAKeyPair(2048);
await SecureStore.setItem('devicePrivateKey', privateKey);

// 2. For each API call
const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body)}`;
const signature = await signRSA(payload, privateKey);

// 3. Verify server response
const valid = await verifyRSA(responsePayload, serverSignature, serverPublicKey);
```

### Server Side (Node.js):
```javascript
// 1. Verify device signature
const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body)}`;
const valid = crypto.verify('RSA-SHA256', Buffer.from(payload), devicePublicKey, signature);

// 2. Sign response
const responsePayload = `${statusCode}:${timestamp}:${JSON.stringify(data)}`;
const signature = crypto.sign('RSA-SHA256', Buffer.from(responsePayload), serverPrivateKey);
```

## What You Asked For - Confirmed ✅

✅ Zero-Touch Provisioning with QR code (256-char uniqueCode)
✅ User creates client with IMEI, documents, client info
✅ Device registers by scanning QR
✅ IMEI mismatch detection with confirmation flow
✅ Secure communication without login (signature-based)
✅ deviceUniqueCode for authentication
✅ Mutual verification (device can't be impersonated, server can't be impersonated)
✅ JWT for agents (already handled)
✅ Complete data flow diagrams in HLD.md

## Files Updated

1. **[HLD.md](HLD.md)** - Main design document with:
   - Section 5: Complete authentication architecture
   - Section 3.6: Updated clients table schema
   - Section 3.19: New device_auth_logs table
   - Section 4.4: Updated client APIs
   - Section 6.14-6.15: Authentication business rules
   - Section 7.13: Zero-Touch Provisioning flow diagram
   - Section 8.2: Authentication edge cases (26-38)

## Next Steps (Implementation)

1. Set up NestJS/Express project structure
2. Implement RSA key generation utilities
3. Create authentication middleware for both JWT and signature verification
4. Implement device registration endpoints
5. Build QR code generation service
6. Add Android Keystore integration in React Native
7. Implement certificate pinning in mobile apps
8. Set up device auth logging and monitoring
