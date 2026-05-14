# API Testing Guide - Complete Automation

This guide provides **automated API testing** for all Demigod endpoints with local database setup.

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated E2E Tests (Recommended)

```bash
# 1. Run the automated test suite
./scripts/run-all-tests.sh
```

That's it! The script will:
- ✅ Start test database (PostgreSQL + Redis)
- ✅ Check database health
- ✅ Run all E2E tests
- ✅ Generate coverage reports
- ✅ Show test results

### Option 2: Manual Step-by-Step

```bash
# 1. Start test database
docker compose -f docker-compose.test.yml up -d

# 2. Wait for database to be ready
sleep 5

# 3. Run E2E tests
pnpm test:e2e

# 4. View coverage report
open coverage/e2e/lcov-report/index.html
```

---

## 📋 What Gets Tested

The automated test suite covers **all major API modules**:

### ✅ Authentication Module
- User registration
- Login (with and without 2FA)
- Token refresh
- Password reset
- Profile management
- Logout

### ✅ Company Module
- Create company
- Get all companies (with pagination)
- Get company by ID
- Update company
- Delete company (soft delete)
- Company statistics

### ✅ Client Module
- Create client
- Get all clients
- Get client by ID
- Update client
- Delete client
- Client EMI history

### ✅ Device Module
- Get client devices
- Lock device
- Unlock device
- Track device location
- Send message to device
- Device status history

### ✅ Order Module
- Create order
- Get all orders
- Approve/reject order
- Purchase keys
- Order history

### ✅ Reports Module
- Revenue reports
- EMI reports
- User performance reports
- Client reports
- Device usage reports

### ✅ Notification Module
- Get notifications
- Mark as read
- Delete notification
- Notification preferences

---

## 📊 Test Database Setup

### Automatic Setup

The test runner script handles everything automatically. But if you need manual control:

### Database Configuration

```yaml
# docker-compose.test.yml
PostgreSQL:
  - Host: localhost
  - Port: 5433
  - Database: demi_test
  - Username: test
  - Password: test

Redis:
  - Host: localhost
  - Port: 6380
```

### Environment Variables

All test configuration is in [`.env.test`](.env.test):

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=demi_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# Auto-sync database schema
DB_SYNCHRONIZE=true
```

### Manual Database Management

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Check status
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs -f

# Stop database
docker compose -f docker-compose.test.yml down

# Stop and remove all data
docker compose -f docker-compose.test.yml down -v
```

---

## 🧪 Running Tests

### Run All E2E Tests

```bash
# Automated (recommended)
./scripts/run-all-tests.sh

# Manual
pnpm test:e2e
```

### Run Specific Test File

```bash
# Auth tests only
pnpm test:e2e auth.e2e-spec

# Company tests only
pnpm test:e2e company.e2e-spec

# Client tests only
pnpm test:e2e client.e2e-spec
```

### Run with Coverage

```bash
pnpm test:e2e --coverage
```

### Run in Watch Mode

```bash
pnpm test:e2e --watch
```

### Run with Verbose Output

```bash
pnpm test:e2e --verbose
```

---

## 📦 Test Structure

```
test/
├── e2e/                          # E2E test suites
│   ├── auth.e2e-spec.ts         # Auth endpoints
│   ├── company.e2e-spec.ts      # Company endpoints
│   ├── client.e2e-spec.ts       # Client endpoints
│   ├── device.e2e-spec.ts       # Device endpoints
│   ├── order.e2e-spec.ts        # Order endpoints
│   └── reports.e2e-spec.ts      # Reports endpoints
├── helpers/                      # Test utilities
│   ├── auth-helper.ts           # Authentication helpers
│   ├── database-helper.ts       # Database utilities
│   └── test-data-factory.ts    # Test data generation
├── jest-e2e.json                # Jest E2E configuration
└── setup-e2e.ts                 # Test setup
```

---

## 🔧 Test Helpers

### AuthHelper

Handles authentication for tests:

```typescript
import { AuthHelper } from '../helpers/auth-helper';

const authHelper = new AuthHelper(app);

// Login
const token = await authHelper.login('user@test.com', 'Password123!');

// Login with 2FA
const token = await authHelper.loginWith2FA('user@test.com', 'Password123!', '123456');

// Get profile
const profile = await authHelper.getProfile(token);

// Create auth header
const headers = authHelper.createAuthHeader(token);
```

### DatabaseHelper

Manages test database:

```typescript
import { DatabaseHelper } from '../helpers/database-helper';

const dbHelper = new DatabaseHelper(app);

// Clean entire database
await dbHelper.cleanDatabase();

// Clean specific table
await dbHelper.cleanTable('agents');

// Get repository
const agentRepo = dbHelper.getRepository(User);

// Execute raw SQL
await dbHelper.query('SELECT * FROM agents WHERE email = $1', ['test@test.com']);
```

