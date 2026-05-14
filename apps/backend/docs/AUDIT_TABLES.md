# Audit & Logging Tables Documentation

This document provides a comprehensive overview of all audit, logging, and tracking tables in the Demigod EMI Management System.

---

## Table of Contents

1. [System-Wide Audit Logs](#1-system-wide-audit-logs)
2. [Device Activity & Tracking](#2-device-activity--tracking)
3. [Key Request Audit Trail](#3-key-request-audit-trail)
4. [Financial Audit Trail](#4-financial-audit-trail)
5. [Notification Queue Logs](#5-notification-queue-logs)
6. [OTP & Security Logs](#6-otp--security-logs)
7. [Retention Policies](#7-retention-policies)
8. [Performance Indexes](#8-performance-indexes)
9. [Query Examples](#9-query-examples)

---

## 1. System-Wide Audit Logs

### Table: `audit_logs`

**Purpose:** Comprehensive system-wide audit logging for all user actions, system events, and data modifications.

**Entity:** `AuditLog` (`src/modules/audit/entities/audit-log.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who performed the action (nullable) |
| `user_email` | VARCHAR(100) | Email of user who performed action (nullable) |
| `user_role` | VARCHAR(100) | Role of user (SUPER_ADMIN, SUPER, DISTRIBUTOR, RETAILER) |
| `action` | ENUM | Action type (see AuditAction enum - 40+ types) |
| `description` | TEXT | Human-readable description of action |
| `entity_type` | VARCHAR(100) | Type of entity affected (Client, User, Order, etc.) |
| `entity_id` | UUID | ID of affected entity |
| `old_values` | JSONB | Previous state (for updates) |
| `new_values` | JSONB | New state (for updates/creates) |
| `ip_address` | VARCHAR(100) | IP address of requester |
| `user_agent` | VARCHAR(500) | User user string |
| `method` | VARCHAR(100) | HTTP method (GET, POST, PUT, DELETE) |
| `endpoint` | VARCHAR(500) | API endpoint called |
| `success` | BOOLEAN | Whether action succeeded (default: true) |
| `error_message` | VARCHAR(500) | Error message if failed |
| `metadata` | JSONB | Additional context data |
| `created_at` | TIMESTAMP | When action occurred |

**Tracked Actions (40+ types):**

**Authentication & Authorization:**
- `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_RESET`, `PASSWORD_CHANGED`
- `TWO_FACTOR_ENABLED`, `TWO_FACTOR_DISABLED`, `SESSION_EXPIRED`

**Client Operations:**
- `CLIENT_CREATED`, `CLIENT_UPDATED`, `CLIENT_DELETED`, `CLIENT_ARCHIVED`
- `CLIENT_DEVICE_REGISTERED`, `CLIENT_DEVICE_UPDATED`, `CLIENT_STATUS_CHANGED`

**Device Operations:**
- `DEVICE_LOCKED`, `DEVICE_UNLOCKED`, `DEVICE_MARKED_STOLEN`, `DEVICE_WIPED`
- `DEVICE_FACTORY_RESET`, `DEVICE_LOCATION_TRACKED`, `DEVICE_MESSAGE_SENT`

**Order & Key Operations:**
- `ORDER_CREATED`, `ORDER_APPROVED`, `ORDER_REJECTED`, `ORDER_CANCELLED`
- `KEY_TRANSFER`, `KEY_REQUEST_CREATED`, `KEY_REQUEST_APPROVED`, `KEY_REQUEST_REJECTED`

**User Management:**
- `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_SUSPENDED`, `USER_ACTIVATED`
- `USER_ROLE_CHANGED`, `USER_COMPANY_CHANGED`

**Company Management:**
- `COMPANY_CREATED`, `COMPANY_UPDATED`, `COMPANY_STATUS_CHANGED`, `COMPANY_SETTINGS_UPDATED`

**System Operations:**
- `SYSTEM_SETTINGS_CHANGED`, `MAINTENANCE_MODE_ENABLED`, `MAINTENANCE_MODE_DISABLED`
- `SYSTEM_HEALTH_CHECK`, `AUDIT_LOG_CLEANUP`

**Indexes:**
- `idx_audit_user_created` (user_id, created_at) - User activity timeline
- `idx_audit_action_created` (action, created_at) - Action filtering
- `idx_audit_entity` (entity_type, entity_id) - Entity audit trail
- `idx_audit_created` (created_at) - Time-based queries

**Foreign Keys:**
- `user_id` → `users.id` (SET NULL on delete) - Allows deleted user audit trail preservation

**Retention:** 90 days (configurable via `cleanupOldLogs()` method)

**Access Control:**
- **SUPER_ADMIN only:** Full access to all audit logs
- **Query endpoint:** `GET /api/v1/audit/logs`
- **Filters:** user, action, entity type, entity ID, date range

---

## 2. Device Activity & Tracking

### 2.1 Table: `device_activity_logs`

**Purpose:** Track all device-related activities for clients including locks, unlocks, location tracking, etc.

**Entity:** `DeviceActivityLog` (`src/modules/device/entities/device-activity-log.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Client whose device this log belongs to |
| `activity_type` | ENUM | Type of activity (see DeviceActivityType) |
| `description` | TEXT | Human-readable description |
| `metadata` | JSONB | Additional context (command payload, result, etc.) |
| `performed_by` | UUID | User who performed the action (nullable) |
| `ip_address` | INET | IP address of requester |
| `user_agent` | TEXT | User user string |
| `created_at` | TIMESTAMP | When activity occurred |

**Activity Types (from DeviceActivityType enum):**
- `DEVICE_LOCKED` - Device locked by admin/retailer
- `DEVICE_UNLOCKED` - Device unlocked
- `DEVICE_LOCATION_TRACKED` - Location ping requested
- `DEVICE_MESSAGE_SENT` - Alert message sent to device
- `DEVICE_WIPED` - Factory reset initiated
- `DEVICE_MARKED_STOLEN` - Device marked as stolen
- `DEVICE_STATUS_CHANGED` - Device status updated

**Relationships:**
- `client_id` → `clients.id` (CASCADE delete)
- `performed_by` → `users.id` (nullable)

**Indexes:**
- Composite: (client_id, activity_type, created_at) - Fast filtering and sorting

**Use Cases:**
- Track who performed device operations
- Audit trail for stolen device reports
- Compliance and dispute resolution
- Client device history timeline

---

### 2.2 Table: `device_locations`

**Purpose:** Store GPS location history for client devices with battery and network state.

**Entity:** `DeviceLocation` (`src/modules/device/entities/device-location.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Client whose device location this is |
| `latitude` | DECIMAL(10,8) | GPS latitude |
| `longitude` | DECIMAL(11,8) | GPS longitude |
| `accuracy` | DECIMAL(10,2) | Location accuracy in meters |
| `altitude` | DECIMAL(10,2) | Altitude in meters |
| `battery_level` | INT | Battery percentage (0-100) |
| `is_charging` | BOOLEAN | Whether device is charging |
| `is_moving` | BOOLEAN | Whether device is in motion |
| `speed` | DECIMAL(10,2) | Speed in km/h |
| `network_type` | VARCHAR(20) | Network type (4G, 5G, WiFi) |
| `wifi_ssid` | VARCHAR(100) | Connected WiFi SSID |
| `recorded_at` | TIMESTAMP | When device recorded location |
| `received_at` | TIMESTAMP | When server received location |

**Relationships:**
- `client_id` → `clients.id` (CASCADE delete)

**Indexes:**
- Composite: (client_id, recorded_at) - Fast timeline queries

**Use Cases:**
- Track client device movements
- Stolen device recovery
- Geofencing alerts
- Historical location playback
- Battery and network monitoring

**Privacy Considerations:**
- Only accessible by retailer who owns client, their distributors/super, and SUPER_ADMIN
- Consider GDPR compliance for location data retention

---

### 2.3 Table: `device_commands`

**Purpose:** Queue and track device control commands (lock, unlock, wipe, message, etc.) with execution status.

**Entity:** `DeviceCommand` (`src/modules/device/entities/device-command.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Client whose device will receive command |
| `type` | ENUM | Command type (see CommandType) |
| `status` | ENUM | Command status (PENDING, SENT, DELIVERED, EXECUTED, FAILED) |
| `payload` | JSONB | Command-specific data |
| `created_by` | UUID | User who initiated command |
| `created_at` | TIMESTAMP | When command was created |
| `sent_at` | TIMESTAMP | When command was sent to device |
| `delivered_at` | TIMESTAMP | When device acknowledged receipt |
| `executed_at` | TIMESTAMP | When device executed command |
| `failed_at` | TIMESTAMP | When command failed |
| `expires_at` | TIMESTAMP | When command expires (undelivered) |
| `result` | JSONB | Execution result from device |
| `error_message` | TEXT | Error if command failed |

**Command Types (from CommandType enum):**
- `LOCK_DEVICE` - Lock device screen
- `UNLOCK_DEVICE` - Unlock device
- `TRACK_LOCATION` - Request GPS location
- `SEND_MESSAGE` - Display alert message
- `FACTORY_RESET` - Wipe device data
- `MARK_STOLEN` - Mark as stolen

**Relationships:**
- `client_id` → `clients.id` (CASCADE delete)
- `created_by` → `users.id`

**Indexes:**
- (client_id, status) - Find pending/active commands per client
- created_at - Cleanup expired commands

**Command Lifecycle:**
```
PENDING → SENT → DELIVERED → EXECUTED ✓
                          ↓
                       FAILED ✗
```

**Use Cases:**
- Remote device control
- Track command execution status
- Audit who issued commands
- Retry failed commands
- Cleanup expired commands

---

## 3. Key Request Audit Trail

### Table: `key_request_audit_logs`

**Purpose:** Immutable audit trail for all changes to key requests including status changes, comments, fulfillment, and rejections.

**Entity:** `KeyRequestAuditLog` (`src/modules/key-request/entities/key-request.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key_request_id` | UUID | Key request this log belongs to |
| `action` | VARCHAR(50) | Action performed |
| `performed_by` | UUID | User who performed action |
| `old_status` | VARCHAR(50) | Previous status (nullable) |
| `new_status` | VARCHAR(50) | New status (nullable) |
| `details` | JSONB | Additional change details |
| `comment` | TEXT | Comment added with action |
| `created_at` | TIMESTAMP | When action occurred |

**Tracked Actions:**
- `created` - Key request created by RETAILER
- `status_changed` - Status updated (PENDING → APPROVED/REJECTED)
- `commented` - Admin or approver added comment
- `fulfilled` - Request fulfilled by SUPER/DISTRIBUTOR
- `rejected` - Request rejected with reason
- `internal_note_added` - Internal note added (not visible to requester)

**Relationships:**
- `key_request_id` → `key_requests.id` (CASCADE delete)
- `performed_by` → `users.id`

**Indexes:**
- key_request_id - Fast lookup of audit trail per request
- performed_by - Find actions by user
- created_at - Timeline sorting

**Features:**
- **Immutable:** Once created, entries cannot be updated or deleted
- **Complete Trail:** Every change to key request is logged
- **User Attribution:** Tracks who made each change
- **Status History:** Old and new status for transitions
- **Comments Preserved:** All comments stored with timestamp

**Use Cases:**
- Compliance and audit requirements
- Dispute resolution
- Performance tracking (approval times)
- User activity monitoring
- Request timeline reconstruction

---

## 4. Financial Audit Trail

### 4.1 Table: `balance_sheets`

**Purpose:** Immutable financial ledger tracking all balance changes with before/after snapshots.

**Entity:** `BalanceSheet` (`src/modules/balance-sheet/entities/balance-sheet.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_type` | ENUM | Type of balance transaction |
| `company_id` | UUID | Company involved |
| `user_id` | UUID | User involved (nullable for company entries) |
| `client_id` | UUID | Related client (nullable) |
| `order_id` | UUID | Related order (nullable) |
| `transaction_id` | UUID | Related transaction (nullable) |
| `from_user_id` | UUID | Source user for transfers (nullable) |
| `to_user_id` | UUID | Destination user for transfers (nullable) |
| `amount` | DECIMAL(15,2) | Amount of change (+/-) |
| `balance_before` | DECIMAL(15,2) | Balance snapshot before |
| `balance_after` | DECIMAL(15,2) | Balance snapshot after |
| `description` | TEXT | Human-readable description |
| `metadata` | JSONB | Additional transaction context |
| `created_at` | TIMESTAMP | When entry was created |
| `created_by` | UUID | User who created entry |

**Transaction Types (BalanceSheetType enum):**
- `ORDER_PURCHASE` - User purchases keys from company
- `KEY_USE` - User uses key to create client
- `BALANCE_TRANSFER` - Owner/Admin transfers balance to user (deduction)
- `BALANCE_RECEIVED` - User receives balance from owner/admin (addition)
- `REFUND` - Super admin refunds balance to user
- `COMMISSION` - Commission earned/deducted

**Relationships:**
- `company_id` → `companies.id`
- `user_id` → `users.id`
- `created_by` → `users.id`
- `from_user_id` → `users.id`
- `to_user_id` → `users.id`

**Indexes:**
- company_id - Company financial history
- user_id - User balance timeline
- transaction_type - Filter by transaction type
- created_at - Time-based queries

**Features:**
- **Append-Only:** Entries can NEVER be updated or deleted
- **Balance Snapshots:** Before and after values for reconciliation
- **Double-Entry:** Transfers create two entries (debit and credit)
- **Audit Trail:** Complete financial history
- **Validation:** `balance_after` must equal `balance_before + amount`

**Use Cases:**
- Balance reconciliation
- Financial audit and compliance
- Dispute resolution
- Commission tracking
- Revenue reporting
- User financial history

---

### 4.2 Table: `transactions`

**Purpose:** Track payment transactions for key purchases with gateway integration.

**Entity:** `Transaction` (`src/modules/transaction/entities/transaction.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | VARCHAR(100) | Internal transaction ID (unique) |
| `order_id` | UUID | Related order (nullable) |
| `agent_id` | UUID | User who initiated transaction |
| `company_id` | UUID | User's company |
| `amount` | DECIMAL(15,2) | Transaction amount |
| `payment_method` | ENUM | Payment method (cash, card, UPI, etc.) |
| `external_trans_id` | VARCHAR(255) | Gateway transaction ID |
| `status` | ENUM | Transaction status |
| `failure_reason` | TEXT | Failure reason if failed |
| `refund_reason` | TEXT | Refund reason if refunded |
| `refunded_at` | TIMESTAMP | When refund was processed |
| `gateway_name` | VARCHAR(100) | Payment gateway (Razorpay, Stripe, etc.) |
| `gateway_response` | JSONB | Raw gateway response |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | Last update |
| `processed_at` | TIMESTAMP | When payment succeeded |

**Transaction Status Flow:**
```
INITIATED → PENDING → PROCESSING → SUCCESS ✓
                                 ↓
                              FAILED ✗
                                 ↓
                            REFUNDED
```

**Indexes:**
- order_id - Find transaction for order
- agent_id - User transaction history
- status - Filter by status
- created_at - Time-based queries
- transaction_id (UNIQUE) - Fast lookup

**Features:**
- **Payment Gateway Integration:** Stores raw responses
- **Multi-Gateway Support:** Razorpay, Stripe, PayTM, PhonePe
- **Refund Tracking:** Reason and timestamp
- **Complete Audit:** All payment attempts logged

**Use Cases:**
- Payment reconciliation
- Refund processing
- Gateway debugging
- Revenue tracking
- Fraud detection

---

### 4.3 Table: `key_transfers`

**Purpose:** Track hierarchical key distribution with commission (SUPER → DISTRIBUTOR → RETAILER).

**Entity:** `KeyTransfer` (`src/modules/key-transfer/entities/key-transfer.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `from_user_id` | UUID | Sender (parent in hierarchy) |
| `to_user_id` | UUID | Receiver (child in hierarchy) |
| `quantity` | INT | Number of keys transferred |
| `base_rate` | DECIMAL(10,2) | Rate per key |
| `commission_percentage` | DECIMAL(5,2) | Commission % |
| `transfer_amount` | DECIMAL(15,2) | Total amount to receiver |
| `commission_amount` | DECIMAL(15,2) | Commission to sender |
| `order_id` | UUID | Related order (if from SUPER) |
| `company_id` | UUID | Company context |
| `status` | ENUM | Transfer status |
| `payment_method` | VARCHAR(50) | Payment method |
| `payment_transaction_id` | VARCHAR(255) | Payment transaction ID |
| `payment_received_at` | TIMESTAMP | When payment received |
| `payment_proof` | VARCHAR(500) | Payment proof URL |
| `notes` | TEXT | Transfer notes |
| `cancellation_reason` | TEXT | Cancellation reason if cancelled |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | Last update |
| `completed_at` | TIMESTAMP | When completed |
| `cancelled_at` | TIMESTAMP | When cancelled |
| `created_by` | UUID | Who created transfer |
| `approved_by` | UUID | Who approved transfer |

**Transfer Status:**
- `PENDING` - Awaiting payment
- `PAYMENT_RECEIVED` - Payment confirmed
- `COMPLETED` - Keys transferred
- `CANCELLED` - Transfer cancelled

**Indexes:**
- from_user_id - Sender history
- to_user_id - Receiver history
- company_id - Company transfers
- status - Filter by status
- created_at - Time-based queries

**Features:**
- **Commission Tracking:** Automatic commission calculation
- **Payment Proof:** Upload receipt
- **Multi-Level:** SUPER → DISTRIBUTOR → RETAILER
- **Cancellation:** Track cancelled transfers with reason

**Use Cases:**
- Commission reconciliation
- Key distribution audit
- Payment tracking
- Revenue sharing
- Transfer history

---

## 5. Notification Queue Logs

### 5.1 Table: `email_queue`

**Purpose:** Queue email notifications with retry logic and delivery tracking.

**Entity:** `EmailQueue` (`src/modules/notification/entities/email-queue.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `recipient_type` | ENUM | Recipient type (user, client, company) |
| `recipient_id` | UUID | Recipient entity ID |
| `to_email` | VARCHAR(255) | Recipient email |
| `to_name` | VARCHAR(255) | Recipient name |
| `subject` | VARCHAR(500) | Email subject |
| `body` | TEXT | Plain text body |
| `body_html` | TEXT | HTML body |
| `from_email` | VARCHAR(255) | Sender email |
| `from_name` | VARCHAR(255) | Sender name |
| `reply_to` | VARCHAR(255) | Reply-to email |
| `email_type` | ENUM | Email type (welcome, OTP, alert, etc.) |
| `status` | ENUM | Delivery status |
| `attempt_count` | INT | Send attempt count |
| `max_attempts` | INT | Max retry attempts (default: 3) |
| `last_attempt_at` | TIMESTAMP | Last send attempt |
| `next_retry_at` | TIMESTAMP | Next retry scheduled |
| `sent_at` | TIMESTAMP | When sent |
| `delivered_at` | TIMESTAMP | When delivered |
| `opened_at` | TIMESTAMP | When opened (tracking) |
| `clicked_at` | TIMESTAMP | When link clicked |
| `provider` | VARCHAR(50) | Email provider used |
| `external_id` | VARCHAR(255) | Provider message ID |
| `error_message` | TEXT | Error if failed |
| `error_code` | VARCHAR(50) | Error code |
| `attachments` | JSONB | Attachment metadata |
| `priority` | ENUM | Priority (high, normal, low) |
| `created_at` | TIMESTAMP | When queued |
| `updated_at` | TIMESTAMP | Last update |

**Email Status:**
- `PENDING` - Queued for sending
- `SENT` - Sent to provider
- `DELIVERED` - Delivered to inbox
- `OPENED` - Email opened (tracking)
- `CLICKED` - Link clicked (tracking)
- `FAILED` - Delivery failed
- `BOUNCED` - Email bounced

**Features:**
- **Automatic Retry:** Exponential backoff
- **Fallback Providers:** Try secondary if primary fails
- **Delivery Tracking:** Open and click tracking
- **Priority Queue:** High-priority emails first

**Use Cases:**
- Email delivery audit
- Retry failed emails
- Delivery rate analysis
- Provider performance comparison

---

### 5.2 Table: `sms_queue`

**Purpose:** Queue SMS notifications with retry logic and delivery tracking.

**Entity:** `SmsQueue` (`src/modules/notification/entities/sms-queue.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `recipient_type` | ENUM | Recipient type (user, client, company) |
| `recipient_id` | UUID | Recipient entity ID |
| `to_phone` | VARCHAR(20) | Recipient phone |
| `to_name` | VARCHAR(255) | Recipient name |
| `message` | TEXT | SMS message body |
| `sms_type` | ENUM | SMS type (OTP, alert, notification) |
| `status` | ENUM | Delivery status |
| `attempt_count` | INT | Send attempt count |
| `max_attempts` | INT | Max retry attempts (default: 3) |
| `last_attempt_at` | TIMESTAMP | Last send attempt |
| `next_retry_at` | TIMESTAMP | Next retry scheduled |
| `sent_at` | TIMESTAMP | When sent |
| `delivered_at` | TIMESTAMP | When delivered |
| `provider` | VARCHAR(50) | SMS provider used |
| `external_id` | VARCHAR(255) | Provider message ID |
| `error_message` | TEXT | Error if failed |
| `error_code` | VARCHAR(50) | Error code |
| `priority` | ENUM | Priority (high, normal, low) |
| `dlt_template_id` | VARCHAR(100) | DLT template ID (India compliance) |
| `credits_used` | INT | SMS credits consumed |
| `created_at` | TIMESTAMP | When queued |
| `updated_at` | TIMESTAMP | Last update |

**SMS Status:**
- `PENDING` - Queued for sending
- `SENT` - Sent to provider
- `DELIVERED` - Delivered to phone
- `FAILED` - Delivery failed
- `REJECTED` - Rejected by provider

**Features:**
- **DLT Compliance:** Template ID tracking (India)
- **Credit Tracking:** SMS credits per message
- **Provider Fallback:** Secondary provider support
- **OTP Priority:** OTP messages sent first

**Use Cases:**
- SMS delivery audit
- Cost tracking (credits)
- DLT compliance reporting
- Provider performance analysis

---

### 5.3 Table: `push_queue`

**Purpose:** Queue push notifications with retry logic and delivery tracking.

**Entity:** `PushQueue` (`src/modules/notification/entities/push-queue.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `recipient_type` | ENUM | Recipient type (user, client, company) |
| `recipient_id` | UUID | Recipient entity ID |
| `device_tokens` | JSONB | Array of FCM device tokens |
| `title` | VARCHAR(255) | Notification title |
| `body` | TEXT | Notification body |
| `data` | JSONB | Custom payload data |
| `image_url` | VARCHAR(500) | Notification image |
| `action_url` | VARCHAR(500) | Deep link URL |
| `push_type` | ENUM | Push type (alert, reminder, etc.) |
| `status` | ENUM | Delivery status |
| `attempt_count` | INT | Send attempt count |
| `max_attempts` | INT | Max retry attempts (default: 3) |
| `last_attempt_at` | TIMESTAMP | Last send attempt |
| `next_retry_at` | TIMESTAMP | Next retry scheduled |
| `sent_at` | TIMESTAMP | When sent |
| `delivered_count` | INT | Successful deliveries |
| `failed_count` | INT | Failed deliveries |
| `provider` | VARCHAR(50) | Push provider (FCM) |
| `external_id` | VARCHAR(255) | Provider message ID |
| `error_message` | TEXT | Error if failed |
| `priority` | ENUM | Priority (high, normal, low) |
| `ttl` | INT | Time to live (seconds) |
| `created_at` | TIMESTAMP | When queued |
| `updated_at` | TIMESTAMP | Last update |

**Push Status:**
- `PENDING` - Queued for sending
- `SENT` - Sent to FCM
- `DELIVERED` - Delivered to device(s)
- `PARTIALLY_DELIVERED` - Some tokens failed
- `FAILED` - All tokens failed

**Features:**
- **Multi-Token Support:** Send to multiple devices
- **Partial Delivery:** Track success per token
- **Deep Linking:** App navigation URLs
- **Rich Media:** Images and custom data

**Use Cases:**
- Push notification audit
- Device token validation
- Delivery rate analysis
- User engagement tracking

---

## 6. OTP & Security Logs

### 6.1 Table: `otps`

**Purpose:** Track OTP generation, usage, and validation with security features.

**Entity:** `Otp` (`src/modules/otp/entities/otp.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `recipient_type` | ENUM | Recipient type (USER, CLIENT) |
| `recipient_id` | UUID | Recipient entity ID |
| `otp_code` | VARCHAR(255) | Hashed OTP code (bcrypt) |
| `otp_type` | ENUM | OTP type (login, reset, 2FA, etc.) |
| `attempt_count` | INT | Verification attempt count |
| `max_attempts` | INT | Max verification attempts (default: 5) |
| `expires_at` | TIMESTAMP | Expiration timestamp |
| `is_used` | BOOLEAN | Whether OTP has been used |
| `used_at` | TIMESTAMP | When OTP was used |
| `ip_address` | VARCHAR(45) | IP address of requester |
| `user_agent` | TEXT | User user string |
| `created_at` | TIMESTAMP | When OTP was generated |
| `updated_at` | TIMESTAMP | Last update |

**OTP Types:**
- `LOGIN` - Login verification
- `PASSWORD_RESET` - Password reset
- `TWO_FACTOR` - 2FA verification
- `PHONE_VERIFICATION` - Phone number verification
- `EMAIL_VERIFICATION` - Email verification

**Security Features:**
- **Hashed Storage:** OTP codes hashed with bcrypt
- **Attempt Limiting:** Max 5 verification attempts
- **Expiration:** Time-limited validity
- **Single-Use:** Cannot reuse after validation
- **IP Tracking:** Log requester IP

**Use Cases:**
- OTP validation audit
- Brute force detection
- Security compliance
- Failed attempt tracking

---

### 6.2 Table: `otp_rate_limits`

**Purpose:** Prevent OTP spam and abuse with rate limiting and cooldown.

**Entity:** `OtpRateLimit` (`src/modules/otp/entities/otp.entity.ts`)

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `recipient_type` | ENUM | Recipient type (USER, CLIENT) |
| `recipient_id` | UUID | Recipient entity ID |
| `otp_type` | ENUM | OTP type |
| `request_count` | INT | Request count in window |
| `window_start` | TIMESTAMP | Rate limit window start |
| `cooldown_until` | TIMESTAMP | Cooldown expiry |
| `is_in_cooldown` | BOOLEAN | Whether in cooldown |
| `created_at` | TIMESTAMP | When record created |
| `updated_at` | TIMESTAMP | Last update |

**Rate Limit Rules:**
- **Max Requests:** 3 OTPs per 15-minute window
- **Cooldown:** 1-hour cooldown after exceeding limit
- **Per User Per Type:** Separate limits for each OTP type

**Use Cases:**
- Prevent OTP spam
- Detect abuse patterns
- Security compliance
- User protection

---

## 7. Retention Policies

### Recommended Retention Periods

| Table | Retention | Reason | Cleanup Method |
|-------|-----------|--------|----------------|
| `audit_logs` | 90 days | Compliance, space management | `AuditService.cleanupOldLogs()` |
| `device_activity_logs` | 180 days | Dispute resolution | Manual/scheduled job |
| `device_locations` | 30 days | Privacy, GDPR | Manual/scheduled job |
| `device_commands` | 7 days | Only recent commands needed | Manual/scheduled job |
| `key_request_audit_logs` | 1 year | Financial audit | Manual/scheduled job |
| `balance_sheets` | Permanent | Financial records | Never delete |
| `transactions` | Permanent | Financial records | Never delete |
| `key_transfers` | Permanent | Financial records | Never delete |
| `email_queue` | 30 days | Delivery history | Manual/scheduled job |
| `sms_queue` | 30 days | Delivery history | Manual/scheduled job |
| `push_queue` | 30 days | Delivery history | Manual/scheduled job |
| `otps` | 24 hours | Security, space | Manual/scheduled job |
| `otp_rate_limits` | 7 days | Rate limit enforcement | Manual/scheduled job |

### Cleanup Implementation

**Audit Logs:**
```typescript
// apps/demi-service/src/modules/audit/audit.service.ts
await auditService.cleanupOldLogs(90); // Keep 90 days
```

**Device Locations (Example):**
```sql
DELETE FROM device_locations
WHERE recorded_at < NOW() - INTERVAL '30 days';
```

**Notification Queues (Example):**
```sql
DELETE FROM email_queue
WHERE status IN ('DELIVERED', 'FAILED')
AND created_at < NOW() - INTERVAL '30 days';
```

---

## 8. Performance Indexes

### Critical Indexes Summary

**audit_logs:**
- `idx_audit_user_created` - User activity timeline
- `idx_audit_action_created` - Action filtering
- `idx_audit_entity` - Entity audit trail
- `idx_audit_created` - Time-based cleanup

**device_activity_logs:**
- Composite: (client_id, activity_type, created_at)

**device_locations:**
- Composite: (client_id, recorded_at)

**device_commands:**
- Composite: (client_id, status)
- created_at - Cleanup

**key_request_audit_logs:**
- key_request_id
- performed_by
- created_at

**balance_sheets:**
- company_id
- user_id
- transaction_type
- created_at

**transactions:**
- order_id
- agent_id
- status
- created_at
- transaction_id (UNIQUE)

**key_transfers:**
- from_user_id
- to_user_id
- company_id
- status
- created_at

**email_queue / sms_queue / push_queue:**
- No explicit indexes defined (rely on primary key and sequential scans)
- Consider adding: (status, created_at) for queue processing

---

## 9. Query Examples

### Get User Audit Trail
```typescript
// Get all actions by a user in date range
const logs = await auditLogRepository.find({
  where: {
    userId: userId,
    createdAt: Between(startDate, endDate),
  },
  order: { createdAt: 'DESC' },
});
```

### Get Client Device Activity
```typescript
// Get device activity for client
const activities = await deviceActivityLogRepository.find({
  where: { clientId },
  relations: ['performedBy'],
  order: { createdAt: 'DESC' },
  take: 50,
});
```

### Get Client Location History
```typescript
// Get location timeline
const locations = await deviceLocationRepository.find({
  where: {
    clientId,
    recordedAt: Between(startDate, endDate),
  },
  order: { recordedAt: 'DESC' },
});
```

### Get Key Request Audit Trail
```typescript
// Get complete audit trail for key request
const auditLogs = await keyRequestAuditLogRepository.find({
  where: { keyRequestId },
  relations: ['performer'],
  order: { createdAt: 'ASC' },
});
```

### Get Balance Sheet for User
```typescript
// Get user balance history
const balanceSheet = await balanceSheetRepository.find({
  where: { userId },
  order: { createdAt: 'DESC' },
  take: 100,
});

// Verify balance integrity
const latestEntry = balanceSheet[0];
const calculatedBalance = latestEntry.balanceAfter;
```

### Get Failed Email Notifications
```typescript
// Get emails that need retry
const failedEmails = await emailQueueRepository.find({
  where: {
    status: NotificationStatus.FAILED,
    attemptCount: LessThan(3),
  },
  order: { nextRetryAt: 'ASC' },
});
```

### Get Active OTPs
```typescript
// Get valid OTP for user
const otp = await otpRepository.findOne({
  where: {
    recipientId,
    recipientType: OtpRecipientType.USER,
    otpType: OtpType.LOGIN,
    isUsed: false,
    expiresAt: MoreThan(new Date()),
  },
  order: { createdAt: 'DESC' },
});
```

---

## Summary

The Demigod system implements comprehensive audit and logging across **12 tables**:

**System Audit:**
1. `audit_logs` - System-wide audit (40+ action types)

**Device Tracking:**
2. `device_activity_logs` - Device operations
3. `device_locations` - GPS tracking
4. `device_commands` - Command queue

**Financial Audit:**
5. `balance_sheets` - Immutable ledger
6. `transactions` - Payment tracking
7. `key_transfers` - Key distribution

**Notification Tracking:**
8. `email_queue` - Email delivery
9. `sms_queue` - SMS delivery
10. `push_queue` - Push notifications

**Security:**
11. `otps` - OTP generation/usage
12. `otp_rate_limits` - Rate limiting

**Additional Audit:**
13. `key_request_audit_logs` - Key request trail

**Key Features:**
✅ **Immutable:** Balance sheets, audit logs
✅ **Complete Trail:** Every action logged
✅ **User Attribution:** Track who did what
✅ **Time-Series:** Chronological tracking
✅ **JSONB Flexibility:** Store complex metadata
✅ **Performance:** Strategic indexes
✅ **Compliance:** GDPR, financial regulations
✅ **Retention:** Configurable cleanup

For API endpoints and service methods, see:
- [audit.controller.ts](src/modules/audit/audit.controller.ts)
- [audit.service.ts](src/modules/audit/audit.service.ts)

For Jaeger distributed tracing integration:
- [docker-compose.dev.yml](docker-compose.dev.yml) - Jaeger all-in-one container
- OTLP HTTP endpoint: `http://localhost:4318`
- Jaeger UI: `http://localhost:16686`
