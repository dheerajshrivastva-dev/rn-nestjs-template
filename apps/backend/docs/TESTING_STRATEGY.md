# Testing Strategy - EMI Management System

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Project Status:** Development - Pre-Release

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Pyramid Strategy](#2-testing-pyramid-strategy)
3. [Coverage Targets](#3-coverage-targets)
4. [Unit Testing Strategy](#4-unit-testing-strategy)
5. [Integration Testing Strategy](#5-integration-testing-strategy)
6. [E2E Testing Strategy](#6-e2e-testing-strategy)
7. [Test Organization](#7-test-organization)
8. [Testing Infrastructure Setup](#8-testing-infrastructure-setup)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Code Quality & Formatting](#10-code-quality--formatting)
11. [CI/CD Integration](#11-cicd-integration)

---

## 1. Testing Philosophy

### Core Principles

1. **Test Early, Test Often** - Write tests alongside implementation
2. **Test Behavior, Not Implementation** - Focus on what the code does, not how
3. **Maintainable Tests** - Tests should be easy to read and update
4. **Fast Feedback** - Unit tests run in milliseconds, integration in seconds
5. **Isolated Tests** - Each test is independent and can run in any order
6. **Real-World Scenarios** - Tests reflect actual usage patterns from HLD

### Testing Priorities (Based on HLD)

**Critical Path (Must Test First):**
1. Authentication & Authorization (JWT, 2FA, OAuth)
2. OTP System (Generation, Verification, Rate Limiting)
3. User Management (CRUD, Balance, Permissions)
4. Company Management (CRUD, Status, Validation)
5. Security Guards & Authorization

**Secondary Priority:**
6. Database Migrations & Entity Relations
7. Error Handling & Validation
8. Utility Functions & Helpers

**Future Implementation:**
9. Device Registration & Authentication
10. Client/Key Management
11. Order & Transaction Processing
12. Notification System

---

## 2. Testing Pyramid Strategy

```
                    /\
                   /  \
                  / E2E \         10% - Complete user flows
                 /______\
                /        \
               /  INTEG   \       30% - API endpoints, DB operations
              /____________\
             /              \
            /   UNIT TESTS   \    60% - Services, Guards, Utils
           /__________________\
```

### Distribution by Type

| Test Type | Target % | Purpose | Speed |
|-----------|----------|---------|-------|
| **Unit Tests** | 60% | Test individual functions/methods in isolation | < 1s total |
| **Integration Tests** | 30% | Test API endpoints, database operations, module interactions | < 10s total |
| **E2E Tests** | 10% | Test complete user workflows end-to-end | < 30s total |

---

## 3. Coverage Targets

### Overall Coverage Goals

- **Minimum Acceptable:** 70% overall
- **Target Goal:** 80% overall
- **Stretch Goal:** 90%+ for critical modules

### Module-Specific Coverage Targets

| Module | Target Coverage | Priority | Reason |
|--------|----------------|----------|---------|
| **auth** | 90%+ | CRITICAL | Security-sensitive, authentication logic |
| **otp** | 90%+ | CRITICAL | Security-sensitive, 2FA implementation |
| **user** | 85%+ | HIGH | Core business logic, RBAC |
| **company** | 85%+ | HIGH | Core business logic, multi-tenancy |
| **guards** | 95%+ | CRITICAL | Authorization enforcement |
| **utils** | 90%+ | HIGH | Shared utilities, crypto functions |
| **config** | 80%+ | MEDIUM | Configuration validation |
| **entities** | 60%+ | MEDIUM | Mostly data models |
| **dto** | 50%+ | LOW | Validation rules (covered by integration tests) |

### Exclude from Coverage

- **DTOs** - Basic validation rules (tested via integration)
- **Interfaces** - TypeScript types only
- **main.ts** - Bootstrap file (tested via E2E)
- **Migration files** - One-time database scripts
- **tracing.ts** - Observability setup

---

## 4. Unit Testing Strategy

### 4.1 Services Testing

**Pattern: Isolated Unit Tests with Mocked Dependencies**

#### Example: Auth Service Tests

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let agentRepository: MockRepository<User>;
  let jwtService: MockJwtService;
  let otpService: MockOtpService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useClass: MockRepository },
        { provide: JwtService, useClass: MockJwtService },
        { provide: OtpService, useClass: MockOtpService },
        { provide: ConfigService, useClass: MockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    agentRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    otpService = module.get(OtpService);
  });

  describe('login', () => {
    it('should return tokens when credentials valid and 2FA disabled', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'Password123!' };
      const mockAgent = { id: 'uuid', email: loginDto.email, is2faEnabled: false };
      agentRepository.findOne.mockResolvedValue(mockAgent);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(otpService.generateOtp).not.toHaveBeenCalled();
    });

    it('should send OTP and return temp token when 2FA enabled', async () => {
      // ... test implementation
    });

    it('should throw UnauthorizedException when credentials invalid', async () => {
      // ... test implementation
    });

    it('should throw UnauthorizedException when user is suspended', async () => {
      // ... test implementation
    });

    it('should increment failed login attempts on failure', async () => {
      // ... test implementation
    });

    it('should lock account after 5 failed attempts', async () => {
      // ... test implementation
    });
  });

  describe('verify2fa', () => {
    it('should return tokens when OTP is valid', async () => {
      // ... test implementation
    });

    it('should throw BadRequestException when OTP expired', async () => {
      // ... test implementation
    });

    it('should throw BadRequestException when OTP invalid', async () => {
      // ... test implementation
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token when refresh token valid', async () => {
      // ... test implementation
    });

    it('should rotate refresh token on successful refresh', async () => {
      // ... test implementation
    });

    it('should throw UnauthorizedException when refresh token invalid', async () => {
      // ... test implementation
    });
  });

  describe('validateGoogleUser', () => {
    it('should create new user when Google user not found', async () => {
      // ... test implementation
    });

    it('should return existing user when Google user found', async () => {
      // ... test implementation
    });

    it('should throw exception when user is suspended', async () => {
      // ... test implementation
    });
  });
});
```

#### Test Coverage Areas for Each Service

**AuthService Tests (auth.service.spec.ts):**
- ✅ Login with valid credentials (2FA enabled/disabled)
- ✅ Login with invalid credentials
- ✅ Login with suspended/inactive user
- ✅ Failed login attempt tracking
- ✅ Account lockout after 5 failures
- ✅ 2FA OTP verification
- ✅ Token refresh flow
- ✅ Token rotation on refresh
- ✅ Google OAuth user creation
- ✅ Google OAuth existing user login
- ✅ Logout and token revocation

**OtpService Tests (otp.service.spec.ts):**
- ✅ Generate OTP (6-digit, encrypted)
- ✅ Verify valid OTP
- ✅ Verify expired OTP
- ✅ Verify invalid OTP
- ✅ Max attempt tracking (5 attempts)
- ✅ Rate limiting (5 per 10 minutes)
- ✅ Cooldown period (15 minutes)
- ✅ OTP cleanup for expired entries
- ✅ Different OTP types (LOGIN_2FA, EMAIL_VERIFICATION, etc.)
- ✅ Recipient type handling (AGENT, CLIENT)

**AgentService Tests (user.service.spec.ts):**
- ✅ Create user with valid data
- ✅ Create user with duplicate email
- ✅ Create first user as SUPER_ADMIN
- ✅ Update user profile
- ✅ Update user status (ACTIVE/INACTIVE/SUSPENDED)
- ✅ Find user by ID
- ✅ Find user by email
- ✅ List agents with pagination
- ✅ Filter agents by role/status
- ✅ Delete user (soft delete)
- ✅ Verify email/phone
- ✅ Balance tracking

**CompanyService Tests (company.service.spec.ts):**
- ✅ Create company with address
- ✅ Create company with duplicate GST/PAN
- ✅ Update company details
- ✅ Update company status
- ✅ Find company by ID
- ✅ List companies with pagination
- ✅ Delete company (with active agents check)
- ✅ User/customer counter updates
- ✅ Balance and revenue tracking
- ✅ Commission percentage updates

### 4.2 Guards Testing

**JwtAuthGuard Tests (jwt-auth.guard.spec.ts):**
- ✅ Allow request with valid JWT
- ✅ Reject request with expired JWT
- ✅ Reject request with invalid JWT
- ✅ Allow @Public() decorated endpoints
- ✅ Reject request with missing token

**RolesGuard Tests (roles.guard.spec.ts):**
- ✅ Allow SUPER_ADMIN to access all routes
- ✅ Allow OWNER to access owner-level routes
- ✅ Allow ADMIN to access admin-level routes
- ✅ Reject AGENT from admin routes
- ✅ Allow access when no @Roles() decorator

**OwnershipGuard Tests (ownership.guard.spec.ts):**
- ✅ Allow user to access own resources
- ✅ Allow OWNER/ADMIN to access any resource in company
- ✅ Reject user from accessing other user's resources
- ✅ Handle missing resource ID

**CompanyStatusGuard Tests (company-status.guard.spec.ts):**
- ✅ Allow GET requests for inactive companies
- ✅ Reject non-GET requests for inactive companies
- ✅ Allow all requests for active companies

**TempTokenGuard Tests (temp-token.guard.spec.ts):**
- ✅ Allow request with valid temp token
- ✅ Reject request with expired temp token
- ✅ Reject request with invalid temp token
- ✅ Extract userId from temp token payload

**DeviceSignatureGuard Tests (device-signature.guard.spec.ts):**
- ✅ Allow request with valid signature
- ✅ Reject request with invalid signature
- ✅ Reject request with expired timestamp (> 5 min)
- ✅ Verify RSA-SHA256 signature
- ✅ Log failed authentication attempts

**GoogleOAuthGuard Tests (google-oauth.guard.spec.ts):**
- ✅ Redirect to Google OAuth consent screen
- ✅ Handle OAuth callback
- ✅ Extract Google profile data

### 4.3 Utilities Testing

**CryptoUtil Tests (crypto.util.spec.ts):**
- ✅ Generate 6-digit OTP
- ✅ Hash password with bcrypt
- ✅ Compare password with hash
- ✅ Encrypt data with AES-256
- ✅ Decrypt data with AES-256
- ✅ Generate secure random string (256 chars)
- ✅ Generate RSA key pair (2048-bit)
- ✅ Sign data with RSA private key
- ✅ Verify signature with RSA public key

### 4.4 Validators & Pipes Testing

**ValidationPipe Tests:**
- ✅ Validate DTO with class-validator decorators
- ✅ Strip unknown properties (whitelist: true)
- ✅ Transform payload to DTO instance
- ✅ Return validation errors with details

---

## 5. Integration Testing Strategy

### 5.1 API Endpoint Testing

**Pattern: Test with Real NestJS App + Test Database**

#### Setup: Test Database Configuration

```typescript
// test/setup.ts
import { DataSource } from 'typeorm';

export const setupTestDatabase = async (): Promise<DataSource> => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT) || 5433,
    username: process.env.TEST_DB_USERNAME || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
    database: process.env.TEST_DB_NAME || 'demi_test',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true, // Auto-sync for tests
    dropSchema: true, // Clean slate for each test run
  });

  await dataSource.initialize();
  return dataSource;
};

