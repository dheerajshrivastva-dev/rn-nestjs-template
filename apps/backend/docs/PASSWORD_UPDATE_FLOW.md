# Password Update Flow with Advanced Security Options

## Overview

This document describes the password update functionality with advanced security features including:
- **SUPER_ADMIN can update any user's password** (except other SUPER_ADMINs)
- **Logout from all devices** option
- **Reset or replace 2FA** option
- **Comprehensive audit logging** (accessible to SUPER_ADMIN only)

---

## Permission Matrix

| Actor Role    | Can Update Password For      | Requires Current Password | Can Modify 2FA | Can Logout All Devices |
|---------------|------------------------------|---------------------------|----------------|------------------------|
| SUPER_ADMIN   | SUPER, DISTRIBUTOR, RETAILER | ❌ No                      | ✅ Yes          | ✅ Yes                  |
| SUPER_ADMIN   | Other SUPER_ADMIN            | ❌ **FORBIDDEN**           | ❌ No           | ❌ No                   |
| SUPER         | Self only                    | ✅ Yes                     | ✅ Yes          | ✅ Yes                  |
| DISTRIBUTOR   | Self only                    | ✅ Yes                     | ✅ Yes          | ✅ Yes                  |
| RETAILER      | Self only                    | ✅ Yes                     | ✅ Yes          | ✅ Yes                  |

**Key Rules**:
- SUPER_ADMIN **CANNOT** update other SUPER_ADMIN passwords (security measure)
- Users updating their own password **MUST** provide current password
- SUPER_ADMIN updating other users' passwords does **NOT** need current password
- All password updates are logged in audit logs

---

## API Endpoints

### 1. Update Another User's Password (SUPER_ADMIN Only)

**Endpoint**: `POST /api/v1/users/update-password`

**Access**: SUPER_ADMIN only

**Headers**: `Authorization: Bearer <accessToken>`

**Request**:

```json
{
  "userId": "target-user-uuid",
  "newPassword": "NewSecurePassword@123",
  "logoutAllDevices": true,
  "reset2FA": false,
  "replace2FAWithMethod": "2fa_totp",
  "reason": "User forgot password and requested reset"
}
```

**Request Fields**:

| Field                | Type    | Required | Description                                      |
|----------------------|---------|----------|--------------------------------------------------|
| userId               | string  | ✅ Yes    | Target user ID                                   |
| newPassword          | string  | ✅ Yes    | New password (min 8 chars, complexity rules)     |
| currentPassword      | string  | ❌ No     | Not required for SUPER_ADMIN                     |
| logoutAllDevices     | boolean | ❌ No     | Default: false. Logout all devices after update  |
| reset2FA             | boolean | ❌ No     | Default: false. Disable 2FA                      |
| replace2FAWithMethod | string  | ❌ No     | null, "2fa_totp", or "2fa_mobile_otp"            |
| reason               | string  | ❌ No     | Reason for update (recorded in audit log)        |

**Response**:

```json
{
  "success": true,
  "message": "Password updated successfully",
  "devicesLoggedOut": 3,
  "twoFactorStatus": {
    "enabled": true,
    "primaryMethod": "2fa_totp"
  },
  "auditLogId": "audit-log-uuid"
}
```

**Error Responses**:

- **403 Forbidden**: SUPER_ADMIN trying to update another SUPER_ADMIN's password
- **403 Forbidden**: Non-SUPER_ADMIN trying to update another user's password
- **400 Bad Request**: Password doesn't meet complexity requirements
- **404 Not Found**: Target user not found

---

### 2. Change Own Password

**Endpoint**: `POST /api/v1/users/me/change-password`

**Access**: All authenticated users

**Headers**: `Authorization: Bearer <accessToken>`

**Request**:

```json
{
  "userId": "own-user-uuid",
  "currentPassword": "OldPassword@123",
  "newPassword": "NewSecurePassword@123",
  "logoutAllDevices": false,
  "reset2FA": false
}
```

