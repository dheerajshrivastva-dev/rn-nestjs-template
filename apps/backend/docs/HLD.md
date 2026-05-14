# High-Level Design (HLD) - EMI Management System

## 1. System Overview

The EMI Management System is a multi-tenant B2B2C platform that enables companies to manage device protection services through a hierarchical distribution network of Super admins, Distributors, and Retailers who sell protected keys (licenses) to end clients.

### System Architecture

The system consists of three main components:

1. **Backend API Server** (Node.js): Central server managing all business logic, database operations, and API endpoints
2. **Retailer/Distributor Mobile App** (React Native): Mobile application for company supers, distributors and retailers to:
   - Manage clients and devices
   - Purchase/transfer keys through distribution hierarchy
   - View reports and analytics
   - Control device protection features
   - Send messages to client devices
   - Manage downstream users (for Super/Distributors)
3. **Client Device App** (React Native with Device Owner): Protected application installed on client devices that:
   - Has Device Owner privileges (installed via Zero-Touch Provisioning)
   - Receives commands from backend server
   - Reports location and device status
   - Enforces device policies (lock/unlock, app restrictions)
   - Cannot be uninstalled by device user

**Communication Flow:**
```
User App ←→ Backend Server ←→ Client Device App (Device Owner)
```

### Key Features
- Multi-tenant company management
- **4-tier hierarchical user management**: SUPER_ADMIN → SUPER → DISTRIBUTOR → RETAILER
- **Commission-based revenue sharing** at each distribution level
- **Flexible hierarchy**: Optional distributor level (SUPER → RETAILER direct)
- **Key transfer system** with transaction tracking through distribution chain
- **Node replacement**: Transfer entire downstream networks to new users
- Key/License management system
- Order and payment processing with approval workflow
- Comprehensive balance sheet and audit trails with commission tracking
- Device protection and lock/unlock mechanisms
- Real-time device tracking and monitoring
- Email/SMS/Push notification system with retry logic
- Zero-Touch Provisioning for client devices

---

## 2. Architecture Overview

### 2.1 Technology Stack (Recommended)
- **Backend Framework**: Node.js with Express.js/NestJS
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 / Azure Blob Storage
- **API Style**: RESTful API
- **Documentation**: Swagger/OpenAPI

### 2.2 System Architecture Layers

```text
┌─────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer            │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                Authentication Layer                 │
│            (JWT, Role-based Access Control)         │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                  Application Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Company  │  │   User   │  │  Client  │           │
│  │ Service  │  │ Service  │  │ Service  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐          │
│  │  Order   │  │Transaction│  │ Balance  │          │
│  │ Service  │  │ Service   │  │ Service  │          │
│  └──────────┘  └───────────┘  └──────────┘          │
│  ┌──────────┐  ┌───────────┐                        │
│  │   Key    │  │Commission │                        │
│  │ Transfer │  │ Service   │                        │
│  └──────────┘  └───────────┘                        │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│          PostgreSQL + Redis + File Storage          │
└─────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Design

### 3.1 Address (Shared Table)
```sql
addresses {
  id: UUID PRIMARY KEY
  street: VARCHAR(255)
  city: VARCHAR(100) NOT NULL
  state: VARCHAR(100) NOT NULL
  country: VARCHAR(100) NOT NULL
  postalCode: VARCHAR(20) NOT NULL
  latitude: DECIMAL(10,8)
  longitude: DECIMAL(11,8)
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
}
```

### 3.2 Company
```sql
companies {
  id: UUID PRIMARY KEY
  name: VARCHAR(255) NOT NULL UNIQUE
  email: VARCHAR(255) NOT NULL UNIQUE
  phone: VARCHAR(20) NOT NULL
  logo: VARCHAR(500) -- S3 URL
  tagLine: VARCHAR(500)
  contactNumber: VARCHAR(20)

  -- Pricing (set by SUPER_ADMIN)
  baseKeyRate: DECIMAL(10,2) DEFAULT 100.00 -- Base price per key (inclusive of tax)
  taxPercentage: DECIMAL(5,2) DEFAULT 18.00 -- Tax percentage included in base rate

  status: ENUM('active', 'inactive') DEFAULT 'active'
  totalBalance: DECIMAL(15,2) DEFAULT 0
  totalUsers: INTEGER DEFAULT 1 -- Total users (super + distributors + retailers)
  totalDistributors: INTEGER DEFAULT 0
  totalRetailers: INTEGER DEFAULT 0
  totalActiveCustomers: INTEGER DEFAULT 0
  addressId: UUID REFERENCES addresses(id)

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  createdBy: UUID
  lastModifiedBy: UUID

  INDEX idx_company_email (email)
  INDEX idx_company_status (status)
}
```

### 3.3 Company Documents
```sql
company_documents {
  id: UUID PRIMARY KEY
  companyId: UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE
  documentType: VARCHAR(50) NOT NULL -- 'registration', 'tax', 'license', etc.
  documentUrl: VARCHAR(500) NOT NULL
  documentName: VARCHAR(255) NOT NULL
  uploadedAt: TIMESTAMP DEFAULT NOW()
  verifiedAt: TIMESTAMP
  verifiedBy: UUID
  status: ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'

  INDEX idx_company_docs (companyId)
}
```

### 3.4 User (formerly User)
```sql
users {
  id: UUID PRIMARY KEY
  name: VARCHAR(255) NOT NULL
  email: VARCHAR(255) NOT NULL UNIQUE
  passwordHash: VARCHAR(255) NOT NULL -- bcrypt hashed
  frpEmail: VARCHAR(255) -- Factory Reset Protection email
  phone: VARCHAR(20) NOT NULL

  -- Role Hierarchy: SUPER_ADMIN → SUPER → DISTRIBUTOR → RETAILER
  role: ENUM('super_admin', 'super', 'distributor', 'retailer') DEFAULT 'retailer'

  -- Hierarchy structure
  companyId: UUID REFERENCES companies(id) ON DELETE CASCADE -- NULL for super_admin
  parentUserId: UUID REFERENCES users(id) -- Parent in hierarchy (NULL for super_admin and super)
  hierarchyLevel: INTEGER DEFAULT 0 -- 0=super_admin, 1=super, 2=distributor, 3=retailer
  hierarchyPath: VARCHAR(500) -- Materialized path: "super_id/distributor_id/retailer_id"

  -- Commission & Financial
  commissionPercentage: DECIMAL(5,2) DEFAULT 0 -- Commission % for this user
  balance: DECIMAL(15,2) DEFAULT 0 -- Available keys balance
  activeClients: INTEGER DEFAULT 0 -- Clients using keys from this user

  -- Status
  status: ENUM('active', 'inactive', 'suspended') DEFAULT 'active'

  -- Profile
  profileUrl: VARCHAR(500)
  addressId: UUID REFERENCES addresses(id)
  contactPhone: VARCHAR(20)
  contactEmail: VARCHAR(255)

  -- Security fields
  lastLoginAt: TIMESTAMP
  lastLoginIp: VARCHAR(45)
  failedLoginAttempts: INTEGER DEFAULT 0
  lockedUntil: TIMESTAMP
  passwordChangedAt: TIMESTAMP
  require2FA: BOOLEAN DEFAULT false -- Force 2FA for sensitive roles

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  createdBy: UUID
  lastModifiedBy: UUID

  INDEX idx_user_email (email)
  INDEX idx_user_company (companyId)
  INDEX idx_user_parent (parentUserId)
  INDEX idx_user_role (role)
  INDEX idx_user_status (status)
  INDEX idx_user_hierarchy_path (hierarchyPath)
  INDEX idx_user_hierarchy_level (hierarchyLevel)
  UNIQUE INDEX idx_user_company_email (companyId, email)

  -- Constraints
  CHECK (
    (role = 'super_admin' AND companyId IS NULL AND parentUserId IS NULL AND hierarchyLevel = 0) OR
    (role = 'super' AND companyId IS NOT NULL AND parentUserId IS NULL AND hierarchyLevel = 1) OR
    (role = 'distributor' AND companyId IS NOT NULL AND parentUserId IS NOT NULL AND hierarchyLevel = 2) OR
    (role = 'retailer' AND companyId IS NOT NULL AND parentUserId IS NOT NULL AND hierarchyLevel IN (2, 3))
  )
}
```

### 3.5 User Documents (formerly User Documents)
```sql
user_documents {
  id: UUID PRIMARY KEY
  userId: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  documentType: VARCHAR(50) NOT NULL -- 'id_proof', 'address_proof', 'business_license', etc.
  documentUrl: VARCHAR(500) NOT NULL
  documentName: VARCHAR(255) NOT NULL
  uploadedAt: TIMESTAMP DEFAULT NOW()
  verifiedAt: TIMESTAMP
  verifiedBy: UUID
  status: ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'

  INDEX idx_user_docs (userId)
}
```

### 3.6 Client (Key/License)
```sql
clients {
  id: UUID PRIMARY KEY
  uniqueKey: VARCHAR(256) NOT NULL UNIQUE -- Encrypted license key (deprecated, use uniqueCode)

  -- Zero-Touch Provisioning (NEW)
  uniqueCode: VARCHAR(256) UNIQUE NOT NULL -- For QR code, generated on client creation
  deviceUniqueCode: VARCHAR(256) UNIQUE -- Generated after device registration

  -- Device Information (Initial - from Retailer)
  imei1: VARCHAR(20) -- Provided by retailer
  imei2: VARCHAR(20) -- Provided by retailer
  brand: VARCHAR(100)
  ram: VARCHAR(20)
  storage: VARCHAR(20)
  modelName: VARCHAR(100)

  -- Device Information (Actual - from Device)
  actualImei1: VARCHAR(20) -- Actual IMEI from device after registration
  actualImei2: VARCHAR(20) -- Actual IMEI from device after registration
  androidApiLevel: INTEGER
  androidVersion: VARCHAR(50)
  deviceManufacturer: VARCHAR(100)
  deviceModel: VARCHAR(100)
  deviceSerialNumber: VARCHAR(100)
  androidDeviceId: VARCHAR(255)

  -- Cryptographic Keys for Device Authentication (NEW)
  devicePublicKey: TEXT -- Device's RSA public key (PEM format)
  serverPublicKey: TEXT -- Server's public key for this device
  serverPrivateKey: TEXT -- Server's private key (AES-256 encrypted)

  -- Device Registration Tracking (NEW)
  deviceRegisteredAt: TIMESTAMP
  lastDeviceSyncAt: TIMESTAMP

  -- IMEI Tracking (NEW)
  imeiMismatch: BOOLEAN DEFAULT false -- Flag if retailer's IMEI != device's IMEI
  imeiChangedAt: TIMESTAMP
  imeiChangeReason: VARCHAR(100) -- 'initial_mismatch', 'device_replaced', etc.

  -- Client Information
  clientName: VARCHAR(255) NOT NULL
  clientEmail: VARCHAR(255)
  clientPhone1: VARCHAR(20) NOT NULL
  clientPhone2: VARCHAR(20)
  profileUrl: VARCHAR(500) NOT NULL

  -- Relationships
  userId: UUID NOT NULL REFERENCES users(id) -- Retailer who created/owns this client
  companyId: UUID NOT NULL REFERENCES companies(id)

  -- Status and Protection
  status: ENUM(
    'deviceNotRegistered',  -- Initial state after retailer creates client
    'deviceVerified',       -- Device successfully registered
    'protected',            -- Protection active
    'notProtected',         -- Protection inactive
    'locked',               -- Device locked
    'expired'               -- License expired
  ) DEFAULT 'deviceNotRegistered'

  -- Permissions
  permissionStatus: ENUM('locked', 'unlocked') DEFAULT 'unlocked'
  canMakeCall: BOOLEAN DEFAULT true
  isStolen: BOOLEAN DEFAULT false
  stolenMarkedAt: TIMESTAMP

  -- Financial Information
  totalAmount: DECIMAL(15,2) NOT NULL
  downPayment: DECIMAL(15,2) NOT NULL
  numberOfEmi: INTEGER NOT NULL
  emiAmount: DECIMAL(15,2) NOT NULL
  paidEmis: INTEGER DEFAULT 0
  remainingAmount: DECIMAL(15,2)

  -- Key activation/expiry
  activatedAt: TIMESTAMP
  expiresAt: TIMESTAMP
  lastSyncAt: TIMESTAMP -- Last device sync

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  createdBy: UUID

  INDEX idx_client_user (userId)
  INDEX idx_client_company (companyId)
  INDEX idx_client_status (status)
  INDEX idx_client_phone (clientPhone1)
  INDEX idx_client_imei1 (imei1)
  INDEX idx_client_imei2 (imei2)
  INDEX idx_client_actual_imei1 (actualImei1)
  INDEX idx_client_actual_imei2 (actualImei2)
  INDEX idx_client_unique_code (uniqueCode)
  UNIQUE INDEX idx_client_device_unique (deviceUniqueCode)
}
```

### 3.7 Key Transfers

```sql
key_transfers {
  id: UUID PRIMARY KEY

  -- Transfer hierarchy
  fromUserId: UUID NOT NULL REFERENCES users(id) -- User transferring keys (higher level)
  toUserId: UUID NOT NULL REFERENCES users(id)   -- User receiving keys (lower level)

  -- Transfer details
  quantity: INTEGER NOT NULL                      -- Number of keys transferred
  baseRate: DECIMAL(10,2) NOT NULL               -- Base rate per key (from company settings)
  commissionPercentage: DECIMAL(5,2) NOT NULL    -- Commission % for receiver
  transferAmount: DECIMAL(15,2) NOT NULL         -- Actual amount paid by receiver
  commissionAmount: DECIMAL(15,2) NOT NULL       -- Commission retained by sender

  -- Relationships
  orderId: UUID REFERENCES orders(id)            -- Original order (if from super → super_admin)
  companyId: UUID NOT NULL REFERENCES companies(id)

  -- Status tracking
  status: ENUM(
    'pending',           -- Transfer initiated, awaiting payment
    'payment_received',  -- Payment received, keys ready to transfer
    'completed',         -- Keys transferred successfully
    'cancelled'          -- Transfer cancelled
  ) DEFAULT 'pending'

  -- Payment details
  paymentMethod: VARCHAR(50)                     -- 'cash', 'upi', 'bank_transfer', etc.
  paymentTransactionId: VARCHAR(255)             -- External transaction reference
  paymentReceivedAt: TIMESTAMP
  paymentProof: VARCHAR(500)                     -- S3 URL for payment proof

  -- Notes
  notes: TEXT
  cancellationReason: TEXT

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  completedAt: TIMESTAMP
  cancelledAt: TIMESTAMP
  createdBy: UUID
  approvedBy: UUID

  INDEX idx_key_transfer_from (fromUserId)
  INDEX idx_key_transfer_to (toUserId)
  INDEX idx_key_transfer_order (orderId)
  INDEX idx_key_transfer_company (companyId)
  INDEX idx_key_transfer_status (status)
  INDEX idx_key_transfer_created (createdAt)
}
```

### 3.8 OTP Management (All Purpose)
```sql
otps {
  id: UUID PRIMARY KEY

  -- Recipient information
  recipientType: ENUM('user', 'client') NOT NULL
  recipientId: UUID NOT NULL -- userId or clientId

  -- Contact information
  email: VARCHAR(255)
  phone: VARCHAR(20)

  -- OTP details
  otpCode: VARCHAR(6) NOT NULL -- Encrypted, 6-digit code
  otpType: ENUM(
    'login_2fa',           -- Two-factor authentication for login
    'email_verification',  -- Email verification
    'phone_verification',  -- Phone verification
    'emergency_unlock',    -- Emergency device unlock
    'password_reset',      -- Password reset
    'balance_transfer'     -- High-value balance transfer confirmation
  ) NOT NULL

  -- Status and validation
  isUsed: BOOLEAN DEFAULT false
  isExpired: BOOLEAN DEFAULT false
  attemptCount: INTEGER DEFAULT 0
  maxAttempts: INTEGER DEFAULT 5

  -- Timestamps
  createdAt: TIMESTAMP DEFAULT NOW()
  expiresAt: TIMESTAMP NOT NULL -- Default: NOW() + 10 minutes
  usedAt: TIMESTAMP

  -- Security
  ipAddress: VARCHAR(45)
  userAgent: TEXT

  INDEX idx_otp_recipient (recipientType, recipientId)
  INDEX idx_otp_type (otpType)
  INDEX idx_otp_email (email)
  INDEX idx_otp_phone (phone)
  INDEX idx_otp_expires (expiresAt)
  INDEX idx_otp_created (createdAt)
}
```

### 3.9 OTP Rate Limiting
```sql
otp_rate_limits {
  id: UUID PRIMARY KEY

  -- Target information
  recipientType: ENUM('user', 'client') NOT NULL
  recipientId: UUID NOT NULL
  otpType: ENUM(
    'login_2fa',
    'email_verification',
    'phone_verification',
    'emergency_unlock',
    'password_reset',
    'balance_transfer'
  ) NOT NULL

  -- Rate limiting
  requestCount: INTEGER DEFAULT 1
  firstRequestAt: TIMESTAMP DEFAULT NOW()
  lastRequestAt: TIMESTAMP DEFAULT NOW()
  cooldownUntil: TIMESTAMP -- When cooldown expires

  -- Limits: 5 OTPs per type in 10 minutes, then 15 min cooldown
  isInCooldown: BOOLEAN DEFAULT false

  INDEX idx_otp_rate_recipient (recipientType, recipientId, otpType)
  INDEX idx_otp_rate_cooldown (cooldownUntil)
  UNIQUE INDEX idx_otp_rate_unique (recipientType, recipientId, otpType, firstRequestAt)
}
```

### 3.10 Device Location History

```sql
device_location_history {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE

  -- Location data
  latitude: DECIMAL(10,8) NOT NULL
  longitude: DECIMAL(11,8) NOT NULL
  accuracy: DECIMAL(10,2) -- Accuracy in meters
  altitude: DECIMAL(10,2)

  -- Additional info
  address: TEXT -- Reverse geocoded address
  provider: VARCHAR(50) -- 'gps', 'network', 'passive'

  -- Timestamps
  recordedAt: TIMESTAMP NOT NULL -- When device recorded this
  createdAt: TIMESTAMP DEFAULT NOW() -- When received by server

  INDEX idx_location_client (clientId)
  INDEX idx_location_recorded (recordedAt)
  INDEX idx_location_client_time (clientId, recordedAt DESC)
}

