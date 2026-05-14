# EMI Management System - Backend

Backend API service for EMI Management System with Zero-Touch Provisioning for device protection.

## 🚀 Features

- **Dual Authentication System**
  - JWT-based authentication for agents
  - RSA signature-based authentication for devices
- **Zero-Touch Provisioning**
  - QR code-based device registration
  - IMEI validation and mismatch handling
  - Cryptographically secure device-server communication
- **Multi-tenant Architecture**
  - Company → User → Client hierarchy
  - Balance management and commission tracking
- **Device Management**
  - Remote lock/unlock
  - Location tracking
  - Device messaging (text/audio)
  - Stolen device marking
- **Notification System**
  - Email notifications (SendGrid)
  - SMS notifications (Twilio)
  - Push notifications (FCM)
  - Retry mechanisms with exponential backoff
- **OTP System**
  - Multi-purpose OTP (login, verification, emergency unlock)
  - Rate limiting and cooldown
- **Comprehensive Audit Logging**

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- pnpm >= 8.x

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd demi-backend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up PostgreSQL database**
```bash
createdb emi_management
```

5. **Run database migrations**
```bash
pnpm migration:run
```

## 🏃 Running the Application

### Development
```bash
pnpm start:dev
```

### Production
```bash
pnpm build
pnpm start:prod
```

### Debug Mode
```bash
pnpm start:debug
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **API Prefix**: `/api/v1`

## 🧪 Testing

### 🚀 Quick Test (Automated - Recommended)

```bash
pnpm test:auto
```

This single command will:

- ✅ Start test database (PostgreSQL + Redis)
- ✅ Check database health
- ✅ Run all E2E tests
- ✅ Generate coverage reports
- ✅ Show comprehensive results

### Manual Testing

```bash
# Start test database
pnpm test:db:up

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:e2e:cov

# Stop test database
pnpm test:db:down
```

### Unit Tests
```bash
pnpm test
```

### Test Coverage

All major API endpoints are tested:

- ✅ Authentication (login, register, 2FA, password reset)
- ✅ Companies (CRUD, stats, filtering, pagination)
- ✅ Clients (CRUD, EMI management)
- ✅ Devices (lock/unlock, tracking, messaging)
- ✅ Orders (create, approve, purchase keys)
- ✅ Reports (revenue, EMI, agents, clients)
- ✅ Notifications (list, read, delete)

**📖 Complete Testing Guide**: [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
**⚡ Quick Commands**: [TESTING_COMMANDS.md](./TESTING_COMMANDS.md)

## 📁 Project Structure

```
src/
├── common/                 # Shared utilities and base classes
│   ├── decorators/        # Custom decorators (Public, CurrentUser, etc.)
│   ├── dto/               # Common DTOs
│   ├── entities/          # Base entities (Address, etc.)
│   ├── enums/             # Enums (Status, Role, etc.)
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth guards (JWT, Device Signature)
│   ├── interceptors/      # Response interceptors
│   ├── interfaces/        # TypeScript interfaces
│   ├── middleware/        # Custom middleware
│   ├── pipes/             # Validation pipes
│   └── utils/             # Utility functions (crypto, etc.)
├── config/                # Configuration files
│   ├── database.config.ts # Database configuration
│   └── validation.schema.ts # Env validation schema
├── modules/               # Feature modules
│   ├── auth/             # Authentication & authorization
│   ├── company/          # Company management
│   ├── user/            # User management
│   ├── client/           # Client & device management
│   ├── order/            # Order processing
│   ├── transaction/      # Payment transactions
│   ├── balance-sheet/    # Balance tracking
│   ├── otp/              # OTP management
│   ├── device/           # Device operations
│   ├── notification/     # Email/SMS/Push notifications
│   ├── location/         # Device location tracking
│   └── audit/            # Audit logging
├── database/             # Database related
│   ├── migrations/       # TypeORM migrations
│   └── seeds/            # Database seeders
├── app.module.ts         # Root application module
└── main.ts               # Application entry point
```

## 🔐 Authentication

### User Authentication (JWT)
```typescript
// Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "Password@123"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}

// Use in subsequent requests
Authorization: Bearer <accessToken>
```

### Device Authentication (Signature-based)
```typescript
// Every device API call requires these headers:
X-Device-Unique-Code: <256-char-device-code>
X-Client-Id: <client-uuid>
X-Timestamp: <ISO-8601-timestamp>
X-Signature: <RSA-SHA256-signature>

// Signature calculation:
const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body)}`;
const signature = rsaSign(payload, devicePrivateKey);
```

