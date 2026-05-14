# Device Control System - Quick Reference

## TL;DR

**You need BOTH state-based and command-based approaches:**

### State-Based (clients table)
**What the device SHOULD BE** - Read on every sync, applied continuously
- Lock status (LOCKED/UNLOCKED)
- Theft status (isStolen: true/false)
- Feature restrictions (camera blocked, WiFi disabled, etc.)
- App restrictions (WhatsApp blocked, etc.)
- Location tracking settings (enabled, interval)

### Command-Based (device_commands table)
**What the device SHOULD DO** - Execute once with acknowledgment
- Factory reset
- Request immediate location
- Play sound
- Show one-time message
- Take screenshot

---

## Complete Feature List

| Feature | Type | Storage | Execution |
|---------|------|---------|-----------|
| **Lock Device** | State + Command | clients.lockStatus | Continuous |
| **Unlock Device** | State + Command | clients.lockStatus | Continuous |
| **Mark Stolen** | Hybrid | clients.isStolen + device_commands | Both |
| **Location Tracking** | State | clients.locationTrackingEnabled | Continuous |
| **Aggressive Tracking (Stolen)** | State | clients.locationTrackingInterval = 1 | Continuous |
| **Request Location** | Command | device_commands | One-time |
| **Block Camera** | State | clients.restrictedFeatures.camera | Continuous |
| **Block Apps** | State | clients.blockedApps[] | Continuous |
| **Factory Reset** | Command | device_commands | One-time |
| **Send Message** | Command | device_commands | One-time |
| **Play Sound** | Command | device_commands | One-time |
| **Disable WiFi** | State | clients.restrictedFeatures.wifi | Continuous |
| **Disable Bluetooth** | State | clients.restrictedFeatures.bluetooth | Continuous |
| **Prevent App Install** | State | clients.canInstallApps | Continuous |
| **Time Restrictions** | State | clients.usageTimeRestrictions | Continuous |

---

## Device Sync Response (What Device Receives)

```typescript
// Every sync returns BOTH state and commands

{
  // STATE (always included, device applies continuously)
  state: {
    lockStatus: "LOCKED" | "UNLOCKED",
    lockReason: "Payment overdue",

    isStolen: false,
    locationTrackingEnabled: true,
    locationTrackingInterval: 15, // minutes (1 if stolen)

    restrictedFeatures: {
      camera: false,
      wifi: false,
      bluetooth: false,
      mobileData: true,
      screenCapture: false,
      usb: false,
      nfc: true
    },

    blockedApps: ["com.whatsapp", "com.facebook.katana"],
    allowedApps: null, // or ["com.google.chrome"] for whitelist mode

    canInstallApps: false,
    canUninstallApps: false,
    canFactoryReset: false,
    canModifySettings: false,

    emiStatus: {
      totalAmount: 25000,
      paidAmount: 10000,
      remainingAmount: 15000,
      nextDueDate: "2024-02-01",
      isOverdue: false
    }
  },

  // COMMANDS (only if pending, device executes once + ACK)
  commands: [
    {
      id: "cmd-123",
      type: "REQUEST_LOCATION",
      createdAt: "2024-01-15T10:00:00Z",
      expiresAt: "2024-01-16T10:00:00Z"
    },
    {
      id: "cmd-456",
      type: "PLAY_SOUND",
      payload: { volume: 100, duration: 30 },
      createdAt: "2024-01-15T10:05:00Z"
    }
  ],

  serverTime: "2024-01-15T10:30:00Z",
  syncInterval: 900 // Next sync in 900 seconds (15 min)
}
```

---

## Device Logic (Pseudo-code)

```typescript
// Demi app device logic

class DeviceControlService {

  async performSync() {
    // 1. Create signed request
    const signature = this.signRequest('POST', '/device/sync', timestamp, body);

    // 2. Send sync request
    const response = await api.post('/device/sync', {
      headers: {
        'X-Device-Unique-Code': deviceUniqueCode,
        'X-Signature': signature,
        'X-Timestamp': timestamp
      },
      body: { lastSyncAt }
    });

    // 3. Apply state (continuous)
    this.applyState(response.state);

    // 4. Execute commands (one-time)
    for (const command of response.commands) {
      await this.executeCommand(command);
    }
  }

  applyState(state) {
    // Lock/Unlock
    if (state.lockStatus === 'LOCKED' && !this.isLocked()) {
      devicePolicyManager.lockNow();
      this.showLockedScreen(state.lockReason);
    } else if (state.lockStatus === 'UNLOCKED' && this.isLocked()) {
      this.hideLockedScreen();
    }

    // Theft mode
    if (state.isStolen) {
      this.enableTheftMode();
      this.lockDevice();
      this.startAggressiveLocationTracking(state.locationTrackingInterval);
    }

    // Feature restrictions
    devicePolicyManager.setCameraDisabled(state.restrictedFeatures.camera);
    devicePolicyManager.setWifiDisabled(state.restrictedFeatures.wifi);
    // ... etc for all features

    // App restrictions
    this.updateBlockedApps(state.blockedApps);
    this.enforceAppRestrictions();

    // Location tracking
    if (state.locationTrackingEnabled) {
      this.startLocationService(state.locationTrackingInterval);
    } else {
      this.stopLocationService();
    }
  }

  async executeCommand(command) {
    switch (command.type) {
      case 'REQUEST_LOCATION':
        const location = await this.getHighAccuracyLocation();
        await this.sendLocationToServer(location);
        break;

      case 'FACTORY_RESET':
        // Decrypt payload
        const decrypted = this.decryptWithPrivateKey(command.payload.encrypted);

        // Send ACK BEFORE wiping
        await this.sendCommandAck(command.id, 'EXECUTED');

        // Wipe device
        devicePolicyManager.wipeData(WIPE_EXTERNAL_STORAGE);
        break;

      case 'PLAY_SOUND':
        await this.playSound(command.payload.volume, command.payload.duration);
        break;

      case 'SHOW_MESSAGE':
        this.showFullScreenMessage(command.payload.message);
        break;
    }

    // Send acknowledgment
    await this.sendCommandAck(command.id, 'EXECUTED');
  }

  startLocationService(intervalMinutes) {
    // Background location service
    setInterval(async () => {
      const location = await this.getLocation();
      await this.sendLocationToServer({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        battery: this.getBatteryLevel(),
        isCharging: this.isCharging(),
        isMoving: location.speed > 0.5,
        networkType: this.getNetworkType(),
        wifiSSID: this.getWifiSSID()
      });
    }, intervalMinutes * 60 * 1000);
  }

  async sendCommandAck(commandId, status) {
    const body = { commandId, status, executedAt: new Date() };
    const signature = this.signRequest('POST', '/device/command-ack', timestamp, body);

    await api.post('/device/command-ack', {
      headers: {
        'X-Device-Unique-Code': deviceUniqueCode,
        'X-Signature': signature,
        'X-Timestamp': timestamp
      },
      body
    });
  }
}

// App blocking logic
class AppBlockReceiver extends DeviceAdminReceiver {
  onReceive(context, intent) {
    if (intent.action === Intent.ACTION_PACKAGE_ADDED) {
      const packageName = intent.data.schemeSpecificPart;
      if (blockedApps.includes(packageName)) {
        Toast.show("This app is blocked by administrator");
        // Kill the app
        activityManager.killBackgroundProcesses(packageName);
      }
    }
  }
}
```