**Request Fields**:

| Field                | Type    | Required | Description                                   |
|----------------------|---------|----------|-----------------------------------------------|
| userId               | string  | ✅ Yes    | Own user ID (must match authenticated user)   |
| currentPassword      | string  | ✅ Yes    | Current password (required for verification)  |
| newPassword          | string  | ✅ Yes    | New password (min 8 chars, complexity rules)  |
| logoutAllDevices     | boolean | ❌ No     | Default: false. Logout all other devices      |
| reset2FA             | boolean | ❌ No     | Default: false. Disable own 2FA               |
| replace2FAWithMethod | string  | ❌ No     | null, "2fa_totp", or "2fa_mobile_otp"         |

**Response**: Same as above

**Error Responses**:

- **401 Unauthorized**: Current password is incorrect
- **400 Bad Request**: Password doesn't meet complexity requirements
- **403 Forbidden**: userId doesn't match authenticated user

---

## Password Complexity Requirements

All new passwords **MUST** meet these requirements:

✅ Minimum 8 characters
✅ At least one uppercase letter (A-Z)
✅ At least one lowercase letter (a-z)
✅ At least one digit (0-9)
✅ At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Validation Regex**:
```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
```

---

## Flow Diagrams

### Flow 1: SUPER_ADMIN Updates User Password

```
1. SUPER_ADMIN clicks "Update Password" on user profile
   ↓
2. System checks permission:
   - Is actor SUPER_ADMIN? ✅
   - Is target user SUPER_ADMIN? ❌ (would fail if yes)
   ↓
3. Dialog shows:
   - New password field
   - Confirm password field
   - Advanced options:
     □ Logout all devices
     □ Disable 2FA
     □ Replace 2FA method (TOTP / Mobile OTP)
     - Reason field (for audit log)
   ↓
4. SUPER_ADMIN enters new password + options + reason
   ↓
5. System validates:
   - Password complexity ✅
   - Passwords match ✅
   ↓
6. Backend processes:
   a) Hash new password (bcrypt)
   b) Update user.password
   c) If logoutAllDevices:
      - Find all active sessions for user
      - Mark as revoked
      - Increment tokenVersion (invalidates refresh tokens)
   d) If reset2FA:
      - Set twoFactorEnabled = false
      - Clear TOTP secret, backup codes
   e) If replace2FAWithMethod:
      - Clear old 2FA method
      - Set up new method (send setup instructions)
   f) Create audit log:
      - Action: PASSWORD_CHANGED
      - Severity: WARNING
      - Actor: SUPER_ADMIN
      - Target: User
      - Metadata: {logoutAllDevices, reset2FA, replace2FAWithMethod, reason}
   ↓
7. System sends email to user:
   - "Your password was changed by administrator"
   - Include reason (if provided)
   - List actions taken (devices logged out, 2FA changes)
   - "This wasn't me?" link → contacts support
   ↓
8. Response returned:
   - Success message
   - Devices logged out count
   - 2FA status
   - Audit log ID
   ↓
9. Frontend:
   - Show success alert
   - Invalidate user queries
   - Invalidate session queries
   - Invalidate audit log queries
```

### Flow 2: User Changes Own Password

```
1. User navigates to Profile → Change Password
   ↓
2. Dialog shows:
   - Current password field
   - New password field
   - Confirm password field
   - Advanced options (optional):
     □ Logout all other devices
     □ Disable 2FA
   ↓
3. User enters passwords
   ↓
4. System validates:
   - Current password correct? ✅
   - New password complexity ✅
   - Passwords match ✅
   ↓
5. Backend processes:
   a) Verify current password (bcrypt.compare)
   b) Hash new password
   c) Update user.password
   d) If logoutAllDevices:
      - Revoke all sessions EXCEPT current session
   e) If reset2FA:
      - Disable 2FA
   f) Create audit log:
      - Action: PASSWORD_CHANGED
      - Severity: INFO
      - Actor: User (self)
      - Target: User (self)
   ↓
6. System sends confirmation email:
   - "Your password was changed successfully"
   - If 2FA disabled: "Two-factor authentication was disabled"
   - "This wasn't me?" link
   ↓
7. Response returned with success status
```