export const cleanupTestDatabase = async (dataSource: DataSource) => {
  await dataSource.dropDatabase();
  await dataSource.destroy();
};
```

#### Example: Auth API Integration Tests

```typescript
// auth.controller.integration.spec.ts
describe('Auth API (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let agentRepository: Repository<User>;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    agentRepository = dataSource.getRepository(User);
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    // Clear tables before each test
    await agentRepository.clear();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should create new company and super admin user', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        phone: '+919876543210',
        companyName: 'Acme Corp',
        companyEmail: 'contact@acme.com',
        companyPhone: '+919876543211',
        companyAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: registerDto.email,
        role: AgentRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      });

      // Verify user created in DB
      const user = await agentRepository.findOne({ where: { email: registerDto.email } });
      expect(user).toBeDefined();
      expect(user.role).toBe(AgentRole.SUPER_ADMIN);
    });

    it('should return 409 when email already exists', async () => {
      // Create user first
      await agentRepository.save({
        email: 'existing@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        name: 'Existing User',
        phone: '+919876543210',
        role: AgentRole.AGENT,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'existing@example.com', /* ... */ })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 when password is weak', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'weak', /* ... */ })
        .expect(400);

      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testAgent: User;

    beforeEach(async () => {
      testAgent = await agentRepository.save({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        name: 'Test User',
        phone: '+919876543210',
        role: AgentRole.AGENT,
        status: UserStatus.ACTIVE,
        is2faEnabled: false,
      });
    });

    it('should return tokens when credentials are valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 when password is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword!' })
        .expect(401);
    });

    it('should return temp token when 2FA is enabled', async () => {
      await agentRepository.update(testAgent.id, { is2faEnabled: true });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(200);

      expect(response.body).toHaveProperty('tempToken');
      expect(response.body).toHaveProperty('require2fa', true);
      expect(response.body).not.toHaveProperty('accessToken');
    });

    it('should lock account after 5 failed login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'WrongPassword!' })
          .expect(401);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(423);

      expect(response.body.message).toContain('locked');
    });
  });

  describe('POST /api/v1/auth/verify-2fa', () => {
    // ... test implementation
  });

  describe('POST /api/v1/auth/refresh', () => {
    // ... test implementation
  });

  describe('POST /api/v1/auth/logout', () => {
    // ... test implementation
  });

  describe('GET /api/v1/auth/google', () => {
    // ... test implementation (mock Google OAuth)
  });
});
```

### 5.2 Integration Test Coverage

**Auth Module Integration Tests:**
- ✅ POST /api/v1/auth/register (success, duplicate email, validation errors)
- ✅ POST /api/v1/auth/login (success, invalid credentials, 2FA flow, account lockout)
- ✅ POST /api/v1/auth/verify-2fa (valid OTP, invalid OTP, expired OTP, max attempts)
- ✅ POST /api/v1/auth/refresh (valid token, invalid token, token rotation)
- ✅ POST /api/v1/auth/logout (token revocation)
- ✅ GET /api/v1/auth/google (OAuth redirect, callback)
- ✅ POST /api/v1/auth/forgot-password
- ✅ POST /api/v1/auth/reset-password

**OTP Module Integration Tests:**
- ✅ POST /api/v1/otp/send (success, rate limiting, cooldown)
- ✅ POST /api/v1/otp/verify (valid OTP, invalid OTP, expired OTP)
- ✅ POST /api/v1/otp/resend (within rate limit, during cooldown)
- ✅ GET /api/v1/otp/rate-limit-status

**User Module Integration Tests:**
- ✅ POST /api/v1/agents (create by owner, create by admin, create by user - forbidden)
- ✅ GET /api/v1/agents (list all, pagination, filtering by role/status)
- ✅ GET /api/v1/agents/:id (success, not found, unauthorized)
- ✅ PUT /api/v1/agents/:id (update own profile, update others - forbidden)
- ✅ PATCH /api/v1/agents/:id/status (update by owner, update by user - forbidden)
- ✅ POST /api/v1/agents/transfer-balance (success, insufficient balance)
- ✅ GET /api/v1/agents/:id/balance
- ✅ GET /api/v1/agents/:id/clients

**Company Module Integration Tests:**
- ✅ POST /api/v1/companies (create with address, duplicate GST/PAN)
- ✅ GET /api/v1/companies (list all, pagination)
- ✅ GET /api/v1/companies/:id (success, not found)
- ✅ PUT /api/v1/companies/:id (update by owner, update by user - forbidden)
- ✅ PATCH /api/v1/companies/:id/status (activate/deactivate)
- ✅ GET /api/v1/companies/:id/stats

---

## 6. E2E Testing Strategy

### 6.1 Complete User Flows

**Test Scenarios Based on HLD:**

#### Flow 1: Company Registration & First User Creation
```typescript
// e2e/auth-flows.e2e-spec.ts
describe('Complete Registration Flow (E2E)', () => {
  it('should complete full registration flow', async () => {
    // Step 1: Register company and super admin
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ /* ... */ })
      .expect(201);

    const { accessToken, user, company } = registerResponse.body;

    // Step 2: Verify user is super admin
    expect(user.role).toBe(AgentRole.SUPER_ADMIN);

    // Step 3: Access protected resource
    const profileResponse = await request(app.getHttpServer())
      .get(`/api/v1/agents/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.email).toBe(user.email);

    // Step 4: Create another user (admin)
    const createAgentResponse = await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: AgentRole.ADMIN, /* ... */ })
      .expect(201);

    // Step 5: Verify company user count updated
    const companyResponse = await request(app.getHttpServer())
      .get(`/api/v1/companies/${company.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(companyResponse.body.totalAgents).toBe(2);
  });
});
```

#### Flow 2: Login with 2FA
```typescript
describe('Login with 2FA Flow (E2E)', () => {
  it('should complete 2FA login flow', async () => {
    // Setup: Create user with 2FA enabled
    const user = await createTestAgent({ is2faEnabled: true });

    // Step 1: Login to get temp token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Password123!' })
      .expect(200);

    expect(loginResponse.body.require2fa).toBe(true);
    expect(loginResponse.body.tempToken).toBeDefined();

    // Step 2: Get OTP from database (in real scenario, from email/SMS)
    const otpRecord = await getLatestOtp(user.id);

    // Step 3: Verify 2FA with OTP
    const verify2faResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-2fa')
      .send({ tempToken: loginResponse.body.tempToken, otp: otpRecord.code })
      .expect(200);

    expect(verify2faResponse.body.accessToken).toBeDefined();
    expect(verify2faResponse.body.refreshToken).toBeDefined();

    // Step 4: Access protected resource
    await request(app.getHttpServer())
      .get(`/api/v1/agents/${user.id}`)
      .set('Authorization', `Bearer ${verify2faResponse.body.accessToken}`)
      .expect(200);
  });
});
```

#### Flow 3: User Creates Client (Key Purchase Flow)
```typescript
describe('User Creates Client Flow (E2E)', () => {
  it('should complete client creation with balance deduction', async () => {
    // Setup: Create owner with balance
    const { owner, accessToken } = await createOwnerWithBalance(1000);

    // Step 1: Create user under owner
    const agentResponse = await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ /* ... */ })
      .expect(201);

    // Step 2: Transfer balance to user
    await request(app.getHttpServer())
      .post('/api/v1/agents/transfer-balance')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fromAgentId: owner.id, toAgentId: agentResponse.body.id, amount: 500 })
      .expect(200);

    // Step 3: Login as user
    const agentLoginResponse = await loginAsAgent(agentResponse.body);

    // Step 4: Create client (uses 1 key)
    const clientResponse = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${agentLoginResponse.accessToken}`)
      .send({ /* ... */ })
      .expect(201);

    // Step 5: Verify balance deducted
    const balanceResponse = await request(app.getHttpServer())
      .get(`/api/v1/agents/${agentResponse.body.id}/balance`)
      .set('Authorization', `Bearer ${agentLoginResponse.accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(499); // 500 - 1 key
  });
});
```

#### Flow 4: Token Refresh Flow
```typescript
describe('Token Refresh Flow (E2E)', () => {
  it('should refresh access token using refresh token', async () => {
    // Step 1: Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body;

    // Step 2: Wait for access token to expire (mock expiry in test)
    // ... (skip wait in test, just proceed)

    // Step 3: Refresh token
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.accessToken).not.toBe(accessToken); // New token

    // Step 4: Verify old refresh token is invalidated
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken }) // Old token
      .expect(401);

    // Step 5: Use new access token
    await request(app.getHttpServer())
      .get('/api/v1/agents/me')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .expect(200);
  });
});
```

#### Flow 5: OTP Rate Limiting Flow
```typescript
describe('OTP Rate Limiting Flow (E2E)', () => {
  it('should enforce rate limit and cooldown', async () => {
    const user = await createTestAgent();

    // Step 1: Send 5 OTPs successfully
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/otp/send')
        .send({ recipientId: user.id, recipientType: 'user', otpType: 'LOGIN_2FA' })
        .expect(200);
    }

    // Step 2: 6th request should trigger cooldown
    const response = await request(app.getHttpServer())
      .post('/api/v1/otp/send')
      .send({ recipientId: user.id, recipientType: 'user', otpType: 'LOGIN_2FA' })
      .expect(429);

    expect(response.body.message).toContain('cooldown');

    // Step 3: Check rate limit status
    const statusResponse = await request(app.getHttpServer())
      .get('/api/v1/otp/rate-limit-status')
      .query({ recipientId: user.id, recipientType: 'user', otpType: 'LOGIN_2FA' })
      .expect(200);

    expect(statusResponse.body.isInCooldown).toBe(true);
  });
});
```

---

## 7. Test Organization

### 7.1 Directory Structure

```
demi-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.spec.ts          # Unit tests
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.controller.spec.ts       # Unit tests
│   │   │   └── auth.integration.spec.ts      # Integration tests
│   │   ├── otp/
│   │   │   ├── otp.service.ts
│   │   │   ├── otp.service.spec.ts
│   │   │   ├── otp.controller.spec.ts
│   │   │   └── otp.integration.spec.ts
│   │   ├── user/
│   │   │   ├── user.service.spec.ts
│   │   │   ├── user.controller.spec.ts
│   │   │   └── user.integration.spec.ts
│   │   └── company/
│   │       ├── company.service.spec.ts
│   │       ├── company.controller.spec.ts
│   │       └── company.integration.spec.ts
│   └── common/
│       ├── guards/
│       │   ├── jwt-auth.guard.spec.ts
│       │   ├── roles.guard.spec.ts
│       │   ├── ownership.guard.spec.ts
│       │   └── ...
│       └── utils/
│           └── crypto.util.spec.ts
├── test/
│   ├── setup.ts                              # Test database setup
│   ├── helpers/                               # Test utilities
│   │   ├── create-test-user.ts
│   │   ├── create-test-company.ts
│   │   └── mock-factories.ts
│   ├── fixtures/                              # Test data
│   │   ├── agents.fixture.ts
│   │   └── companies.fixture.ts
│   └── e2e/
│       ├── auth-flows.e2e-spec.ts
│       ├── user-flows.e2e-spec.ts
│       ├── otp-flows.e2e-spec.ts
│       └── client-flows.e2e-spec.ts
├── jest.config.js                             # Jest unit test config
├── jest-integration.config.js                 # Jest integration config
└── jest-e2e.config.js                         # Jest e2e config
```

### 7.2 Naming Conventions

| Test Type | File Extension | Location | Example |
|-----------|---------------|----------|---------|
| **Unit Test** | `.spec.ts` | Next to source file | `auth.service.spec.ts` |
| **Integration Test** | `.integration.spec.ts` | Next to source file | `auth.integration.spec.ts` |
| **E2E Test** | `.e2e-spec.ts` | `test/e2e/` | `auth-flows.e2e-spec.ts` |

### 7.3 Test Naming Patterns

```typescript
describe('ServiceName/ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Examples:**
- ✅ `it('should return tokens when credentials are valid')`
- ✅ `it('should throw UnauthorizedException when password is incorrect')`
- ✅ `it('should lock account when failed attempts exceed 5')`
- ❌ `it('test login')` (too vague)
- ❌ `it('works correctly')` (not descriptive)

---

## 8. Testing Infrastructure Setup

### 8.1 Jest Configurations

#### jest.config.js (Unit Tests)
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.integration.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/main.ts',
    '!**/tracing.ts',
    '!**/migrations/**',
  ],
  coverageDirectory: '../coverage/unit',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/modules/auth/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/otp/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/common/guards/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

