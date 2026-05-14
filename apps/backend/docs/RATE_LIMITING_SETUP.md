# Rate Limiting Setup

## Installation

```bash
npm install @nestjs/throttler
```

## Configuration

### 1. Update app.module.ts

Add ThrottlerModule to imports:

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ... other imports

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (1 minute)
        limit: 10,  // Max requests per time window
      },
    ]),
  ],
  providers: [
    // ... other providers

    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 2. Apply Custom Limits to Registration Endpoints

In `user.controller.ts` and `auth.controller.ts`:

```typescript
import { Throttle } from '@nestjs/throttler';

// More strict rate limit for registration (5 requests per minute)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Public()
@Post('register')
async register(/* ... */) {
  // ...
}

// Strict rate limit for Google OAuth
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Get('google')
@UseGuards(GoogleAuthGuard)
async googleAuth() {
  // ...
}
```

### 3. Skip Rate Limiting for Specific Routes (if needed)

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('health')
async healthCheck() {
  return { status: 'ok' };
}
```

## Environment Variables

Add to `.env`:

```env
# Rate Limiting
THROTTLE_TTL=60000    # Time window in ms (1 minute)
THROTTLE_LIMIT=10     # Max requests per window
```

## Custom Limits by Endpoint Type

- **Public Registration**: 5 requests/minute
- **OAuth Login**: 5 requests/minute
- **Regular Login**: 10 requests/minute
- **General API**: 60 requests/minute (for authenticated users)

## Testing Rate Limits

```bash
# Test registration endpoint
for i in {1..6}; do curl -X POST http://localhost:3000/api/v1/agents/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123"}'; done
```

Expected: First 5 succeed, 6th returns 429 Too Many Requests