---

## Security Measures

### 1. SUPER_ADMIN Cannot Update Other SUPER_ADMIN Passwords

**Why**: Prevents privilege escalation attacks

**Implementation**:
```typescript
if (actor.role === 'super_admin' && targetUser.role === 'super_admin' && actor.id !== targetUser.id) {
  throw new ForbiddenException('SUPER_ADMIN cannot update other SUPER_ADMIN passwords');
}
```

### 2. Logout All Devices

**Why**: Ensures stolen sessions are invalidated after password change

**Implementation**:
- Find all `user_sessions` where `userId = targetUserId` and `isActive = true`
- Set `isActive = false`, `revokedAt = NOW()`, `revokedReason = 'password_changed'`
- Increment `tokenVersion` to invalidate refresh tokens

**Exception**: When user changes own password, current session is NOT revoked (keep logged in)

### 3. 2FA Reset

**Why**: User may have lost access to 2FA device

**Options**:
- **Disable 2FA**: Completely remove 2FA requirement
- **Replace with TOTP**: Clear old method, generate new TOTP secret, send QR code
- **Replace with Mobile OTP**: Clear old method, verify new phone number

**Implementation**:
```typescript
if (reset2FA) {
  await this.twoFactorAuthService.disable(targetUserId);
  auditMetadata.twoFactorReset = true;
}

if (replace2FAWithMethod === '2fa_totp') {
  await this.twoFactorAuthService.disable(targetUserId);
  const totpSetup = await this.twoFactorAuthService.setupTOTP(targetUserId);
  // Send setup instructions to user via email
  auditMetadata.twoFactorReplaced = '2fa_totp';
}
```

### 4. Audit Logging

**All password updates are logged** with:
- **Action**: `PASSWORD_CHANGED`
- **Severity**:
  - `INFO` - User changed own password
  - `WARNING` - SUPER_ADMIN changed user password
  - `CRITICAL` - Password changed during security incident
- **Actor**: User who performed the update
- **Target**: User whose password was updated
- **Metadata**:
  ```json
  {
    "logoutAllDevices": true,
    "devicesLoggedOut": 3,
    "reset2FA": false,
    "replace2FAWithMethod": "2fa_totp",
    "reason": "User forgot password",
    "ipAddress": "192.168.1.1",
    "userAgent": "demiAdmin/iOS"
  }
  ```

**Audit Log Access**:
- **SUPER_ADMIN**: Can view ALL audit logs
- **Other roles**: Cannot access audit logs

---

