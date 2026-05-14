# DEMIGOD Cryptographic Flow Analysis
## RSA + AES Encryption for Device Authentication

**Date:** 2026-01-20
**Status:** Implementation Analysis with Gap Identification

---

## Overview

The system uses a **hybrid cryptographic approach**:
- **RSA 2048-bit** for asymmetric key exchange
- **AES-256-CBC** for symmetric encryption of server private keys
- **Device signature verification** for API authentication

---

## Complete Flow: Client Creation → Device Activation → Ongoing Communication

### Phase 1: Client Creation (Retailer Action)

**Actor:** RETAILER (via web/mobile app)

```
RETAILER → Server
POST /clients
{
  clientName: "John Doe",
  clientPhone1: "+1234567890",
  imei1: "123456789012345",  // Optional at this stage
  totalAmount: 50000,
  ...
}
```

**Server Actions:**
1. Validates retailer has balance >= 1
2. Generates **uniqueCode** (256 characters, hex)
   ```typescript
   const uniqueCode = randomBytes(128).toString('hex');
   // Result: 64a7f3b2c1... (256 chars)
   ```
3. Creates client record with status: `DEVICE_NOT_REGISTERED`
4. Deducts 1 key from retailer balance
5. Creates balance sheet entry

**Server Response:**
```json
{
  "client": {
    "id": "client-uuid",
    "uniqueCode": "64a7f3b2c1...",  // 256 chars
    "status": "DEVICE_NOT_REGISTERED"
  },
  "qrCodeData": {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.demigod.dpc/.receivers.DemiDeviceAdminReceiver",
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      "com.demigod.dpc.EXTRA_ENROLLMENT_TOKEN": "64a7f3b2c1...",
      "com.demigod.dpc.EXTRA_SERVER_URL": "https://api.demigod.com",
      "com.demigod.dpc.EXTRA_COMPANY_ID": "company-uuid",
      "com.demigod.dpc.EXTRA_CLIENT_ID": "client-uuid",
      "com.demigod.dpc.EXTRA_IMEI1": "123456789012345"
    }
  }
}
```

**What's Stored in Database:**
```sql
clients table:
- id: UUID
- uniqueCode: "64a7f3b2c1..." (256 chars) -- Used ONCE for registration
- status: "DEVICE_NOT_REGISTERED"
- imei1: "123456789012345" (optional)
- deviceUniqueCode: NULL -- Generated during registration
- devicePublicKey: NULL
- serverPublicKey: NULL
- serverPrivateKey: NULL -- Will be encrypted with AES
```

---

### Phase 2: QR Code Display & Device Provisioning

**Actor:** RETAILER displays QR code to customer

**QR Code Contents:**
- Android Zero-Touch provisioning format
- Contains `uniqueCode` in extras bundle
- Device scans this during setup

---

### Phase 3: Device Registration (First Contact)

**Actor:** Android Device (during zero-touch provisioning)

#### Step 1: Device Generates RSA Key Pair

**Device-side (Android app):**
```kotlin
// Device generates its own RSA key pair
val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
keyPairGenerator.initialize(2048)
val deviceKeyPair = keyPairGenerator.generateKeyPair()

val devicePublicKey = deviceKeyPair.public.encoded // PEM format
val devicePrivateKey = deviceKeyPair.private // STORED SECURELY ON DEVICE
```

**Device Storage (Android KeyStore):**
```
Android KeyStore (Hardware-backed if available):
- devicePrivateKey: NEVER leaves device, hardware-protected
- devicePublicKey: Sent to server
```

#### Step 2: Device Calls Registration Endpoint

```
Device → Server
POST /clients/register-device
Headers: (NONE - Public endpoint)
Body:
{
  "uniqueCode": "64a7f3b2c1...",  // From QR code
  "imei1": "123456789012345",
  "imei2": "123456789012346",
  "androidApiLevel": 33,
  "androidVersion": "13",
  "deviceManufacturer": "Samsung",
  "deviceModel": "SM-G998B",
  "deviceSerialNumber": "R58N123ABCD",
  "androidDeviceId": "1234567890abcdef",
  "devicePublicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjAN..."  // Device's public key (PEM)
}
```

#### Step 3: Server Registration Logic

**Server Actions (client.service.ts:454-526):**

