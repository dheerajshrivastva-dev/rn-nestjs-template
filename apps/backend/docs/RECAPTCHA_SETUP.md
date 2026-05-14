# reCAPTCHA Implementation Guide

## Overview

reCAPTCHA requires **both frontend and backend** implementation:
- **Frontend**: Displays the challenge, gets token from Google
- **Backend**: Verifies the token with Google's API

## Setup Steps

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register your site
3. Choose reCAPTCHA v2 (Checkbox) or v3 (Invisible)
4. Get your **Site Key** (public) and **Secret Key** (private)

### 2. Frontend Implementation (React/Next.js Example)

#### Install Package

```bash
npm install react-google-recaptcha
```

#### Add to Registration Form

```tsx
import ReCAPTCHA from 'react-google-recaptcha';

function RegisterForm() {
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      alert('Please complete the reCAPTCHA');
      return;
    }

    const response = await fetch('/api/v1/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        recaptchaToken, // Send token to backend
      }),
    });

    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        onChange={handleRecaptchaChange}
      />

      <button type="submit">Register</button>
    </form>
  );
}
```

### 3. Backend Implementation (NestJS)

#### Install Package

```bash
npm install axios
```

#### Create reCAPTCHA Service

```typescript
// src/common/services/recaptcha.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
  }

  async verify(token: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: this.secretKey,
            response: token,
          },
        },
      );

      const { success, score } = response.data;

      // For reCAPTCHA v2: only check success
      // For reCAPTCHA v3: check success and score (score > 0.5 is human-like)
      if (!success) {
        throw new BadRequestException('reCAPTCHA verification failed');
      }

      // Optional: For v3, check score
      if (score !== undefined && score < 0.5) {
        throw new BadRequestException('reCAPTCHA score too low');
      }

      return true;
    } catch (error) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }
  }
}
```

#### Update Register DTO

```typescript
// src/modules/user/dto/register-user.dto.ts
export class RegisterAgentDto {
  // ... existing fields

  @ApiProperty({
    example: 'recaptcha-token-here',
    description: 'reCAPTCHA token from frontend',
  })
  @IsNotEmpty()
  @IsString()
  recaptchaToken: string;
}
```

#### Use in Controller/Service

```typescript
// user.controller.ts
@Post('register')
async register(@Body() registerAgentDto: RegisterAgentDto) {
  // Verify reCAPTCHA first
  await this.recaptchaService.verify(registerAgentDto.recaptchaToken);

  // Then proceed with registration
  return this.agentService.register(registerAgentDto);
}
```

### 4. Environment Variables

```env
# reCAPTCHA (Backend)
RECAPTCHA_SECRET_KEY=your-secret-key-here

# reCAPTCHA (Frontend)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key-here
```

## reCAPTCHA v2 vs v3

### v2 (Checkbox)
- **Pros**: Clear user interaction, explicit verification
- **Cons**: Can be annoying for users
- **Use case**: High-security registration

### v3 (Invisible)
- **Pros**: No user interaction, better UX
- **Cons**: Less obvious, requires score threshold tuning
- **Use case**: General registration with good UX

## Testing

### Development Mode
During development, you can:
1. Use test keys from Google
2. Skip reCAPTCHA verification in development environment

```typescript
async verify(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true; // Skip in development
  }
  // ... actual verification
}
```

## Security Best Practices

1. ✅ **Never expose Secret Key** to frontend
2. ✅ **Always verify on backend** (don't trust frontend)
3. ✅ **Use HTTPS** in production
4. ✅ **Set appropriate score thresholds** for v3
5. ✅ **Combine with rate limiting** for defense in depth

## Which Approach to Use?

### Recommended: Combine Both

```
Registration Request
       │
       ├─ Rate Limiting (Fast check)
       │  └─ Block if too many requests
       │
       └─ reCAPTCHA Verification (Bot check)
          └─ Block if failed/low score

          ✅ If both pass → Process registration
```

- **Rate Limiting**: Prevents brute force, DDoS
- **reCAPTCHA**: Prevents automated bot registrations

Both work together for maximum protection!