#### jest-integration.config.js (Integration Tests)
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.integration.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage/integration',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  testTimeout: 30000, // 30 seconds for DB operations
};
```

#### jest-e2e.config.js (E2E Tests)
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 60000, // 1 minute for complete flows
};
```

### 8.2 Test Database Setup

#### Docker Compose Test Database

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:16-alpine
    container_name: demi-postgres-test
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: demi_test
    ports:
      - '5433:5432'
    volumes:
      - postgres-test-data:/var/lib/postgresql/data

  redis-test:
    image: redis:7-alpine
    container_name: demi-redis-test
    ports:
      - '6380:6379'

volumes:
  postgres-test-data:
```

#### Test Environment Variables

```bash
# .env.test
NODE_ENV=test
PORT=3001

# Test Database
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_USERNAME=test
TEST_DB_PASSWORD=test
TEST_DB_NAME=demi_test

# Test Redis
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6380

# Test JWT
JWT_SECRET=test-secret-key-for-testing-only
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Test OTP
OTP_VALIDITY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### 8.3 Test Utilities & Helpers

#### test/helpers/create-test-user.ts
```typescript
import { Repository } from 'typeorm';
import { User } from '@modules/user/user.entity';
import { AgentRole, UserStatus } from '@common/enums';
import * as bcrypt from 'bcrypt';

export const createTestAgent = async (
  agentRepository: Repository<User>,
  overrides: Partial<User> = {},
): Promise<User> => {
  const defaultAgent = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    passwordHash: await bcrypt.hash('Password123!', 10),
    phone: '+919876543210',
    role: AgentRole.AGENT,
    status: UserStatus.ACTIVE,
    is2faEnabled: false,
    balance: 0,
    activeClients: 0,
  };

  return agentRepository.save({ ...defaultAgent, ...overrides });
};
```