-- Partition this table by month for better performance
```

### 3.11 Device Messages (User to Client)

```sql
device_messages {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
  userId: UUID NOT NULL REFERENCES users(id) -- Retailer who owns the client

  -- Message details
  messageType: ENUM('text', 'audio') NOT NULL
  messageContent: TEXT -- Text message or audio URL
  audioUrl: VARCHAR(500) -- S3 URL if audio message
  audioDuration: INTEGER -- Duration in seconds

  -- Status
  status: ENUM(
    'pending',      -- Created, not yet sent to device
    'sent',         -- Sent to device
    'delivered',    -- Device acknowledged receipt
    'played',       -- Audio played or text displayed
    'failed'        -- Failed to deliver
  ) DEFAULT 'pending'

  deliveredAt: TIMESTAMP
  playedAt: TIMESTAMP

  -- Timestamps
  createdAt: TIMESTAMP DEFAULT NOW()
  expiresAt: TIMESTAMP -- Message expiry (optional)

  INDEX idx_message_client (clientId)
  INDEX idx_message_user (userId)
  INDEX idx_message_status (status)
  INDEX idx_message_created (createdAt)
}
```

### 3.12 Device Activity Logs

```sql
device_activity_logs {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE

  -- Activity details
  activityType: ENUM(
    'device_sync',          -- Regular sync
    'location_update',      -- Location updated
    'status_change',        -- Device status changed
    'app_installed',        -- App installed
    'app_uninstalled',      -- App uninstalled
    'sim_change',           -- SIM card changed
    'factory_reset_attempt',-- Factory reset attempted
    'unlock_attempt',       -- Device unlock attempted
    'emergency_unlock',     -- Emergency unlock used
    'power_on',            -- Device powered on
    'power_off',           -- Device powered off
    'low_battery',         -- Battery low
    'message_played'       -- Message played/displayed
  ) NOT NULL

  -- Activity metadata
  metadata: JSONB -- Store activity-specific data

  -- Device state at time of activity
  batteryLevel: INTEGER
  isCharging: BOOLEAN
  networkType: VARCHAR(20) -- 'wifi', '4g', '5g', etc.

  -- Timestamps
  occurredAt: TIMESTAMP NOT NULL -- When activity occurred on device
  createdAt: TIMESTAMP DEFAULT NOW() -- When received by server

  INDEX idx_activity_client (clientId)
  INDEX idx_activity_type (activityType)
  INDEX idx_activity_occurred (occurredAt)
  INDEX idx_activity_client_time (clientId, occurredAt DESC)
}

