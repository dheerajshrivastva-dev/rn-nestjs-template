# Quick Setup: Cookie-Based Authentication

## 1. Install Dependencies

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

## 2. Update main.ts

```typescript
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie parser middleware
  app.use(cookieParser());

  // Enable CORS with credentials
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // ← Important!
  });

  // ... rest of your setup
}
```

## 3. Update .env

```env
# JWT Secrets (use different secrets!)
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=different-secret-for-refresh-min-32-chars

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## 4. Test the Implementation

### Test Login
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Test Authenticated Request
```bash
curl -b cookies.txt http://localhost:3000/api/v1/agents/me
```

### Test Token Refresh
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/refresh
```

### Test Logout
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/auth/logout
```

## 5. Frontend Setup

### Web (React/Next.js)
```typescript
// Configure axios globally
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:3000/api/v1';

// Or with fetch
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // ← Always include this
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

## API Endpoints Available

### Authentication
- `POST /auth/login` - Login with email/password (sets cookies)
- `POST /auth/refresh` - Refresh access token (uses cookie or body)
- `POST /auth/logout` - Logout and clear cookies
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback

### Agents
- `POST /agents/register` - Public registration (rate-limited)
- `GET /agents/me` - Get current user profile
- `GET /agents` - Get all agents (ADMIN only)

### Companies
- `POST /companies` - Create company (ADMIN/SUPER_ADMIN)
- `GET /companies/me` - Get my company
- `GET /companies` - Get all companies (SUPER_ADMIN only)

## Token Lifetimes

- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 7 days (long-lived for convenience)

## Security Features ✅

- ✅ HTTP-only cookies (XSS protection)
- ✅ SameSite: strict (CSRF protection)
- ✅ Token rotation (replay attack protection)
- ✅ Hashed refresh tokens in DB
- ✅ Dual mode: cookies OR Authorization header
- ✅ Automatic token extraction in JWT strategy

## Ready to Use!

The system now supports:
1. ✅ Web clients using cookies (automatic)
2. ✅ Mobile/API clients using Bearer tokens
3. ✅ Google OAuth with cookie support
4. ✅ Token refresh with rotation
5. ✅ Secure logout

For more details, see:
- [COOKIE_SECURITY_GUIDE.md](COOKIE_SECURITY_GUIDE.md) - Comprehensive security guide
- [RATE_LIMITING_SETUP.md](RATE_LIMITING_SETUP.md) - Rate limiting setup
- [RECAPTCHA_SETUP.md](RECAPTCHA_SETUP.md) - reCAPTCHA integration
