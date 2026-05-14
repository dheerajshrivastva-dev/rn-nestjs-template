# Zero-Touch Provisioning Guide

## Overview

This guide explains how to provision devices as Device Owner using QR code provisioning, including automatic app installation, permission grants, and server registration.

---

## 1. Provisioning Methods

### Method 1: QR Code Provisioning (Recommended)

**Requirements:**
- Android 7.0+ (API 24+)
- Factory reset device
- Internet connection (WiFi or mobile data)

**User Steps:**
1. Factory reset device
2. On welcome screen, tap 7 times
3. QR scanner appears
4. Scan QR code
5. Device automatically provisions

**What Happens Automatically:**
- ✅ App downloads and installs
- ✅ Device Owner permission granted
- ✅ ALL runtime permissions granted
- ✅ App receives provisioning data
- ✅ App launches with server config

### Method 2: ADB Provisioning (Development Only)

```bash
# Factory reset device first
adb shell dpm set-device-owner in.duetech.demi/.MyDeviceAdminReceiver
```

---

## 2. QR Code Structure

### Complete QR Code JSON

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "in.duetech.demi/.MyDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://yourserver.com/apk/app-release.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "SHA256:1234567890abcdef...",
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "serverUrl": "https://api.yourcompany.com",
    "provisioningCode": "YOUR_256_CHAR_CODE_HERE",
    "companyId": "company_123",
    "deviceGroupId": "group_456"
  },
  "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
  "android.app.extra.PROVISIONING_WIFI_SSID": "CompanyWiFi",
  "android.app.extra.PROVISIONING_WIFI_PASSWORD": "wifi_password_here",
  "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE": "WPA"
}
```

### Key Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| `PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME` | ✅ Yes | Your DeviceAdminReceiver component |
| `PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION` | ✅ Yes | APK download URL |
| `PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM` | ✅ Yes | APK SHA-256 checksum for security |
| `PROVISIONING_ADMIN_EXTRAS_BUNDLE` | ⚠️ Optional | Custom data passed to your app |
| `PROVISIONING_SKIP_ENCRYPTION` | ⚠️ Optional | Skip device encryption (not recommended) |
| `PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED` | ⚠️ Optional | Keep system apps enabled |
| `PROVISIONING_WIFI_SSID` | ⚠️ Optional | Auto-connect to WiFi |
| `PROVISIONING_WIFI_PASSWORD` | ⚠️ Optional | WiFi password |

---

## 3. Admin Panel Flow

### Step 1: Create Provisioning Code

**Admin panel generates unique code for each device:**

```typescript
// Server-side code
function generateProvisioningCode(deviceInfo: {
  companyId: string;
  deviceGroupId?: string;
  customerId?: string;
}) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(64); // 128 hex chars
  const metadata = JSON.stringify({
    companyId: deviceInfo.companyId,
    deviceGroupId: deviceInfo.deviceGroupId,
    customerId: deviceInfo.customerId,
    createdAt: timestamp,
  });

  // Create 256-character code
  const code = base64url.encode(
    Buffer.concat([
      randomBytes,
      Buffer.from(metadata)
    ])
  ).substring(0, 256);

  // Store in database with expiry
  await db.provisioningCodes.create({
    code: code,
    companyId: deviceInfo.companyId,
    expiresAt: timestamp + (24 * 60 * 60 * 1000), // 24 hours
    status: 'pending',
    usedAt: null,
  });

  return code;
}
```

### Step 2: Generate QR Code

**Admin panel creates QR code with all provisioning data:**

```typescript
// Server-side: Generate QR code
function generateProvisioningQR(provisioningCode: string) {
  const qrData = {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "in.duetech.demi/.MyDeviceAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
      `https://api.yourcompany.com/apk/download/${provisioningCode}`,
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
      "SHA256:YOUR_APK_SHA256_CHECKSUM_HERE",
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      "serverUrl": "https://api.yourcompany.com",
      "provisioningCode": provisioningCode,
      "companyId": "company_123"
    },
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
  };

  // Generate QR code image
  const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));

  return qrImage;
}
```

### Step 3: Admin Panel UI

**What admin sees:**

```
┌─────────────────────────────────────────┐
│  Add New Device                         │
├─────────────────────────────────────────┤
│  Company:     [Finance Corp Ltd    ▼]  │
│  Customer:    [John Doe           ]    │
│  Device Group:[EMI Group 1        ▼]   │
│  Notes:       [Galaxy A52 - Blue   ]   │
│                                         │
│  [ Generate Provisioning Code ]        │
└─────────────────────────────────────────┘

After clicking "Generate":

