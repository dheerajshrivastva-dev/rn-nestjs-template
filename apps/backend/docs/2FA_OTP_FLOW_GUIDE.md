# 2FA OTP Flow - Complete Implementation Guide

## Architecture Overview

The 2FA system uses a **generic OTP module** that handles all OTP types (login 2FA, password reset, email verification, etc.) with:

1. **Dedicated OTP Entity & Service** - Stores and manages OTPs with rate limiting
2. **TempTokenGuard** - Decodes temp tokens and attaches payload to `req.tempUser`
3. **Generic OTP Controller** - Handles verify/resend for all OTP types
4. **Cookie-based Auth** - Supports both cookies (web) and body params (mobile)

### Key Security Features

✅ OTP stored as **bcrypt hash** in database
✅ **Rate limiting** - 5 requests per 15 minutes, 30-minute cooldown
✅ **Temp tokens** encoded in JWT with OTP metadata
✅ **HTTP-only cookies** for XSS protection
✅ **SameSite strict** for CSRF protection
✅ **Attempt tracking** - Max 5 attempts per OTP
✅ **Single-use OTPs** - Invalidated after verification

---

## Complete 2FA Login Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        1. Login Request                         │
│  POST /auth/login { email, password }                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Validate Password  │
                   └─────────┬─────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
     ┌─────▼──────┐                   ┌───────▼────────┐
     │ 2FA Enabled│                   │ 2FA Disabled   │
     └─────┬──────┘                   └───────┬────────┘
           │                                  │
   ┌───────▼────────┐                ┌───────▼────────┐
   │ Generate OTP   │                │ Generate Tokens│
   │ Save to DB     │                │ Set Cookies    │
   └───────┬────────┘                └───────┬────────┘
           │                                  │
   ┌───────▼────────┐                        │
   │ Create TempToken│                       │
   │ Set Cookie     │                        │
   └───────┬────────┘                        │
           │                                  │
   ┌───────▼────────┐                ┌───────▼────────┐
   │ Return tempToken│                │ Login Complete │
   │ + OTP (dev)    │                │ Return tokens  │
   └───────┬────────┘                └────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│           2. User Receives OTP via Email/SMS                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│          3. Verify OTP Request                                  │
│  POST /otp/verify { code: "123456" }                            │
│  Cookie: temp_token=eyJhbGc...                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ TempTokenGuard    │
                   │ Decodes tempToken │
                   │ → req.tempUser    │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Verify OTP Code   │
                   │ (bcrypt compare)  │
                   └─────────┬─────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
     ┌─────▼──────┐                   ┌───────▼────────┐
     │ OTP Valid  │                   │ OTP Invalid    │
     └─────┬──────┘                   └───────┬────────┘
           │                                  │
   ┌───────▼────────┐                ┌───────▼────────┐
   │ Mark OTP as    │                │ Increment      │
   │ Used           │                │ Attempt Count  │
   └───────┬────────┘                └───────┬────────┘
           │                                  │
   ┌───────▼────────┐                ┌───────▼────────┐
   │ Return Success │                │ Return Error   │
   └───────┬────────┘                └────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│          4. Complete 2FA Login                                  │
│  POST /auth/complete-2fa                                        │
│  Cookie: temp_token=eyJhbGc...                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ TempTokenGuard    │
                   │ → req.tempUser    │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Generate Tokens   │
                   │ Set Cookies       │
                   │ Clear temp_token  │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Login Complete    │
                   │ Return Tokens     │
                   └───────────────────┘
```

---

## API Endpoints

### 1. Login (POST /auth/login)

**Request:**
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

**Cookies Set:**
- `access_token` (15 minutes, HTTP-only, SameSite strict)
- `refresh_token` (7 days, HTTP-only, SameSite strict)

**Response (2FA Enabled):**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "message": "2FA code sent to your email",
  "otpSent": true,
  "otp": "123456"  // Only in development
}
```

**Cookies Set:**
- `temp_token` (10 minutes, HTTP-only, SameSite strict)

---

### 2. Verify OTP (POST /otp/verify)

**Request (Cookie-based - Web):**
```json
{
  "code": "123456"
}
```
**Cookies:** `temp_token=eyJhbGc...`

