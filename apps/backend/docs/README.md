# Backend Docs

## Modules

| Module | Purpose | Doc |
|---|---|---|
| Auth | Login, JWT, refresh, Google OAuth, sessions | [AUTH.md](modules/AUTH.md) |
| 2FA | Two-factor auth, biometric/PIN login | [2FA.md](modules/2FA.md) |
| OTP | One-time passwords (verify, resend) | [OTP.md](modules/OTP.md) |
| User | User CRUD, password, email verification | [USER.md](modules/USER.md) |
| System Tokens | Long-lived API keys for integrations | [SYSTEM_TOKENS.md](modules/SYSTEM_TOKENS.md) |
| Notification | Email/SMS/Push via Bull queues | [NOTIFICATION.md](modules/NOTIFICATION.md) |
| Upload | File upload, Cloudinary provider | [UPLOAD.md](modules/UPLOAD.md) |
| Audit | Audit logs, system health | [AUDIT.md](modules/AUDIT.md) |
| WebSocket | Real-time push to clients | [WEBSOCKET.md](modules/WEBSOCKET.md) |

## Common

| Topic | Doc |
|---|---|
| Guards | [GUARDS.md](common/GUARDS.md) |
| Decorators | [DECORATORS.md](common/DECORATORS.md) |
| RBAC | [RBAC.md](common/RBAC.md) |

## Setup & Deployment

| Topic | Doc |
|---|---|
| Docker dev stack | [setup/DOCKER.md](setup/DOCKER.md) |
| Environment variables | [setup/ENV_VARS.md](setup/ENV_VARS.md) |
| Migrations | [setup/MIGRATIONS.md](setup/MIGRATIONS.md) |
| SSH access | [deployment/SSH.md](deployment/SSH.md) |
| VPS checklist | [deployment/VPS_CHECKLIST.md](deployment/VPS_CHECKLIST.md) |