## Database Schema Updates

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- PASSWORD_CHANGED, TWO_FA_ENABLED, etc.
  severity VARCHAR(20) NOT NULL, -- INFO, WARNING, ERROR, CRITICAL
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(20) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  target_user_name VARCHAR(255),
  target_user_role VARCHAR(20),
  target_resource_type VARCHAR(50), -- 'user', 'company', 'session', '2fa', 'password'
  target_resource_id VARCHAR(255),
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_action (action),
  INDEX idx_actor (actor_id),
  INDEX idx_target (target_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_severity (severity)
);
```

### Example Audit Log Entry

```json
{
  "id": "audit-uuid-123",
  "action": "PASSWORD_CHANGED",
  "severity": "WARNING",
  "actorId": "super-admin-uuid",
  "actorRole": "super_admin",
  "actorName": "System Admin",
  "targetUserId": "user-uuid-456",
  "targetUserName": "John Distributor",
  "targetUserRole": "distributor",
  "targetResourceType": "password",
  "targetResourceId": "user-uuid-456",
  "description": "SUPER_ADMIN updated user password with advanced security options",
  "metadata": {
    "logoutAllDevices": true,
    "devicesLoggedOut": 3,
    "reset2FA": false,
    "replace2FAWithMethod": "2fa_totp",
    "reason": "User reported account compromise",
    "emailSent": true,
    "sessionsBefore": 3,
    "sessionsAfter": 0
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "demiAdmin/iOS 1.0.0",
  "createdAt": "2026-01-24T10:30:00Z"
}
```

---

## Email Notifications

### Template 1: Password Changed by SUPER_ADMIN

**Subject**: Your Demigod Password Was Updated

```
Hi {userName},

Your password was updated by a system administrator.

Details:
- Updated by: {adminName}
- Date/Time: {timestamp}
- IP Address: {ipAddress}
- Reason: {reason}

Actions Taken:
{if logoutAllDevices}
✅ All devices were logged out ({devicesCount} sessions terminated)
{endif}

{if reset2FA}
⚠️ Two-factor authentication was disabled
{endif}

{if replace2FAWithMethod}
🔒 Two-factor authentication method was changed to {method}
{if method === 'totp'}
Please check your email for TOTP setup instructions.
{endif}
{endif}

If you did not request this change, please contact support immediately:
[Report Unauthorized Access]

- Demigod Security Team
```

### Template 2: User Changed Own Password

**Subject**: Your Demigod Password Was Changed

```
Hi {userName},

Your password was changed successfully.

Details:
- Date/Time: {timestamp}
- IP Address: {ipAddress}
- Device: {deviceName}

{if logoutAllDevices}
All other devices were logged out for security.
{endif}

{if reset2FA}
Two-factor authentication was disabled.
{endif}

If you did not make this change, please contact support immediately:
[Report Unauthorized Access]

- Demigod Security Team
```

---

## Frontend Implementation

### Using the UpdatePasswordDialog Component

```tsx
import {UpdatePasswordDialog} from '../components/UpdatePasswordDialog';
import {useAuthStore} from '../store/authStore';

const UserProfileScreen = () => {
  const {user} = useAuthStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <View>
      <FilledButton
        label="Change Password"
        onPress={() => setShowPasswordDialog(true)}
      />

      <UpdatePasswordDialog
        visible={showPasswordDialog}
        onDismiss={() => setShowPasswordDialog(false)}
        targetUserId={user.id}
        targetUserName={user.name}
        targetUserRole={user.role}
        isOwnPassword={true}
      />
    </View>
  );
};
```

### SUPER_ADMIN Updating Another User's Password

```tsx
const UserDetailScreen = ({userId, userName, userRole}) => {
  const {user} = useAuthStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Only show button for SUPER_ADMIN
  const canUpdatePassword = user.role === 'super_admin' && userRole !== 'super_admin';

  return (
    <View>
      {canUpdatePassword && (
        <FilledButton
          label="Reset Password"
          onPress={() => setShowPasswordDialog(true)}
        />
      )}

      <UpdatePasswordDialog
        visible={showPasswordDialog}
        onDismiss={() => setShowPasswordDialog(false)}
        targetUserId={userId}
        targetUserName={userName}
        targetUserRole={userRole}
        isOwnPassword={false}
      />
    </View>
  );
};
```

---

## Summary

✅ **SUPER_ADMIN can update passwords** for SUPER, DISTRIBUTOR, RETAILER (but NOT other SUPER_ADMINs)
✅ **Users can update own password** (requires current password)
✅ **Logout all devices** option (invalidates all sessions)
✅ **Reset or replace 2FA** option (disable or change method)
✅ **Comprehensive audit logging** (all actions recorded)
✅ **SUPER_ADMIN-only access** to audit logs
✅ **Email notifications** sent to affected users
✅ **Permission-based UI** (shows/hides features based on role)
✅ **Security measures** (password complexity, SUPER_ADMIN restrictions)

This system provides a secure, auditable way for administrators to manage user passwords while maintaining strict access controls and comprehensive logging.