#### test/helpers/create-test-company.ts
```typescript
import { Repository } from 'typeorm';
import { Company } from '@modules/company/company.entity';
import { Address } from '@common/entities/address.entity';

export const createTestCompany = async (
  companyRepository: Repository<Company>,
  addressRepository: Repository<Address>,
  overrides: Partial<Company> = {},
): Promise<Company> => {
  const address = await addressRepository.save({
    street: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
  });

  const defaultCompany = {
    name: `Test Company ${Date.now()}`,
    email: `company-${Date.now()}@example.com`,
    phone: '+919876543211',
    gstNumber: `GST${Date.now()}`,
    panNumber: `PAN${Date.now()}`,
    address,
    isActive: true,
    totalAgents: 0,
    totalActiveCustomers: 0,
    totalBalance: 0,
  };

  return companyRepository.save({ ...defaultCompany, ...overrides });
};
```

#### test/helpers/mock-factories.ts
```typescript
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export class MockJwtService {
  sign = jest.fn().mockReturnValue('mock-jwt-token');
  verify = jest.fn().mockReturnValue({ userId: 'mock-user-id' });
  decode = jest.fn().mockReturnValue({ userId: 'mock-user-id' });
}

export class MockConfigService {
  get = jest.fn((key: string) => {
    const config = {
      'jwt.secret': 'test-secret',
      'jwt.accessExpiration': '15m',
      'jwt.refreshExpiration': '7d',
      'otp.validityMinutes': 10,
      'otp.maxAttempts': 5,
    };
    return config[key];
  });
}

export class MockRepository<T> {
  save = jest.fn();
  find = jest.fn();
  findOne = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  create = jest.fn();
  createQueryBuilder = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  }));
}
```

