# DEMIGOD Cryptographic Flow - Mermaid Diagrams

## Diagram 1: Complete Registration Flow with Key Exchange

```mermaid
sequenceDiagram
    actor R as Retailer
    participant S as Server
    participant DB as Database
    participant D as Android Device
    participant KS as Device KeyStore

    Note over R,KS: PHASE 1: Client Creation
    R->>S: POST /clients<br/>(clientName, imei1, totalAmount, ...)
    S->>S: Generate uniqueCode (256 chars)<br/>randomBytes(128).toString('hex')
    S->>DB: INSERT client<br/>(uniqueCode, status: DEVICE_NOT_REGISTERED)
    S->>S: Generate QR Code Data<br/>(Android Zero-Touch format)
    S-->>R: {client, qrCodeData}

    Note over R,KS: PHASE 2: QR Code Display
    R->>R: Display QR Code to Customer

    Note over R,KS: PHASE 3: Device Provisioning & Registration
    D->>D: Factory Reset & Setup
    D->>D: Scan QR Code
    D->>D: Extract uniqueCode from QR

    Note over D,KS: Device Generates RSA Keys
    D->>KS: Generate RSA 2048-bit Key Pair
    KS-->>D: {devicePublicKey, devicePrivateKey}
    D->>KS: Store devicePrivateKey<br/>(Hardware-backed, never leaves device)

    Note over D,S: First Contact - Registration
    D->>S: POST /clients/register-device<br/>{uniqueCode, imei1, imei2,<br/>devicePublicKey, deviceInfo}

    Note over S: Server Key Generation & Encryption
    S->>DB: Find client by uniqueCode
    DB-->>S: client record
    S->>S: Validate status == DEVICE_NOT_REGISTERED
    S->>S: Check IMEI mismatch
    S->>S: Generate deviceUniqueCode (256 chars)

    rect rgb(200, 220, 255)
        Note over S: RSA Key Pair Generation
        S->>S: generateKeyPairSync('rsa', {modulusLength: 2048})
        S->>S: Result: {serverPublicKey, serverPrivateKey}
    end

    rect rgb(255, 220, 200)
        Note over S: AES Encryption of Private Key
        S->>S: Generate random IV (16 bytes)
        S->>S: Get CRYPTO_ENCRYPTION_KEY from env
        S->>S: createCipheriv('aes-256-cbc', key, iv)
        S->>S: Encrypt serverPrivateKey
        S->>S: Format: "iv:encryptedKey"
    end

    S->>DB: UPDATE client SET<br/>deviceUniqueCode,<br/>devicePublicKey,<br/>serverPublicKey,<br/>serverPrivateKey (encrypted),<br/>status: DEVICE_VERIFIED

    S-->>D: {deviceUniqueCode,<br/>serverPublicKey,<br/>clientId, companyId}

    Note over D: Device Stores Credentials
    D->>D: Store in Encrypted SharedPrefs:<br/>- deviceUniqueCode<br/>- serverPublicKey<br/>- clientId<br/>- companyId

    Note over R,KS: Registration Complete!

    Note over DB: Final Database State
    Note over DB: clients table:<br/>✓ uniqueCode (marked as used)<br/>✓ deviceUniqueCode (new auth token)<br/>✓ devicePublicKey (from device)<br/>✓ serverPublicKey (generated)<br/>✓ serverPrivateKey (AES encrypted)<br/>✓ status: DEVICE_VERIFIED
```

---

## Diagram 2: Key Material Flow & Storage