```typescript
// 1. Validate uniqueCode
const client = await this.clientRepository.findOne({
  where: { uniqueCode },
  relations: ['company'],
});

// 2. Check IMEI mismatch
if (client.imei1 && client.imei1 !== imei1) {
  imeiMismatch = true;
}

// 3. Generate deviceUniqueCode (256 chars)
const deviceUniqueCode = randomBytes(128).toString('hex');
// Result: "f3a8c9d2b4..." (256 chars)

// 4. Generate SERVER RSA key pair (2048-bit)
const { publicKey: serverPublicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
// serverPublicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjAN..." (PEM)
// privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA..." (PEM)

// 5. Encrypt server private key with AES-256-CBC
const encryptionKey = process.env.CRYPTO_ENCRYPTION_KEY || 'demigod-default-encryption-key-32';
const iv = cryptoRandomBytes(16); // Random IV (16 bytes)
const cipher = createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.substring(0, 32)), iv);
let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
encryptedPrivateKey += cipher.final('hex');

// 6. Store IV with encrypted key (format: "iv:encrypted")
const serverPrivateKey = `${iv.toString('hex')}:${encryptedPrivateKey}`;
// Result: "a1b2c3d4e5f6....:4f3a2b1c9d8e...." (IV:Encrypted)
```

**Database Update:**
```sql
UPDATE clients SET
  deviceUniqueCode = 'f3a8c9d2b4...',  -- NEW: For future auth
  devicePublicKey = '-----BEGIN PUBLIC KEY----- (device)',
  serverPublicKey = '-----BEGIN PUBLIC KEY----- (server)',
  serverPrivateKey = 'a1b2c3d4...:4f3a2b1c...',  -- Encrypted with AES
  actualImei1 = '123456789012345',
  actualImei2 = '123456789012346',
  androidApiLevel = 33,
  androidVersion = '13',
  deviceManufacturer = 'Samsung',
  deviceModel = 'SM-G998B',
  deviceSerialNumber = 'R58N123ABCD',
  androidDeviceId = '1234567890abcdef',
  deviceRegisteredAt = NOW(),
  lastDeviceSyncAt = NOW(),
  status = 'DEVICE_VERIFIED',
  imeiMismatch = false  -- or true if mismatch detected
WHERE id = 'client-uuid';
```

#### Step 4: Server Response to Device

```json
{
  "deviceUniqueCode": "f3a8c9d2b4...",  // 256 chars - Device stores this
  "serverPublicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjAN...",  // Server's public key
  "clientId": "client-uuid",
  "companyId": "company-uuid",
  "serverUrl": "https://api.demigod.com",
  "registeredAt": "2026-01-20T10:30:00Z",
  "imeiMismatch": false,
  "status": "DEVICE_VERIFIED"
}
```

**Device Storage After Registration:**
```
Android Shared Preferences (Encrypted):
- deviceUniqueCode: "f3a8c9d2b4..." (256 chars)
- serverPublicKey: "-----BEGIN PUBLIC KEY-----..."
- clientId: "client-uuid"
- companyId: "company-uuid"
- serverUrl: "https://api.demigod.com"

Android KeyStore (Hardware-backed):
- devicePrivateKey: [NEVER TRANSMITTED, HARDWARE PROTECTED]
```

---

## Key Material Summary After Registration

| Key Material | Location | Format | Purpose |
|-------------|----------|--------|---------|
| **uniqueCode** | Server DB (marked as used) | 256-char hex | ONE-TIME registration token |
| **deviceUniqueCode** | Server DB + Device Storage | 256-char hex | Device authentication identifier |
| **Device Private Key** | Device KeyStore ONLY | RSA 2048-bit PEM | Sign requests (never leaves device) |
| **Device Public Key** | Server DB | RSA 2048-bit PEM | Verify device signatures |
| **Server Private Key** | Server DB (AES encrypted) | RSA 2048-bit PEM (encrypted) | Decrypt device messages |
| **Server Public Key** | Device Storage + Server DB | RSA 2048-bit PEM | Device encrypts messages to server |

---

## Phase 4: Ongoing Device Communication (Authenticated API Calls)

### Authentication Mechanism: RSA Signature Verification

**Every device API call uses:**
1. **deviceUniqueCode** (identifies the device)
2. **RSA Signature** (proves device identity)