### 8.4 Package.json Scripts

```json
{
  "scripts": {
    "test": "jest --config jest.config.js",
    "test:watch": "jest --config jest.config.js --watch",
    "test:cov": "jest --config jest.config.js --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",

    "test:integration": "jest --config jest-integration.config.js",
    "test:integration:watch": "jest --config jest-integration.config.js --watch",
    "test:integration:cov": "jest --config jest-integration.config.js --coverage",

    "test:e2e": "jest --config jest-e2e.config.js",
    "test:e2e:watch": "jest --config jest-e2e.config.js --watch",
    "test:e2e:cov": "jest --config jest-e2e.config.js --coverage",

    "test:all": "npm run test && npm run test:integration && npm run test:e2e",
    "test:all:cov": "npm run test:cov && npm run test:integration:cov && npm run test:e2e:cov",

    "test:db:up": "docker-compose -f docker-compose.test.yml up -d",
    "test:db:down": "docker-compose -f docker-compose.test.yml down -v"
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation Setup (Week 1)

**Day 1-2: Infrastructure Setup**
- [x] Review existing Jest configuration
- [ ] Create test database configuration
- [ ] Set up docker-compose.test.yml
- [ ] Create test environment variables (.env.test)
- [ ] Create test helpers (mock factories, test data creators)
- [ ] Set up coverage thresholds in jest.config.js

**Day 3-4: First Unit Tests**
- [ ] Write unit tests for CryptoUtil (10 tests)
- [ ] Write unit tests for OtpService (15 tests)
- [ ] Write unit tests for AuthService (20 tests)
- [ ] Verify tests run and pass
- [ ] Generate initial coverage report

**Day 5-7: Critical Guards Tests**
- [ ] Write unit tests for JwtAuthGuard (5 tests)
- [ ] Write unit tests for RolesGuard (5 tests)
- [ ] Write unit tests for OwnershipGuard (5 tests)
- [ ] Write unit tests for TempTokenGuard (5 tests)
- [ ] Write unit tests for CompanyStatusGuard (4 tests)
- [ ] Generate coverage report for guards (target: 95%+)

**Deliverables:**
- ✅ Test infrastructure fully configured
- ✅ 65+ unit tests written
- ✅ ~40% overall code coverage

---

### Phase 2: Core Module Unit Tests (Week 2)

**Day 8-10: Service Tests**
- [ ] Write unit tests for AgentService (15 tests)
- [ ] Write unit tests for CompanyService (12 tests)
- [ ] Refactor existing services for better testability if needed

**Day 11-12: Controller Tests**
- [ ] Write unit tests for AuthController (10 tests)
- [ ] Write unit tests for OtpController (8 tests)
- [ ] Write unit tests for AgentController (10 tests)
- [ ] Write unit tests for CompanyController (10 tests)

**Day 13-14: Validation & Edge Cases**
- [ ] Add edge case tests for all services
- [ ] Test error handling paths
- [ ] Test validation logic
- [ ] Review and improve test coverage

**Deliverables:**
- ✅ 130+ unit tests total
- ✅ 70%+ overall code coverage
- ✅ 90%+ coverage for critical modules (auth, otp)

---

### Phase 3: Integration Tests (Week 3)

**Day 15-16: Auth API Integration Tests**
- [ ] Set up test database with real PostgreSQL
- [ ] Write integration tests for registration (5 tests)
- [ ] Write integration tests for login (8 tests)
- [ ] Write integration tests for 2FA verification (6 tests)
- [ ] Write integration tests for token refresh (4 tests)

**Day 17-18: OTP API Integration Tests**
- [ ] Write integration tests for OTP send (5 tests)
- [ ] Write integration tests for OTP verify (5 tests)
- [ ] Write integration tests for rate limiting (4 tests)
- [ ] Write integration tests for resend (3 tests)

**Day 19-20: User & Company API Integration Tests**
- [ ] Write integration tests for user CRUD (10 tests)
- [ ] Write integration tests for company CRUD (8 tests)
- [ ] Write integration tests for balance transfer (4 tests)
- [ ] Write integration tests for authorization (6 tests)

**Day 21: Integration Test Optimization**
- [ ] Optimize test database setup/teardown
- [ ] Reduce test execution time
- [ ] Fix flaky tests
- [ ] Generate integration coverage report

**Deliverables:**
- ✅ 68+ integration tests
- ✅ Full API endpoint coverage for implemented modules
- ✅ Integration tests run in < 30 seconds

---

### Phase 4: E2E Tests & Final Polish (Week 4)

**Day 22-23: E2E Flow Tests**
- [ ] Write E2E test for registration flow
- [ ] Write E2E test for login with 2FA flow
- [ ] Write E2E test for token refresh flow
- [ ] Write E2E test for OTP rate limiting flow
- [ ] Write E2E test for user creates client flow (when implemented)

**Day 24-25: Code Quality Improvements**
- [ ] Run ESLint on all files, fix issues
- [ ] Run Prettier on all files, enforce formatting
- [ ] Review code structure, refactor if needed
- [ ] Add JSDoc comments to public APIs
- [ ] Update README with testing instructions

**Day 26-27: Documentation & CI/CD**
- [ ] Document testing strategy (this file)
- [ ] Create testing best practices guide
- [ ] Set up GitHub Actions CI/CD for tests
- [ ] Configure automated coverage reporting
- [ ] Set up pre-commit hooks (run tests before commit)

**Day 28: Final Review & Metrics**
- [ ] Run full test suite
- [ ] Generate final coverage report
- [ ] Review test metrics (speed, coverage, quality)
- [ ] Create testing dashboard
- [ ] Present testing strategy to team

**Deliverables:**
- ✅ 200+ total tests (unit + integration + e2e)
- ✅ 80%+ overall code coverage
- ✅ 90%+ coverage for critical modules
- ✅ CI/CD pipeline with automated testing
- ✅ Complete testing documentation

---

## 10. Code Quality & Formatting

### 10.1 ESLint Rules (Enforced)

**Current Configuration Analysis:**
- ✅ TypeScript parser configured
- ✅ TypeScript plugin enabled
- ⚠️ Some rules disabled (explicit-function-return-type, no-explicit-any)

**Recommended Additions:**
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn', // Changed from off
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn', // Changed from off
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: { regex: '^I[A-Z]', match: false }, // No "I" prefix
      },
    ],
    'import/order': [
      'error',
      {
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'max-len': ['warn', { code: 120, ignoreComments: true }],
  },
};
```