```mermaid
flowchart TB
    subgraph Registration["Registration Phase"]
        direction TB
        A[uniqueCode<br/>256 chars] -->|One-time use| B[Device Scans QR]
        B --> C[Device Registers]
        C --> D[deviceUniqueCode<br/>256 chars]
    end

    subgraph DeviceKeys["Device Key Pair"]
        direction TB
        DPub[Device Public Key<br/>RSA 2048-bit<br/>PEM Format]
        DPri[Device Private Key<br/>RSA 2048-bit<br/>HARDWARE PROTECTED]
        DPub -.->|Sent to| Server
        DPri -.->|NEVER leaves| DeviceKS[Android KeyStore]
    end

    subgraph ServerKeys["Server Key Pair"]
        direction TB
        SPub[Server Public Key<br/>RSA 2048-bit<br/>PEM Format]
        SPri[Server Private Key<br/>RSA 2048-bit<br/>PEM Format]
        SPri -->|AES-256-CBC| Encrypt[Encrypt with<br/>CRYPTO_ENCRYPTION_KEY]
        Encrypt --> EncPri["Encrypted:<br/>IV:EncryptedKey"]
    end

    subgraph Storage["Key Storage Locations"]
        direction TB
        DeviceStore["📱 Device Storage<br/>(Encrypted SharedPrefs)<br/>• deviceUniqueCode<br/>• serverPublicKey<br/>• clientId"]

        DeviceKS2["🔒 Android KeyStore<br/>(Hardware-backed)<br/>• devicePrivateKey"]

        ServerDB["💾 Server Database<br/>• uniqueCode (used)<br/>• deviceUniqueCode<br/>• devicePublicKey<br/>• serverPublicKey<br/>• serverPrivateKey (encrypted)"]
    end

    Registration --> D
    D --> DeviceStore
    DeviceKeys --> DeviceKS2
    DeviceKeys --> ServerDB
    ServerKeys --> ServerDB
    ServerKeys --> DeviceStore

    style DPri fill:#ff9999
    style EncPri fill:#ff9999
    style DeviceKS2 fill:#ffcccc
    style ServerDB fill:#ccffcc
    style DeviceStore fill:#ccccff
```

---

## Diagram 3: Authenticated API Call with RSA Signature

```mermaid
sequenceDiagram
    participant D as Device
    participant KS as KeyStore
    participant S as Server
    participant DB as Database
    participant G as DeviceSignatureGuard<br/>(⚠️ NOT IMPLEMENTED)

    Note over D,DB: Device Makes Authenticated API Call

    D->>D: Prepare Request<br/>method: POST<br/>path: /device/sync<br/>body: {...}
    D->>D: Get current timestamp
    D->>D: Create signature payload:<br/>"POST:/device/sync:timestamp:body"

    rect rgb(200, 255, 200)
        Note over D,KS: Sign with Device Private Key
        D->>KS: Request devicePrivateKey
        KS-->>D: devicePrivateKey (hardware-protected)
        D->>D: SHA256withRSA signature
        D->>D: Base64 encode signature
    end

    D->>S: POST /device/sync<br/>Headers:<br/>  X-Client-Id: uuid<br/>  X-Device-Unique-Code: 256-char<br/>  X-Timestamp: 1705750800<br/>  X-Signature: base64-signature<br/>Body: {...}

    rect rgb(255, 220, 220)
        Note over S,G: Signature Verification (REQUIRED)
        S->>G: canActivate(request)
        G->>G: Extract headers:<br/>clientId, deviceUniqueCode,<br/>timestamp, signature

        G->>G: Validate timestamp<br/>(now - timestamp <= 300s)

        G->>DB: Find client by<br/>clientId + deviceUniqueCode
        DB-->>G: client {devicePublicKey, ...}

        G->>G: Reconstruct payload:<br/>"method:path:timestamp:body"

        G->>G: crypto.createVerify('SHA256')
        G->>G: verify(devicePublicKey, signature)

        alt Signature Valid
            G->>G: Attach client to request
            G-->>S: true (allow request)
            S->>S: Process request
            S-->>D: Response
        else Signature Invalid
            G-->>S: UnauthorizedException
            S-->>D: 401 Unauthorized
        end
    end

    Note over D,DB: ⚠️ DeviceSignatureGuard NOT YET IMPLEMENTED<br/>Required for Phase 3: Device Operations
```

---

## Diagram 4: Encrypted Payload Exchange

