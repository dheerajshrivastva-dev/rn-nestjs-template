# User Module

User profile, settings, and session management.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | JWT | Current user profile |
| `PATCH` | `/users/me` | JWT | Update current user profile |
| `GET` | `/users/:id` | JWT | Get user by ID |

Session and biometric endpoints are on `/auth/*` — see [AUTH.md](AUTH.md).

## `User` Entity Fields

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `firstName` | varchar(100) | Required |
| `lastName` | varchar(100) | Optional |
| `email` | varchar(255) | Unique |
| `phone` | varchar(20) | Optional |
| `password` | varchar(255) | bcrypt-hashed, excluded from responses |
| `role` | enum | `admin` \| `manager` \| `user` |
| `status` | enum | `active` \| `inactive` \| `suspended` |
| `avatarUrl` | varchar(500) | Cloudinary URL |
| `emailVerified` | boolean | |
| `phoneVerified` | boolean | |
| `is2FAEnabled` | boolean | |
| `notificationSettings` | jsonb | Per-user channel preferences |
| `lastLoginAt` | timestamp | |

## Roles

| `UserRole` | Value | Notes |
|---|---|---|
| `ADMIN` | `admin` | Full access, bypasses RolesGuard checks |
| `MANAGER` | `manager` | Elevated access |
| `USER` | `user` | Standard access |

## User Status

| `UserStatus` | Value | Behavior |
|---|---|---|
| `ACTIVE` | `active` | Normal login |
| `INACTIVE` | `inactive` | Cannot log in |
| `SUSPENDED` | `suspended` | Cannot log in, triggers lockout flow |

## Creating Users

There is no public `/auth/register` endpoint. Users are created programmatically or via admin flows. Extend as needed for your app's user creation requirements.

## Email Verification

Flow: after user creation, send an OTP via `OtpType.EMAIL_VERIFICATION`. User verifies → set `emailVerified = true`. The OTP service handles generation and expiry.

## Notification Settings

`notificationSettings` is a JSONB column storing per-user channel preferences (email, SMS, push). Default values are in `src/modules/notification/user-settings.ts`. Access via `user.effectiveNotificationSettings` (returns defaults if null).
