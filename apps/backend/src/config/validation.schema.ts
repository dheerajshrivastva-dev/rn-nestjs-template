import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('Forge App'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNC: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_MIGRATIONS_RUN: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  FRONTEND_URL: Joi.string().optional(),

  // Encryption
  AES_SECRET_KEY: Joi.string().min(32).required(),

  // OTP
  OTP_VALIDITY_MINUTES: Joi.number().default(10),
  OTP_MAX_ATTEMPTS: Joi.number().default(5),
  OTP_RATE_LIMIT_COUNT: Joi.number().default(5),
  OTP_RATE_LIMIT_WINDOW_MINUTES: Joi.number().default(10),
  OTP_COOLDOWN_MINUTES: Joi.number().default(15),

  // Notification provider selection
  EMAIL_PROVIDER: Joi.string().valid('sendgrid', 'smtp', 'msg91').default('smtp'),
  EMAIL_PROVIDER_FALLBACK: Joi.string().valid('sendgrid', 'smtp', 'msg91').optional(),
  SMS_PROVIDER: Joi.string().valid('msg91', 'twilio', 'sns').default('msg91'),
  SMS_PROVIDER_FALLBACK: Joi.string().valid('msg91', 'twilio', 'sns').optional(),
  PUSH_PROVIDER: Joi.string().valid('fcm', 'apns', 'onesignal').default('fcm'),

  // Default email sender
  EMAIL_FROM: Joi.string().email().optional(),
  EMAIL_FROM_NAME: Joi.string().optional(),

  // SendGrid
  SENDGRID_API_KEY: Joi.string().optional(),

  // SMTP
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(465),
  SMTP_SECURE: Joi.boolean().default(true),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM_EMAIL: Joi.string().email().optional(),
  SMTP_FROM_NAME: Joi.string().optional(),

  // MSG91 (Email + SMS)
  MSG91_AUTH_KEY: Joi.string().optional(),
  MSG91_EMAIL_DOMAIN: Joi.string().optional(),
  MSG91_SENDER_ID: Joi.string().optional(),
  MSG91_DLT_ENTITY_ID: Joi.string().optional(),
  MSG91_OTP_TEMPLATE_ID: Joi.string().optional(),

  // SMS — Twilio
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_FROM_NUMBER: Joi.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().optional(),

  // FCM (Firebase Admin SDK — used by FCMPushProvider to send push notifications)
  // Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
  // Provide EITHER a file path OR the full JSON string (prefer JSON for containers/env vars)
  FCM_SERVICE_ACCOUNT_PATH: Joi.string().optional(),
  FCM_SERVICE_ACCOUNT_JSON: Joi.string().optional(),
  // Legacy key — not used by FCMPushProvider, kept for schema completeness
  FCM_SERVER_KEY: Joi.string().optional(),

  // Device Authentication
  DEVICE_SIGNATURE_EXPIRY_MINUTES: Joi.number().default(5),
  DEVICE_MAX_FAILED_AUTH_ATTEMPTS: Joi.number().default(10),
  DEVICE_RATE_LIMIT_PER_MINUTE: Joi.number().default(100),

  // QR Code
  UNIQUE_CODE_LENGTH: Joi.number().default(256),
  UNIQUE_CODE_EXPIRY_DAYS: Joi.number().default(7),

  // App Release APK storage path (absolute path on server, served as static /releases/*)
  APP_RELEASES_PATH: Joi.string().optional(),

  // File Upload
  MAX_FILE_SIZE_MB: Joi.number().default(10),
  ALLOWED_FILE_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/jpg,application/pdf',
  ),

  // Notification Limits
  EMAIL_DAILY_LIMIT_PER_USER: Joi.number().default(1000),
  SMS_DAILY_LIMIT_PER_USER: Joi.number().default(50),
  EMAIL_MAX_RETRY_ATTEMPTS: Joi.number().default(3),
  SMS_MAX_RETRY_ATTEMPTS: Joi.number().default(3),
  PUSH_MAX_RETRY_ATTEMPTS: Joi.number().default(3),

  // CORS
  CORS_ORIGINS: Joi.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Auth session limits
  AUTH_MAX_SESSIONS: Joi.number().default(10),

  // Login rate-limit windows (seconds)
  AUTH_RL_SHORT_WINDOW_SECS: Joi.number().default(15 * 60),   // 15 min — 3-failure window
  AUTH_RL_MID_WINDOW_SECS: Joi.number().default(60 * 60),     // 1 h   — 5-failure window
  AUTH_RL_LONG_WINDOW_SECS: Joi.number().default(24 * 60 * 60), // 24 h — 10-failure window
  AUTH_RL_IP_WINDOW_SECS: Joi.number().default(5 * 60),       // 5 min — IP window

  // Login rate-limit failure thresholds
  AUTH_RL_SHORT_THRESHOLD: Joi.number().default(3),
  AUTH_RL_MID_THRESHOLD: Joi.number().default(5),
  AUTH_RL_LONG_THRESHOLD: Joi.number().default(10),
  AUTH_RL_IP_THRESHOLD: Joi.number().default(10),

  // Biometric
  BIOMETRIC_EXPIRY_DAYS: Joi.number().default(90),
  BIOMETRIC_CHALLENGE_TTL_SECS: Joi.number().default(120),

  // Swagger — comma-separated IP prefixes allowed to access /api/docs (e.g. Tailscale "100.")
  SWAGGER_ALLOWED_IPS: Joi.string().optional(),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
});