┌─────────────────────────────────────────┐
│  Provisioning QR Code                   │
├─────────────────────────────────────────┤
│                                         │
│      ████████████████████████          │
│      ██            ██      ██          │
│      ██  ████████  ██████  ██          │
│      ██            ██      ██          │
│      ████████████████████████          │
│                                         │
│  Code: ABC123...XYZ789                 │
│  Expires: 2025-12-03 10:30 AM          │
│  Status: Pending                        │
│                                         │
│  [ Download QR ]  [ Print ]  [ Email ] │
└─────────────────────────────────────────┘
```

---

## 4. Device Provisioning Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVICE SIDE                               │
└─────────────────────────────────────────────────────────────┘

1. Factory Reset Device
   ↓
2. User taps 7 times on welcome screen
   ↓
3. Android shows QR scanner
   ↓
4. User scans QR code
   ↓
5. Android reads provisioning data
   ↓
6. Android downloads APK from provided URL
   ↓
7. Android verifies APK signature matches checksum
   ↓
8. Android installs APK automatically
   ↓
9. Android sets app as Device Owner
   ↓
10. Android grants ALL permissions (no prompts!)
    • Storage
    • Location
    • Camera
    • Phone
    • SMS
    • Contacts
    • Everything!
   ↓
11. Android launches app with Intent containing:
    • ACTION_PROVISION_MANAGED_DEVICE
    • EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE
   ↓
12. App receives provisioning data in onCreate

┌─────────────────────────────────────────────────────────────┐
│                     APP SIDE                                 │
└─────────────────────────────────────────────────────────────┘

1. MainActivity receives Intent
   ↓
2. Extract provisioning data:
   • serverUrl
   • provisioningCode
   • companyId
   ↓
3. Collect device info:
   • IMEI
   • Model, manufacturer
   • Android version
   • Serial number
   ↓
4. Call server API: POST /api/devices/register
   Body: {
     provisioningCode: "...",
     deviceInfo: {...}
   }
   ↓
5. Server validates code
   ↓
6. Server returns device config:
   {
     deviceId: "device_123",
     companyName: "Finance Corp",
     companyPhone: "+1-800-555-0100",
     serverConfig: {...},
     frpAccount: "frp@company.com"
   }
   ↓
7. App saves config locally
   ↓
8. App sets up FRP
   ↓
9. App applies device policies
   ↓
10. Show success screen → Dashboard
```

---

## 5. Implementation Code

### 5.1 Receive Provisioning Data (MainActivity.kt)

```kotlin
// android/app/src/main/java/com/demi/MainActivity.kt

package in.duetech.demi

import android.app.admin.DevicePolicyManager
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "demi"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if this is a provisioning intent
        if (intent?.action == DevicePolicyManager.ACTION_PROVISION_MANAGED_DEVICE) {
            handleProvisioning(intent)
        }
    }

    private fun handleProvisioning(intent: Intent) {
        // Extract provisioning extras
        val adminExtras = intent.getParcelableExtra<android.os.PersistableBundle>(
            DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE
        )

        if (adminExtras != null) {
            val serverUrl = adminExtras.getString("serverUrl")
            val provisioningCode = adminExtras.getString("provisioningCode")
            val companyId = adminExtras.getString("companyId")

            // Save to SharedPreferences
            val prefs = getSharedPreferences("provisioning", MODE_PRIVATE)
            prefs.edit().apply {
                putString("serverUrl", serverUrl)
                putString("provisioningCode", provisioningCode)
                putString("companyId", companyId)
                putBoolean("isProvisioning", true)
                apply()
            }

            // React Native will pick this up on launch
            android.util.Log.d("MainActivity", "Provisioning data received: code=$provisioningCode")
        }
    }
}
```

### 5.2 Add Provisioning Native Module (DeviceOwnerModule.kt)

```kotlin
// Add these methods to DeviceOwnerModule.kt

@ReactMethod
fun getProvisioningData(promise: Promise) {
    try {
        val prefs = reactContext.getSharedPreferences("provisioning", Context.MODE_PRIVATE)

        if (prefs.getBoolean("isProvisioning", false)) {
            val data: WritableMap = WritableNativeMap()
            data.putString("serverUrl", prefs.getString("serverUrl", null))
            data.putString("provisioningCode", prefs.getString("provisioningCode", null))
            data.putString("companyId", prefs.getString("companyId", null))

            promise.resolve(data)
        } else {
            promise.resolve(null)
        }
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}

@ReactMethod
fun clearProvisioningData(promise: Promise) {
    try {
        val prefs = reactContext.getSharedPreferences("provisioning", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        promise.resolve(true)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}

@ReactMethod
fun getIMEI(promise: Promise) {
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ requires Device Owner to get IMEI
            if (!dpm.isDeviceOwnerApp(reactContext.packageName)) {
                promise.reject("NOT_DEVICE_OWNER", "Requires Device Owner permission")
                return
            }
        }

        val telephonyManager = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        @Suppress("DEPRECATION")
        val imei = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            telephonyManager.imei
        } else {
            telephonyManager.deviceId
        }

        promise.resolve(imei)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}
```