### TestDataFactory

Generates realistic test data:

```typescript
import { TestDataFactory } from '../helpers/test-data-factory';

// Create company data
const companyData = TestDataFactory.createCompanyData();

// Create super admin
const superAdmin = await TestDataFactory.createSuperAdminData();

// Create user
const user = await TestDataFactory.createAgentData(companyId);

// Create client
const client = TestDataFactory.createClientData(companyId, userId);

// Create device
const device = TestDataFactory.createDeviceData(clientId);
```

---

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { DatabaseHelper } from '../helpers/database-helper';
import { AuthHelper } from '../helpers/auth-helper';

describe('My Module (E2E)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let authHelper: AuthHelper;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();

    dbHelper = new DatabaseHelper(app);
    authHelper = new AuthHelper(app);
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbHelper.cleanDatabase();

    // Setup test data
    // ... create test users, companies, etc.

    // Login
    authToken = await authHelper.login('test@test.com', 'Password123!');
  });

  afterAll(async () => {
    await dbHelper.close();
    await app.close();
  });

  describe('GET /api/v1/my-endpoint', () => {
    it('should return data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/my-endpoint')
        .set(authHelper.createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });
});
```

---

## 🎯 Postman/Newman Testing

### Generate Postman Collection

```bash
# Generate Postman collection from API
cd scripts
npx ts-node generate-postman-tests.ts
```

This creates [`postman-collection.json`](postman-collection.json) with all endpoints.

### Use in Postman

1. Open Postman
2. Import → `postman-collection.json`
3. Run "Login" request first (saves token)
4. Run other requests (auto-use saved token)

### Use with Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run postman-collection.json

# Run with environment
newman run postman-collection.json -e postman-environment.json

# Run with HTML report
newman run postman-collection.json -r html
```

---

## 📈 Test Coverage

### View Coverage Report

```bash
# Run tests with coverage
pnpm test:e2e --coverage

# Open coverage report
open coverage/e2e/lcov-report/index.html
```

### Coverage Goals

- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

---

## 🐛 Debugging Tests

### Enable Verbose Logging

```bash
# Run with debug output
DEBUG=* pnpm test:e2e

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand test/e2e/auth.e2e-spec.ts
```

### View Database State During Tests

```bash
# Connect to test database
docker exec -it demi-postgres-test psql -U test -d demi_test

# List tables
\dt

# Query data
SELECT * FROM agents;
```

### Common Issues

#### Database Connection Failed

```bash
# Check if database is running
docker compose -f docker-compose.test.yml ps

# Check logs
docker compose -f docker-compose.test.yml logs postgres-test
```

#### Tests Timeout

```bash
# Increase timeout in jest-e2e.json
{
  "testTimeout": 120000  // 2 minutes
}
```

#### Port Already in Use

```bash
# Check what's using port 5433
lsof -i :5433

# Kill process or change port in docker-compose.test.yml
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Start test database
        run: docker compose -f docker-compose.test.yml up -d

      - name: Wait for database
        run: sleep 10

      - name: Run E2E tests
        run: pnpm test:e2e --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/e2e/lcov.info
```

---

## 📚 Best Practices

### 1. Clean Database Between Tests

```typescript
beforeEach(async () => {
  await dbHelper.cleanDatabase();
});
```

### 2. Use Test Data Factories

```typescript
// ✅ Good
const company = TestDataFactory.createCompanyData();

// ❌ Bad - hardcoded data
const company = { name: 'Test', email: 'test@test.com' };
```

### 3. Test Error Cases

```typescript
it('should reject invalid data', async () => {
  await request(app.getHttpServer())
    .post('/api/v1/companies')
    .send({ name: '' })  // Invalid
    .expect(400);
});
```

### 4. Test Authorization

```typescript
it('should reject unauthorized requests', async () => {
  await request(app.getHttpServer())
    .get('/api/v1/companies')
    .expect(401);  // No token
});
```

### 5. Use Descriptive Test Names

```typescript
// ✅ Good
it('should create company with valid data', () => {});
it('should reject duplicate company email', () => {});

// ❌ Bad
it('test 1', () => {});
it('works', () => {});
```

---

## 🎓 Learning Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/)

---

## ✅ Checklist

Before committing code:

- [ ] All E2E tests pass
- [ ] Coverage is above 70%
- [ ] New endpoints have tests
- [ ] Error cases are tested
- [ ] Auth/permissions are tested
- [ ] Database is cleaned between tests

---

## 🤝 Need Help?

- **Issues**: Report at [GitHub Issues](https://github.com/your-repo/issues)
- **Questions**: Check [TESTING_QUICK_START.md](TESTING_QUICK_START.md)
- **Examples**: See [`test/e2e/`](test/e2e/) for examples

---

**Happy Testing! 🧪**
