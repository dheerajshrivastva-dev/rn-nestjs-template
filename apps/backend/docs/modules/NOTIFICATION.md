# Notification Module

Email, SMS, and push notifications via Bull queues + Redis. Three independent queues: `email`, `sms`, `push`.

## Architecture

```
NotificationService.send*()
  └─→ Bull queue  (email | sms | push)
        └─→ Processor picks up job
              └─→ Provider sends (SendGrid / MSG91 / Twilio / FCM / mock)
```

Each queue entry is persisted as `EmailQueue` / `SmsQueue` / `PushQueue` entity with status tracking (`pending → sending → sent | failed`).

## Email Providers

| `EMAIL_PROVIDER` | Class | Notes |
|---|---|---|
| `smtp` (default) | `SmtpEmailProvider` | Works with Mailpit in dev |
| `sendgrid` | `SendGridEmailProvider` | Requires `SENDGRID_API_KEY` |
| `msg91` | `Msg91EmailProvider` | Requires `MSG91_AUTH_KEY`, `MSG91_EMAIL_DOMAIN` |

## SMS Providers

| `SMS_PROVIDER` | Class | Notes |
|---|---|---|
| `msg91` (default) | `Msg91SmsProvider` | Requires `MSG91_SENDER_ID`, `MSG91_OTP_TEMPLATE_ID` |
| `twilio` | `TwilioSmsProvider` | Requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |

## Push Providers

| `PUSH_PROVIDER` | Notes |
|---|---|
| `fcm` | Requires `FCM_SERVICE_ACCOUNT_JSON` or `FCM_SERVICE_ACCOUNT_PATH` |
| Mock fallback | Logs push to console; active when provider not configured |

## Sending a Notification

Inject `NotificationService` and call a typed helper:

```typescript
// Email
await notificationService.sendPasswordResetEmail(userId, email, name, otp);
await notificationService.send2FAEmail(userId, email, name, otp);
await notificationService.sendWelcomeEmail(userId, email, name);

// SMS
await notificationService.sendOTPSMS(phone, otp, userId);

// Push
await notificationService.sendDeviceAlertPush(userId, title, body, data);
```

For custom emails use `queueEmail(dto)` directly.

## Notification Inbox Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications` | Paginated inbox (page, pageSize) |
| `GET` | `/notifications/:id` | Single notification |
| `PATCH` | `/notifications/:id/read` | Mark as read |
| `PUT` | `/notifications/read-all` | Mark all as read |
| `DELETE` | `/notifications/:id` | Delete |
| `DELETE` | `/notifications` | Delete all |
| `GET` | `/notifications/unread-count` | Unread badge count |

## Push Device Registration

| Method | Path | Description |
|---|---|---|
| `POST` | `/notifications/device/register` | Register FCM/APNs token |
| `DELETE` | `/notifications/device/unregister` | Unregister token |
| `POST` | `/notifications/test-push` | Send a test push (dev) |

## User Preferences

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications/preferences` | Current user preferences |
| `PATCH` | `/notifications/preferences` | Update preferences |
| `GET` | `/notifications/settings` | Per-channel settings |
| `PATCH` | `/notifications/settings` | Update settings |

## Cleanup Scheduler

`NotificationCleanupService` runs a cron to purge old delivered/failed notifications. Configurable retention period.

## Adding a New Email Template

1. Add a render method to `src/modules/notification/utils/email-template.util.ts`
2. Add a typed helper to `NotificationService` that calls `queueEmail()` with the rendered HTML
3. Add the new `EmailType` value to the enum in `src/common/enums/index.ts`
