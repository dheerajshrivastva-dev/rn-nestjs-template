# Device Control System - Complete Flows

## Flow 1: Lock Device for Payment Overdue

```mermaid
sequenceDiagram
    actor A as Admin/Retailer
    participant S as Server
    participant DB as Database
    participant FCM as Firebase FCM
    participant D as Device (Demi App)

    Note over A,D: Admin locks device due to missed payments

    A->>S: POST /clients/123/lock<br/>JWT Auth<br/>{reason: "2 EMIs overdue"}

    S->>S: Validate JWT<br/>Check permissions

    S->>DB: UPDATE clients SET<br/>lockStatus = 'LOCKED',<br/>lockReason = '2 EMIs overdue',<br/>lockedAt = NOW(),<br/>lockedBy = adminId

    S->>DB: INSERT device_commands<br/>(type: LOCK, status: PENDING)

    S->>DB: INSERT device_activity_logs<br/>(type: DEVICE_LOCKED)

    S->>FCM: Send high-priority notification<br/>{type: 'COMMAND_PENDING'}
    FCM-->>D: Push notification

    S-->>A: 200 OK<br/>{message: "Device locked"}

    Note over D: Device receives FCM and wakes up

    D->>D: Create signature<br/>Sign with devicePrivateKey

    D->>S: POST /device/sync<br/>Headers: X-Signature, X-Device-Unique-Code

    S->>S: DeviceSignatureGuard<br/>Verify RSA signature

    S->>DB: SELECT * FROM clients<br/>WHERE deviceUniqueCode = '...'
    DB-->>S: client data

    S->>DB: SELECT * FROM device_commands<br/>WHERE status = PENDING
    DB-->>S: [LOCK command]

    S-->>D: 200 OK<br/>{<br/>  state: { lockStatus: 'LOCKED' },<br/>  commands: [{ type: 'LOCK' }]<br/>}

    D->>D: Execute lock command<br/>devicePolicyManager.lockNow()

    D->>D: Show locked screen<br/>"Payment overdue - Contact retailer"

    D->>D: Sign ACK request

    D->>S: POST /device/command-ack<br/>{commandId: '...', status: 'EXECUTED'}

    S->>S: Verify signature

    S->>DB: UPDATE device_commands<br/>SET status = 'EXECUTED'

    S->>FCM: Notify admin<br/>"Device locked successfully"
    FCM-->>A: Push notification

    S-->>D: 200 OK
```

---

## Flow 2: Mark Device as Stolen + Aggressive Tracking

```mermaid
sequenceDiagram
    actor A as Admin
    participant S as Server
    participant DB as Database
    participant FCM as Firebase
    participant D as Device
    participant GPS as Device GPS

    A->>S: POST /clients/123/mark-stolen<br/>{notes: "Police case #12345"}

    S->>DB: UPDATE clients SET<br/>isStolen = true,<br/>locationTrackingEnabled = true,<br/>locationTrackingInterval = 1,<br/>lockStatus = 'LOCKED'

    S->>DB: INSERT device_commands<br/>(type: MARK_STOLEN)

    S->>DB: INSERT activity_log<br/>(type: MARKED_STOLEN)

    S->>FCM: Send silent high-priority FCM
    FCM-->>D: Silent push (no notification shown)

    S-->>A: 200 OK

    Note over D: Device syncs (background)

    D->>S: POST /device/sync (RSA signed)

    S-->>D: {<br/>  state: {<br/>    isStolen: true,<br/>    lockStatus: 'LOCKED',<br/>    locationTrackingInterval: 1<br/>  }<br/>}

    D->>D: Start LocationService<br/>Update interval: 1 minute<br/>Silent mode (no notifications)

    D->>D: Lock device immediately<br/>(if not already locked)

    loop Every 1 minute
        D->>GPS: Get high-accuracy location
        GPS-->>D: {lat, lng, accuracy}

        D->>D: Get device status<br/>(battery, network, speed)

        D->>D: Sign location data

        D->>S: POST /device/location (RSA signed)<br/>{<br/>  latitude, longitude, accuracy,<br/>  battery, isCharging, isMoving,<br/>  networkType, wifiSSID<br/>}

        S->>S: Verify signature

        S->>DB: INSERT device_locations<br/>(lat, lng, battery, ...)

        S-->>D: 200 OK

        alt Location changed significantly
            S->>FCM: Notify admin<br/>"Device moved to new location"
            FCM-->>A: Push notification with map
        end
    end

    Note over A: Admin views location history

    A->>S: GET /clients/123/locations<br/>?last=10

    S->>DB: SELECT * FROM device_locations<br/>WHERE clientId = 123<br/>ORDER BY recordedAt DESC<br/>LIMIT 10

    DB-->>S: Location history

    S-->>A: [<br/>  {lat, lng, recordedAt, battery},<br/>  ...<br/>]
```

---

## Flow 3: Restrict Features (Camera + Apps)

