# Cookie-Based Authentication Security Guide

## Is Cookie-Based Auth Fine to Use?

**YES!** Cookie-based authentication is actually **MORE SECURE** than storing JWT in localStorage when implemented correctly.

## Cookie vs localStorage Comparison

| Security Concern | Cookies (HTTP-only) | localStorage |
|------------------|---------------------|--------------|
| **XSS Protection** | ✅ Excellent | ❌ Vulnerable |
| **CSRF Protection** | ⚠️ Needs `SameSite` | ✅ Immune |
| **Auto-included in requests** | ✅ Yes | ❌ Manual |
| **Can be stolen by JS** | ✅ No (if HTTP-only) | ❌ Yes |
| **Best Practice** | ✅ Recommended | ⚠️ Use with caution |

## Our Implementation

### 1. **Cookie Configuration**

```typescript
res.cookie('access_token', token, {
  httpOnly: true,        // ✅ Cannot be accessed via JavaScript
  secure: true,          // ✅ HTTPS only in production
  sameSite: 'strict',    // ✅ CSRF protection
  maxAge: 15 * 60 * 1000 // 15 minutes
});
```

### 2. **Token Rotation**

We implement **refresh token rotation** for maximum security:

```
Login
  ↓
Generate: Access Token (15m) + Refresh Token (7d)
  ↓
Store: Hashed refresh token in DB
  ↓
After 15 minutes:
  ↓
POST /auth/refresh with old refresh token
  ↓
Verify old token → Generate NEW tokens
  ↓
Invalidate old refresh token (rotation)
```

**Benefits:**
- Limits damage if refresh token is stolen
- Each refresh token can only be used once
- Detects token reuse attacks

### 3. **Security Features Implemented**

#### ✅ HTTP-Only Cookies
- Prevents XSS attacks
- JavaScript cannot read the token
- Even if attacker injects malicious script, token is safe

#### ✅ Secure Flag
- Only sent over HTTPS in production
- Prevents man-in-the-middle attacks

#### ✅ SameSite: Strict
- Prevents CSRF attacks
- Cookie only sent from same origin
- Blocks cross-site requests automatically

#### ✅ Refresh Token Hashing
- Refresh tokens hashed before storing in DB
- Even if DB is compromised, tokens are useless

#### ✅ Token Rotation
- Each refresh generates new tokens
- Old tokens immediately invalidated
- Detects stolen token reuse

#### ✅ Dual Mode Support
- Web: Uses cookies (automatic)
- Mobile/API: Uses Authorization header
- JWT strategy checks both sources

## Environment Variables Required

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=different-secret-for-refresh-tokens-min-32-chars

# Frontend URL for CORS and redirects
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development  # or 'production'
```

## Frontend Implementation

### Web (React/Next.js) - Use Cookies

```typescript
// Login - cookies set automatically
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // ← Important!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Subsequent requests - cookies sent automatically
const data = await fetch('/api/v1/agents/me', {
  credentials: 'include', // ← Always include
});

// Refresh token automatically (set up interceptor)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh
      await axios.post('/api/v1/auth/refresh', {}, {
        withCredentials: true,
      });
      // Retry original request
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Mobile/API Clients - Use Headers

```typescript
// Login - get tokens from response body
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { accessToken, refreshToken } = await response.json();

// Store securely (e.g., Keychain on iOS, KeyStore on Android)
await SecureStore.setItemAsync('access_token', accessToken);
await SecureStore.setItemAsync('refresh_token', refreshToken);

// Use in requests
const data = await fetch('/api/v1/agents/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## CORS Configuration

Update `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // ← Important for cookies!
});
```

## Security Best Practices Checklist

### ✅ Implemented
- [x] HTTP-only cookies
- [x] Secure flag in production
- [x] SameSite: strict
- [x] Refresh token rotation
- [x] Refresh token hashing in DB
- [x] Short-lived access tokens (15m)
- [x] Longer refresh tokens (7d)
- [x] Cookie extraction in JWT strategy
- [x] Logout invalidates tokens

### 🔄 Recommended Additional Security

#### 1. **Rate Limiting** (See RATE_LIMITING_SETUP.md)
```bash
npm install @nestjs/throttler
```

#### 2. **HTTPS Only in Production**
```typescript
// In production, always use HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

#### 3. **Helmet for Security Headers**
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

#### 4. **Cookie Parser**
```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

```typescript
// main.ts
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

## Common Attacks & Our Defenses

### 1. **XSS (Cross-Site Scripting)**
- **Attack**: Inject malicious JavaScript to steal tokens
- **Our Defense**: HTTP-only cookies (JS can't access)

### 2. **CSRF (Cross-Site Request Forgery)**
- **Attack**: Trick user into making unwanted requests
- **Our Defense**: SameSite: strict (blocks cross-origin cookies)

### 3. **Token Theft**
- **Attack**: Steal refresh token from database
- **Our Defense**: Hashed tokens in DB, token rotation

### 4. **Man-in-the-Middle**
- **Attack**: Intercept tokens in transit
- **Our Defense**: HTTPS only (secure flag), short-lived tokens

### 5. **Brute Force**
- **Attack**: Try many passwords
- **Our Defense**: Rate limiting (see RATE_LIMITING_SETUP.md)

## Monitoring & Logging

Add these logs for security monitoring:

```typescript
// Log suspicious activity
if (!isValidRefreshToken) {
  logger.warn(`Invalid refresh token attempt for user ${user.id}`);
  // Alert security team
}

// Log token refresh
logger.info(`Token refreshed for user ${user.id} from IP ${req.ip}`);
```

## Testing Cookies

### Development Testing
```bash
# Login and save cookies
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use cookies in subsequent requests
curl -b cookies.txt http://localhost:3000/api/v1/agents/me

# Refresh tokens
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/refresh
```

## Migration from localStorage to Cookies

If you're migrating from localStorage:

```typescript
// Old way (localStorage)
localStorage.setItem('token', accessToken);
const token = localStorage.getItem('token');
headers: { 'Authorization': `Bearer ${token}` }

// New way (cookies) - Much simpler!
// No code needed! Cookies automatically sent with:
fetch(url, { credentials: 'include' });
```

## Summary

**Cookie-based auth with our implementation is VERY SECURE because:**

1. ✅ HTTP-only cookies prevent XSS
2. ✅ SameSite: strict prevents CSRF
3. ✅ Token rotation prevents stolen token reuse
4. ✅ Hashed tokens in DB protect against DB breaches
5. ✅ Short-lived access tokens limit damage window
6. ✅ HTTPS + secure flag prevents interception
7. ✅ Supports both web (cookies) and mobile (headers)

**Use cookies for web apps** - it's the security best practice! 🔒