**Request (Body-based - Mobile):**
```json
{
  "code": "123456",
  "tempToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**How it Works:**
1. `TempTokenGuard` extracts token from cookie or body
2. Guard decodes JWT and validates purpose starts with `"otp:"`
3. Guard attaches payload to `req.tempUser`
4. Controller uses `@CurrentTempUser()` to access decoded payload
5. OTP service verifies the code

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "otpId": "uuid",
  "recipientId": "uuid",
  "otpType": "login_2fa"
}
```

**Response (Error):**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP"
}
```

---

### 3. Resend OTP (POST /otp/resend)

**Request (Cookie-based):**
No body required - uses `temp_token` cookie

**Request (Body-based - Mobile):**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "New OTP sent successfully",
  "otpId": "uuid",
  "expiresAt": "2025-12-06T10:15:00.000Z",
  "otp": "654321"  // Only in development
}
```

**Rate Limiting:**
- Max 5 requests per 15 minutes
- 30-minute cooldown if exceeded

---

### 4. Complete 2FA Login (POST /auth/complete-2fa)

**Request (Cookie-based):**
No body required - uses `temp_token` cookie

**Request (Body-based - Mobile):**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
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

**Cookies Set/Cleared:**
- `temp_token` - **Cleared**
- `access_token` - Set (15 minutes)
- `refresh_token` - Set (7 days)

---

## Code Implementation

### 1. TempTokenGuard

```typescript
// src/common/guards/temp-token.guard.ts
@Injectable()
export class TempTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract temp token from cookie or request body
    const tempToken =
      request.cookies?.temp_token ||
      request.body?.tempToken;

    if (!tempToken) {
      throw new UnauthorizedException('Temp token is required');
    }

    // Verify and decode temp token
    const payload = this.jwtService.verify(tempToken);

    // Validate token purpose (must start with "otp:")
    if (!payload.purpose || !payload.purpose.startsWith('otp:')) {
      throw new UnauthorizedException('Invalid token purpose');
    }

    // Basic validation
    if (!payload.sub || !payload.recipientType) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Attach decoded payload directly to request
    (request as any).tempUser = payload;

    return true;
  }
}
```

### 2. CurrentTempUser Decorator

```typescript
// src/common/decorators/current-temp-user.decorator.ts
export const CurrentTempUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tempUser;
  },
);

export interface TempUser {
  sub: string; // recipientId
  recipientType: string;
  purpose: string; // e.g., "otp:login_2fa"
  otpId: string;
  iat?: number;
  exp?: number;
}
```

### 3. OTP Controller

```typescript
// src/modules/otp/otp.controller.ts
@Public()
@UseGuards(TempTokenGuard)
@Post('verify')
async verifyOtp(
  @Body() verifyOtpDto: VerifyOtpDto,
  @CurrentTempUser() tempUser: TempUser,
) {
  // Extract OTP type from purpose (e.g., "otp:login_2fa" -> "login_2fa")
  const otpType = tempUser.purpose.split(':')[1] as OtpType;

  // Verify OTP - no need to decode token again!
  const otp = await this.otpService.verifyOtp(
    tempUser.sub, // recipientId
    tempUser.recipientType as OtpRecipientType,
    otpType,
    verifyOtpDto.code,
  );

  return {
    success: true,
    message: 'OTP verified successfully',
    otpId: otp.id,
    recipientId: otp.recipientId,
    otpType: otp.otpType,
  };
}
```

### 4. Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
@Public()
@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.authService.login(loginDto);

  if ('tempToken' in result) {
    // Set temp token cookie for 2FA flow
    this.setTempTokenCookie(res, result.tempToken);
    return result;
  }

  // Set auth cookies for regular login
  this.setAuthCookies(res, result.accessToken, result.refreshToken);
  return result;
}

@Public()
@UseGuards(TempTokenGuard)
@Post('complete-2fa')
async complete2FA(
  @CurrentTempUser() tempUser: TempUser,
  @Res({ passthrough: true }) res: Response,
) {
  // No need to decode token - TempTokenGuard already did it!
  const result = await this.authService.complete2FALogin(tempUser.sub);

  // Clear temp token cookie
  res.clearCookie('temp_token');

  // Set auth cookies
  this.setAuthCookies(res, result.accessToken, result.refreshToken);

  return result;
}
```

---

## Frontend Implementation

### React/Next.js Example

```typescript
// 1. Login
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if ('tempToken' in result) {
    // 2FA required - temp_token cookie is set automatically
    setShow2FAModal(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('OTP:', result.otp);
    }
  } else {
    // Login successful, cookies set automatically
    router.push('/dashboard');
  }
};