```mermaid
sequenceDiagram
    actor A as Admin
    participant S as Server
    participant DB as Database
    participant FCM as Firebase
    participant D as Device
    participant DPM as DevicePolicyManager

    A->>S: PUT /clients/123/restrictions<br/>{<br/>  restrictedFeatures: { camera: true },<br/>  blockedApps: ["com.whatsapp"]<br/>}

    S->>DB: UPDATE clients SET<br/>restrictedFeatures = {...},<br/>blockedApps = [...]

    S->>DB: INSERT device_commands<br/>(type: UPDATE_RESTRICTIONS)

    S->>FCM: Send notification
    FCM-->>D: Push

    S-->>A: 200 OK

    D->>S: POST /device/sync (RSA signed)

    S-->>D: {<br/>  state: {<br/>    restrictedFeatures: { camera: true },<br/>    blockedApps: ["com.whatsapp"]<br/>  }<br/>}

    D->>DPM: setCameraDisabled(true)
    DPM-->>D: Camera disabled

    D->>D: Register AppBlockReceiver<br/>Block WhatsApp launch

    D->>D: Hide WhatsApp from launcher<br/>(optional)

    D->>S: POST /device/command-ack<br/>{status: 'EXECUTED'}

    S-->>D: 200 OK

    Note over D: User tries to open WhatsApp

    D->>D: AppBlockReceiver triggered
    D->>D: Show toast:<br/>"WhatsApp is blocked by administrator"
    D->>D: Prevent app launch

    Note over D: User tries to open Camera

    D->>DPM: Launch camera intent
    DPM-->>D: SecurityException<br/>"Camera disabled by admin"
    D->>D: Show error message
```

---

## Flow 4: Request Immediate Location

```mermaid
sequenceDiagram
    actor A as Admin
    participant S as Server
    participant DB as Database
    participant FCM as Firebase
    participant D as Device
    participant GPS as GPS

    Note over A: Admin wants to know device location NOW

    A->>S: POST /clients/123/request-location

    S->>DB: INSERT device_commands<br/>(type: REQUEST_LOCATION,<br/>priority: HIGH)

    S->>FCM: Send HIGH PRIORITY FCM<br/>with wake lock

    S-->>A: 200 OK<br/>{message: "Location requested"}

    FCM-->>D: High-priority push<br/>(wakes device immediately)

    Note over D: Device wakes from deep sleep

    D->>D: Acquire wake lock

    D->>GPS: Request high-accuracy location<br/>(timeout: 10s)

    GPS-->>D: {lat, lng, accuracy: 5m}

    D->>D: Get device status<br/>(battery, network)

    D->>D: Sign location data

    D->>S: POST /device/location (RSA signed)<br/>{<br/>  latitude: 12.9716,<br/>  longitude: 77.5946,<br/>  accuracy: 5,<br/>  battery: 45,<br/>  timestamp: "2024-01-15T10:30:00Z"<br/>}

    S->>S: Verify signature

    S->>DB: INSERT device_locations

    S->>DB: UPDATE device_commands<br/>SET status = 'EXECUTED'

    S->>FCM: Notify admin<br/>"Location received"
    FCM-->>A: Push notification

    S-->>D: 200 OK

    D->>D: Release wake lock

    Note over A: Admin views location on map

    A->>S: GET /clients/123/locations/latest

    S->>DB: SELECT * FROM device_locations<br/>WHERE clientId = 123<br/>ORDER BY recordedAt DESC<br/>LIMIT 1

    DB-->>S: Latest location

    S-->>A: {<br/>  latitude: 12.9716,<br/>  longitude: 77.5946,<br/>  accuracy: 5,<br/>  recordedAt: "2024-01-15T10:30:00Z",<br/>  battery: 45,<br/>  mapUrl: "https://maps.google.com/..."<br/>}
```

---

## Flow 5: Factory Reset (Emergency)