-- Partition this table by month for better performance
```

### 3.13 Email Queue

```sql
email_queue {
  id: UUID PRIMARY KEY

  -- Recipient information
  recipientType: ENUM('user', 'client', 'company') NOT NULL
  recipientId: UUID NOT NULL
  toEmail: VARCHAR(255) NOT NULL
  toName: VARCHAR(255)

  -- Email content
  subject: VARCHAR(500) NOT NULL
  body: TEXT NOT NULL
  bodyHtml: TEXT -- HTML version
  fromEmail: VARCHAR(255) NOT NULL
  fromName: VARCHAR(255)
  replyTo: VARCHAR(255)

  -- Email type
  emailType: ENUM(
    'otp',                    -- OTP delivery
    'welcome',                -- Welcome email
    'password_reset',         -- Password reset link
    'order_confirmation',     -- Order confirmation
    'invoice',                -- Invoice email
    'device_registered',      -- Device registration confirmation
    'device_locked',          -- Device locked notification
    'device_stolen',          -- Device marked as stolen
    'low_balance',            -- Low balance alert
    'payment_reminder',       -- Payment reminder
    'system_alert'            -- System alerts
  ) NOT NULL

  -- Status and retry
  status: ENUM('pending', 'sending', 'sent', 'failed', 'bounced') DEFAULT 'pending'
  attemptCount: INTEGER DEFAULT 0
  maxAttempts: INTEGER DEFAULT 3
  lastAttemptAt: TIMESTAMP
  nextRetryAt: TIMESTAMP

  -- Delivery tracking
  sentAt: TIMESTAMP
  deliveredAt: TIMESTAMP
  openedAt: TIMESTAMP
  clickedAt: TIMESTAMP

  -- Provider details
  provider: VARCHAR(50) -- 'sendgrid', 'ses', 'smtp'
  externalId: VARCHAR(255) -- Provider's message ID
  errorMessage: TEXT
  errorCode: VARCHAR(50)

  -- Attachments (JSON array of URLs)
  attachments: JSONB

  -- Priority
  priority: ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal'

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_email_recipient (recipientType, recipientId)
  INDEX idx_email_status (status)
  INDEX idx_email_type (emailType)
  INDEX idx_email_next_retry (nextRetryAt)
  INDEX idx_email_created (createdAt)
  INDEX idx_email_priority_status (priority, status)
}
```

### 3.14 SMS Queue

```sql
sms_queue {
  id: UUID PRIMARY KEY

  -- Recipient information
  recipientType: ENUM('user', 'client', 'company') NOT NULL
  recipientId: UUID NOT NULL
  toPhone: VARCHAR(20) NOT NULL
  countryCode: VARCHAR(5) -- '+1', '+91', etc.

  -- SMS content
  message: TEXT NOT NULL
  smsType: ENUM(
    'otp',                    -- OTP delivery
    'verification',           -- Phone verification
    'alert',                  -- Important alerts
    'device_locked',          -- Device locked notification
    'device_stolen',          -- Device marked as stolen
    'payment_reminder',       -- Payment reminder
    'emergency_contact',      -- Emergency contact message
    'system_alert'            -- System alerts
  ) NOT NULL

  -- Status and retry
  status: ENUM('pending', 'sending', 'sent', 'failed', 'delivered', 'undelivered') DEFAULT 'pending'
  attemptCount: INTEGER DEFAULT 0
  maxAttempts: INTEGER DEFAULT 3
  lastAttemptAt: TIMESTAMP
  nextRetryAt: TIMESTAMP

  -- Delivery tracking
  sentAt: TIMESTAMP
  deliveredAt: TIMESTAMP

  -- Provider details
  provider: VARCHAR(50) -- 'twilio', 'sns', 'msg91'
  externalId: VARCHAR(255) -- Provider's message ID
  errorMessage: TEXT
  errorCode: VARCHAR(50)
  cost: DECIMAL(10,4) -- SMS cost

  -- Priority
  priority: ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal'

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_sms_recipient (recipientType, recipientId)
  INDEX idx_sms_status (status)
  INDEX idx_sms_type (smsType)
  INDEX idx_sms_next_retry (nextRetryAt)
  INDEX idx_sms_created (createdAt)
  INDEX idx_sms_priority_status (priority, status)
}
```

### 3.15 Push Notifications

```sql
push_notifications {
  id: UUID PRIMARY KEY

  -- Recipient information
  recipientType: ENUM('user', 'client') NOT NULL
  recipientId: UUID NOT NULL
  deviceToken: VARCHAR(500) NOT NULL -- FCM/APNS token

  -- Notification content
  title: VARCHAR(255) NOT NULL
  body: TEXT NOT NULL
  notificationType: ENUM(
    'device_sync',            -- Device sync completed
    'device_locked',          -- Device locked
    'device_unlocked',        -- Device unlocked
    'device_stolen',          -- Device marked as stolen
    'low_balance',            -- Low balance alert
    'new_order',              -- New order placed
    'payment_received',       -- Payment received
    'client_registered',      -- New client registered
    'message_received',       -- New message from user
    'location_alert',         -- Location-based alert
    'emi_due',                -- EMI payment due
    'system_update',          -- System update available
    'general'                 -- General notification
  ) NOT NULL

  -- Notification data (custom payload)
  data: JSONB

  -- Status and retry
  status: ENUM('pending', 'sending', 'sent', 'failed', 'delivered') DEFAULT 'pending'
  attemptCount: INTEGER DEFAULT 0
  maxAttempts: INTEGER DEFAULT 3
  lastAttemptAt: TIMESTAMP
  nextRetryAt: TIMESTAMP

  -- Delivery tracking
  sentAt: TIMESTAMP
  deliveredAt: TIMESTAMP
  readAt: TIMESTAMP
  clickedAt: TIMESTAMP

  -- Provider details
  provider: VARCHAR(50) -- 'fcm', 'apns'
  externalId: VARCHAR(255) -- Provider's message ID
  errorMessage: TEXT
  errorCode: VARCHAR(50)

  -- Display options
  sound: VARCHAR(100) DEFAULT 'default'
  badge: INTEGER
  priority: ENUM('low', 'normal', 'high') DEFAULT 'normal'
  ttl: INTEGER DEFAULT 86400 -- Time to live in seconds (24 hours)

  -- Action buttons (JSON array)
  actions: JSONB

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_push_recipient (recipientType, recipientId)
  INDEX idx_push_status (status)
  INDEX idx_push_type (notificationType)
  INDEX idx_push_next_retry (nextRetryAt)
  INDEX idx_push_created (createdAt)
  INDEX idx_push_device_token (deviceToken)
}
```

### 3.16 Device Tokens (For Push Notifications)

```sql
device_tokens {
  id: UUID PRIMARY KEY

  -- Owner information
  ownerType: ENUM('user', 'client') NOT NULL
  ownerId: UUID NOT NULL

  -- Token details
  token: VARCHAR(500) NOT NULL UNIQUE
  platform: ENUM('android', 'ios') NOT NULL
  appVersion: VARCHAR(20)
  osVersion: VARCHAR(20)

  -- Device information
  deviceModel: VARCHAR(100)
  deviceName: VARCHAR(255)
  deviceId: VARCHAR(255) -- Unique device identifier

  -- Status
  isActive: BOOLEAN DEFAULT true
  lastUsedAt: TIMESTAMP DEFAULT NOW()

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_device_token_owner (ownerType, ownerId)
  INDEX idx_device_token_active (isActive)
  INDEX idx_device_token_platform (platform)
  UNIQUE INDEX idx_device_token_unique (token)
}
```

### 3.17 Notification Preferences

```sql
notification_preferences {
  id: UUID PRIMARY KEY

  -- User information
  userType: ENUM('user', 'client', 'company') NOT NULL
  userId: UUID NOT NULL

  -- Email preferences
  emailEnabled: BOOLEAN DEFAULT true
  emailOtp: BOOLEAN DEFAULT true
  emailAlerts: BOOLEAN DEFAULT true
  emailReports: BOOLEAN DEFAULT true
  emailMarketing: BOOLEAN DEFAULT false

  -- SMS preferences
  smsEnabled: BOOLEAN DEFAULT true
  smsOtp: BOOLEAN DEFAULT true
  smsAlerts: BOOLEAN DEFAULT true
  smsMarketing: BOOLEAN DEFAULT false

  -- Push notification preferences
  pushEnabled: BOOLEAN DEFAULT true
  pushDeviceEvents: BOOLEAN DEFAULT true
  pushPayments: BOOLEAN DEFAULT true
  pushAlerts: BOOLEAN DEFAULT true

  -- Quiet hours (no notifications except urgent)
  quietHoursEnabled: BOOLEAN DEFAULT false
  quietHoursStart: TIME -- e.g., 22:00:00
  quietHoursEnd: TIME -- e.g., 08:00:00

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_notification_pref_user (userType, userId)
  UNIQUE INDEX idx_notification_pref_unique (userType, userId)
}
```

### 3.18 Client Documents

```sql
client_documents {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
  documentType: VARCHAR(50) NOT NULL
  documentUrl: VARCHAR(500) NOT NULL
  documentName: VARCHAR(255) NOT NULL
  uploadedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_client_docs (clientId)
}
```

### 3.19 Client Allowed Apps

```sql
client_allowed_apps {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
  packageName: VARCHAR(255) NOT NULL
  appName: VARCHAR(255)
  isAllowed: BOOLEAN DEFAULT true
  addedAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_client_apps (clientId)
  UNIQUE INDEX idx_client_app_package (clientId, packageName)
}
```

### 3.20 Order

```sql
orders {
  id: UUID PRIMARY KEY
  orderId: VARCHAR(50) NOT NULL UNIQUE -- Human readable order ID
  orderBy: UUID NOT NULL REFERENCES users(id) -- User who placed order
  orderFrom: UUID NOT NULL REFERENCES companies(id)

  totalKeys: INTEGER NOT NULL
  ratePerKey: DECIMAL(15,2) NOT NULL
  tax: DECIMAL(15,2) DEFAULT 0
  taxPercentage: DECIMAL(5,2) DEFAULT 0
  discount: DECIMAL(15,2) DEFAULT 0
  totalAmount: DECIMAL(15,2) NOT NULL -- (ratePerKey * totalKeys) + tax - discount

  status: ENUM(
    'pending',
    'processing',
    'completed',
    'cancelled',
    'refunded'
  ) DEFAULT 'pending'

  notes: TEXT

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  completedAt: TIMESTAMP
  cancelledAt: TIMESTAMP

  INDEX idx_order_user (orderBy)
  INDEX idx_order_company (orderFrom)
  INDEX idx_order_status (status)
  INDEX idx_order_created (createdAt)
}
```

### 3.21 Transaction

```sql
transactions {
  id: UUID PRIMARY KEY
  transactionId: VARCHAR(100) NOT NULL UNIQUE -- Internal transaction ID

  -- Related entities
  orderId: UUID REFERENCES orders(id)
  userId: UUID REFERENCES users(id)
  companyId: UUID REFERENCES companies(id)

  amount: DECIMAL(15,2) NOT NULL
  paymentMethod: ENUM(
    'cash',
    'card',
    'upi',
    'net_banking',
    'wallet',
    'bank_transfer'
  ) NOT NULL

  externalTransId: VARCHAR(255) -- Payment gateway transaction ID

  status: ENUM(
    'initiated',
    'pending',
    'processing',
    'success',
    'failed',
    'refunded',
    'cancelled'
  ) DEFAULT 'initiated'

  failureReason: TEXT
  refundReason: TEXT
  refundedAt: TIMESTAMP

  -- Payment gateway details
  gatewayName: VARCHAR(100) -- 'razorpay', 'stripe', etc.
  gatewayResponse: JSONB -- Store raw gateway response

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
  processedAt: TIMESTAMP

  INDEX idx_transaction_order (orderId)
  INDEX idx_transaction_user (userId)
  INDEX idx_transaction_status (status)
  INDEX idx_transaction_created (createdAt)
}
```

### 3.22 Balance Sheet (Ledger)

```sql
balance_sheets {
  id: UUID PRIMARY KEY

  -- Transaction details
  transactionType: ENUM(
    'key_purchase',        -- User purchases keys from company
    'key_use',            -- User uses key to create client
    'balance_transfer',   -- User transfers balance to another user
    'balance_received',   -- User receives balance from another user
    'refund',            -- Refund processed
    'commission',        -- Commission earned
    'adjustment'         -- Manual adjustment
  ) NOT NULL

  -- Entities involved
  companyId: UUID NOT NULL REFERENCES companies(id)
  userId: UUID REFERENCES users(id)
  clientId: UUID REFERENCES clients(id)
  orderId: UUID REFERENCES orders(id)
  transactionId: UUID REFERENCES transactions(id)

  -- Transfer details (for balance transfers)
  fromUserId: UUID REFERENCES users(id) -- Source user
  toUserId: UUID REFERENCES users(id)   -- Destination user

  -- Financial details
  amount: DECIMAL(15,2) NOT NULL
  balanceBefore: DECIMAL(15,2) NOT NULL
  balanceAfter: DECIMAL(15,2) NOT NULL

  -- Metadata
  description: TEXT
  metadata: JSONB -- Store additional data

  -- Audit fields
  createdAt: TIMESTAMP DEFAULT NOW()
  createdBy: UUID

  INDEX idx_balance_company (companyId)
  INDEX idx_balance_user (userId)
  INDEX idx_balance_type (transactionType)
  INDEX idx_balance_created (createdAt)
  INDEX idx_balance_from_user (fromUserId)
  INDEX idx_balance_to_user (toUserId)
}
```

### 3.23 Refresh Tokens (For JWT)

```sql
refresh_tokens {
  id: UUID PRIMARY KEY
  userId: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  token: VARCHAR(500) NOT NULL UNIQUE
  expiresAt: TIMESTAMP NOT NULL
  createdAt: TIMESTAMP DEFAULT NOW()
  lastUsedAt: TIMESTAMP
  deviceInfo: JSONB -- Browser, OS, IP, etc.
  isRevoked: BOOLEAN DEFAULT false

  INDEX idx_refresh_token_user (userId)
  INDEX idx_refresh_token_expires (expiresAt)
}
```

### 3.24 Audit Logs

```sql
audit_logs {
  id: UUID PRIMARY KEY
  entityType: VARCHAR(50) NOT NULL -- 'company', 'user', 'client', etc.
  entityId: UUID NOT NULL
  action: VARCHAR(50) NOT NULL -- 'create', 'update', 'delete', 'login', etc.
  performedBy: UUID -- User who performed action
  performedByType: ENUM('user', 'system', 'super_admin')
  ipAddress: VARCHAR(45)
  userAgent: TEXT
  changes: JSONB -- Store before/after values
  timestamp: TIMESTAMP DEFAULT NOW()

  INDEX idx_audit_entity (entityType, entityId)
  INDEX idx_audit_performer (performedBy)
  INDEX idx_audit_timestamp (timestamp)
}
```

---

## 4. API Endpoints Design

### 4.1 Authentication APIs
```
POST   /api/v1/auth/register          # Register new company (first user as super)
POST   /api/v1/auth/login             # Login (returns temp token if 2FA enabled)
POST   /api/v1/auth/verify-2fa        # Verify 2FA OTP and complete login
POST   /api/v1/auth/refresh-token     # Refresh JWT token
POST   /api/v1/auth/logout            # Logout
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password with OTP
POST   /api/v1/auth/change-password   # Change password (authenticated)
```

### 4.2 Company APIs
```
GET    /api/v1/companies              # List companies (super_admin only)
POST   /api/v1/companies              # Create new company (super_admin only)
GET    /api/v1/companies/:id          # Get company details
PUT    /api/v1/companies/:id          # Update company (super_admin or super)
PATCH  /api/v1/companies/:id/status   # Update company status (super_admin only)
PATCH  /api/v1/companies/:id/pricing  # Update base rate & tax (super_admin only)
GET    /api/v1/companies/:id/stats    # Company statistics
GET    /api/v1/companies/:id/hierarchy # Get user hierarchy tree
POST   /api/v1/companies/:id/documents # Upload company documents
GET    /api/v1/companies/:id/documents # Get company documents
```

### 4.3 User APIs (formerly User APIs)

```
# User Management
POST   /api/v1/users                  # Create new user (role-based: super creates distributor/retailer)
GET    /api/v1/users                  # List users (hierarchical based on role)
GET    /api/v1/users/:id              # Get user details
PUT    /api/v1/users/:id              # Update user
PATCH  /api/v1/users/:id/status       # Update user status
PATCH  /api/v1/users/:id/commission   # Update commission percentage (super/super_admin only)

# Balance & Keys
GET    /api/v1/users/:id/balance      # Get user balance
GET    /api/v1/users/:id/clients      # Get user's clients (retailers only)
GET    /api/v1/users/:id/downstream   # Get downstream users (super/distributors)

# Hierarchy Management
POST   /api/v1/users/:id/transfer-downstream  # Transfer all downstream users to new parent
GET    /api/v1/users/:id/hierarchy            # Get user's position in hierarchy
POST   /api/v1/users/:id/replace              # Replace user in hierarchy (move to new parent)

# Documents & Verification
POST   /api/v1/users/:id/documents    # Upload user documents
POST   /api/v1/users/:id/verify-email # Send email verification OTP
POST   /api/v1/users/:id/verify-phone # Send phone verification OTP
POST   /api/v1/users/:id/confirm-verification # Confirm email/phone with OTP
```

### 4.4 Client/Key APIs

```
# Retailer-side Client Management (JWT Auth)
POST   /api/v1/clients                # Create new client (use key, returns QR code)
GET    /api/v1/clients                # List clients
GET    /api/v1/clients/:id            # Get client details
PUT    /api/v1/clients/:id            # Update client
GET    /api/v1/clients/:id/qr-code    # Regenerate QR code for unregistered device
PATCH  /api/v1/clients/:id/status     # Update client status
PATCH  /api/v1/clients/:id/lock       # Lock device
PATCH  /api/v1/clients/:id/unlock     # Unlock device
POST   /api/v1/clients/:id/request-emergency-unlock # Request emergency unlock OTP
POST   /api/v1/clients/:id/emergency-unlock # Emergency unlock with OTP
PATCH  /api/v1/clients/:id/mark-stolen # Mark device as stolen
GET    /api/v1/clients/:id/permissions # Get client permissions
PUT    /api/v1/clients/:id/permissions # Update client permissions
POST   /api/v1/clients/:id/allowed-apps # Add allowed app
DELETE /api/v1/clients/:id/allowed-apps/:appId # Remove allowed app
POST   /api/v1/clients/:id/documents  # Upload client documents

# Device-side Registration & Communication (Signature Auth)
POST   /api/v1/clients/register-device         # Initial device registration (QR scan)
POST   /api/v1/clients/register-device/confirm # Confirm IMEI mismatch & complete registration
POST   /api/v1/clients/:id/sync                # Device sync endpoint (signed request)
POST   /api/v1/clients/:id/heartbeat           # Device heartbeat (signed request)
GET    /api/v1/clients/:id/commands            # Fetch pending commands (lock/unlock, etc.)
POST   /api/v1/clients/:id/command-ack         # Acknowledge command execution
```

### 4.5 Key Transfer APIs

```
# Hierarchical Key Transfers
POST   /api/v1/key-transfers          # Initiate key transfer to downstream user
GET    /api/v1/key-transfers          # List key transfers (sent/received)
GET    /api/v1/key-transfers/:id      # Get transfer details
PATCH  /api/v1/key-transfers/:id/confirm-payment  # Confirm payment received
PATCH  /api/v1/key-transfers/:id/complete        # Complete transfer (send keys)
PATCH  /api/v1/key-transfers/:id/cancel          # Cancel transfer
POST   /api/v1/key-transfers/:id/upload-proof    # Upload payment proof