// 2. Verify OTP
const handleVerifyOTP = async (code: string) => {
  const response = await fetch('/api/v1/otp/verify', {
    method: 'POST',
    credentials: 'include', // Uses temp_token cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (response.ok) {
    // OTP verified
    setOtpVerified(true);

    // 3. Complete 2FA login
    const completeResponse = await fetch('/api/v1/auth/complete-2fa', {
      method: 'POST',
      credentials: 'include', // Uses temp_token cookie
    });

    if (completeResponse.ok) {
      // Auth cookies set automatically, temp_token cleared
      router.push('/dashboard');
    }
  } else {
    setError('Invalid OTP');
  }
};

// 4. Resend OTP
const handleResendOTP = async () => {
  const response = await fetch('/api/v1/otp/resend', {
    method: 'POST',
    credentials: 'include', // Uses temp_token cookie
  });

  if (response.ok) {
    const result = await response.json();
    setMessage('New OTP sent');

    if (process.env.NODE_ENV === 'development') {
      console.log('New OTP:', result.otp);
    }
  }
};
```

---

## Benefits of This Architecture

### 1. **No Token Decoding Duplication**
- Token decoded once by `TempTokenGuard`
- All controllers access `req.tempUser` directly
- Clean, DRY code

### 2. **Dual Client Support**
- Web clients: Use cookies automatically
- Mobile clients: Send `tempToken` in request body
- Same backend code handles both

### 3. **Generic & Reusable**
- OTP controller works for all OTP types
- Just change the `purpose` in temp token
- Examples: `otp:login_2fa`, `otp:password_reset`, `otp:email_verification`

### 4. **Security by Design**
- Temp tokens can't be tampered (signed JWT)
- HTTP-only cookies prevent XSS
- Rate limiting prevents abuse
- OTPs hashed in database

### 5. **Developer Experience**
- Simple decorators (`@CurrentTempUser()`)
- Type-safe with TypeScript interfaces
- Clear separation of concerns

---

## Security Considerations

### ✅ Implemented

1. **OTP Hashing** - Bcrypt with salt
2. **Rate Limiting** - 5 requests/15 min, 30 min cooldown
3. **Attempt Tracking** - Max 5 attempts per OTP
4. **Token Expiry** - Temp tokens expire in 10 minutes
5. **Single-use OTPs** - Marked as used after verification
6. **HTTP-only Cookies** - XSS protection
7. **SameSite Strict** - CSRF protection
8. **Secure in Production** - HTTPS only for cookies

### ⚠️ TODO

1. **Email Service** - Implement actual OTP sending
2. **SMS Support** - Add Twilio/AWS SNS integration
3. **Backup Codes** - Generate one-time backup codes
4. **TOTP Support** - Add Google Authenticator option
5. **Device Trust** - Remember trusted devices
6. **Login Notifications** - Alert on successful 2FA

---

## Testing

```bash
# 1. Login (should return tempToken if 2FA enabled)
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Response: { tempToken: "...", otp: "123456" }

# 2. Verify OTP (uses temp_token cookie)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'

# Response: { success: true, message: "OTP verified" }

# 3. Complete 2FA (uses temp_token cookie)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/complete-2fa

# Response: { accessToken: "...", refreshToken: "..." }
# Cookies: access_token, refresh_token set, temp_token cleared

# 4. Access protected route (uses access_token cookie)
curl -b cookies.txt http://localhost:3000/api/v1/agents/me
```

---

## Summary

This implementation provides:

✅ Clean, maintainable architecture
✅ No code duplication
✅ Strong security
✅ Dual client support (web + mobile)
✅ Generic OTP system
✅ Easy to extend for other OTP types

The key innovation is **TempTokenGuard** that decodes tokens once and makes the payload available via `@CurrentTempUser()` decorator, eliminating repetitive token decoding across controllers.
