# React Native + NestJS Monorepo Template

A production-ready template for building mobile apps with a NestJS backend. Extracted and generalized from a live production system.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11, TypeORM, PostgreSQL 16 |
| Queue | Bull + Redis |
| Mobile | React Native 0.82, TypeScript |
| State | Zustand + TanStack Query |
| UI | Material Design 3 (`@forge/ui`) |
| Navigation | React Navigation v7 (native stack + drawer) |
| Auth | JWT + Refresh tokens + Biometric + 2FA |
| Notifications | FCM (push), SendGrid/SMTP (email), Twilio/MSG91 (SMS) |
| Uploads | Cloudinary (swappable via provider interface) |
| Real-time | Socket.io (WebSocket gateway) |

## Monorepo Structure

```
rn-nestjs-template/
├── apps/
│   ├── backend/          # NestJS API server
│   └── app/              # React Native mobile app
├── packages/
│   └── ui/               # @forge/ui — shared Material Design 3 component library
├── pnpm-workspace.yaml
└── package.json
```

## What's Included

### Backend (`apps/backend`)

**Infrastructure modules** (ready to use, no changes needed):
- `auth` — JWT login, OTP 2FA, biometric challenge/response, Google OAuth, session management
- `user` — Clean User entity (ADMIN/MANAGER/USER roles), profile CRUD
- `otp` — OTP generation, validation, rate limiting, email/SMS delivery
- `notification` — Multi-provider: FCM push, SendGrid/SMTP email, Twilio/MSG91 SMS, Bull queues
- `upload` — File upload with Cloudinary (swap to S3/MinIO via provider interface)
- `audit` — Decorator-based audit logging (`@Audit(AuditAction.CREATE)`)
- `redis` — Shared ioredis client injected as `REDIS_CLIENT` token
- `ws` — Socket.io WebSocket gateway for real-time events

**Common utilities** (in `src/common/`):
- Guards: `JwtAuthGuard` (global), `RolesGuard`, `TempTokenGuard`, `GoogleAuthGuard`
- Decorators: `@Public()`, `@Roles(UserRole.ADMIN)`, `@CurrentUser()`, `@Audit()`
- Filters: HTTP exception filter with consistent error format

### Mobile App (`apps/app`)

**Auth flow** (complete, end-to-end):
- Login → OTP → JWT → biometric setup → drawer navigation
- Zustand store (`authStore`) with token persistence, session expiry, 2FA state
- Axios client with auto token refresh on 401

**Screens included**:
- Auth: Login, OTP, ForgotPassword, ResetPassword, BiometricLogin, PinSetup
- Account: Profile, EditProfile, ChangePassword, 2FA, Sessions
- Notifications: list + detail
- Settings
- Dashboard (placeholder — add your screens)

**Services**:
- `NotificationService` — FCM token registration, foreground handling, deep link intent queue
- `SocketService` — Socket.io client with auto-reconnect

### UI Library (`packages/ui`)

40+ Material Design 3 components. Import everything from `@forge/ui`:

```tsx
import { FilledButton, ElevatedCard, TextField, useTheme, SafeScreen } from '@forge/ui';
```

Theme keys: `'admin-light'`, `'admin-dark'`, `'manager-light'`, `'manager-dark'`, `'user-light'`, `'user-dark'`

## Quick Start

### Prerequisites
- Node >= 20
- pnpm >= 10
- Docker (for dev services)
- Android Studio / Xcode (for mobile)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start dev services (PostgreSQL, Redis, Mailpit, MinIO, etc.)

```bash
pnpm --filter forge-backend dev:db:up
```

Services available at:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6380`
- Mailpit (email UI): `http://localhost:8025`
- Adminer (DB UI): `http://localhost:8080`
- Redis Commander: `http://localhost:8081`
- Jaeger (tracing): `http://localhost:16686`

### 3. Configure backend environment

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — at minimum set:
# JWT_SECRET, JWT_REFRESH_SECRET, AES_SECRET_KEY, GOOGLE_CLIENT_*
```

### 4. Run migrations

```bash
pnpm --filter forge-backend migration:run
```

### 5. Start backend

```bash
pnpm dev:service
```

Swagger docs: `http://localhost:3000/api/docs`

### 6. Start mobile app

```bash
pnpm dev:app          # Metro bundler
pnpm android          # Run on Android
```

## Adding a New Domain Module (Backend)

```bash
# 1. Create the module
pnpm --filter forge-backend nest g module modules/project
pnpm --filter forge-backend nest g service modules/project
pnpm --filter forge-backend nest g controller modules/project

# 2. Add entity, DTO files
# 3. Generate migration
pnpm --filter forge-backend migration:generate src/database/migrations/AddProject

# 4. Register in app.module.ts
```

## Adding a New Screen (Mobile)

```tsx
// 1. Add to src/navigation/screens.ts
export const ProjectScreens = {
  List: 'project/list',
  Detail: 'project/detail',
  Create: 'project/create',
} as const;

// 2. Add AllScreens spread
export const AllScreens = {
  ...ProjectScreens,
  // ...existing
};

// 3. Create screen component in src/screens/projects/
// 4. Add stack in src/navigation/stacks/ProjectStack.tsx
// 5. Register stack in src/navigation/private/PrivateRoot.tsx
```

## Renaming for Your Project

When starting a new project from this template, run:

```bash
# Replace 'forge' with your project name across all files
find . -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yaml" \) \
  | xargs sed -i 's/forge/myapp/g; s/Forge/MyApp/g'
```

Then update:
- `apps/app/app.json` — `displayName`
- `apps/app/android/app/src/main/res/values/strings.xml` — app name
- `packages/ui/src/theme/colors.ts` — brand colors

## Notification Provider Config

Set in `apps/backend/.env`:

```env
EMAIL_PROVIDER=smtp          # smtp | sendgrid | msg91
SMS_PROVIDER=msg91           # msg91 | twilio
PUSH_PROVIDER=fcm            # fcm (only option currently)

# FCM — add your Firebase service account JSON
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Tech Decisions

| Decision | Rationale |
|---|---|
| pnpm workspaces | Shared `@forge/ui` without publishing to npm |
| Bull queues for notifications | Retries, rate limiting, multi-provider fallback without blocking requests |
| JWT + refresh tokens in sessions table | Revocable sessions, multi-device support, replay attack prevention |
| Biometric via challenge/response | Private key never leaves device; server only verifies signature |
| WatermelonDB (not in template, add per project) | Best offline-first option for React Native field apps |