### 5.3 Add to NativeModules.ts

```typescript
// src/NativeModules.ts

export interface ProvisioningData {
  serverUrl: string;
  provisioningCode: string;
  companyId: string;
}

export interface DeviceOwnerModule {
  // ... existing methods ...

  getProvisioningData(): Promise<ProvisioningData | null>;
  clearProvisioningData(): Promise<boolean>;
  getIMEI(): Promise<string>;
}
```

### 5.4 Create Provisioning Screen

```typescript
// src/screens/ProvisioningScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DeviceOwner } from '../NativeModules';
import StorageService from '../services/StorageService';

interface ServerResponse {
  deviceId: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  serverConfig: any;
  frpAccount?: string;
}

export default function ProvisioningScreen({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    provision();
  }, []);

  const provision = async () => {
    try {
      // Step 1: Get provisioning data
      setStatus('Reading provisioning data...');
      const provisioningData = await DeviceOwner.getProvisioningData();

      if (!provisioningData) {
        throw new Error('No provisioning data found');
      }

      // Step 2: Collect device info
      setStatus('Collecting device information...');
      const deviceInfo = await DeviceOwner.getDeviceInfo();
      const imei = await DeviceOwner.getIMEI();

      // Step 3: Register with server
      setStatus('Registering device with server...');
      const response = await fetch(`${provisioningData.serverUrl}/api/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provisioningCode: provisioningData.provisioningCode,
          deviceInfo: {
            imei: imei,
            model: deviceInfo.model,
            manufacturer: deviceInfo.manufacturer,
            androidVersion: deviceInfo.androidVersion,
            brand: deviceInfo.brand,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const serverData: ServerResponse = await response.json();

      // Step 4: Save configuration
      setStatus('Saving configuration...');
      await StorageService.saveDeviceState({
        deviceId: serverData.deviceId,
        deviceStatus: 'active',
        isSetup: true,
        imei: imei,
        serverConfig: {
          companyName: serverData.companyName,
          companyPhone: serverData.companyPhone,
          companyEmail: serverData.companyEmail,
          serverUrl: provisioningData.serverUrl,
          lockScreenMessages: serverData.serverConfig?.lockScreenMessages || {},
        },
        lastSync: new Date().toISOString(),
      });

      // Step 5: Set up FRP if provided
      if (serverData.frpAccount) {
        setStatus('Setting up factory reset protection...');
        await DeviceOwner.setupFullFRPProtection(serverData.frpAccount);
      }

      // Step 6: Apply device policies
      setStatus('Applying device policies...');
      await DeviceOwner.setUserRestriction('no_factory_reset', true);
      await DeviceOwner.setUserRestriction('no_debugging_features', true);

      // Step 7: Clear provisioning flag
      await DeviceOwner.clearProvisioningData();

      setStatus('Provisioning complete!');

      // Complete
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (err: any) {
      console.error('Provisioning error:', err);
      setError(err.message);
      setStatus('Provisioning failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Provisioning</Text>

      <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />

      <Text style={styles.status}>{status}</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
});
```

### 5.5 Update App.tsx

```typescript
// App.tsx

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  // ... other state ...

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Check if this is first boot after provisioning
      const provisioningData = await DeviceOwner.getProvisioningData();

      if (provisioningData) {
        setIsProvisioning(true);
        setLoading(false);
        return;
      }

      // Normal app initialization
      // ... rest of your initialization code ...

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvisioningComplete = () => {
    setIsProvisioning(false);
    initializeApp();
  };

  // ... rest of App component ...

  // Show provisioning screen if needed
  if (isProvisioning) {
    return (
      <SafeAreaProvider>
        <ProvisioningScreen onComplete={handleProvisioningComplete} />
      </SafeAreaProvider>
    );
  }

  // ... rest of your render logic ...
}
```

---

## 6. Server API Implementation

### Registration Endpoint

```typescript
// Server-side: POST /api/devices/register