# Transfer Analytics
GET    /api/v1/key-transfers/sent     # Transfers sent to downstream
GET    /api/v1/key-transfers/received # Transfers received from upstream
GET    /api/v1/key-transfers/pending  # Pending transfers
```

### 4.6 Order APIs

```
# Orders (Super → Super Admin only)
POST   /api/v1/orders                 # Create new order (purchase keys from super_admin)
GET    /api/v1/orders                 # List orders
GET    /api/v1/orders/:id             # Get order details
PATCH  /api/v1/orders/:id/approve     # Approve order (super_admin only)
PATCH  /api/v1/orders/:id/cancel      # Cancel order
GET    /api/v1/orders/:id/invoice     # Generate invoice
```

### 4.7 Transaction APIs

```
POST   /api/v1/transactions           # Create transaction
GET    /api/v1/transactions           # List transactions
GET    /api/v1/transactions/:id       # Get transaction details
POST   /api/v1/transactions/:id/refund # Refund transaction
GET    /api/v1/transactions/:id/receipt # Generate receipt
```

### 4.7 Balance Sheet APIs
```
GET    /api/v1/balance-sheets         # List balance sheet entries
GET    /api/v1/balance-sheets/summary # Get balance summary
GET    /api/v1/balance-sheets/export  # Export balance sheet (CSV/PDF)
```

### 4.8 OTP APIs
```
POST   /api/v1/otp/send               # Send OTP (generic endpoint)
POST   /api/v1/otp/verify             # Verify OTP
POST   /api/v1/otp/resend             # Resend OTP
GET    /api/v1/otp/rate-limit-status  # Check rate limit status
```

### 4.9 Device Location APIs
```
POST   /api/v1/clients/:id/location   # Update device location (from device)
GET    /api/v1/clients/:id/location/history # Get location history
GET    /api/v1/clients/:id/location/latest # Get latest location
GET    /api/v1/clients/:id/location/track # Real-time location tracking
DELETE /api/v1/clients/:id/location/history # Clear old location data
```

### 4.10 Device Message APIs
```
POST   /api/v1/clients/:id/messages   # Send message to device (text/audio)
GET    /api/v1/clients/:id/messages   # Get all messages for device
GET    /api/v1/clients/:id/messages/:messageId # Get specific message
PATCH  /api/v1/clients/:id/messages/:messageId/status # Update message status (from device)
DELETE /api/v1/clients/:id/messages/:messageId # Delete message
POST   /api/v1/clients/:id/messages/audio # Upload audio message
```

### 4.11 Device Activity APIs
```
POST   /api/v1/clients/:id/activity   # Log device activity (from device)
GET    /api/v1/clients/:id/activity   # Get device activity logs
GET    /api/v1/clients/:id/activity/summary # Get activity summary
GET    /api/v1/clients/:id/activity/export # Export activity logs (CSV/PDF)
```

### 4.12 Reports & Analytics APIs
```
GET    /api/v1/reports/dashboard      # Dashboard stats
GET    /api/v1/reports/sales          # Sales report
GET    /api/v1/reports/agents         # User performance report
GET    /api/v1/reports/clients        # Client report
GET    /api/v1/reports/revenue        # Revenue report
GET    /api/v1/reports/device-activity # Device activity report
GET    /api/v1/reports/stolen-devices # Stolen devices report
```

### 4.13 Notification APIs
```
# Email
POST   /api/v1/notifications/email/send       # Send email
GET    /api/v1/notifications/email            # List email queue
GET    /api/v1/notifications/email/:id        # Get email details
POST   /api/v1/notifications/email/:id/retry  # Retry failed email

# SMS
POST   /api/v1/notifications/sms/send         # Send SMS
GET    /api/v1/notifications/sms              # List SMS queue
GET    /api/v1/notifications/sms/:id          # Get SMS details
POST   /api/v1/notifications/sms/:id/retry    # Retry failed SMS

# Push Notifications
POST   /api/v1/notifications/push/send        # Send push notification
GET    /api/v1/notifications/push             # List push notifications
GET    /api/v1/notifications/push/:id         # Get notification details
POST   /api/v1/notifications/push/:id/retry   # Retry failed notification

# Device Tokens
POST   /api/v1/notifications/tokens/register  # Register device token
DELETE /api/v1/notifications/tokens/:token    # Remove device token
GET    /api/v1/notifications/tokens           # List user's device tokens

# Preferences
GET    /api/v1/notifications/preferences      # Get notification preferences
PUT    /api/v1/notifications/preferences      # Update preferences

# Webhooks (for email/SMS providers)
POST   /api/v1/webhooks/sendgrid              # SendGrid webhook
POST   /api/v1/webhooks/twilio                # Twilio webhook
POST   /api/v1/webhooks/fcm                   # FCM delivery status
```

---

## 5. Authentication & Security Architecture

### 5.1 User Authentication (JWT-based)

**Login Flow:**
```
1. User → POST /api/v1/auth/login
   - Email/Phone + Password
   - Server validates credentials
   - If 2FA enabled → Send OTP, return temporary token
   - If 2FA disabled → Generate JWT tokens

2. User → POST /api/v1/auth/verify-2fa (if 2FA enabled)
   - Temporary token + OTP
   - Server verifies OTP
   - Generate JWT tokens

3. Server Response:
   - Access Token (JWT, 15 min expiry)
   - Refresh Token (JWT, 7 days expiry, stored in DB)
```

**JWT Payload:**
```javascript
{
  userId: UUID,
  companyId: UUID,
  role: 'super_admin' | 'super' | 'distributor' | 'retailer',
  email: string,
  phone: string,
  iat: timestamp,
  exp: timestamp
}
```

**Token Management:**
- Access Token: Short-lived (15 min), stored in memory/localStorage
- Refresh Token: Long-lived (7 days), stored in DB with device info
- Refresh endpoint: `/api/v1/auth/refresh-token`
- Logout: Revoke refresh token in DB

---

### 5.2 Client Device Authentication (Zero-Touch Provisioning)

#### 5.2.1 Initial Device Provisioning Flow

**Step 1: User Creates Client Record**
```
User → POST /api/v1/clients
Request Body:
{
  imei1: "123456789012345",          // Required
  imei2: "123456789012346",          // Optional
  brand: "Samsung",
  ram: "8GB",
  storage: "128GB",
  modelName: "Galaxy A52",
  clientName: "John Doe",            // Required
  clientPhone1: "+919876543210",     // Required
  clientEmail: "john@example.com",
  clientPhone2: "+919876543211",
  profileUrl: "https://...",         // Required
  totalAmount: 25000.00,             // Required
  downPayment: 5000.00,              // Required
  numberOfEmi: 12,                   // Required
  emiAmount: 1666.67,                // Required
  documents: {
    aadhar1: "https://s3.../aadhar_front.jpg",
    aadhar2: "https://s3.../aadhar_back.jpg",
    selfie: "https://s3.../selfie.jpg"
  }
}

Server Response:
{
  clientId: UUID,
  uniqueCode: "256-character-alphanumeric-string",  // For QR code
  companyId: UUID,
  imei1: "123456789012345",
  status: "deviceNotRegistered",
  createdAt: timestamp
}
```

**Step 2: Generate QR Code for Zero-Touch Provisioning**
```
QR Code Data (JSON):
{
  "uniqueCode": "256-char-string",
  "companyId": "company-uuid",
  "imei1": "123456789012345",
  "imei2": "123456789012346",      // Optional
  "serverUrl": "https://api.yourservice.com",
  "version": "1.0"
}
```

**Step 3: Device Scans QR and Initiates Registration**
```
Client Device → POST /api/v1/clients/register-device
Headers:
  X-Unique-Code: 256-character-string
  X-Company-Id: company-uuid

Request Body:
{
  imei1: "123456789012345",        // Device's actual IMEI1
  imei2: "123456789012346",        // Device's actual IMEI2 (optional)
  deviceInfo: {
    brand: "Samsung",
    model: "SM-A525F",
    androidVersion: "12",
    sdkVersion: 31,
    manufacturer: "Samsung",
    serialNumber: "RF8N1234567",
    deviceId: "android-device-id"
  },
  publicKey: "-----BEGIN PUBLIC KEY-----\n..." // Device's RSA public key (2048-bit)
}

Server Processing:
1. Validate uniqueCode + companyId
2. Fetch client record from DB
3. Check if client.status == 'deviceNotRegistered'
4. Compare IMEI numbers:
   - If match → Proceed
   - If mismatch → Return warning with stored vs actual IMEI
5. User confirmation required if IMEI mismatch
6. Generate server-side RSA key pair (2048-bit)
7. Generate deviceUniqueCode (256-char secure random string)
8. Store device public key + server key pair
9. Update client record with device info

Server Response:
{
  status: "success" | "imei_mismatch_confirmation_required",
  storedImei1: "123456789012345",
  actualImei1: "123456789012345",
  storedImei2: "123456789012346",
  actualImei2: "123456789012346",
  deviceUniqueCode: "256-char-device-specific-code",
  serverPublicKey: "-----BEGIN PUBLIC KEY-----\n...",
  clientId: UUID,
  message: "Device registered successfully"
}
```

**Step 4: IMEI Mismatch Handling (if needed)**
```
If IMEI mismatch detected:

Client App → Shows Alert:
"IMEI Mismatch Detected!
Stored IMEI1: 123456789012345
Actual IMEI1: 987654321098765

Do you want to proceed with actual IMEI?"

If User Confirms:
Client Device → POST /api/v1/clients/register-device/confirm
Headers:
  X-Unique-Code: 256-character-string
  X-Device-Unique-Code: 256-char-device-code

Request Body:
{
  confirmImeiUpdate: true,
  imei1: "987654321098765",
  imei2: "987654321098766"
}

Server:
1. Update client record with actual IMEI
2. Create audit log for IMEI change
3. Notify user via push notification
4. Complete device registration
```

---

#### 5.2.2 Device-Server Secure Communication

**Authentication Mechanism: Mutual TLS + Signed Requests**

**For every API call from Client Device:**

```
Client Device → Any API Endpoint
Headers:
  X-Device-Unique-Code: 256-char-code
  X-Client-Id: client-uuid
  X-Timestamp: ISO-8601-timestamp
  X-Signature: RSA-SHA256-signature

Signature Calculation:
const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body)}`;
const signature = rsaSign(payload, devicePrivateKey);

Server Verification:
1. Fetch client record using X-Client-Id
2. Verify deviceUniqueCode matches
3. Check timestamp (reject if > 5 minutes old - replay attack prevention)
4. Fetch device's public key from DB
5. Verify signature using device's public key
6. If valid → Process request
7. If invalid → Reject with 401 Unauthorized
```

**Server Response Signing:**

```
Server → Client Device Response
Headers:
  X-Server-Timestamp: ISO-8601-timestamp
  X-Server-Signature: RSA-SHA256-signature

Response Body:
{
  data: { ... },
  timestamp: timestamp,
  signature: signature
}

Signature Calculation:
const payload = `${statusCode}:${timestamp}:${JSON.stringify(data)}`;
const signature = rsaSign(payload, serverPrivateKey);

Device Verification:
1. Fetch server's public key (received during registration)
2. Verify signature using server's public key
3. If valid → Process response
4. If invalid → Reject and alert user
```

---

#### 5.2.3 Device Authentication Schema Updates

**Add to Clients Table:**
```sql
clients {
  -- ... existing fields ...

  -- Zero-Touch Provisioning
  uniqueCode: VARCHAR(256) UNIQUE NOT NULL -- For QR code
  deviceUniqueCode: VARCHAR(256) UNIQUE -- Generated after device registration

  -- Cryptographic Keys
  devicePublicKey: TEXT -- Device's RSA public key (PEM format)
  serverPublicKey: TEXT -- Server's public key for this device
  serverPrivateKey: TEXT -- Server's private key (encrypted)

  -- Device Registration
  deviceRegisteredAt: TIMESTAMP
  lastDeviceSyncAt: TIMESTAMP

  -- IMEI Tracking
  imeiChangedAt: TIMESTAMP
  imeiChangeReason: TEXT -- 'initial_mismatch', 'device_replaced', etc.

  INDEX idx_client_unique_code (uniqueCode)
  INDEX idx_client_device_code (deviceUniqueCode)
}
```

**Add New Table: Device Authentication Logs**
```sql
device_auth_logs {
  id: UUID PRIMARY KEY
  clientId: UUID NOT NULL REFERENCES clients(id)

  -- Request details
  endpoint: VARCHAR(255) NOT NULL
  method: VARCHAR(10) NOT NULL
  requestTimestamp: TIMESTAMP NOT NULL

  -- Authentication
  deviceUniqueCode: VARCHAR(256) NOT NULL
  signatureValid: BOOLEAN NOT NULL

  -- Security
  ipAddress: VARCHAR(45)
  userAgent: TEXT

  -- Result
  status: ENUM('success', 'invalid_signature', 'expired_timestamp', 'invalid_device_code', 'replay_attack') NOT NULL
  errorMessage: TEXT

  createdAt: TIMESTAMP DEFAULT NOW()

  INDEX idx_auth_log_client (clientId)
  INDEX idx_auth_log_status (status)
  INDEX idx_auth_log_timestamp (requestTimestamp)
}
```

---

### 5.3 Security Considerations

**User Authentication:**
1. ✅ JWT with short-lived access tokens (15 min)
2. ✅ Refresh token rotation on each refresh
3. ✅ 2FA with OTP for sensitive operations
4. ✅ Device fingerprinting stored with refresh tokens
5. ✅ Rate limiting on login attempts (5 attempts, 15 min lockout)
6. ✅ Session revocation on password change
7. ✅ IP-based anomaly detection

**Device Authentication:**
1. ✅ Mutual authentication (device verifies server, server verifies device)
2. ✅ 256-character unique codes (cryptographically secure random)
3. ✅ RSA-2048 asymmetric encryption for signatures
4. ✅ Timestamp validation (5-minute window) to prevent replay attacks
5. ✅ Device public key pinning
6. ✅ IMEI validation and mismatch detection
7. ✅ Audit logging for all authentication attempts
8. ✅ No session tokens - stateless authentication via signatures
9. ✅ Certificate pinning for API calls (optional)
10. ✅ Device fingerprinting beyond IMEI (serial number, Android ID)