#### Example: Device Sync Request

**Device-side:**
```kotlin
// 1. Prepare request payload
val method = "POST"
val path = "/device/sync"
val timestamp = System.currentTimeMillis() / 1000
val body = """{"lastSyncAt":"2026-01-20T10:00:00Z"}"""

// 2. Create signature payload
val signaturePayload = "$method:$path:$timestamp:$body"
// Result: "POST:/device/sync:1705750800:{\"lastSyncAt\":\"2026-01-20T10:00:00Z\"}"

// 3. Sign with device private key (from KeyStore)
val signature = Signature.getInstance("SHA256withRSA")
signature.initSign(devicePrivateKey) // From Android KeyStore
signature.update(signaturePayload.toByteArray())
val signatureBytes = signature.sign()
val signatureBase64 = Base64.encodeToString(signatureBytes, Base64.NO_WRAP)

// 4. Send request
HTTP Request:
POST /device/sync
Headers:
  X-Client-Id: client-uuid
  X-Device-Unique-Code: f3a8c9d2b4...
  X-Timestamp: 1705750800
  X-Signature: iJKLMNOPQRSTUVWXYZ... (Base64-encoded signature)
Body:
  {"lastSyncAt":"2026-01-20T10:00:00Z"}
```

**Server-side Verification (DeviceSignatureGuard):**

```typescript
// ⚠️ NOT YET IMPLEMENTED - REQUIRED FOR PHASE 3

@Injectable()
export class DeviceSignatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract headers
    const clientId = request.headers['x-client-id'];
    const deviceUniqueCode = request.headers['x-device-unique-code'];
    const timestamp = request.headers['x-timestamp'];
    const signature = request.headers['x-signature'];

    // 2. Validate timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) { // 5 minutes
      throw new UnauthorizedException('Request timestamp expired');
    }

    // 3. Fetch client from database
    const client = await this.clientRepository.findOne({
      where: { id: clientId, deviceUniqueCode },
    });

    if (!client || !client.devicePublicKey) {
      throw new UnauthorizedException('Invalid device credentials');
    }

    // 4. Reconstruct signature payload
    const method = request.method;
    const path = request.path;
    const body = JSON.stringify(request.body);
    const signaturePayload = `${method}:${path}:${timestamp}:${body}`;

    // 5. Verify signature using device's public key
    const verify = crypto.createVerify('SHA256');
    verify.update(signaturePayload);
    verify.end();

    const isValid = verify.verify(
      client.devicePublicKey,
      Buffer.from(signature, 'base64')
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 6. Attach client to request for use in controllers
    request.client = client;
    return true;
  }
}
```

---

## Phase 5: Device Commands (Server → Device Communication)

### Scenario: Retailer locks device due to missed payment

**Retailer → Server:**
```
POST /clients/:id/device/lock
Authorization: Bearer <retailer-jwt-token>
{
  "lockMessage": "Payment overdue. Please contact retailer."
}
```

**Server Actions:**
1. Validates retailer owns this client
2. Creates DeviceCommand record:
   ```sql
   INSERT INTO device_commands (
     clientId,
     commandType,
     payload,
     status,
     createdAt
   ) VALUES (
     'client-uuid',
     'LOCK',
     '{"lockMessage": "Payment overdue..."}',
     'PENDING',
     NOW()
   );
   ```

**Device Periodic Sync (Every 15 minutes or on event):**
```
Device → Server
POST /device/sync
Headers:
  X-Client-Id: client-uuid
  X-Device-Unique-Code: f3a8c9d2b4...
  X-Timestamp: 1705750800
  X-Signature: iJKLMNOPQRSTUVWXYZ...
Body:
  {"lastSyncAt":"2026-01-20T10:00:00Z"}
```

**Server Response:**
```json
{
  "commands": [
    {
      "id": "cmd-uuid",
      "type": "LOCK",
      "payload": {
        "lockMessage": "Payment overdue. Please contact retailer."
      },
      "createdAt": "2026-01-20T11:00:00Z"
    }
  ],
  "serverTimestamp": "2026-01-20T11:15:00Z"
}
```

**Device Executes Command:**
1. Locks the device
2. Displays lock message
3. Sends acknowledgment:
   ```
   POST /device/commands/cmd-uuid/ack
   Headers: (signed request)
   Body:
     {"status": "EXECUTED", "executedAt": "2026-01-20T11:15:30Z"}
   ```