app.post('/api/devices/register', async (req, res) => {
  try {
    const { provisioningCode, deviceInfo } = req.body;

    // Validate provisioning code
    const codeRecord = await db.provisioningCodes.findOne({
      where: { code: provisioningCode, status: 'pending' }
    });

    if (!codeRecord) {
      return res.status(400).json({ error: 'Invalid or expired provisioning code' });
    }

    if (codeRecord.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Provisioning code expired' });
    }

    // Create device record
    const device = await db.devices.create({
      imei: deviceInfo.imei,
      model: deviceInfo.model,
      manufacturer: deviceInfo.manufacturer,
      androidVersion: deviceInfo.androidVersion,
      companyId: codeRecord.companyId,
      status: 'active',
      provisioningCode: provisioningCode,
      registeredAt: new Date(),
    });

    // Mark code as used
    await codeRecord.update({
      status: 'used',
      usedAt: new Date(),
      deviceId: device.id,
    });

    // Get company info
    const company = await db.companies.findByPk(codeRecord.companyId);

    // Return device configuration
    res.json({
      deviceId: device.id,
      companyName: company.name,
      companyPhone: company.supportPhone,
      companyEmail: company.supportEmail,
      serverConfig: {
        lockScreenMessages: company.lockScreenMessages,
        checkInInterval: 3600, // Check server every hour
      },
      frpAccount: company.frpAccount,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

### APK Download Endpoint

```typescript
// Server-side: GET /apk/download/:provisioningCode

app.get('/apk/download/:provisioningCode', async (req, res) => {
  try {
    const { provisioningCode } = req.params;

    // Validate code
    const codeRecord = await db.provisioningCodes.findOne({
      where: { code: provisioningCode }
    });

    if (!codeRecord) {
      return res.status(404).send('Invalid provisioning code');
    }

    // Log download
    await db.apkDownloads.create({
      provisioningCode: provisioningCode,
      downloadedAt: new Date(),
      ip: req.ip,
    });

    // Stream APK file
    const apkPath = path.join(__dirname, 'apks', 'app-release.apk');
    res.download(apkPath, 'demi-app.apk');

  } catch (error) {
    console.error('APK download error:', error);
    res.status(500).send('Download failed');
  }
});
```

---

## 7. APK Signature Checksum

### Generate APK Checksum

```bash
# Get SHA-256 checksum of your APK
openssl dgst -sha256 -binary app-release.apk | openssl base64 | tr -d '\n'

# Output example:
# 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd
```

Use this checksum in your QR code:
```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "SHA256:1234567890abcdef..."
}
```

---

## 8. Permissions Handling

### All Permissions Granted Automatically

When provisioning via QR code, Android **automatically grants ALL permissions** to the Device Owner app:

✅ **Runtime Permissions (Auto-granted)**
- `READ_PHONE_STATE` (IMEI access)
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `READ_SMS`
- `SEND_SMS`
- `CAMERA`
- `READ_CONTACTS`
- `WRITE_EXTERNAL_STORAGE`
- `READ_EXTERNAL_STORAGE`

✅ **Device Owner Permissions (Auto-granted)**
- Device administration
- Lock device
- Wipe device
- Reboot device
- Set user restrictions
- Hide/show apps
- Install/uninstall apps

### AndroidManifest.xml (Declare all permissions)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Device Owner Permissions -->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.REBOOT" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <application>
        <!-- Your app components -->
    </application>
</manifest>
```

**No runtime permission requests needed!** All declared permissions are granted during QR provisioning.

---

## 9. Summary

### What Happens During QR Provisioning

1. ✅ **App downloads automatically** from URL in QR code
2. ✅ **App installs automatically** without user interaction
3. ✅ **Device Owner set automatically**
4. ✅ **ALL permissions granted automatically** (no prompts!)
5. ✅ **App receives provisioning data** (serverUrl, code, etc.)
6. ✅ **App collects device info** (IMEI, model, etc.)
7. ✅ **App registers with server** using provisioning code
8. ✅ **Server validates code** and returns config
9. ✅ **App saves config locally**
10. ✅ **App sets up FRP** if provided
11. ✅ **App applies policies**
12. ✅ **Device ready to use**

### Admin Panel Workflow

1. Admin creates device entry with IMEI (optional at this stage)
2. System generates unique 256-char provisioning code
3. System creates QR code with:
   - APK download URL
   - Provisioning code
   - Server URL
   - Company ID
4. Admin prints/emails QR code to customer/field tech
5. Device scanned → automatic provisioning
6. Device registers with server
7. Admin sees device online with collected info

### Security Features

- ✅ Provisioning codes expire (e.g., 24 hours)
- ✅ Codes can only be used once
- ✅ APK signature verified during install
- ✅ Server validates code before accepting device
- ✅ HTTPS required for all communication
- ✅ Device fingerprint prevents cloning

---

## 10. Next Steps

1. Implement `ProvisioningScreen.tsx`
2. Add provisioning methods to `DeviceOwnerModule.kt`
3. Update `MainActivity.kt` to handle provisioning intent
4. Create server endpoints for registration
5. Build admin panel QR generator
6. Test provisioning flow on factory reset device
7. Document for field technicians

---

**Generated with Claude Code**