**Additional Security Measures:**
1. ✅ Rate limiting per deviceUniqueCode (100 requests/minute)
2. ✅ Automatic device deactivation after 10 failed auth attempts
3. ✅ Alert user on suspicious device activity
4. ✅ Regular key rotation policy (every 90 days)
5. ✅ Encrypted storage of private keys (AES-256)
6. ✅ Hardware-backed keystore on Android (use Android Keystore)
7. ✅ Root/jailbreak detection on device

---

### 5.4 API Authentication Summary

| API Endpoint Type | Authentication Method | Headers Required |
|-------------------|----------------------|------------------|
| User APIs | JWT Bearer Token | `Authorization: Bearer <access_token>` |
| Device APIs | Signed Requests | `X-Device-Unique-Code`, `X-Client-Id`, `X-Timestamp`, `X-Signature` |
| Device Registration | Unique Code + Company ID | `X-Unique-Code`, `X-Company-Id` |
| OTP Verification | Temporary Token (for 2FA) | `Authorization: Bearer <temp_token>` |
| Public APIs | None (Rate Limited) | None |

---

## 6. Security Recommendations

### 5.1 Authentication & Authorization
- **JWT Tokens**: Use access token (15 min) + refresh token (7 days)
- **Password Policy**: Min 8 chars, uppercase, lowercase, number, special char
- **Password Hashing**: bcrypt with salt rounds 10-12
- **Rate Limiting**:
  - Login: 5 attempts per 15 minutes per IP
  - API calls: 100 requests per minute per user
- **Role-Based Access Control (RBAC)**:
  - Owner: Full access to company and all agents
  - Admin: Manage agents and clients, view reports
  - User: Manage own clients only

### 5.2 Data Security
- **Encryption at Rest**:
  - Encrypt sensitive fields: `uniqueKey`, `otpCode`, `frpEmail`
  - Use AES-256 encryption
  - Store encryption keys in AWS KMS or similar
- **Encryption in Transit**:
  - HTTPS/TLS 1.3 for all API communications
  - Certificate pinning for mobile apps
- **Database Security**:
  - Use parameterized queries (prevent SQL injection)
  - Database connection pooling with encryption
  - Regular automated backups (daily) with encryption

### 5.3 API Security
- **Input Validation**: Validate all inputs on server side
- **XSS Protection**: Sanitize all user inputs
- **CSRF Protection**: Use CSRF tokens for state-changing operations
- **CORS**: Configure strict CORS policies
- **API Versioning**: Use `/api/v1/` format for versioning
- **Request Size Limits**: Max 10MB for file uploads
- **SQL Injection Prevention**: Use ORM (Sequelize/TypeORM/Prisma)

### 5.4 File Upload Security
- **Allowed Types**: Only specific document types (PDF, JPG, PNG)
- **File Size Limits**: Max 5MB per document
- **Virus Scanning**: Scan uploads with ClamAV or similar
- **Storage**: Store in S3 with pre-signed URLs (expire in 1 hour)
- **Filename Sanitization**: Use UUIDs for stored filenames

### 5.5 Audit & Monitoring
- **Audit Logs**: Log all critical operations
- **Failed Login Monitoring**: Alert on multiple failures
- **Anomaly Detection**: Monitor unusual balance transfers
- **System Health**: Use monitoring tools (Prometheus, Grafana)
- **Error Tracking**: Use Sentry or similar

### 5.6 Additional Security Layers

#### 5.6.1 Two-Factor Authentication (2FA)
```sql
user_2fa {
  id: UUID PRIMARY KEY
  userId: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  secret: VARCHAR(255) NOT NULL -- Encrypted
  isEnabled: BOOLEAN DEFAULT false
  backupCodes: JSONB -- Encrypted array of backup codes
  createdAt: TIMESTAMP DEFAULT NOW()
  lastUsedAt: TIMESTAMP
}
```

#### 5.6.2 IP Whitelisting
```sql
user_ip_whitelist {
  id: UUID PRIMARY KEY
  userId: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  ipAddress: VARCHAR(45) NOT NULL
  description: VARCHAR(255)
  isActive: BOOLEAN DEFAULT true
  createdAt: TIMESTAMP DEFAULT NOW()
}
```

#### 5.6.3 Session Management
```sql
active_sessions {
  id: UUID PRIMARY KEY
  userId: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  sessionToken: VARCHAR(500) NOT NULL UNIQUE
  ipAddress: VARCHAR(45)
  userAgent: TEXT
  deviceInfo: JSONB
  createdAt: TIMESTAMP DEFAULT NOW()
  lastActivityAt: TIMESTAMP DEFAULT NOW()
  expiresAt: TIMESTAMP NOT NULL

  INDEX idx_session_user (userId)
  INDEX idx_session_expires (expiresAt)
}
```

---

## 6. Business Logic & Rules

### 6.1 Company Rules
- Companies are created and managed exclusively by SUPER_ADMIN
- Only SUPER_ADMIN can set/update baseKeyRate and taxPercentage for companies
- Company cannot be deleted if it has active users or clients
- Company totalBalance = SUM(all user balances within the company)
- SUPER users within a company CANNOT manage company settings (rates, tax, etc.)
- Company createdBy and lastModifiedBy always references SUPER_ADMIN user

### 6.2 User Hierarchy Rules
**Hierarchy Levels:**
- **SUPER_ADMIN (Level 0)**: System-wide administrator, not tied to any company
  - Can create/manage companies
  - Sets base key rates and tax percentages for companies
  - Approves key orders from SUPER users
  - Cannot have clients or participate in key transfers
  - No commission percentage
  - companyId is NULL, parentUserId is NULL

- **SUPER (Level 1)**: Top-level distributor within a company (can be multiple per company)
  - Multiple SUPER users can exist in one company
  - No parent user (parentUserId is NULL), but has companyId
  - Can create DISTRIBUTOR and RETAILER users
  - Orders keys from SUPER_ADMIN (requires approval)
  - Transfers keys to downstream users (DISTRIBUTOR/RETAILER)
  - Can set commission percentages for direct downstream users only
  - Can view all users and clients in company
  - Cannot manage company settings (baseKeyRate, taxPercentage, etc.)
  - hierarchyPath: "super_id" or empty

- **DISTRIBUTOR (Level 2)**: Mid-tier distributor (optional level)
  - Parent must be a SUPER user
  - Can create RETAILER users
  - Receives keys via transfer from SUPER
  - Transfers keys to RETAILER users
  - Earns commission on downstream key transfers
  - Can view own downstream retailers and their clients
  - Cannot view other distributors or their networks
  - hierarchyPath: "super_id/distributor_id"

- **RETAILER (Level 2 or 3)**: End-tier seller
  - Parent can be SUPER (level 2) or DISTRIBUTOR (level 3)
  - Cannot create other users
  - Creates and manages clients (end customers)
  - Receives keys via transfer from parent user
  - Earns commission when creating clients (if set by parent)
  - Can only view own clients
  - hierarchyPath: "super_id/retailer_id" or "super_id/distributor_id/retailer_id"

**Hierarchy Flow Rules:**
- Keys flow downstream: SUPER_ADMIN → SUPER → DISTRIBUTOR → RETAILER → CLIENT
- Commission flows upstream on key transfers
- Balance transfers only allowed from parent to direct child (one level down)
- Negative balance not allowed for any user
- User can be replaced (node replacement): all downstream users transfer to new parent

**Commission Rules:**
- Commission percentage range: 0-30% (configurable)
- Each user can set commission percentage for their direct children only
- SUPER sets commission for DISTRIBUTOR and RETAILER users they create
- DISTRIBUTOR sets commission for RETAILER users they create
- Commission earned on key transfers to downstream users
- Commission calculated: (commissionPercentage / 100) × transferAmount
- Commission recorded in balance_sheets table with type 'commission_earned'