### 10.2 Prettier Configuration (Enforced)

**Current Configuration:**
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

✅ Configuration looks good, no changes needed.

### 10.3 Code Formatting Workflow

**Pre-commit Hook Setup (Husky + lint-staged):**

```bash
# Install dependencies
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install
```

**package.json:**
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests --passWithNoTests"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

**.husky/pre-commit:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### 10.4 Code Structure Review

**Current Issues Identified:**
1. ❌ No return type annotations on many methods
2. ❌ Some files use `any` type
3. ❌ Inconsistent import ordering
4. ⚠️ Some services have methods > 50 lines (consider refactoring)

**Recommendations:**
1. ✅ Add explicit return types to all public methods
2. ✅ Replace `any` with proper types or `unknown`
3. ✅ Use ESLint import ordering rule
4. ✅ Extract complex logic into private helper methods
5. ✅ Add JSDoc comments to all public APIs

**Example Refactor:**

**Before:**
```typescript
async login(loginDto: LoginDto) {  // ❌ No return type
  const user = await this.agentRepository.findOne({
    where: { email: loginDto.email }
  });
  if (!user) throw new UnauthorizedException('Invalid credentials');
  // ... 30 more lines
}
```

**After:**
```typescript
/**
 * Authenticates an user and returns JWT tokens or temp token for 2FA
 * @param loginDto - Login credentials
 * @returns Authentication response with tokens
 * @throws UnauthorizedException if credentials invalid or account locked
 */
async login(loginDto: LoginDto): Promise<AuthResponse> {
  const user = await this.findAgentByEmail(loginDto.email);
  this.validateAgentStatus(user);
  await this.validatePassword(loginDto.password, user.passwordHash);

  if (user.is2faEnabled) {
    return this.handle2faLogin(user);
  }

  return this.generateTokens(user);
}

private async findAgentByEmail(email: string): Promise<User> {
  const user = await this.agentRepository.findOne({ where: { email } });
  if (!user) throw new UnauthorizedException('Invalid credentials');
  return user;
}

private validateAgentStatus(user: User): void {
  if (user.status === UserStatus.SUSPENDED) {
    throw new UnauthorizedException('Account suspended');
  }
  // ... more validations
}
```

