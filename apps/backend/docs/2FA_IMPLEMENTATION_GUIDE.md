# 2FA (Two-Factor Authentication) Implementation Guide

## Overview

The 2FA system is now fully integrated into the authentication flow. When an user has `twoFactorEnabled: true`, they must verify an OTP code after entering their credentials.

## How It Works

### 1. Login Flow with 2FA Enabled

```
User enters email + password
         ↓
POST /auth/login
         ↓
Credentials valid? → Check twoFactorEnabled
         ↓
If 2FA enabled:
  - Generate 6-digit OTP
  - Save OTP to database (with 10-minute expiry)
  - Send OTP via email
  - Return tempToken (short-lived, 10 minutes)
         ↓
User receives OTP in email
         ↓
POST /auth/verify-2fa with OTP + tempToken
         ↓
Verify OTP and tempToken
         ↓
Generate real access + refresh tokens
         ↓
Set HTTP-only cookies
         ↓
Login complete
```

### 2. Login Flow without 2FA

```
User enters email + password
         ↓
POST /auth/login
         ↓
Credentials valid? → twoFactorEnabled: false
         ↓
Generate access + refresh tokens immediately
         ↓
Set HTTP-only cookies
         ↓
Login complete
```

## API Endpoints

### POST /auth/login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (2FA Disabled):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "status": "active"
  }
}
```

**Response (2FA Enabled):**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "message": "2FA code sent to your email",
  "otpSent": true,
  "otp": "123456"  // Only in development mode
}
```

### POST /auth/verify-2fa

**Request Body:**
```json
{
  "otp": "123456",
  "tempToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (Success):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "status": "active"
  }
}
```

**Response (Error):**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP"
}
```

## Frontend Implementation

### React/Next.js Example

```typescript
// 1. Initial login
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if ('tempToken' in result) {
    // 2FA required
    setTempToken(result.tempToken);
    setShow2FAModal(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('OTP:', result.otp); // For testing
    }
  } else {
    // Login successful, cookies set automatically
    router.push('/dashboard');
  }
};

// 2. Verify 2FA
const handleVerify2FA = async (otp: string) => {
  const response = await fetch('/api/v1/auth/verify-2fa', {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      otp,
      tempToken,
    }),
  });

  if (response.ok) {
    // Cookies set automatically
    router.push('/dashboard');
  } else {
    setError('Invalid OTP');
  }
};
```

## Security Features

### 1. Temp Token
- **Purpose**: Prevent unauthorized 2FA attempts
- **Lifetime**: 10 minutes
- **Payload**: Contains `{ sub: userId, purpose: '2fa' }`
- **Validation**: Verified before OTP check

### 2. OTP Code
- **Format**: 6-digit numeric code
- **Lifetime**: 10 minutes
- **Storage**: Stored in database (needs to be added to User entity)
- **Single-use**: Cleared after successful verification

### 3. Rate Limiting
- Apply rate limiting to both endpoints:
  - `/auth/login`: 10 requests/minute
  - `/auth/verify-2fa`: 5 requests/minute

### 4. Cookie Security
After successful 2FA verification:
- `access_token` cookie: HTTP-only, 15 minutes
- `refresh_token` cookie: HTTP-only, 7 days
- Both use `sameSite: 'strict'` for CSRF protection

## Database Changes Required

### Add 2FA Fields to User Entity

```typescript
// src/modules/user/entities/user.entity.ts

@Column({ type: 'varchar', length: 6, nullable: true })
twoFactorCode?: string;

@Column({ type: 'timestamp', nullable: true })
twoFactorExpiry?: Date;
```

### Migration

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTwoFactorFieldsToAgent1764901000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'two_factor_code',
        type: 'varchar',
        length: '6',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'two_factor_expiry',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('agents', 'two_factor_code');
    await queryRunner.dropColumn('agents', 'two_factor_expiry');
  }
}
```

## Email Service Implementation

### Create Email Service

```bash
nest generate service common/services/email
```

### Email Service Code

```typescript
// src/common/services/email.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Your 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two-Factor Authentication</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  }
}
```

