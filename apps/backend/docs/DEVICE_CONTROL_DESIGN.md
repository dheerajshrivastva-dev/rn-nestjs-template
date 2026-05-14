# Device Control System Design

## Overview

Complete device management system with:
- Lock/Unlock control
- Theft tracking with aggressive location monitoring
- Feature restrictions (camera, WiFi, apps, etc.)
- Location history
- Command audit trail
- State-based + Command-based hybrid architecture

---

## Database Schema

### 1. Client Entity Extensions

```typescript
// Add to existing client.entity.ts

// Lock Control
@Column({
  type: 'enum',
  enum: LockStatus,
  default: LockStatus.UNLOCKED,
  name: 'lock_status',
})
lockStatus: LockStatus; // LOCKED | UNLOCKED

@Column({ type: 'varchar', length: 500, nullable: true, name: 'lock_reason' })
lockReason: string;

@Column({ type: 'timestamp', nullable: true, name: 'locked_at' })
lockedAt: Date;

@Column({ type: 'uuid', nullable: true, name: 'locked_by' })
lockedBy: string; // Admin user ID

// Theft Tracking
@Column({ type: 'boolean', default: false, name: 'is_stolen' })
isStolen: boolean;

@Column({ type: 'timestamp', nullable: true, name: 'stolen_marked_at' })
stolenMarkedAt: Date;

@Column({ type: 'uuid', nullable: true, name: 'stolen_marked_by' })
stolenMarkedBy: string;

@Column({ type: 'text', nullable: true, name: 'theft_notes' })
theftNotes: string; // Police case number, details, etc.

// Location Tracking
@Column({ type: 'boolean', default: false, name: 'location_tracking_enabled' })
locationTrackingEnabled: boolean;

@Column({ type: 'int', default: 15, name: 'location_tracking_interval' })
locationTrackingInterval: number; // minutes (normal: 15, stolen: 1)

@Column({ type: 'point', nullable: true, name: 'last_known_location' })
lastKnownLocation: string; // PostGIS point

@Column({ type: 'timestamp', nullable: true, name: 'last_location_update' })
lastLocationUpdate: Date;

// Feature Restrictions (JSON)
@Column({ type: 'jsonb', nullable: true, name: 'restricted_features' })
restrictedFeatures: {
  camera: boolean;
  wifi: boolean;
  bluetooth: boolean;
  mobileData: boolean;
  screenCapture: boolean;
  usb: boolean;
  nfc: boolean;
};

// App Restrictions (JSON)
@Column({ type: 'jsonb', nullable: true, name: 'blocked_apps' })
blockedApps: string[]; // ['com.whatsapp', 'com.facebook.katana']

@Column({ type: 'jsonb', nullable: true, name: 'allowed_apps' })
allowedApps: string[]; // Whitelist mode (if not null, ONLY these apps allowed)

// Device Permissions
@Column({ type: 'boolean', default: true, name: 'can_install_apps' })
canInstallApps: boolean;

@Column({ type: 'boolean', default: false, name: 'can_uninstall_apps' })
canUninstallApps: boolean;

@Column({ type: 'boolean', default: false, name: 'can_factory_reset' })
canFactoryReset: boolean;

@Column({ type: 'boolean', default: false, name: 'can_modify_settings' })
canModifySettings: boolean;

// Network Restrictions
@Column({ type: 'jsonb', nullable: true, name: 'allowed_wifi_ssids' })
allowedWifiSSIDs: string[]; // Only allow specific WiFi networks

@Column({ type: 'boolean', default: true, name: 'can_use_mobile_data' })
canUseMobileData: boolean;

// Time Restrictions
@Column({ type: 'jsonb', nullable: true, name: 'usage_time_restrictions' })
usageTimeRestrictions: {
  enabled: boolean;
  allowedHours: { start: string; end: string }[]; // [{ start: "09:00", end: "21:00" }]
  timezone: string;
};
```

### 2. Device Commands Table

```sql
CREATE TYPE command_type AS ENUM (
  'LOCK',
  'UNLOCK',
  'MARK_STOLEN',
  'UNMARK_STOLEN',
  'REQUEST_LOCATION',
  'UPDATE_RESTRICTIONS',
  'BLOCK_APPS',
  'UNBLOCK_APPS',
  'FACTORY_RESET',
  'WIPE_DATA',
  'PLAY_SOUND',
  'SHOW_MESSAGE',
  'TAKE_SCREENSHOT',
  'DISABLE_CAMERA',
  'ENABLE_CAMERA'
);

CREATE TYPE command_status AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'EXECUTED',
  'FAILED',
  'EXPIRED'
);

CREATE TABLE device_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type command_type NOT NULL,
  status command_status DEFAULT 'PENDING',
  payload JSONB, -- Additional data for the command

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  executed_at TIMESTAMP,
  failed_at TIMESTAMP,
  expires_at TIMESTAMP, -- Commands expire after 24 hours

  -- Execution result
  result JSONB, -- { success: true, message: "..." }
  error_message TEXT,

  -- Indexes
  INDEX idx_device_commands_client_status (client_id, status),
  INDEX idx_device_commands_created_at (created_at)
);
```