---

## 11. CI/CD Integration

### 11.1 GitHub Actions Workflow

**.github/workflows/test.yml:**
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format -- --check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:cov
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/unit/lcov.info
          flags: unit
          name: unit-tests

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: demi_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6380:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration:cov
        env:
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5433
          TEST_DB_USERNAME: test
          TEST_DB_PASSWORD: test
          TEST_DB_NAME: demi_test
          TEST_REDIS_HOST: localhost
          TEST_REDIS_PORT: 6380
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/integration/lcov.info
          flags: integration
          name: integration-tests

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: demi_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6380:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:e2e:cov
        env:
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5433
          TEST_DB_USERNAME: test
          TEST_DB_PASSWORD: test
          TEST_DB_NAME: demi_test
          TEST_REDIS_HOST: localhost
          TEST_REDIS_PORT: 6380
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/e2e/lcov.info
          flags: e2e
          name: e2e-tests

  coverage-report:
    name: Coverage Report
    needs: [unit-tests, integration-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Download coverage reports
        uses: actions/download-artifact@v3
      - name: Generate combined report
        run: echo "Coverage reports uploaded to Codecov"
```

### 11.2 Coverage Badges

**README.md:**
```markdown
# EMI Management System Backend

[![Tests](https://github.com/your-org/demi-backend/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/demi-backend/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/your-org/demi-backend/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/demi-backend)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

...
```

### 11.3 Branch Protection Rules

**GitHub Repository Settings → Branches → Add Rule:**
- ✅ Require status checks to pass before merging
  - [x] lint
  - [x] unit-tests
  - [x] integration-tests
  - [x] e2e-tests
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Dismiss stale pull request approvals when new commits are pushed

---

## 12. Testing Metrics & Monitoring

### 12.1 Test Execution Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Unit Test Count** | 130+ | 0 | ❌ |
| **Integration Test Count** | 68+ | 0 | ❌ |
| **E2E Test Count** | 10+ | 0 | ❌ |
| **Total Test Count** | 200+ | 0 | ❌ |
| **Unit Test Speed** | < 5s | - | - |
| **Integration Test Speed** | < 30s | - | - |
| **E2E Test Speed** | < 60s | - | - |
| **Overall Coverage** | 80%+ | 0% | ❌ |
| **Critical Module Coverage** | 90%+ | 0% | ❌ |

### 12.2 Coverage by Module (Target)

| Module | Unit Coverage | Integration Coverage | Overall Target |
|--------|--------------|---------------------|----------------|
| auth | 90%+ | 85%+ | 90%+ |
| otp | 90%+ | 85%+ | 90%+ |
| user | 85%+ | 80%+ | 85%+ |
| company | 85%+ | 80%+ | 85%+ |
| guards | 95%+ | N/A | 95%+ |
| utils | 90%+ | N/A | 90%+ |
| config | 80%+ | 70%+ | 80%+ |

---

## 13. Summary & Next Steps

### ✅ Current Status

**Implemented:**
- Complete authentication system (email/password + Google OAuth + 2FA)
- OTP system with rate limiting
- User and Company management
- Security guards and authorization
- Database setup with migrations

**Missing:**
- ❌ Zero unit tests
- ❌ Zero integration tests
- ❌ Zero e2e tests
- ❌ No test infrastructure

### 🎯 Immediate Next Steps

1. **Week 1: Foundation**
   - Set up test infrastructure
   - Write first 65 unit tests
   - Achieve 40% coverage

2. **Week 2: Core Tests**
   - Complete all unit tests
   - Achieve 70% coverage
   - 90% coverage for critical modules

3. **Week 3: Integration**
   - Write all integration tests
   - Full API coverage
   - Tests run in < 30s

4. **Week 4: Polish**
   - Write E2E tests
   - Set up CI/CD
   - Code quality improvements
   - Achieve 80%+ overall coverage

### 📊 Success Criteria

- ✅ 200+ tests written
- ✅ 80%+ overall code coverage
- ✅ 90%+ coverage for auth, otp, guards
- ✅ All tests run in < 2 minutes
- ✅ CI/CD pipeline passing
- ✅ Code quality enforced (ESLint + Prettier)
- ✅ Pre-commit hooks configured

---

**Document Status:** DRAFT - Ready for Implementation
**Next Review:** After Phase 1 completion (Week 1)