**Server Updates:**
```sql
UPDATE device_commands SET
  status = 'EXECUTED',
  executedAt = '2026-01-20T11:15:30Z'
WHERE id = 'cmd-uuid';
```

---

## Encryption Use Cases

### Use Case 1: Device Sends Sensitive Data to Server

**Scenario:** Device sends user's payment information

**Device-side:**
```kotlin
// 1. Prepare sensitive data
val sensitiveData = """{"cardNumber":"4111111111111111","cvv":"123"}"""

// 2. Encrypt with server's public key
val cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding")
cipher.init(Cipher.ENCRYPT_MODE, serverPublicKey)
val encryptedData = cipher.doFinal(sensitiveData.toByteArray())
val encryptedBase64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP)

// 3. Send encrypted data
POST /device/payment
Headers: (signed request)
Body:
  {"encryptedPayload": "aB3dE5fG7hI9..."}
```

**Server-side:**
```typescript
// 1. Fetch server private key from database (encrypted)
const [ivHex, encryptedPrivateKeyHex] = client.serverPrivateKey.split(':');

// 2. Decrypt server private key with AES
const iv = Buffer.from(ivHex, 'hex');
const encryptionKey = process.env.CRYPTO_ENCRYPTION_KEY.substring(0, 32);
const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
let serverPrivateKeyPEM = decipher.update(encryptedPrivateKeyHex, 'hex', 'utf8');
serverPrivateKeyPEM += decipher.final('utf8');

// 3. Decrypt device's message with server private key
const encryptedPayload = Buffer.from(request.body.encryptedPayload, 'base64');
const decryptedData = crypto.privateDecrypt(
  {
    key: serverPrivateKeyPEM,
    padding: crypto.constants.RSA_PKCS1_PADDING
  },
  encryptedPayload
);

const sensitiveData = JSON.parse(decryptedData.toString('utf8'));
// Result: {cardNumber: "4111111111111111", cvv: "123"}
```

### Use Case 2: Server Sends Sensitive Command to Device

**Scenario:** Server sends device unlock PIN

**Server-side:**
```typescript
// 1. Prepare sensitive command
const unlockCommand = JSON.stringify({ unlockPIN: "1234" });

// 2. Encrypt with device's public key
const encrypted = crypto.publicEncrypt(
  {
    key: client.devicePublicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  },
  Buffer.from(unlockCommand)
);

// 3. Send to device
{
  "commands": [{
    "type": "UNLOCK",
    "encryptedPayload": encrypted.toString('base64')
  }]
}
```

**Device-side:**
```kotlin
// 1. Decrypt with device private key
val cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding")
cipher.init(Cipher.DECRYPT_MODE, devicePrivateKey) // From KeyStore
val decryptedData = cipher.doFinal(Base64.decode(encryptedPayload, Base64.NO_WRAP))
val command = String(decryptedData)
// Result: {"unlockPIN": "1234"}
```

---

## Security Analysis

### ✅ What's Implemented (Current)

1. **RSA Key Generation** ✅
   - Server generates 2048-bit RSA key pair
   - Proper PEM encoding (SPKI for public, PKCS8 for private)
   - Code: `client.service.ts:487-497`

2. **AES-256 Encryption** ✅
   - Server private key encrypted with AES-256-CBC
   - Random 16-byte IV generated for each encryption
   - IV stored with encrypted data (format: `iv:encrypted`)
   - Uses environment variable `CRYPTO_ENCRYPTION_KEY`
   - Code: `client.service.ts:499-508`

3. **Secure Key Storage** ✅
   - Server private key NEVER stored in plaintext
   - Device public key stored for signature verification
   - Server public key sent to device for encryption

4. **Device Authentication Identifiers** ✅
   - `uniqueCode`: One-time registration token (256 chars)
   - `deviceUniqueCode`: Permanent device identifier (256 chars)

### ⚠️ What's Missing (Required for Phase 3)

1. **DeviceSignatureGuard** ❌ NOT IMPLEMENTED
   - File: `src/common/guards/device-signature.guard.ts`
   - Purpose: Verify RSA signatures on device API calls
   - Required for: All device endpoints (`/device/*`)
   - Implementation needed:
     ```typescript
     @Injectable()
     export class DeviceSignatureGuard implements CanActivate {
       // Verify signature using device's public key
       // Prevent replay attacks (timestamp validation)
       // Attach client to request context
     }
     ```