### 3. Device Locations Table

```sql
CREATE TABLE device_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- meters
  altitude DECIMAL(10, 2), -- meters

  -- Device state
  battery_level INT, -- 0-100
  is_charging BOOLEAN,
  is_moving BOOLEAN,
  speed DECIMAL(10, 2), -- km/h

  -- Network info
  network_type VARCHAR(20), -- 4G, 5G, WiFi
  wifi_ssid VARCHAR(100),

  -- Timestamps
  recorded_at TIMESTAMP NOT NULL, -- Device timestamp
  received_at TIMESTAMP DEFAULT NOW(), -- Server timestamp

  -- Indexes
  INDEX idx_device_locations_client_recorded (client_id, recorded_at DESC),
  INDEX idx_device_locations_stolen (client_id) WHERE is_stolen = true
);

-- PostGIS spatial index for location queries
CREATE INDEX idx_device_locations_geom ON device_locations
  USING GIST (ST_MakePoint(longitude, latitude));
```

### 4. Device Activity Log Table

```sql
CREATE TYPE activity_type AS ENUM (
  'DEVICE_REGISTERED',
  'DEVICE_LOCKED',
  'DEVICE_UNLOCKED',
  'MARKED_STOLEN',
  'UNMARKED_STOLEN',
  'LOCATION_UPDATED',
  'COMMAND_EXECUTED',
  'COMMAND_FAILED',
  'APP_BLOCKED',
  'APP_UNBLOCKED',
  'FEATURE_RESTRICTED',
  'FEATURE_UNRESTRICTED',
  'SYNC_COMPLETED',
  'FACTORY_RESET_REQUESTED',
  'FACTORY_RESET_EXECUTED'
);

CREATE TABLE device_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,

  -- Details
  description TEXT,
  metadata JSONB, -- Additional context

  -- Actor
  performed_by UUID REFERENCES users(id), -- NULL if device action
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_activity_client_type (client_id, activity_type, created_at DESC)
);
```

---

## Enums

```typescript
// apps/demi-service/src/common/enums/lock-status.enum.ts
export enum LockStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
}

// apps/demi-service/src/common/enums/command-type.enum.ts
export enum CommandType {
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  MARK_STOLEN = 'MARK_STOLEN',
  UNMARK_STOLEN = 'UNMARK_STOLEN',
  REQUEST_LOCATION = 'REQUEST_LOCATION',
  UPDATE_RESTRICTIONS = 'UPDATE_RESTRICTIONS',
  BLOCK_APPS = 'BLOCK_APPS',
  UNBLOCK_APPS = 'UNBLOCK_APPS',
  FACTORY_RESET = 'FACTORY_RESET',
  WIPE_DATA = 'WIPE_DATA',
  PLAY_SOUND = 'PLAY_SOUND',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  TAKE_SCREENSHOT = 'TAKE_SCREENSHOT',
  DISABLE_CAMERA = 'DISABLE_CAMERA',
  ENABLE_CAMERA = 'ENABLE_CAMERA',
}

// apps/demi-service/src/common/enums/command-status.enum.ts
export enum CommandStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}
```

---

## API Endpoints

### Admin/Retailer Endpoints (JWT Auth)

```typescript
// Device Control
POST   /api/clients/:id/lock            // Lock device
POST   /api/clients/:id/unlock          // Unlock device
POST   /api/clients/:id/mark-stolen     // Mark as stolen
POST   /api/clients/:id/unmark-stolen   // Unmark stolen
POST   /api/clients/:id/factory-reset   // Factory reset

// Location Tracking
POST   /api/clients/:id/request-location     // Request immediate location
GET    /api/clients/:id/locations            // Get location history
GET    /api/clients/:id/locations/latest     // Get latest location
POST   /api/clients/:id/location-tracking    // Enable/disable tracking
PUT    /api/clients/:id/location-interval    // Update tracking interval

// Feature Restrictions
PUT    /api/clients/:id/restrictions         // Update all restrictions
POST   /api/clients/:id/restrict-feature     // Block specific feature
POST   /api/clients/:id/unrestrict-feature   // Unblock specific feature

// App Control
POST   /api/clients/:id/block-apps           // Block apps
POST   /api/clients/:id/unblock-apps         // Unblock apps
GET    /api/clients/:id/blocked-apps         // Get blocked apps list

// Commands & Activity
GET    /api/clients/:id/commands             // Get command history
GET    /api/clients/:id/activity             // Get activity log
POST   /api/clients/:id/send-message         // Send message to device
POST   /api/clients/:id/play-sound           // Play sound on device
```