```mermaid
sequenceDiagram
    actor A as Admin
    participant S as Server
    participant DB as Database
    participant FCM as Firebase
    participant D as Device

    Note over A: CRITICAL: Customer wants full refund,<br/>device must be wiped

    A->>S: POST /clients/123/factory-reset<br/>{<br/>  confirm: true,<br/>  reason: "Customer refund"<br/>}

    S->>S: Validate authorization<br/>(Require SUPER/ADMIN role)

    S->>DB: Get client.devicePublicKey

    S->>S: Encrypt command payload<br/>with devicePublicKey<br/>(extra security for destructive action)

    S->>DB: INSERT device_commands<br/>(type: FACTORY_RESET,<br/>payload: encrypted)

    S->>DB: INSERT activity_log<br/>(type: FACTORY_RESET_REQUESTED)

    S->>FCM: Send CRITICAL priority FCM
    FCM-->>D: Push

    S-->>A: 200 OK<br/>{<br/>  warning: "Device will be wiped",<br/>  commandId: "cmd-789"<br/>}

    D->>S: POST /device/sync (RSA signed)

    S-->>D: {<br/>  commands: [{<br/>    type: 'FACTORY_RESET',<br/>    payload: { encrypted: "..." }<br/>  }]<br/>}

    D->>D: Decrypt payload with<br/>devicePrivateKey

    D->>D: Verify command integrity

    D->>D: Show confirmation dialog<br/>"Device will be reset.<br/>All data will be lost."

    alt User confirms (or auto-confirm)
        D->>S: POST /device/command-ack<br/>{<br/>  commandId: "cmd-789",<br/>  status: "EXECUTED"<br/>} (SEND BEFORE WIPE!)

        S->>DB: UPDATE device_commands<br/>SET status = 'EXECUTED'

        S->>DB: UPDATE clients<br/>SET status = 'NOT_PROTECTED'

        S->>DB: INSERT activity_log<br/>(type: FACTORY_RESET_EXECUTED)

        S->>FCM: Notify admin<br/>"Factory reset completed"

        S-->>D: 200 OK

        D->>D: devicePolicyManager.wipeData(<br/>  WIPE_EXTERNAL_STORAGE |<br/>  WIPE_RESET_PROTECTION_DATA<br/>)

        Note over D: Device resets and reboots<br/>All data wiped
    else User cancels
        D->>S: POST /device/command-ack<br/>{status: "FAILED", reason: "User cancelled"}

        S->>DB: UPDATE device_commands<br/>SET status = 'FAILED'

        S->>FCM: Notify admin<br/>"Factory reset cancelled by user"
    end
```

---

## State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> DeviceNotRegistered: Client created

    DeviceNotRegistered --> DeviceVerified: Device registers

    state DeviceVerified {
        [*] --> Unlocked

        Unlocked --> Locked: Payment overdue
        Locked --> Unlocked: Payment received

        Unlocked --> Stolen: Admin marks stolen
        Locked --> Stolen: Admin marks stolen

        Stolen --> Unlocked: Admin unmarks stolen
        Stolen --> Locked: Admin unmarks stolen (but still locked)

        state Stolen {
            [*] --> LocationTracking
            LocationTracking --> AggressiveTracking: Every 1 minute
            AggressiveTracking --> LocationTracking: Unmarked
        }
    }

    DeviceVerified --> NotProtected: Factory reset
    DeviceVerified --> Blocked: Admin blocks
    NotProtected --> [*]
    Blocked --> [*]

    note right of Unlocked
        Normal operation
        Features: All enabled
        Tracking: Optional (15 min)
    end note

    note right of Locked
        Device locked
        Features: Limited
        Tracking: Enabled (15 min)
    end note

    note right of Stolen
        CRITICAL MODE
        Auto-locked
        Features: All disabled
        Tracking: Aggressive (1 min)
        Silent mode
    end note
```

---

## Decision Tree: Which Approach for Each Feature?

```mermaid
flowchart TD
    Start([Feature Request]) --> Type{Feature Type?}

    Type -->|Persistent State| State[State-Based Approach]
    Type -->|One-Time Action| Command[Command-Based Approach]
    Type -->|Both| Hybrid[Hybrid Approach]

    State --> StateEx[Examples:<br/>- Lock/Unlock status<br/>- Feature restrictions<br/>- Blocked apps<br/>- Location tracking settings]

    Command --> CommandEx[Examples:<br/>- Factory reset<br/>- Request immediate location<br/>- Play sound<br/>- Show one-time message]

    Hybrid --> HybridEx[Examples:<br/>- Mark stolen:<br/>  State: isStolen flag<br/>  Command: MARK_STOLEN<br/>- Restrict camera:<br/>  State: restrictedFeatures.camera<br/>  Command: DISABLE_CAMERA]

    StateEx --> StoreDB[Store in clients table]
    CommandEx --> CreateCmd[Create in device_commands table]
    HybridEx --> Both[Update both tables]

    StoreDB --> Sync[Device reads on sync]
    CreateCmd --> Execute[Device executes once + ACK]
    Both --> SyncAndExec[Device reads state + executes command]

    Sync --> Apply[Device applies continuously]
    Execute --> Once[Device runs once]
    SyncAndExec --> Continuous[State applies continuously<br/>Command runs once]
```

---

## Summary

### Use State-Based For:
- ✅ Lock/unlock status
- ✅ Feature restrictions (camera, WiFi, etc.)
- ✅ App blocking
- ✅ Location tracking settings
- ✅ Permissions (install apps, modify settings)
- ✅ Network restrictions
- ✅ Time restrictions

**Why:** These are persistent settings that should be enforced continuously.

### Use Command-Based For:
- ✅ Factory reset
- ✅ Request immediate location
- ✅ Play sound
- ✅ Show message
- ✅ Take screenshot
- ✅ Wipe specific data

**Why:** These are one-time actions that need audit trail and execution confirmation.

### Use Hybrid For:
- ✅ Mark/unmark stolen (state + command for audit)
- ✅ Major restriction changes (state + command for logging)
- ✅ Critical actions (state + command for compliance)

**Why:** Need both persistent state and audit trail for legal/compliance reasons.
