# Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

## App

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | | `development` | `development` \| `production` \| `test` |
| `PORT` | | `3000` | HTTP server port |
| `APP_NAME` | | `Forge App` | Used in emails and logs |
| `CORS_ORIGINS` | | `*` | Comma-separated allowed origins |

## Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ | — | PostgreSQL host |
| `DB_PORT` | | `5432` | PostgreSQL port |
| `DB_USERNAME` | ✅ | — | DB user |
| `DB_PASSWORD` | ✅ | — | DB password |
| `DB_DATABASE` | ✅ | — | Database name |
| `DB_SYNC` | | `false` | Auto-sync schema (dev only, never prod) |
| `DB_LOGGING` | | `false` | Log SQL queries |
| `DB_MIGRATIONS_RUN` | | `false` | Auto-run migrations on start |

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | ✅ | — | Redis host |
| `REDIS_PORT` | | `6379` | Redis port |
| `REDIS_PASSWORD` | | `''` | Redis password |
| `REDIS_DB` | | `0` | Redis database index |

## JWT

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | ✅ | — | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token signing secret |
| `JWT_ACCESS_EXPIRATION` | | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | | `7d` | Refresh token TTL |
| `AES_SECRET_KEY` | ✅ | — | Min 32 chars, used for TOTP secret encryption |

## Google OAuth

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ | — | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | OAuth client secret |
| `GOOGLE_CALLBACK_URL` | ✅ | — | e.g. `http://localhost:3000/auth/google/callback` |
| `FRONTEND_URL` | | — | Redirect target after OAuth success |

## Email

| Variable | Required | Default | Description |
|---|---|---|---|
| `EMAIL_PROVIDER` | | `smtp` | `sendgrid` \| `smtp` \| `msg91` |
| `EMAIL_FROM` | | — | Default sender address |
| `EMAIL_FROM_NAME` | | — | Default sender display name |
| `SENDGRID_API_KEY` | | — | Required if `EMAIL_PROVIDER=sendgrid` |
| `SMTP_HOST` | | — | Required if `EMAIL_PROVIDER=smtp` |
| `SMTP_PORT` | | `465` | |
| `SMTP_SECURE` | | `true` | Use TLS |
| `SMTP_USER` | | — | SMTP username |
| `SMTP_PASSWORD` | | — | SMTP password |
| `MSG91_AUTH_KEY` | | — | Required if `EMAIL_PROVIDER=msg91` |
| `MSG91_EMAIL_DOMAIN` | | — | MSG91 domain |

## SMS

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMS_PROVIDER` | | `msg91` | `msg91` \| `twilio` \| `sns` |
| `MSG91_SENDER_ID` | | — | 6-char sender ID |
| `MSG91_DLT_ENTITY_ID` | | — | DLT entity ID (India) |
| `MSG91_OTP_TEMPLATE_ID` | | — | OTP template ID |
| `TWILIO_ACCOUNT_SID` | | — | Required if `SMS_PROVIDER=twilio` |
| `TWILIO_AUTH_TOKEN` | | — | |
| `TWILIO_FROM_NUMBER` | | — | |

## Push Notifications

| Variable | Required | Default | Description |
|---|---|---|---|
| `PUSH_PROVIDER` | | `fcm` | `fcm` \| `apns` \| `onesignal` |
| `FCM_SERVICE_ACCOUNT_JSON` | | — | Full Firebase service account JSON (for containers) |
| `FCM_SERVICE_ACCOUNT_PATH` | | — | Path to service account JSON file |

## Upload (Cloudinary)

| Variable | Required | Default | Description |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | | — | |
| `CLOUDINARY_API_SECRET` | | — | |
| `MAX_FILE_SIZE_MB` | | `10` | Max upload size |

## OTP

| Variable | Required | Default | Description |
|---|---|---|---|
| `OTP_VALIDITY_MINUTES` | | `10` | OTP expiry |
| `OTP_MAX_ATTEMPTS` | | `5` | Max verify attempts before invalidation |
| `OTP_RATE_LIMIT_COUNT` | | `5` | Max send requests per window |
| `OTP_RATE_LIMIT_WINDOW_MINUTES` | | `10` | Rate limit window |
| `OTP_COOLDOWN_MINUTES` | | `15` | Cooldown after hitting rate limit |

## Auth Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `AUTH_MAX_SESSIONS` | `10` | Max concurrent sessions per user |
| `AUTH_RL_SHORT_THRESHOLD` | `3` | Failures before 15-min lock |
| `AUTH_RL_MID_THRESHOLD` | `5` | Failures before 1-hour lock |
| `AUTH_RL_LONG_THRESHOLD` | `10` | Failures before account suspension |
| `BIOMETRIC_EXPIRY_DAYS` | `90` | Days before biometric key expires |
| `BIOMETRIC_CHALLENGE_TTL_SECS` | `120` | Challenge nonce validity window |

## Observability

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | `error` \| `warn` \| `info` \| `debug` |
| `SWAGGER_ALLOWED_IPS` | — | Comma-separated IP prefixes for Swagger access |