### Device Endpoints (RSA Signature Auth)

```typescript
// Device Sync (Primary endpoint)
POST   /api/device/sync                      // Get state + pending commands

// Command Acknowledgment
POST   /api/device/command-ack               // Acknowledge command execution

// Location Updates
POST   /api/device/location                  // Send location update
POST   /api/device/location-batch            // Send multiple locations

// Device Status
POST   /api/device/status                    // Send device status (battery, apps, etc.)
```

---

## Use Cases & Flows

### Use Case 1: Lock Device for Payment Overdue

```typescript
// Admin action
POST /api/clients/123/lock
Body: {
  reason: "Payment overdue - 2 EMIs missed",
  showMessage: "Please contact retailer to unlock"
}

// Server:
1. Update client.lockStatus = LOCKED
2. Create device_command (type: LOCK)
3. Create activity_log
4. Send FCM notification
5. Return success

// Device syncs:
POST /api/device/sync
Response: {
  state: {
    lockStatus: "LOCKED",
    lockReason: "Payment overdue - 2 EMIs missed",
    showMessage: "Please contact retailer to unlock"
  },
  commands: [
    {
      id: "cmd-123",
      type: "LOCK",
      payload: { reason: "...", showMessage: "..." }
    }
  ]
}

// Device executes:
1. devicePolicyManager.lockNow()
2. Show locked screen with message
3. Send ACK:
   POST /api/device/command-ack
   Body: { commandId: "cmd-123", status: "EXECUTED" }
```

### Use Case 2: Mark Device as Stolen + Aggressive Tracking

```typescript
// Admin marks stolen
POST /api/clients/123/mark-stolen
Body: {
  notes: "Reported stolen by customer. Police case #12345",
  enableAggressiveTracking: true
}

// Server:
1. Update client.isStolen = true
2. Update client.locationTrackingEnabled = true
3. Update client.locationTrackingInterval = 1 (every 1 minute)
4. Create device_command (type: MARK_STOLEN)
5. Create activity_log
6. Send high-priority FCM

// Device syncs:
Response: {
  state: {
    isStolen: true,
    lockStatus: "LOCKED", // Auto-lock stolen devices
    locationTrackingEnabled: true,
    locationTrackingInterval: 1, // Every 1 minute
  },
  commands: [
    {
      id: "cmd-456",
      type: "MARK_STOLEN",
      payload: {
        lockDevice: true,
        hideNotifications: true, // Don't alert thief
        silentMode: true
      }
    }
  ]
}

// Device executes:
1. Lock device immediately
2. Start background location service (every 1 minute)
3. Hide theft-related notifications
4. Send locations silently:
   POST /api/device/location
   Body: {
     latitude: 12.9716,
     longitude: 77.5946,
     accuracy: 10,
     battery: 45,
     timestamp: "2024-01-15T10:30:00Z"
   }
```

### Use Case 3: Restrict Camera + Block WhatsApp

```typescript
// Admin restricts features
PUT /api/clients/123/restrictions
Body: {
  restrictedFeatures: {
    camera: true,
    screenCapture: true
  },
  blockedApps: ["com.whatsapp"]
}

// Server:
1. Update client.restrictedFeatures
2. Update client.blockedApps
3. Create device_command (type: UPDATE_RESTRICTIONS)
4. Send FCM

// Device syncs:
Response: {
  state: {
    restrictedFeatures: {
      camera: true,
      screenCapture: true
    },
    blockedApps: ["com.whatsapp"]
  }
}

// Device enforces:
1. devicePolicyManager.setCameraDisabled(true)
2. Block WhatsApp launch via DeviceAdminReceiver
3. Hide WhatsApp from launcher (optional)
```

### Use Case 4: Request Immediate Location

```typescript
// Admin requests location
POST /api/clients/123/request-location

// Server:
1. Create device_command (type: REQUEST_LOCATION, high priority)
2. Send high-priority FCM

// Device receives FCM:
1. Wake up immediately
2. Get current location (high accuracy)
3. Send to server:
   POST /api/device/location
   Body: { latitude, longitude, accuracy, battery, ... }

// Admin views location:
GET /api/clients/123/locations/latest
Response: {
  latitude: 12.9716,
  longitude: 77.5946,
  accuracy: 10,
  recordedAt: "2024-01-15T10:35:00Z",
  battery: 45,
  isCharging: false
}
```

---

## Device Sync Response Structure