2. **Server Private Key Decryption Helper** ❌ NOT IMPLEMENTED
   - File: `src/common/utils/crypto.utils.ts`
   - Purpose: Decrypt server private key when needed
   - Required for: Decrypting device messages
   - Implementation needed:
     ```typescript
     export function decryptServerPrivateKey(
       encryptedPrivateKey: string,
       encryptionKey: string
     ): string {
       const [ivHex, encrypted] = encryptedPrivateKey.split(':');
       const decipher = createDecipheriv('aes-256-cbc', ...);
       return decryptedPrivateKey;
     }
     ```

3. **Device Command Encryption** ❌ NOT IMPLEMENTED
   - Purpose: Encrypt sensitive commands sent to device
   - Required for: Emergency unlock PIN, sensitive data
   - Uses: Device's public key for encryption

4. **Request Payload Encryption/Decryption** ❌ NOT IMPLEMENTED
   - Purpose: Encrypt sensitive data in device↔server communication
   - Required for: Payment info, personal data, etc.

---

## Implementation Gaps & Recommendations

### Critical (Must Implement for Phase 3)

1. **DeviceSignatureGuard**
   - Priority: CRITICAL
   - Complexity: MEDIUM
   - Time: 0.5 day
   - Files to create:
     - `src/common/guards/device-signature.guard.ts`
     - `src/common/guards/device-signature.guard.spec.ts`

2. **Crypto Utilities**
   - Priority: CRITICAL
   - Complexity: LOW
   - Time: 0.25 day
   - Files to create:
     - `src/common/utils/crypto.utils.ts`
     - Functions: `decryptServerPrivateKey()`, `encryptWithPublicKey()`, `decryptWithPrivateKey()`

3. **Device Command Encryption**
   - Priority: HIGH
   - Complexity: LOW
   - Time: 0.25 day
   - Modify: `DeviceCommandService` to support encrypted payloads

### Important (Should Implement)

4. **Replay Attack Prevention**
   - Store used timestamps in Redis (TTL: 5 minutes)
   - Reject duplicate `timestamp + signature` combinations

5. **Key Rotation Support**
   - Allow devices to request new server keys periodically
   - Deprecate old keys gracefully

6. **Hardware Security Module (HSM) Integration**
   - For production: Use AWS KMS or Azure Key Vault
   - Store `CRYPTO_ENCRYPTION_KEY` in HSM instead of env var

### Optional (Nice to Have)

7. **Perfect Forward Secrecy**
   - Implement ECDHE key exchange for session keys
   - Use RSA only for initial handshake

8. **Certificate Pinning**
   - Android app pins server's SSL certificate
   - Prevents MITM attacks

---

## Environment Variables Required

```bash
# .env
CRYPTO_ENCRYPTION_KEY=your-32-character-encryption-key-here  # CRITICAL: Must be 32 bytes
SERVER_URL=https://api.demigod.com
DPC_PACKAGE_NAME=com.demigod.dpc
DPC_SIGNATURE_CHECKSUM=sha256-hash-of-apk-signature
DPC_DOWNLOAD_URL=https://play.google.com/store/apps/details?id=com.demigod.dpc
```

**Security Notes:**
- `CRYPTO_ENCRYPTION_KEY` should be:
  - 32 bytes (256 bits) for AES-256
  - Randomly generated (`openssl rand -base64 32`)
  - NEVER committed to git
  - Rotated periodically
  - Stored in environment/secrets manager

---

## Testing Checklist

### Unit Tests
- [ ] RSA key pair generation
- [ ] AES encryption/decryption
- [ ] Server private key storage format
- [ ] Signature creation and verification

### Integration Tests
- [ ] Full device registration flow
- [ ] Signature verification with valid key
- [ ] Signature verification with invalid key
- [ ] Timestamp expiration (replay attack)
- [ ] Encrypted payload exchange

### Security Tests
- [ ] Replay attack prevention
- [ ] MITM attack resistance (with SSL pinning)
- [ ] Brute force signature attempts
- [ ] Key rotation workflow

---

## Mermaid Diagrams Follow in Next Section...