## 🔑 Key Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-2fa` - Verify 2FA OTP
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Client Management
- `POST /api/v1/clients` - Create client (returns QR code)
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/:id` - Get client details
- `GET /api/v1/clients/:id/qr-code` - Regenerate QR code

### Device Registration (Zero-Touch)
- `POST /api/v1/clients/register-device` - Register device
- `POST /api/v1/clients/register-device/confirm` - Confirm IMEI mismatch

### Device Operations (Signature Auth Required)
- `POST /api/v1/clients/:id/sync` - Device sync
- `POST /api/v1/clients/:id/heartbeat` - Device heartbeat
- `GET /api/v1/clients/:id/commands` - Get pending commands
- `POST /api/v1/clients/:id/command-ack` - Acknowledge command

## 🗄️ Database Migrations

### Generate Migration
```bash
pnpm migration:generate src/database/migrations/MigrationName
```

### Run Migrations
```bash
pnpm migration:run
```

### Revert Last Migration
```bash
pnpm migration:revert
```

## 🔧 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DB_*` - PostgreSQL configuration
- `REDIS_*` - Redis configuration
- `JWT_SECRET` - JWT signing secret
- `AES_SECRET_KEY` - AES encryption key (32 characters)
- `SENDGRID_API_KEY` - Email service API key
- `TWILIO_*` - SMS service configuration
- `FCM_SERVER_KEY` - Push notification key
- `AWS_*` - S3 file upload configuration

## 📝 Code Style

### Format Code
```bash
pnpm format
```

### Lint Code
```bash
pnpm lint
```

## 🏗️ Architecture Highlights

### Zero-Touch Provisioning Flow
1. User creates client with IMEI, documents → Server generates `uniqueCode`
2. Server returns QR code with `uniqueCode` + `companyId` + `IMEIs`
3. Device scans QR → Generates RSA key pair
4. Device sends registration request with public key and actual IMEI
5. Server validates IMEI (warns on mismatch)
6. Server generates `deviceUniqueCode` and server key pair
7. Device stores `deviceUniqueCode`, `serverPublicKey`, and private key
8. All future communication uses RSA signatures for mutual authentication

### Security Features
- ✅ RSA-2048 asymmetric encryption
- ✅ Signature-based device authentication
- ✅ Replay attack prevention (5-minute timestamp window)
- ✅ AES-256 encryption for sensitive data
- ✅ JWT with refresh token rotation
- ✅ 2FA support
- ✅ Rate limiting
- ✅ Failed auth attempt tracking

## 📊 Monitoring

### Key Metrics to Track
- API response times
- Authentication success/failure rates
- Device sync frequency
- Notification delivery rates
- OTP verification success rates
- Database connection pool usage

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `pnpm test`
4. Format code: `pnpm format`
5. Lint code: `pnpm lint`
6. Submit pull request

## 📄 License

ISC

## 📞 Support

For issues and questions, please open an issue in the repository.

## 📚 Additional Documentation

### Getting Started
- [Quick Start Guide](./QUICK_START.md)
- [Project Setup](./PROJECT_SETUP.md)
- [NestJS Guide for Express Developers](./NESTJS_GUIDE_FOR_EXPRESS_DEVS.md)

### Testing
- **[API Testing Guide](./API_TESTING_GUIDE.md)** - Complete automated testing guide
- [Testing Commands Reference](./TESTING_COMMANDS.md) - Quick command reference
- [Testing Quick Start](./TESTING_QUICK_START.md) - Get started in 5 minutes
- [Testing Strategy](./TESTING_STRATEGY.md) - Full testing strategy

### Features & Architecture
- [High-Level Design (HLD.md)](./HLD.md) - Complete system architecture
- [Authentication Summary](./AUTHENTICATION_SUMMARY.md) - Authentication details
- [Zero-Touch Provisioning](./ZERO_TOUCH_PROVISIONING.md) - Device provisioning flow
- [RBAC Guide](./RBAC_GUIDE.md)
- [2FA/OTP Flow Guide](./2FA_OTP_FLOW_GUIDE.md)
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)

### DevOps & Deployment
- [Docker Setup](./DOCKER_SETUP.md)
- [Migrations Guide](./MIGRATIONS_GUIDE.md)
- [OpenTelemetry Setup](./OPENTELEMETRY_SETUP_COMPLETE.md)

### Project Management
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)


Access Points:

API: http://localhost:3000
Swagger: http://localhost:3000/api
Jaeger UI: http://localhost:16686
Mailpit (emails): http://localhost:8025
Redis Commander: http://localhost:8081
MinIO: http://localhost:9001
Adminer (DB): http://localhost:8080