```mermaid
sequenceDiagram
    participant D as Device
    participant DKS as Device KeyStore
    participant S as Server
    participant DB as Database

    Note over D,DB: Use Case: Device Sends Sensitive Data

    rect rgb(220, 220, 255)
        Note over D: Device Encrypts with Server Public Key
        D->>D: Prepare sensitive data:<br/>{paymentInfo: "..."}
        D->>D: Load serverPublicKey<br/>(from SharedPrefs)
        D->>D: RSA.encrypt(data, serverPublicKey)
        D->>D: Base64 encode
    end

    D->>S: POST /device/payment<br/>Headers: (signed request)<br/>Body: {encryptedPayload: "base64..."}

    rect rgb(255, 220, 220)
        Note over S,DB: Server Decrypts with Private Key
        S->>S: Verify signature (DeviceSignatureGuard)
        S->>DB: Get client.serverPrivateKey<br/>(AES encrypted)
        DB-->>S: "iv:encryptedKey"

        Note over S: Decrypt Server Private Key
        S->>S: Split "iv:encryptedKey"
        S->>S: Get CRYPTO_ENCRYPTION_KEY
        S->>S: createDecipheriv('aes-256-cbc', key, iv)
        S->>S: Decrypt → serverPrivateKeyPEM

        Note over S: Decrypt Device Payload
        S->>S: Base64 decode encryptedPayload
        S->>S: crypto.privateDecrypt(<br/>  serverPrivateKeyPEM,<br/>  encryptedPayload)
        S->>S: Parse decrypted JSON
    end

    S->>S: Process sensitive data
    S-->>D: Response

    Note over D,DB: ⚠️ Encryption/Decryption Utils NOT IMPLEMENTED<br/>Required for sensitive data exchange

    Note over D,DB: Use Case: Server Sends Encrypted Command

    rect rgb(255, 220, 220)
        Note over S: Server Encrypts with Device Public Key
        S->>DB: Get client.devicePublicKey
        DB-->>S: devicePublicKey (PEM)
        S->>S: Create command:<br/>{unlockPIN: "1234"}
        S->>S: crypto.publicEncrypt(<br/>  devicePublicKey,<br/>  command)
        S->>S: Base64 encode
    end

    S->>D: Response:<br/>{commands: [{<br/>  type: "UNLOCK",<br/>  encryptedPayload: "base64..."<br/>}]}

    rect rgb(220, 220, 255)
        Note over D,DKS: Device Decrypts with Private Key
        D->>D: Base64 decode
        D->>DKS: Request devicePrivateKey
        DKS-->>D: devicePrivateKey
        D->>D: RSA.decrypt(payload, devicePrivateKey)
        D->>D: Parse JSON → {unlockPIN: "1234"}
    end

    D->>D: Execute unlock command
```

---

## Diagram 5: Security Layers Overview

```mermaid
flowchart TD
    Start([API Request]) --> Layer1{Layer 1:<br/>SSL/TLS}

    Layer1 -->|HTTPS| Layer2{Layer 2:<br/>Device Signature<br/>Verification}

    Layer2 -->|Valid Signature| Layer3{Layer 3:<br/>Timestamp<br/>Validation}
    Layer2 -->|Invalid| Reject1[❌ 401 Unauthorized]

    Layer3 -->|Fresh<br/>≤5 min| Layer4{Layer 4:<br/>Device Identity}
    Layer3 -->|Expired| Reject2[❌ 401 Request Expired]

    Layer4 -->|Valid<br/>deviceUniqueCode| Layer5{Layer 5:<br/>Encrypted Payload?}
    Layer4 -->|Invalid| Reject3[❌ 401 Invalid Device]

    Layer5 -->|Yes| Decrypt[Decrypt with<br/>Server Private Key]
    Layer5 -->|No| Process

    Decrypt --> Process[✅ Process Request]
    Process --> Encrypt{Sensitive<br/>Response?}

    Encrypt -->|Yes| EncryptResp[Encrypt with<br/>Device Public Key]
    Encrypt -->|No| Respond

    EncryptResp --> Respond[📤 Send Response]

    style Layer1 fill:#e1f5ff
    style Layer2 fill:#ffe1e1
    style Layer3 fill:#fff4e1
    style Layer4 fill:#e1ffe1
    style Layer5 fill:#f4e1ff
    style Reject1 fill:#ff9999
    style Reject2 fill:#ff9999
    style Reject3 fill:#ff9999
    style Process fill:#99ff99
    style Respond fill:#99ccff
```

---

## Diagram 6: Key Lifecycle Management

