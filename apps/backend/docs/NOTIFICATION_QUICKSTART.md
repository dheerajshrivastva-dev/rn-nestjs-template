# Notification System - Quick Start Guide

## ✅ Phase 4 Complete - Plug & Play Architecture

**You can now swap notification providers anytime by changing a single environment variable!**

---

## 🚀 Quick Setup

### 1. Install Dependencies (Already Done)

```bash
pnpm add axios @sendgrid/mail twilio firebase-admin --filter demi-backend
```

### 2. Run Database Migration

```bash
pnpm --filter demi-backend migration:run
```

This creates:
- `sms_queue` table
- `push_queue` table

### 3. Configure Providers (.env)

```bash
# Choose your providers
EMAIL_PROVIDER=msg91              # or 'sendgrid' or 'smtp'
EMAIL_PROVIDER_FALLBACK=sendgrid  # optional fallback
SMS_PROVIDER=msg91                # or 'twilio'
PUSH_PROVIDER=fcm

# MSG91 credentials
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=DEMIGD

# SendGrid (optional fallback)
SENDGRID_API_KEY=SG.your_key_here

# FCM for push notifications
FCM_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

---

## 📝 Usage Examples

### Send Email

```typescript
await this.notificationService.sendWelcomeEmail(
  userId,
  'user',
  'user@example.com',
  'John Doe',
  'RETAILER',
);
```

### Send SMS

```typescript
await this.notificationService.sendOTPSMS(
  userId,
  'user',
  '+919876543210',
  'John Doe',
  '123456',
  10, // expires in 10 min
);
```

### Send Push Notification

```typescript
await this.notificationService.sendDeviceAlertPush(
  clientId,
  'client',
  ['fcm_token_1', 'fcm_token_2'],
  'Device Locked',
  'Your device has been locked',
  { action: 'DEVICE_LOCKED' },
);
```

---

## 🔌 Swap Providers (Zero Code Changes!)

### Change Email Provider

```bash
# Before
EMAIL_PROVIDER=msg91

# After (just change env var!)
EMAIL_PROVIDER=sendgrid
```

**Restart app** → Now using SendGrid!

### Add Fallback

```bash
# If MSG91 fails, automatically try SendGrid
EMAIL_PROVIDER=msg91
EMAIL_PROVIDER_FALLBACK=sendgrid
```

---

## 📊 Available Providers

### Email
- ✅ MSG91 (India-focused, cost-effective)
- ✅ SendGrid (Global, high deliverability)
- ⚠️ SMTP (Generic, already existed)

### SMS
- ✅ MSG91 (India DLT, OTP API)
- ✅ Twilio (Global coverage)

### Push
- ✅ FCM (Android + iOS)

---

## 🔍 Monitor Queue Status

```bash
# View Bull queues (if Bull Board is installed)
http://localhost:3000/admin/queues
```

See:
- Email queue status
- SMS queue status
- Push queue status
- Failed jobs
- Retry attempts

---

## 🛠️ Adding a New Provider

1. **Create provider class** implementing `IEmailProvider` or `ISMSProvider`
2. **Register in factory** (`notification-provider.factory.ts`)
3. **Add to module** (`notification.module.ts`)
4. **Set in .env**: `EMAIL_PROVIDER=your-new-provider`

**Done!** No other code changes needed.

---

## 📖 Full Documentation

- **Complete Guide:** [PHASE_4_NOTIFICATIONS.md](./PHASE_4_NOTIFICATIONS.md)
- **Wire Triggers:** See examples in Phase 4 docs
- **Environment Vars:** [.env.example](./.env.example)

---

## ✨ Key Features

✅ **SOLID Architecture** - Plug & Play providers
✅ **Automatic Failover** - Primary → Fallback
✅ **Queue Processing** - Bull + Redis
✅ **Retry Logic** - Auto retry with exponential backoff
✅ **Multi-Channel** - Email + SMS + Push
✅ **Production Ready** - Error handling, logging, monitoring

**Ready to use!** 🎉