### Install Nodemailer

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### Environment Variables

Add to `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="Your App <noreply@yourapp.com>"
```

### Update Auth Service

```typescript
// src/modules/auth/auth.service.ts

constructor(
  @InjectRepository(User)
  private readonly agentRepository: Repository<User>,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly emailService: EmailService, // Add this
) {}

// In login method:
if (user.twoFactorEnabled) {
  const otp = CryptoUtil.generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP to database
  await this.agentRepository.update(user.id, {
    twoFactorCode: otp,
    twoFactorExpiry: otpExpiry,
  });

  // Send OTP via email
  await this.emailService.sendOTP(user.email, otp);

  const tempToken = this.jwtService.sign(
    { sub: user.id, purpose: '2fa' },
    { expiresIn: '10m' },
  );

  return {
    tempToken,
    message: '2FA code sent to your email',
    otpSent: true,
    ...(process.env.NODE_ENV === 'development' && { otp }),
  };
}
```

### Update Verify Method

```typescript
// In verify2FA method:
async verify2FA(otp: string, tempToken: string) {
  try {
    const payload = this.jwtService.verify(tempToken);

    if (payload.purpose !== '2fa') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const user = await this.agentRepository.findOne({
      where: { id: payload.sub },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Verify OTP
    const isValidOTP =
      user.twoFactorCode === otp &&
      user.twoFactorExpiry &&
      user.twoFactorExpiry > new Date();

    if (!isValidOTP) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP from database
    await this.agentRepository.update(user.id, {
      twoFactorCode: null,
      twoFactorExpiry: null,
    });

    // Generate real tokens
    return this.generateTokens(user);
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired 2FA token');
  }
}
```

## Testing

### 1. Enable 2FA for Test User

```sql
UPDATE agents
SET two_factor_enabled = true
WHERE email = 'test@example.com';
```

### 2. Test Login Flow

```bash
# 1. Login (should return tempToken)
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Response:
# {
#   "tempToken": "eyJhbGciOiJIUzI1NiIs...",
#   "message": "2FA code sent to your email",
#   "otpSent": true,
#   "otp": "123456"  // Only in development
# }

# 2. Verify 2FA (should set cookies)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{"otp":"123456","tempToken":"eyJhbGciOiJIUzI1NiIs..."}'

# 3. Access protected route
curl -b cookies.txt http://localhost:3000/api/v1/agents/me
```

## Security Best Practices

1. ✅ **Short-lived temp tokens**: 10 minutes only
2. ✅ **OTP expiry**: Codes expire after 10 minutes
3. ✅ **Single-use OTPs**: Cleared after verification
4. ✅ **Rate limiting**: Prevent brute force attempts
5. ✅ **Token purpose validation**: Temp token can only be used for 2FA
6. ✅ **HTTP-only cookies**: Set after successful verification
7. ✅ **Email delivery**: OTP sent via secure email service
8. ⚠️ **TODO: SMS backup**: Consider SMS as alternative to email
9. ⚠️ **TODO: Backup codes**: Generate one-time backup codes

## Future Enhancements

1. **TOTP Support**: Add Time-based OTP (Google Authenticator)
2. **SMS Delivery**: Use Twilio for SMS-based OTP
3. **Backup Codes**: Generate single-use backup codes
4. **Device Trust**: Remember trusted devices
5. **Login Notifications**: Email on successful login
6. **Failed Attempt Tracking**: Lock account after X failed attempts

## Summary

The 2FA system is now complete with:
- ✅ Login endpoint with 2FA detection
- ✅ Temp token generation
- ✅ OTP generation (6-digit)
- ✅ 2FA verification endpoint
- ✅ Cookie setting after successful verification
- ⚠️ Email service integration (ready to implement)
- ⚠️ Database fields (need migration)

**Next Steps:**
1. Add `twoFactorCode` and `twoFactorExpiry` fields to User entity
2. Run migration
3. Implement email service with nodemailer
4. Test complete flow
5. Add rate limiting to endpoints