**Balance & Key Management:**
- Only SUPER users can order keys from SUPER_ADMIN
- Orders require SUPER_ADMIN approval before keys are credited
- Keys transferred through hierarchy via key_transfers table
- Each transfer deducts from sender's balance, adds to receiver's balance
- Each transfer can earn commission for sender (based on receiver's commissionPercentage)
- Client creation consumes 1 key from retailer's balance
- All balance changes recorded in balance_sheets table

### 6.3 Client/Key Rules
- One key = one client
- Only RETAILER users can create clients
- Key consumed when client created (deducted from retailer balance)
- Client can only be created if retailer has sufficient balance (balance >= 1)
- Device can only be registered once per uniqueCode
- Device lock/unlock requires authentication
- Emergency unlock OTP has maximum 5 attempts
- Emergency unlock OTP expires in 10 minutes
- Expired clients automatically locked
- Stolen device cannot be unlocked until retailer removes stolen mark
- Client is always associated with the retailer who created it (userId references retailer)
- Retailer can only view/manage their own clients

### 6.4 Order Rules (SUPER → SUPER_ADMIN)
- Only SUPER users can create orders
- Orders are submitted to SUPER_ADMIN for approval
- Minimum order: 10 keys (configurable per company)
- Order status flow: pending → approved/rejected
- Keys credited to SUPER's balance only after SUPER_ADMIN approval
- Once approved, order cannot be cancelled
- Payment confirmation required before approval
- Rate per key determined by company's baseKeyRate (set by SUPER_ADMIN)
- Total cost = totalKeys × baseKeyRate (tax already included in base rate)
- Order creates balance_sheet entry with type 'key_purchase' upon approval

### 6.5 Key Transfer Rules
**Transfer Flow:**
- SUPER → DISTRIBUTOR or SUPER → RETAILER
- DISTRIBUTOR → RETAILER
- Cannot skip levels in hierarchy (must be parent → direct child)
- Cannot transfer to parent, sibling, or non-descendant users
- Sender must have sufficient balance (balance >= quantity)

**Commission Calculation on Transfer:**
- Receiver's commission percentage determines commission earned by sender
- Commission earned on transfer confirmation (not on initiation)
- Example: SUPER transfers 100 keys to DISTRIBUTOR who has 10% commission
  - SUPER earns: 100 × baseKeyRate × 0.10 as commission
  - Commission recorded in balance_sheets as 'commission_earned'
  - Transfer amount paid by receiver = (100 × baseKeyRate) - commission

**Payment & Confirmation:**
- Transfers require offline payment confirmation
- Transfer status flow: pending → payment_received → completed
- Keys deducted from sender only after status = 'completed'
- Receiver gets keys only after status = 'completed'
- Both sender and receiver get balance_sheet entries on completion
- Payment proof (optional): uploaded document/image

**Transaction Tracking:**
- Every transfer creates entry in key_transfers table
- Records: fromUserId, toUserId, quantity, baseRate, commissionPercentage, transferAmount, commissionAmount
- Immutable records (create-only, no updates to core fields)
- Linked to balance_sheet entries for complete audit trail
- Status can be updated: pending → payment_received → completed → cancelled

### 6.6 Commission Rules
**Commission Structure:**
- Commission percentage set by parent user for each direct child user
- Range: 0-30% (configurable, can be enforced at company or system level)
- Commission earned when transferring keys to downstream user with commission percentage > 0
- SUPER earns commission when transferring to DISTRIBUTOR/RETAILER (if they have commission %)
- DISTRIBUTOR earns commission when transferring to RETAILER (if they have commission %)

**Commission Earning Events:**
- On key transfer completion: Sender earns commission based on receiver's commissionPercentage
- Commission amount = transferAmount × (commissionPercentage / 100)
- Commission added to sender's earnings (tracked in balance_sheets)
- Commission is deducted from the total amount receiver pays

**Commission Calculation Example:**
```
Scenario: SUPER transfers 100 keys to DISTRIBUTOR with 15% commission
- Base rate per key: ₹100 (set by SUPER_ADMIN)
- Gross transfer value: 100 × ₹100 = ₹10,000
- Commission (15%): ₹10,000 × 0.15 = ₹1,500 (earned by SUPER)
- Transfer amount paid by DISTRIBUTOR: ₹10,000 - ₹1,500 = ₹8,500
- DISTRIBUTOR receives: 100 keys
- SUPER balance: -100 keys (deducted)
- DISTRIBUTOR balance: +100 keys (added)
- SUPER commission earned: +₹1,500 (recorded in balance_sheets)
```

**Commission Limits:**
- Maximum commission per user: 30%
- Minimum commission: 0%
- Total commission across hierarchy should not exceed profit margin
- Commission percentages are independent at each level (not cumulative)

### 6.7 Hierarchy Management Rules
**User Creation:**
- SUPER_ADMIN creates companies and can add initial SUPER users
- SUPER users can create DISTRIBUTOR and RETAILER users
- DISTRIBUTOR users can create RETAILER users only
- RETAILER users cannot create any other users
- Each user creation records createdBy for audit trail

**Node Replacement:**
- Parent user can transfer their downstream user to another parent at same level
- Example: SUPER_A can transfer their DISTRIBUTOR to SUPER_B
- All children of transferred user remain with that user (hierarchy intact below)
- All downstream clients remain with original retailers
- Balance remains with the transferred user (not transferred to new parent)
- Hierarchy paths updated for transferred user and all descendants
- Audit log entry created for replacement with old and new parent info

**User Deletion:**
- Cannot delete user with active downstream users (must transfer or delete children first)
- Cannot delete user with active clients (must transfer or delete clients first)
- Cannot delete SUPER if they are the last SUPER in the company
- Soft delete recommended (status = 'inactive') to maintain audit trail and historical data
- Deleted users' balance must be zero or transferred before deletion

**Balance Integrity:**
- Company totalBalance = SUM(all user balances in the company)
- User balance = SUM(balance_sheet entries for that user where type affects balance)
- Balance must never be negative
- Daily reconciliation job verifies balance integrity across all users and companies
- Alerts triggered if discrepancies found (balance mismatch)

### 6.8 Transaction Rules
- Each order creates one primary transaction entry in transactions table
- Each key transfer creates:
  - One key_transfers entry
  - Two balance_sheet entries (sender deduct, receiver add)
  - One balance_sheet entry for commission (if applicable)
- Failed transactions can be retried (max 3 attempts)
- Refunds create new transaction entry (reverse transaction with negative amount)
- All transactions and balance_sheets are immutable (create-only, no updates to amounts)
- Status field can be updated for state tracking (pending → completed → refunded)
- All financial operations must use database transactions with row-level locking (ACID compliance)

### 6.9 Balance Sheet Rules
- Every financial operation creates one or more balance sheet entries
- Balance sheet is append-only (no updates/deletes to existing entries)
- Each entry must balance: balanceBefore + amount = balanceAfter
- Entry types:
  - **'key_purchase'**: SUPER orders keys from SUPER_ADMIN (after approval)
  - **'key_transfer_sent'**: User transfers keys to downstream user (amount negative)
  - **'key_transfer_received'**: User receives keys from upstream user (amount positive)
  - **'key_use'**: Retailer creates client, consumes 1 key (amount -1)
  - **'commission_earned'**: User earns commission on downstream transfer (amount positive)
  - **'balance_adjustment'**: Manual adjustment by SUPER_ADMIN (with reason, can be +/-)
  - **'refund'**: Refund processed (amount positive for recipient)
- Mandatory fields: userId, companyId, type, amount, balanceBefore, balanceAfter, createdAt, createdBy
- Optional linking: orderId, transferId for traceability
- Description field required for manual adjustments and important operations
- Daily reconciliation job verifies:
  - SUM(balance_sheet entries per user) = user.balance
  - SUM(user.balance per company) = company.totalBalance
  - No gaps in balance timeline (balanceAfter[n] = balanceBefore[n+1])
- Audit trail: all entries include createdBy and createdAt timestamps

### 6.10 OTP Rules
- **Validity**: All OTPs expire in 10 minutes
- **Attempts**: Maximum 5 attempts per OTP
- **Rate Limiting**: 5 OTPs of same type per recipient in 10 minutes
- **Cooldown**: After 5 OTP requests, 15-minute cooldown period enforced
- **Security**: OTPs are encrypted in database
- **Types**:
  - `login_2fa`: For two-factor authentication
  - `email_verification`: Email verification
  - `phone_verification`: Phone verification
  - `emergency_unlock`: Device emergency unlock
  - `password_reset`: Password reset
  - `balance_transfer`: High-value balance transfer confirmation
- **Cleanup**: Expired OTPs automatically cleaned up after 24 hours

### 6.11 Device Location Rules
- Location history stored for last 30 days only
- Location updates from device every 15 minutes (when active)
- Older location data automatically purged
- Reverse geocoding performed asynchronously
- Location tracking can be enabled/disabled by retailer

### 6.12 Device Message Rules
- Text messages limited to 500 characters
- Audio messages limited to 2 minutes duration
- Messages expire after 7 days if not delivered
- Only one pending message of each type allowed
- Messages are queued and delivered on next device sync
- Retailer can delete undelivered messages

### 6.13 Email Notification Rules
- **Retry Logic**: 3 attempts with exponential backoff (1 min, 5 min, 15 min)
- **Priority Handling**:
  - Urgent: Sent immediately
  - High: Within 1 minute
  - Normal: Within 5 minutes
  - Low: Batched every 15 minutes
- **Bounce Handling**: Mark email as bounced, don't retry
- **Delivery Tracking**: Track opens and clicks via webhooks
- **Daily Limit**: Max 1000 emails per user per day (prevent spam)
- **Respect Preferences**: Check notification_preferences before sending
- **Quiet Hours**: No non-urgent emails during quiet hours
- **Cleanup**: Delete sent emails older than 90 days

### 6.14 SMS Notification Rules
- **Retry Logic**: 3 attempts with exponential backoff (30 sec, 2 min, 5 min)
- **Priority Handling**:
  - Urgent: Sent immediately
  - High: Within 30 seconds
  - Normal: Within 2 minutes
  - Low: Batched every 10 minutes
- **Cost Tracking**: Record SMS cost for billing
- **Character Limit**: Max 160 characters per SMS (or 306 for Unicode)
- **Daily Limit**: Max 50 SMS per user per day
- **Respect Preferences**: Check notification_preferences before sending
- **Quiet Hours**: No non-urgent SMS during quiet hours
- **Provider Failover**: If primary provider fails, use backup provider
- **Cleanup**: Delete sent SMS older than 30 days

### 6.15 Push Notification Rules
- **Retry Logic**: 3 attempts with exponential backoff (immediate, 1 min, 5 min)
- **TTL (Time to Live)**: 24 hours default (after which notification expires)
- **Badge Management**: Update app badge count
- **Sound**: Default sound or custom per notification type
- **Token Management**:
  - Remove invalid tokens after failed delivery
  - Support multiple devices per user
  - Tokens expire after 60 days of inactivity
- **Priority Levels**:
  - High: Wake device, show immediately
  - Normal: Show when device is active
  - Low: Batch with other notifications
- **Respect Preferences**: Check notification_preferences before sending
- **Quiet Hours**: No non-urgent push during quiet hours
- **Click Tracking**: Track when user clicks notification
- **Cleanup**: Delete delivered notifications older than 7 days

### 6.16 Notification Preference Rules
- Default preferences created on user registration
- Email marketing disabled by default (GDPR compliance)
- OTP notifications cannot be disabled (critical)
- Alert notifications cannot be disabled (critical)
- Quiet hours only apply to non-urgent notifications
- Users can update preferences anytime via API or app

### 6.17 Device Authentication & Registration Rules
- **uniqueCode Generation**: 256 characters, cryptographically secure random (crypto.randomBytes)
- **uniqueCode Expiry**: Expires after 7 days if device not registered
- **One-time Use**: uniqueCode can only be used once for registration
- **IMEI Validation**: Must be valid 15-digit IMEI format
- **IMEI Mismatch Handling**:
  - If retailer's IMEI ≠ device's IMEI → Require user confirmation
  - Log mismatch in audit_logs
  - Notify retailer via push notification
  - Set imeiMismatch flag in client record
- **Device Re-registration**: Once registered, device cannot be re-registered (status check)
- **IMEI Uniqueness**: One IMEI can only be registered to one client at a time
- **Signature Validation**:
  - Request timestamp must be within 5 minutes (prevent replay attacks)
  - Signature must match using device's public key (RSA-2048 SHA-256)
  - Failed signature validation → Increment failed auth counter
  - 10 consecutive failures → Auto-deactivate device + alert retailer
- **Key Storage**:
  - Device private key → Android Keystore (hardware-backed if available)
  - Server private key → AES-256 encrypted in database
  - Public keys → Stored in plaintext (PEM format)
- **Key Rotation**: Keys should be rotated every 90 days (optional but recommended)
- **Root Detection**: Warn users on rooted/jailbroken devices, optionally block registration
- **Certificate Pinning**: Client app should pin server SSL certificate
- **Rate Limiting**: Max 100 API requests per deviceUniqueCode per minute
- **Authentication Logging**: Log all auth attempts (success + failure) in device_auth_logs

### 6.18 User Authentication Rules
- **JWT Access Token**: 15-minute expiry, cannot be revoked
- **JWT Refresh Token**: 7-day expiry, stored in DB, can be revoked
- **2FA Requirement**: Enforced for sensitive operations (key transfers, etc.)
- **Password Policy**: Min 8 chars, uppercase, lowercase, number, special char
- **Login Rate Limiting**: 5 failed attempts → 15-minute account lockout
- **Session Management**: Max 5 concurrent sessions per user
- **Token Rotation**: New refresh token issued on each refresh (old one invalidated)
- **Device Fingerprinting**: Store IP, user-user with refresh token
- **Password Reset**: Requires OTP verification via email/SMS
- **Auto-logout**: Revoke all sessions on password change

---

## 7. Data Flow Diagrams

### 7.1 Key Purchase Flow (SUPER → SUPER_ADMIN)
```
SUPER User → Create Order → Order Service
                                ↓
                           Validate SUPER role
                                ↓
                           Check minimum quantity (10 keys)
                                ↓
                           Calculate totalAmount (quantity × baseKeyRate)
                                ↓
                           Create Order (status: pending)
                                ↓
                           Create Transaction Entry
                                ↓
                           Notify SUPER_ADMIN for approval
                                ↓
                           Return Order Details to SUPER

SUPER_ADMIN → Review Order → Validate payment proof
                                  ↓
                             (if approved)
                                  ↓
                             Update Order (status: approved)
                                  ↓
                             Update SUPER user.balance (+quantity)
                                  ↓
                             Create Balance Sheet Entry (type: key_purchase)
                                  ↓
                             Update Company totalBalance
                                  ↓
                             Notify SUPER (order approved)
                                  ↓
                             (if rejected)
                                  ↓
                             Update Order (status: rejected)
                                  ↓
                             Notify SUPER (order rejected with reason)
```

### 7.2 Key Transfer Flow (Hierarchical Distribution)
```
Sender (SUPER/DISTRIBUTOR) → Initiate Transfer → Validate sender role
                                                       ↓
                                                  Validate receiver is direct child
                                                       ↓
                                                  Check sender balance (>= quantity)
                                                       ↓
                                                  Calculate commission (receiver.commissionPercentage)
                                                       ↓
                                                  Calculate transferAmount (quantity × baseKeyRate - commission)
                                                       ↓
                                                  Create key_transfers entry (status: pending)
                                                       ↓
                                                  Notify receiver (transfer initiated)
                                                       ↓
                                                  Return transfer details

Receiver → Upload Payment Proof → Update key_transfers (status: payment_received)
                                        ↓
                                   Notify sender (payment received)

Sender → Confirm Payment → Validate payment proof
                                ↓
                           Update key_transfers (status: completed)
                                ↓
                           Deduct keys from sender.balance (-quantity)
                                ↓
                           Create Balance Sheet Entry (type: key_transfer_sent, amount: -quantity)
                                ↓
                           Add keys to receiver.balance (+quantity)
                                ↓
                           Create Balance Sheet Entry (type: key_transfer_received, amount: +quantity)
                                ↓
                           Add commission to sender earnings
                                ↓
                           Create Balance Sheet Entry (type: commission_earned, amount: +commissionAmount)
                                ↓
                           Update Company totalBalance (remains same, internal transfer)
                                ↓
                           Notify receiver (keys transferred successfully)
                                ↓
                           Create Audit Log (key_transfer)
```

### 7.3 Client Creation Flow (RETAILER)
```
RETAILER → Create Client → Validate RETAILER role
                                ↓
                           Check RETAILER balance (>= 1)
                                ↓
                           (if sufficient)
                                ↓
                           Generate uniqueCode (256 chars)
                                ↓
                           Create Client Record (status: deviceNotRegistered)
                                ↓
                           Deduct 1 from RETAILER balance
                                ↓
                           Create Balance Sheet Entry (type: key_use, amount: -1)
                                ↓
                           Update RETAILER activeClients (+1)
                                ↓
                           Update Company totalActiveCustomers (+1)
                                ↓
                           Calculate commission for upstream users
                                ↓
                           Traverse hierarchy path (retailer → distributor → super)
                                ↓
                           For each upstream user with commission %:
                             - Calculate commission earned
                             - Create Balance Sheet Entry (type: commission_earned)
                                ↓
                           Generate QR Code (uniqueCode + companyId + IMEIs)
                                ↓
                           Return Client Details + QR Code to RETAILER
```

### 7.4 Key Transfer Cancellation Flow
```
Sender → Request Cancellation → Validate key_transfers status (must be 'pending')
                                      ↓
                                 Update key_transfers (status: cancelled)
                                      ↓
                                 Notify receiver (transfer cancelled)
                                      ↓
                                 Create Audit Log (key_transfer_cancelled)

Alternative: Receiver can also cancel pending transfers
```

### 7.5 Device Lock Flow
```
RETAILER → Lock Request → Verify client ownership (client.userId = retailer.id)
                               ↓
                          Update Client Status (locked)
                               ↓
                          Queue Lock Command
                               ↓
                          Create Audit Log (device_lock_requested)
                               ↓
Device Syncs → Receive Lock Command
                    ↓
               Device Locks
                    ↓
               Send Acknowledgment
                    ↓
               Create Audit Log (device_locked)
                    ↓
               Notify RETAILER (device locked successfully)
```

### 7.6 Node Replacement Flow (User Hierarchy Transfer)
```
Parent User → Initiate Node Replacement → Validate requester is parent of user being transferred
                                               ↓
                                          Validate new parent is at same level
                                               ↓
                                          Validate new parent is in same company
                                               ↓
                                          Update user.parentUserId (old parent → new parent)
                                               ↓
                                          Update hierarchyPath for transferred user
                                               ↓
                                          Recursively update hierarchyPath for all descendants
                                               ↓
                                          Create Audit Log (node_replacement)
                                               ↓
                                          Notify old parent (user transferred out)
                                               ↓
                                          Notify new parent (user transferred in)
                                               ↓
                                          Notify transferred user (parent changed)

Note: Balance remains with transferred user, all downstream users/clients remain intact
```

### 7.7 Balance Reconciliation Flow (Daily Job)
```
Scheduled Job (Daily) → For each company:
                             ↓
                        Fetch all users in company
                             ↓
                        For each user:
                          - Calculate SUM(balance_sheet entries)
                          - Compare with user.balance
                          - Log discrepancy if mismatch
                             ↓
                        Calculate company totalBalance from SUM(user.balance)
                             ↓
                        Compare with company.totalBalance
                             ↓
                        (if mismatch)
                             ↓
                        Alert SUPER_ADMIN (balance reconciliation failed)
                             ↓
                        Create Audit Log (reconciliation_error)
                             ↓
                        (if match)
                             ↓
                        Create Audit Log (reconciliation_success)
```

### 7.8 OTP Flow (Generic)
```
User → Request OTP → Check Rate Limit
                          ↓
                     (if not in cooldown)
                          ↓
                     Check Request Count
                          ↓
                     (if < 5 in 10 min)
                          ↓
                     Generate 6-digit OTP
                          ↓
                     Encrypt and Store OTP
                          ↓
                     Update Rate Limit Record
                          ↓
                     Send OTP (Email/SMS)
                          ↓
                     Return Success

User → Verify OTP → Fetch OTP Record
                          ↓
                     Check Expiry (10 min)
                          ↓
                     Check Attempt Count (< 5)
                          ↓
                     Decrypt and Compare
                          ↓
                     (if match)
                          ↓
                     Mark OTP as Used
                          ↓
                     Return Success
                          ↓
                     Perform Action (unlock, login, etc.)
```

### 7.9 Emergency Unlock Flow
```
Client/RETAILER → Request Emergency Unlock → Verify Client Exists
                                                  ↓
                                             Check Not Stolen
                                                  ↓
                                             Generate OTP
                                                  ↓
                                             Send to Client Phone
                                                  ↓
                                             Return Success

Client → Submit OTP → Verify OTP
                           ↓
                      (if valid)
                           ↓
                      Update Client Status (unlocked)
                           ↓
                      Send Unlock Command to Device
                           ↓
                      Create Activity Log (emergency_unlock)
                           ↓
                      Create Audit Log
                           ↓
                      Notify RETAILER
```

### 7.10 Location Tracking Flow
```
Device → Periodic Location Update → Authenticate Device
                                         ↓
                                    Validate Location Data
                                         ↓
                                    Store in device_location_history
                                         ↓
                                    Queue Reverse Geocoding Job
                                         ↓
                                    Create Activity Log (location_update)
                                         ↓
                                    Return Success

Background Job → Process Geocoding → Fetch Recent Locations
                                           ↓
                                      Call Geocoding API
                                           ↓
                                      Update Address Field
                                           ↓
                                      Purge Locations > 30 days
```

### 7.11 Device Message Flow
```
RETAILER → Send Message → Validate Message Content
                               ↓
                          (if audio) Upload to S3
                               ↓
                          Create device_messages Record
                               ↓
                          Mark Status: pending
                               ↓
                          Return Success

Device → Sync Request → Fetch Pending Messages
                             ↓
                        Mark Status: sent
                             ↓
                        Return Messages to Device
                             ↓
Device Receives → Update Status: delivered
                             ↓
Device Plays/Shows → Update Status: played
                             ↓
                        Create Activity Log (message_played)
```

### 7.12 Mark Device as Stolen Flow
```
RETAILER → Mark Stolen → Verify Ownership (client.userId = retailer.id)
                              ↓
                         Update Client (isStolen: true)
                              ↓
                         Update Client Status (locked)
                              ↓
                         Send Lock Command to Device
                           ↓
                      Create Activity Log
                           ↓
                      Create Audit Log
                           ↓
                      Notify SUPER users in company
                           ↓
                      Enable High-Frequency Location Tracking
```

### 7.13 Email Notification Flow
```
User/Client → Trigger Event → Create email_queue Record
                                      ↓
                                 Set Priority & Provider
                                      ↓
                                 Status: pending
                                      ↓
Background Worker → Process Email Queue → Fetch pending by priority
                                               ↓
                                          Check Daily Limit
                                               ↓
                                          (if under limit)
                                               ↓
                                          Render Email Template
                                               ↓
                                          Send via Provider (SendGrid/SES)
                                               ↓
                                          (on success)
                                               ↓
                                          Status: sent
                                               ↓
                                          Record sentAt
                                               ↓
Provider Webhook → Track Opens/Clicks

                                          (on failure)
                                               ↓
                                          Increment attemptCount
                                               ↓
                                          Calculate nextRetryAt (exponential backoff)
                                               ↓
                                          (if attempts < 3)
                                               ↓
                                          Schedule Retry (1 min, 5 min, 15 min)
                                               ↓
                                          (if attempts >= 3)
                                               ↓
                                          Status: failed
                                               ↓
                                          Alert SUPER_ADMIN
```

### 7.14 SMS Notification Flow
```
User → Trigger OTP/Alert → Create sms_queue Record
                                 ↓
                            Set Priority & Provider
                                 ↓
                            Status: pending
                                 ↓
Background Worker → Process SMS Queue → Fetch pending by priority
                                             ↓
                                        Check Daily Limit (50/user)
                                             ↓
                                        (if under limit)
                                             ↓
                                        Validate Phone Number
                                             ↓
                                        Check Character Limit (160)
                                             ↓
                                        Send via Provider (Twilio/SNS)
                                             ↓
                                        Record Cost
                                             ↓
                                        (on success)
                                             ↓
                                        Status: sent
                                             ↓
Provider Callback → Status: delivered/undelivered

                                        (on failure)
                                             ↓
                                        Increment attemptCount
                                             ↓
                                        Try Backup Provider
                                             ↓
                                        Calculate nextRetryAt
                                             ↓
                                        (if attempts < 3)
                                             ↓
                                        Schedule Retry (30s, 2min, 5min)
                                             ↓
                                        (if attempts >= 3)
                                             ↓
                                        Status: failed
                                             ↓
                                        Alert SUPER_ADMIN
```

### 7.15 Push Notification Flow
```
Backend Event → Create push_notifications Record
                            ↓
                       Lookup device_tokens for recipient
                            ↓
                       (if no active tokens)
                            ↓
                       Status: failed (no_device)
                            ↓
                       Exit

                       (if tokens found)
                            ↓
                       Check Notification Preferences
                            ↓
                       (if push disabled)
                            ↓
                       Status: cancelled
                            ↓
                       Exit

                       (if push enabled)
                            ↓
                       Check Quiet Hours
                            ↓
                       (if in quiet hours & not urgent)
                            ↓
                       Delay until quiet hours end
                            ↓
                       Set Priority & TTL (24hrs)
                            ↓
Background Worker → Send to FCM/APNS
                            ↓
                       (on success)
                            ↓
                       Status: sent
                            ↓
Device Acknowledges → Status: delivered

                       (on failure)
                            ↓
                       Check Error Type
                            ↓
                       (if invalid token)
                            ↓
                       Mark Token as Inactive
                            ↓
                       Status: failed
                            ↓
                       (if temporary error)
                            ↓
                       Increment attemptCount
                            ↓
                       Calculate nextRetryAt
                            ↓
                       (if attempts < 3)
                            ↓
                       Schedule Retry (immediate, 1min, 5min)
                            ↓
                       (if attempts >= 3)
                            ↓
                       Status: failed
```

### 7.16 Zero-Touch Provisioning & Device Registration Flow
```
=== PHASE 1: RETAILER Creates Client ===

RETAILER App → POST /api/v1/clients
                    ↓
               Authenticate RETAILER (JWT)
                    ↓
               Validate RETAILER role
                    ↓
               Check RETAILER balance (>= 1)
                    ↓
               Deduct 1 key from retailer balance
                    ↓
               Generate uniqueCode (256 chars, cryptographically secure)
                    ↓
               Create Client Record:
                 - userId: retailer.id
                 - companyId: retailer.companyId
                 - Store IMEI1, IMEI2 (from retailer input)
                 - Store client info, documents
                 - status: 'deviceNotRegistered'
                 - uniqueCode: generated
                    ↓
               Create Balance Sheet Entry (type: key_use, amount: -1)
                    ↓
               Update retailer.activeClients (+1)
                    ↓
               Update company.totalActiveCustomers (+1)
                    ↓
               Generate QR Code JSON:
                 {
                   uniqueCode: "...",
                   companyId: "...",
                   imei1: "...",
                   imei2: "...",
                   serverUrl: "https://api..."
                 }
                    ↓
               Return QR Code to RETAILER App
                    ↓
               RETAILER shows QR Code to customer


=== PHASE 2: Device Scans QR & Registers ===

Customer Device → Scans QR Code
                       ↓
                  Parse QR Data
                       ↓
                  Extract uniqueCode, companyId, IMEIs
                       ↓
                  Generate RSA Key Pair (2048-bit)
                       ↓
                  Collect Device Info:
                    - Actual IMEI1, IMEI2
                    - Brand, Model, Android Version
                    - Serial Number, Device ID
                       ↓
                  POST /api/v1/clients/register-device
                  Headers:
                    X-Unique-Code: uniqueCode
                    X-Company-Id: companyId
                  Body:
                    - actualImei1, actualImei2
                    - deviceInfo
                    - devicePublicKey (PEM)
                       ↓

Server Processing:
                  Validate uniqueCode exists
                       ↓
                  Fetch Client Record
                       ↓
                  Check status == 'deviceNotRegistered'
                       ↓
                  Compare IMEIs:
                    storedImei1 vs actualImei1
                    storedImei2 vs actualImei2
                       ↓
            ┌──────────┴──────────┐
            │                     │
    (IMEI Match)          (IMEI Mismatch)
            │                     │
            ↓                     ↓
    Continue Registration   Return Warning Response:
            │                {
            │                  status: "imei_mismatch",
            │                  storedImei1: "...",
            │                  actualImei1: "...",
            │                  requiresConfirmation: true
            │                }
            │                     ↓
            │              Device Shows Alert
            │                     ↓
            │              User Confirms → Retry with flag
            │                     │
            └─────────────────────┘
                       ↓
            Generate Server RSA Key Pair
                       ↓
            Generate deviceUniqueCode (256 chars)
                       ↓
            Update Client Record:
              - devicePublicKey: store
              - serverPublicKey: store
              - serverPrivateKey: encrypt & store
              - deviceUniqueCode: generated
              - actualImei1, actualImei2
              - deviceInfo (model, version, etc.)
              - status: 'deviceVerified'
              - deviceRegisteredAt: NOW()
              - imeiMismatch: true/false
                       ↓
            Create Audit Log (device_registered)
                       ↓
            Send Push to RETAILER:
              "Device registered successfully for client {clientName}"
                       ↓
            Return to Device:
              {
                deviceUniqueCode: "...",
                serverPublicKey: "...",
                clientId: "...",
                status: "success"
              }
                       ↓
            Device Stores:
              - deviceUniqueCode
              - serverPublicKey
              - devicePrivateKey (in Android Keystore)


=== PHASE 3: Secure Device Communication ===

Device → Any API Call (e.g., sync, location update)
              ↓
         Prepare Request
              ↓
         Calculate Signature:
           payload = method + path + timestamp + body
           signature = RSA_Sign(payload, devicePrivateKey)
              ↓
         Send Request:
           Headers:
             X-Device-Unique-Code: "..."
             X-Client-Id: clientId
             X-Timestamp: ISO-8601
             X-Signature: signature
           Body: request data
              ↓

Server → Receives Request
              ↓
         Extract Headers
              ↓
         Fetch Client by clientId
              ↓
         Validate deviceUniqueCode matches
              ↓
         Check Timestamp (< 5 min old)
              ↓
         Fetch Device Public Key from DB
              ↓
         Reconstruct Payload:
           method + path + timestamp + body
              ↓
         Verify Signature:
           RSA_Verify(payload, signature, devicePublicKey)
              ↓
    ┌────────┴────────┐
    │                 │
(Valid)          (Invalid)
    │                 │
    ↓                 ↓
Process Request   Log Failed Auth
    │             Create Alert
    │             Return 401 Unauthorized
    │                 │
    ↓                 ↓
Generate Response   Increment Failed Attempts
    │                 │
    ↓                 ↓
Calculate Response Signature  (if attempts > 10)
payload = status + timestamp + data    │
signature = RSA_Sign(payload, serverPrivateKey)   ↓
    │             Deactivate Device
    │             Notify RETAILER (device security alert)
    ↓
Return Signed Response:
  Headers:
    X-Server-Timestamp: ISO-8601
    X-Server-Signature: signature
  Body: response data
    │
    ↓

Device → Receives Response
              ↓
         Verify Server Signature:
           RSA_Verify(payload, signature, serverPublicKey)
              ↓
    ┌────────┴────────┐
    │                 │
(Valid)          (Invalid)
    │                 │
    ↓                 ↓
Process Response  Reject Response
Update UI         Show Security Alert
                  Log Incident
```

---

## 8. Error Handling & Edge Cases

### 8.1 Common Error Codes
```javascript
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate entry)
- 422: Unprocessable Entity (business logic error)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error
- 503: Service Unavailable
```

### 8.2 Edge Cases to Handle
1. **Concurrent Balance Updates**: Use database transactions with row-level locking
2. **Order Payment Timeout**: Auto-cancel orders after 15 minutes
3. **Device Registration Conflicts**: Check IMEI uniqueness across company
4. **Orphaned Keys**: Background job to identify unused keys older than 30 days
5. **Balance Reconciliation**: Daily job to verify balance_sheets sum equals user.balance
6. **Session Expiry**: Clean up expired sessions daily
7. **File Upload Failures**: Implement retry mechanism with exponential backoff
8. **Device Offline**: Queue lock/unlock commands, execute when device syncs
9. **OTP Expiry During Verification**: Check expiry before verification attempt
10. **Multiple OTP Requests**: Cancel previous unused OTPs when new one requested
11. **Rate Limit Cooldown**: Return time remaining in cooldown period
12. **Location Data Gaps**: Handle missing location when device is offline
13. **Message Delivery Failure**: Retry message delivery on next sync
14. **Stolen Device Recovery**: Automatically unlock when stolen mark removed
15. **High-Frequency Location Updates**: Throttle updates from stolen devices (every 5 min)
16. **Simultaneous Device Registrations**: Prevent multiple devices with same IMEI
17. **Email Delivery Failures**: Implement provider failover (SendGrid → SES → SMTP)
18. **SMS Daily Limit Exceeded**: Queue messages for next day or notify user
19. **Push Token Expiry**: Handle invalid token errors gracefully, mark as inactive
20. **Notification Queue Overflow**: Implement queue size limits and priority-based eviction
21. **Duplicate Notifications**: Deduplicate based on recipient + type + timeframe
22. **Quiet Hours for Urgent Notifications**: Override quiet hours for critical alerts
23. **Email Bounce Handling**: Track bounce rates, block delivery to bounced addresses
24. **SMS Cost Tracking**: Alert when monthly SMS budget threshold reached
25. **Multi-Device Push Notifications**: Send to all active device tokens for a user
26. **IMEI Mismatch During Registration**: Allow user confirmation, log mismatch, notify user
27. **Duplicate uniqueCode**: Ensure cryptographically secure random generation with collision check
28. **Device Registration Timeout**: Expire uniqueCode after 7 days if device not registered
29. **Signature Timestamp Expired**: Reject requests with timestamp > 5 minutes old (replay attack)
30. **Invalid Device Signature**: Log failed auth attempt, auto-deactivate after 10 consecutive failures
31. **Private Key Compromise**: Implement key rotation API, invalidate old keys
32. **QR Code Scanning by Wrong Device**: Validate IMEI before proceeding with registration
33. **Device Re-registration**: Prevent re-registration of already registered device (check status)
34. **Multiple Devices Same IMEI**: Block registration if IMEI already registered by another client
35. **Server Public Key Rotation**: Update all client devices with new public key before rotation
36. **Android Keystore Unavailable**: Fallback to encrypted SharedPreferences with warning
37. **Rooted/Jailbroken Device Detection**: Alert user, optionally block registration
38. **Man-in-the-Middle Attack**: Use certificate pinning on device to verify server identity

---

## 9. Performance Optimization

### 9.1 Database Optimization
- **Indexing**: Index all foreign keys and frequently queried fields
- **Partitioning**: Partition audit_logs and balance_sheets by date (monthly)
- **Connection Pooling**: Min 10, Max 50 connections
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries

### 9.2 Caching Strategy
```javascript
Redis Caching:
- User balance: TTL 5 minutes
- Company details: TTL 15 minutes
- Client active status: TTL 2 minutes
- Order details: TTL 10 minutes
- OTP rate limits: TTL 15 minutes
- Device location (latest): TTL 1 minute
- Pending device messages: TTL 30 seconds
- Notification preferences: TTL 10 minutes
- Device tokens (active): TTL 5 minutes
- Email daily count: TTL 24 hours (reset at midnight)
- SMS daily count: TTL 24 hours (reset at midnight)

Cache Invalidation:
- On update: Invalidate specific key
- On delete: Invalidate related keys
- On OTP use: Invalidate OTP cache
- On notification preference update: Invalidate user preference cache
- On device token registration: Invalidate token cache
```

### 9.3 API Optimization
- **Pagination**: Default 20, Max 100 records per page
- **Field Selection**: Allow client to specify fields (`?fields=id,name,email`)
- **Compression**: Gzip response compression
- **CDN**: Use CDN for static assets (logos, documents)

### 9.4 Device Logging Optimization
- **Batch Location Updates**: Accept multiple location points in single request
- **Location History Partitioning**: Partition by month for faster queries
- **Activity Log Partitioning**: Partition by month, drop partitions older than 6 months
- **Async Geocoding**: Process reverse geocoding in background queue
- **Location Sampling**: Store only significant location changes (> 100m movement)

### 9.5 Notification Optimization
- **Priority Queues**: Separate queues for urgent, high, normal, and low priority notifications
- **Batch Processing**: Process multiple notifications in single provider API call (where supported)
- **Template Caching**: Cache email/SMS templates in Redis
- **Notification Deduplication**: Hash-based deduplication to prevent duplicate sends
- **Queue Partitioning**: Partition notification queues by status and priority
- **Provider Connection Pooling**: Maintain persistent connections to email/SMS providers
- **Async Webhooks**: Process provider webhooks asynchronously in background jobs
- **Rate Limiting**: Respect provider rate limits using token bucket algorithm
- **Smart Retry**: Skip retries for permanent failures (invalid email, phone number)
- **Quiet Hours Scheduling**: Pre-calculate quiet hours end time to avoid repeated checks

---

## 10. Scalability Considerations

### 10.1 Horizontal Scaling
- Stateless API servers (can add/remove instances)
- Load balancer (Nginx/AWS ALB)
- Separate read replicas for reports

### 10.2 Microservices (Future)
If system grows, consider splitting into:
- Auth Service
- Company Service
- User Service
- Client Service
- Order & Payment Service
- Balance & Reporting Service
- Notification Service (Email/SMS/Push)

### 10.3 Background Jobs
Use queue system (Bull/RabbitMQ) for:
- **Email notifications**: Process email_queue with priority-based scheduling
- **SMS notifications**: Process sms_queue with provider failover
- **Push notifications**: Process push_notifications with FCM/APNS
- **Notification retries**: Handle failed notification retries with exponential backoff
- **PDF invoice generation**: Order invoices, receipts
- **Balance reconciliation**: Daily balance verification
- **Expired client cleanup**: Lock expired clients
- **Device sync commands**: Queue lock/unlock commands
- **OTP cleanup**: Remove expired OTPs (>24 hours old)
- **Location geocoding**: Reverse geocode location data
- **Location history cleanup**: Purge locations older than 30 days
- **Activity log cleanup**: Archive logs older than 6 months
- **Message expiry**: Delete undelivered messages older than 7 days
- **Rate limit reset**: Clean up expired rate limit records
- **Session cleanup**: Remove expired sessions
- **Notification cleanup**: Delete sent emails (>90 days), sent SMS (>30 days), delivered push (>7 days)
- **Device token cleanup**: Remove inactive tokens (>60 days)
- **Email bounce processing**: Process webhook events from SendGrid/SES
- **SMS delivery status**: Process webhook callbacks from Twilio/SNS

---

## 11. Monitoring & Alerting

### 11.1 Key Metrics
- API response time (p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Active sessions count
- Order success rate
- Failed payment rate
- OTP delivery success rate
- OTP verification success rate
- Device sync frequency
- Location update frequency
- Message delivery success rate
- Stolen device recovery rate
- Email delivery rate (sent/failed/bounced)
- Email open rate and click-through rate
- SMS delivery rate (sent/failed/undelivered)
- SMS cost per message and monthly total
- Push notification delivery rate
- Push notification click-through rate
- Notification queue processing time
- Notification retry success rate
- Active device tokens count
- Invalid token rate

### 11.2 Alerts
- High error rate (> 5%)
- Slow response time (> 2s)
- Database connection pool exhaustion
- Disk space low (< 20%)
- Multiple failed login attempts
- OTP delivery failures (> 10% in 1 hour)
- High OTP verification failures (> 30% in 1 hour)
- Device not syncing for > 24 hours
- Stolen device marked
- Multiple emergency unlock attempts
- Location tracking stopped for > 2 hours on active device
- Email delivery failure rate > 15% in 1 hour
- Email bounce rate > 5% in 1 hour
- SMS delivery failure rate > 20% in 1 hour
- SMS monthly budget > 80% consumed
- Push notification failure rate > 25% in 1 hour
- Notification queue size > 10,000 pending
- Notification processing delay > 5 minutes
- Provider API downtime detected
- Invalid device token rate > 30% in 1 hour
- Email daily limit reached for multiple users

---

## 12. Compliance & Legal

### 12.1 Data Privacy
- GDPR compliance (if applicable)
- Data retention policy (7 years for financial records)
- Right to data deletion (with audit trail)
- Privacy policy and terms of service

### 12.2 Financial Compliance
- Transaction records immutability
- Audit trail for all financial operations
- Tax calculation and reporting
- Invoice generation with proper numbering

---

## 13. OTP Implementation Details

### 13.1 OTP Generation
- Use `crypto.randomInt()` for secure random 6-digit generation
- Format: 6 digits (000000 - 999999)
- Encrypt OTP using AES-256 before storing in database
- Store creation timestamp for expiry calculation

### 13.2 OTP Delivery
- **Email**: Use SendGrid/AWS SES for email delivery
- **SMS**: Use Twilio/AWS SNS for SMS delivery
- **Template**: Use branded templates with OTP code
- **Retry Logic**: Retry up to 3 times on delivery failure
- **Logging**: Log all delivery attempts and failures

### 13.3 OTP Rate Limiting Logic
```javascript
// Pseudocode for rate limiting
function canSendOTP(recipientId, otpType) {
  const windowStart = now() - 10 minutes;
  const record = getRateLimitRecord(recipientId, otpType, windowStart);

  if (!record) {
    // First request in window
    createRateLimitRecord(recipientId, otpType);
    return { allowed: true, remaining: 4 };
  }

  if (record.isInCooldown && record.cooldownUntil > now()) {
    return {
      allowed: false,
      reason: 'cooldown',
      retryAfter: record.cooldownUntil - now()
    };
  }

  if (record.requestCount >= 5) {
    // Trigger 15-minute cooldown
    updateCooldown(record.id, now() + 15 minutes);
    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      retryAfter: 15 minutes
    };
  }

  // Increment counter
  incrementRequestCount(record.id);
  return { allowed: true, remaining: 5 - record.requestCount };
}
```

### 13.4 OTP Verification Logic
```javascript
// Pseudocode for OTP verification
function verifyOTP(recipientId, otpCode, otpType) {
  const otpRecord = getLatestUnusedOTP(recipientId, otpType);

  if (!otpRecord) {
    return { valid: false, reason: 'otp_not_found' };
  }

  if (otpRecord.expiresAt < now()) {
    markOTPAsExpired(otpRecord.id);
    return { valid: false, reason: 'otp_expired' };
  }

  if (otpRecord.attemptCount >= 5) {
    return { valid: false, reason: 'max_attempts_exceeded' };
  }

  incrementAttemptCount(otpRecord.id);

  const decryptedOTP = decrypt(otpRecord.otpCode);

  if (decryptedOTP === otpCode) {
    markOTPAsUsed(otpRecord.id);
    return { valid: true };
  }

  return { valid: false, reason: 'otp_mismatch' };
}
```

### 13.5 OTP Security Best Practices
- Never log or return actual OTP in API responses
- Use constant-time comparison to prevent timing attacks
- Invalidate all previous OTPs when new one is requested
- Rate limit OTP verification attempts (5 per OTP)
- Monitor for unusual OTP patterns (potential attacks)

---

## 14. Future Enhancements

1. **Multi-currency Support**: Support different currencies per company
2. **SMS/Email Notifications**: Automated alerts for EMI due dates
3. **Payment Gateway Integration**: Razorpay, Stripe, PayPal
4. **Mobile SDK**: SDK for device protection functionality
5. **Analytics Dashboard**: Real-time charts and graphs
6. **Export Features**: Export reports to PDF/Excel
7. **Webhook Support**: Notify external systems of events
8. **White-label Solution**: Custom branding per company
9. **API for Third-party Integration**: Public API for partners
10. **Machine Learning**: Fraud detection, payment default prediction
11. **Geofencing**: Alert when device leaves predefined area
12. **Biometric Authentication**: Add fingerprint/face unlock
13. **Remote Wipe**: Factory reset device remotely
14. **SIM Card Tracking**: Track SIM card changes and numbers

---

## 14. Development Phases

### Phase 1: Core MVP (4-6 weeks)
- Authentication system
- Company & User management
- Basic client creation
- Order & transaction basics

### Phase 2: Advanced Features (4-6 weeks)
- Balance sheet & reporting
- OTP system implementation
- Device location tracking
- Device messaging system
- Document management
- Device lock/unlock
- Permission management

### Phase 3: Polish & Security (2-4 weeks)
- 2FA implementation
- Enhanced security features
- Performance optimization
- Comprehensive testing

### Phase 4: Production Ready (2-3 weeks)
- Monitoring & alerting setup
- Documentation
- DevOps & CI/CD
- Load testing

---

## 15. Tech Stack Recommendation

```yaml
Backend:
  Framework: NestJS (TypeScript)
  ORM: Prisma / TypeORM
  Validation: class-validator, class-transformer
  Authentication: Passport.js + JWT
  API Documentation: Swagger

Database:
  Primary: PostgreSQL 15+
  Cache: Redis 7+
  Search: Elasticsearch (optional, for advanced search)

Storage:
  Files: AWS S3 / Azure Blob Storage

DevOps:
  Container: Docker
  Orchestration: Kubernetes / Docker Compose
  CI/CD: GitHub Actions / GitLab CI
  Monitoring: Prometheus + Grafana
  Logging: ELK Stack / Loki
  Error Tracking: Sentry

Testing:
  Unit: Jest
  Integration: Supertest
  E2E: Playwright / Cypress
  Load: k6 / Artillery
```

---

## 16. Conclusion

This HLD provides a comprehensive foundation for building a secure, scalable, and maintainable EMI management system. The design emphasizes:

- **Security**: Multi-layer security with encryption, authentication, and audit trails
- **Scalability**: Horizontal scaling capability with proper indexing and caching
- **Maintainability**: Clear separation of concerns and modular architecture
- **Compliance**: Audit logs and immutable financial records
- **Flexibility**: Extensible design for future enhancements

The system is designed to handle complex business logic while maintaining data integrity and security at every level.