```typescript
interface DeviceSyncResponse {
  // Current state (always included)
  state: {
    // Lock status
    lockStatus: 'LOCKED' | 'UNLOCKED';
    lockReason?: string;

    // Theft tracking
    isStolen: boolean;
    locationTrackingEnabled: boolean;
    locationTrackingInterval: number; // minutes

    // Feature restrictions
    restrictedFeatures: {
      camera: boolean;
      wifi: boolean;
      bluetooth: boolean;
      mobileData: boolean;
      screenCapture: boolean;
      usb: boolean;
      nfc: boolean;
    };

    // App restrictions
    blockedApps: string[];
    allowedApps?: string[]; // Whitelist mode

    // Permissions
    canInstallApps: boolean;
    canUninstallApps: boolean;
    canFactoryReset: boolean;
    canModifySettings: boolean;

    // Network restrictions
    allowedWifiSSIDs?: string[];
    canUseMobileData: boolean;

    // Time restrictions
    usageTimeRestrictions?: {
      enabled: boolean;
      allowedHours: Array<{ start: string; end: string }>;
      timezone: string;
    };

    // Client info (for display)
    clientName: string;
    clientPhone: string;
    retailerPhone: string;
    emiStatus: {
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      nextDueDate: string;
      isOverdue: boolean;
    };
  };

  // Pending commands (executed once)
  commands: Array<{
    id: string;
    type: CommandType;
    payload?: any;
    createdAt: string;
    expiresAt: string;
  }>;

  // Server metadata
  serverTime: string;
  syncInterval: number; // Next sync in X seconds
}
```

---

## Security Considerations

### 1. RSA Signature Verification (All Device Endpoints)

```typescript
// All device endpoints MUST use DeviceSignatureGuard
@Post('sync')
@Public()
@UseGuards(DeviceSignatureGuard)
async sync(@Request() req) {
  const client = req.client; // Attached by guard after verification
  return this.deviceService.sync(client);
}
```

### 2. Command Expiration

```typescript
// Commands expire after 24 hours
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Don't return expired commands
const pendingCommands = await this.commandRepository.find({
  where: {
    clientId,
    status: CommandStatus.PENDING,
    expiresAt: MoreThan(new Date())
  }
});
```

### 3. Sensitive Command Encryption

```typescript
// Encrypt sensitive commands with device public key
if (command.type === CommandType.FACTORY_RESET) {
  const encrypted = crypto.publicEncrypt(
    client.devicePublicKey,
    Buffer.from(JSON.stringify(command.payload))
  );
  command.payload = { encrypted: encrypted.toString('base64') };
}
```

### 4. Rate Limiting

```typescript
// Prevent abuse
@Throttle(10, 60) // 10 requests per minute
@Post('location')
async updateLocation() { ... }

@Throttle(1, 5) // 1 request per 5 seconds
@Post('request-location')
async requestLocation() { ... }
```

---

## Implementation Priority

### Phase 3A: Core Device Control (Week 1)
1. ✅ Create device_commands table + entity
2. ✅ Create device_locations table + entity
3. ✅ Create device_activity_logs table + entity
4. ✅ Implement DeviceSignatureGuard
5. ✅ Implement Device Sync endpoint
6. ✅ Implement Command ACK endpoint
7. ✅ Add lock/unlock fields to Client entity

### Phase 3B: Lock/Unlock + Location (Week 2)
1. ✅ Lock device endpoint
2. ✅ Unlock device endpoint
3. ✅ Location update endpoint
4. ✅ Request location endpoint
5. ✅ Location history endpoint
6. ✅ FCM integration for commands

### Phase 3C: Theft Tracking (Week 3)
1. ✅ Mark/unmark stolen endpoints
2. ✅ Aggressive location tracking logic
3. ✅ Theft mode state management
4. ✅ Location map view (admin UI)

### Phase 3D: Feature Restrictions (Week 4)
1. ✅ Restrict/unrestrict feature endpoints
2. ✅ Block/unblock apps endpoints
3. ✅ Update all restrictions endpoint
4. ✅ Time-based restrictions
5. ✅ Network restrictions

### Phase 3E: Advanced Commands (Week 5)
1. ✅ Factory reset endpoint
2. ✅ Send message endpoint
3. ✅ Play sound endpoint
4. ✅ Take screenshot endpoint (future)
5. ✅ Command expiration cleanup job

---

## Testing Checklist

- [ ] Device registration generates RSA keys correctly
- [ ] Sync endpoint verifies RSA signature
- [ ] Lock command locks device immediately
- [ ] Stolen mode enables aggressive tracking (1-min intervals)
- [ ] Location updates stored with accuracy
- [ ] Expired commands not returned
- [ ] Command ACK updates status correctly
- [ ] Feature restrictions enforced on device
- [ ] Blocked apps cannot be launched
- [ ] Factory reset command requires encryption
- [ ] Activity log tracks all actions
- [ ] Rate limiting prevents abuse