---

## Security Flow (Every Device Request)

```
1. Device creates request
   ↓
2. Device signs: "METHOD:PATH:TIMESTAMP:BODY" with devicePrivateKey
   ↓
3. Device sends: HTTPS + headers (X-Signature, X-Device-Unique-Code, X-Timestamp)
   ↓
4. Server (DeviceSignatureGuard):
   a. Extract headers
   b. Validate timestamp (≤5 minutes old)
   c. Find client by deviceUniqueCode
   d. Get client.devicePublicKey
   e. Reconstruct signature payload
   f. Verify signature with devicePublicKey
   g. If valid → attach client to request
   h. If invalid → 401 Unauthorized
   ↓
5. Controller processes request
   ↓
6. Response sent to device
```

**Critical:** Without valid RSA signature, NO device endpoint works.

---

## Database Tables Summary

### clients (Main state table)
- Lock status, theft status, location settings
- Feature restrictions, app restrictions
- Device permissions
- RSA keys (devicePublicKey, serverPublicKey, serverPrivateKey encrypted)

### device_commands (Action queue)
- Pending/executed commands
- Command type, payload, status
- Created by (admin user), execution timestamps
- Audit trail

### device_locations (Location history)
- Latitude, longitude, accuracy
- Battery, network, movement data
- Recorded timestamp vs received timestamp
- Indexed by client + time

### device_activity_logs (Audit trail)
- All device-related actions
- Who did what, when
- Metadata (IP, user user)
- Compliance/legal evidence

---

## Implementation Checklist

### Backend (NestJS)
- [ ] Create device_commands entity + table
- [ ] Create device_locations entity + table
- [ ] Create device_activity_logs entity + table
- [ ] Add lock/theft/restriction fields to Client entity
- [ ] Implement DeviceSignatureGuard (RSA verification)
- [ ] Implement CryptoUtils (AES decrypt, RSA encrypt/decrypt)
- [ ] Create Device module + controller + service
- [ ] Device sync endpoint (POST /device/sync)
- [ ] Device command ACK endpoint (POST /device/command-ack)
- [ ] Device location endpoint (POST /device/location)
- [ ] Admin lock/unlock endpoints
- [ ] Admin mark stolen endpoints
- [ ] Admin request location endpoint
- [ ] Admin update restrictions endpoints
- [ ] Admin factory reset endpoint
- [ ] Location history endpoints
- [ ] Command history endpoints
- [ ] Activity log endpoints
- [ ] FCM integration for command notifications
- [ ] Command expiration cleanup job (cron)

### Frontend (Demi Android App)
- [ ] Implement RSA signature generation
- [ ] Device sync service (periodic + FCM-triggered)
- [ ] Command executor service
- [ ] Location tracking service
- [ ] DevicePolicyManager integration
- [ ] Lock screen overlay
- [ ] App blocking receiver
- [ ] Feature restriction enforcement
- [ ] Location reporting (periodic + on-demand)
- [ ] Command acknowledgment
- [ ] Theft mode (silent tracking)
- [ ] Battery optimization (doze mode handling)
- [ ] Notification handling (FCM)
- [ ] Encrypted SharedPreferences (credentials storage)
- [ ] Background services (location, sync)

### Admin UI (demiAdmin React Native)
- [ ] Lock/unlock device button
- [ ] Mark stolen button + form
- [ ] Request location button
- [ ] Location history map view
- [ ] Real-time location updates
- [ ] Feature restrictions UI
- [ ] App blocking UI
- [ ] Command history view
- [ ] Activity log view
- [ ] Device status dashboard
- [ ] Factory reset confirmation dialog
- [ ] Send message to device
- [ ] Play sound on device

---

## Next Steps

1. **Review this design** - Confirm all features match requirements
2. **Prioritize features** - Which are must-have vs nice-to-have?
3. **Start implementation** - Begin with Phase 3A (core device control)
4. **Iterate** - Build incrementally, test each feature

**Questions?**
- Do you need all these features or should we simplify?
- Any additional requirements not covered?
- Ready to start implementing DeviceSignatureGuard + device sync?