```mermaid
stateDiagram-v2
    [*] --> ClientCreation: Retailer creates client

    ClientCreation --> QRGenerated: Generate uniqueCode<br/>(256 chars)

    state QRGenerated {
        [*] --> Waiting: Status: DEVICE_NOT_REGISTERED
        Waiting --> Scanned: Device scans QR
    }

    Scanned --> DeviceKeysGen: Device generates<br/>RSA key pair

    state DeviceKeysGen {
        [*] --> GenKeys: generateKeyPair(2048)
        GenKeys --> StorePrivate: Store private key<br/>in Android KeyStore
        StorePrivate --> SendPublic: Send public key<br/>to server
    }

    SendPublic --> ServerKeysGen: Server generates<br/>RSA key pair

    state ServerKeysGen {
        [*] --> GenServerKeys: generateKeyPairSync(2048)
        GenServerKeys --> EncryptPrivate: AES-256 encrypt<br/>private key
        EncryptPrivate --> StoreKeys: Store in database
    }

    StoreKeys --> DeviceVerified: Status: DEVICE_VERIFIED

    state DeviceVerified {
        [*] --> Active
        Active --> Syncing: Periodic sync<br/>(every 15 min)
        Syncing --> Active: Signature verified

        Active --> ReceiveCommand: Retailer sends command
        ReceiveCommand --> Active: Execute & ACK

        Active --> KeyRotation: Key rotation<br/>(every 90 days)
        KeyRotation --> Active: New keys generated
    }

    DeviceVerified --> Revoked: Security incident
    Revoked --> [*]: Device blocked

    note right of ClientCreation
        uniqueCode: One-time use
        Never reused
    end note

    note right of DeviceKeysGen
        Device Private Key:
        - Hardware-backed
        - Never leaves device
        - Cannot be extracted
    end note

    note right of ServerKeysGen
        Server Private Key:
        - AES-256 encrypted
        - IV stored with key
        - Decrypted only when needed
    end note

    note right of DeviceVerified
        deviceUniqueCode:
        - Permanent identifier
        - Used for all API calls
        - Signature required
    end note
```

---

## Diagram 7: Attack Prevention Mechanisms

```mermaid
flowchart LR
    subgraph Threats["Potential Attacks"]
        A1[Man-in-the-Middle<br/>MITM]
        A2[Replay Attack]
        A3[Device Cloning]
        A4[Key Extraction]
        A5[Brute Force]
    end

    subgraph Defenses["Defense Mechanisms"]
        D1[SSL/TLS<br/>Certificate Pinning]
        D2[Timestamp Validation<br/>± 5 minutes]
        D3[Device Signature<br/>Unique per device]
        D4[Android KeyStore<br/>Hardware-backed]
        D5[Rate Limiting<br/>Account Lockout]
    end

    subgraph Implementation["Implementation Status"]
        I1[✅ HTTPS enforced]
        I2[⚠️ NOT IMPLEMENTED<br/>DeviceSignatureGuard]
        I3[✅ deviceUniqueCode<br/>⚠️ Signature pending]
        I4[✅ Private key encryption<br/>⚠️ Device KeyStore<br/>client-side]
        I5[⚠️ NOT IMPLEMENTED]
    end

    A1 -->|Prevented by| D1
    A2 -->|Prevented by| D2
    A3 -->|Prevented by| D3
    A4 -->|Prevented by| D4
    A5 -->|Prevented by| D5

    D1 --> I1
    D2 --> I2
    D3 --> I3
    D4 --> I4
    D5 --> I5

    style A1 fill:#ffcccc
    style A2 fill:#ffcccc
    style A3 fill:#ffcccc
    style A4 fill:#ffcccc
    style A5 fill:#ffcccc

    style I1 fill:#ccffcc
    style I2 fill:#ffffcc
    style I3 fill:#ffffcc
    style I4 fill:#ffffcc
    style I5 fill:#ffffcc
```

---

## Summary of Diagrams

1. **Diagram 1** - Complete flow from client creation to device registration
2. **Diagram 2** - Key material generation and storage locations
3. **Diagram 3** - Authenticated API call with RSA signature verification
4. **Diagram 4** - Encrypted payload exchange (bidirectional)
5. **Diagram 5** - Security layers for request processing
6. **Diagram 6** - Key lifecycle from generation to rotation
7. **Diagram 7** - Attack vectors and defense mechanisms

---

## Next Steps for Implementation

### Critical Tasks (Phase 3)

1. **Implement DeviceSignatureGuard** (`src/common/guards/device-signature.guard.ts`)
2. **Create Crypto Utilities** (`src/common/utils/crypto.utils.ts`)
3. **Add Encrypted Payload Support** in DeviceCommandService
4. **Implement Replay Attack Prevention** (Redis-based timestamp tracking)

### Testing Required

- Unit tests for signature verification
- Integration tests for full encrypted flow
- Security penetration testing
- Key rotation workflow testing
