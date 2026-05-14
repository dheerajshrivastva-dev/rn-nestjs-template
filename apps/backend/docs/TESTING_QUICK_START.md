# Testing Quick Start Guide

**Get testing up and running in 30 minutes**

---

## Step 1: Set Up Test Database (5 minutes)

### Create docker-compose.test.yml

```bash
cat > docker-compose.test.yml << 'EOF'
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    container_name: demi-redis-test
    ports:
      - '6380:6379'
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres-test-data:
EOF
```

### Start test database

```bash
docker compose -f docker-compose.test.yml up -d
```

### Create .env.test

```bash
cat > .env.test << 'EOF'
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

# JWT
JWT_SECRET=test-secret-key-for-testing-only-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# OTP
OTP_VALIDITY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=10
OTP_RATE_LIMIT_MAX_REQUESTS=5
OTP_COOLDOWN_MINUTES=15

# AES Encryption
AES_SECRET_KEY=test-aes-key-32-characters-min

# Device Signature
DEVICE_SIGNATURE_EXPIRY_MINUTES=5
EOF
```

---

## Step 2: Create Test Helpers (10 minutes)

### Create test directory structure

```bash
mkdir -p test/helpers test/fixtures test/e2e
```

### Create test/setup.ts

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.test' });

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
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
};

export const cleanupTestDatabase = async (dataSource: DataSource) => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.dropDatabase();
    await dataSource.destroy();
  }
};
```

### Create test/helpers/mock-factories.ts

```typescript
export class MockRepository<T = any> {
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
      'otp.rateLimitWindow': 10,
      'otp.rateLimitMaxRequests': 5,
      'otp.cooldownMinutes': 15,
    };
    return config[key];
  });
}
```

### Create test/helpers/create-test-user.ts

```typescript
import { Repository } from 'typeorm';
import { User } from '@/modules/user/user.entity';
import { AgentRole, UserStatus } from '@/common/enums';
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
    isEmailVerified: true,
    isPhoneVerified: true,
    balance: 0,
    activeClients: 0,
  };

  return agentRepository.save({ ...defaultAgent, ...overrides });
};
```

### Create test/helpers/create-test-company.ts

```typescript
import { Repository } from 'typeorm';
import { Company } from '@/modules/company/company.entity';
import { Address } from '@/common/entities/address.entity';

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

---

## Step 3: Update Jest Configuration (5 minutes)

### Update jest.config.js (already exists)

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
  },
};
```

### Create jest-integration.config.js

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
  ],
  coverageDirectory: '../coverage/integration',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
};
```

### Create jest-e2e.config.js

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
  testTimeout: 60000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
};
```

### Update package.json scripts

```json
{
  "scripts": {
    "test": "jest --config jest.config.js",
    "test:watch": "jest --config jest.config.js --watch",
    "test:cov": "jest --config jest.config.js --coverage",
    "test:integration": "jest --config jest-integration.config.js",
    "test:integration:watch": "jest --config jest-integration.config.js --watch",
    "test:integration:cov": "jest --config jest-integration.config.js --coverage",
    "test:e2e": "jest --config jest-e2e.config.js",
    "test:e2e:watch": "jest --config jest-e2e.config.js --watch",
    "test:e2e:cov": "jest --config jest-e2e.config.js --coverage",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e",
    "test:db:up": "docker compose -f docker-compose.test.yml up -d",
    "test:db:down": "docker compose -f docker-compose.test.yml down -v"
  }
}
```

---

## Step 4: Write Your First Test (10 minutes)

### Create src/common/utils/crypto.util.spec.ts

```typescript
import { generateOtp, hashPassword, comparePassword } from './crypto.util';

describe('CryptoUtil', () => {
  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = generateOtp();
      const otp2 = generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Password123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Due to salt
    });
  });

  describe('comparePassword', () => {
    it('should return true when password matches hash', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'Password123!';
      const wrongPassword = 'WrongPassword!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });
  });
});
```

### Run your first test

```bash
npm test
```

You should see output like:
```
PASS  src/common/utils/crypto.util.spec.ts
  CryptoUtil
    generateOtp
      ✓ should generate a 6-digit OTP (5 ms)
      ✓ should generate different OTPs on multiple calls (1 ms)
    hashPassword
      ✓ should hash a password (150 ms)
      ✓ should generate different hashes for same password (140 ms)
    comparePassword
      ✓ should return true when password matches hash (145 ms)
      ✓ should return false when password does not match hash (140 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## Step 5: Write Your First Service Test (Coming Next)

### Example: OtpService Unit Test

Create `src/modules/otp/otp.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { Otp } from './otp.entity';
import { OtpRateLimit } from './otp-rate-limit.entity';
import { MockRepository } from '../../../test/helpers/mock-factories';
import { OtpType, OtpRecipientType } from '@/common/enums';
import { BadRequestException } from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;
  let otpRepository: MockRepository<Otp>;
  let rateLimitRepository: MockRepository<OtpRateLimit>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(Otp),
          useClass: MockRepository,
        },
        {
          provide: getRepositoryToken(OtpRateLimit),
          useClass: MockRepository,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpRepository = module.get(getRepositoryToken(Otp));
    rateLimitRepository = module.get(getRepositoryToken(OtpRateLimit));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate and save OTP', async () => {
      const recipientId = 'test-user-id';
      const otpType = OtpType.LOGIN_2FA;
      const recipientType = OtpRecipientType.AGENT;

      rateLimitRepository.findOne.mockResolvedValue(null); // No rate limit
      otpRepository.save.mockResolvedValue({ id: 'otp-id', otpCode: '123456' });

      const result = await service.generateOtp(recipientId, otpType, recipientType);

      expect(result).toBeDefined();
      expect(otpRepository.save).toHaveBeenCalled();
    });

    it('should throw error when in cooldown', async () => {
      const recipientId = 'test-user-id';
      const otpType = OtpType.LOGIN_2FA;
      const recipientType = OtpRecipientType.AGENT;

      rateLimitRepository.findOne.mockResolvedValue({
        isInCooldown: true,
        cooldownUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      await expect(
        service.generateOtp(recipientId, otpType, recipientType),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP', async () => {
      const otpCode = '123456';
      const recipientId = 'test-user-id';

      otpRepository.findOne.mockResolvedValue({
        id: 'otp-id',
        otpCode: await hashPassword(otpCode), // Assume hashPassword is imported
        isUsed: false,
        isExpired: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attemptCount: 0,
      });

      const result = await service.verifyOtp(otpCode, recipientId, OtpType.LOGIN_2FA);

      expect(result).toBe(true);
      expect(otpRepository.update).toHaveBeenCalledWith(
        'otp-id',
        expect.objectContaining({ isUsed: true }),
      );
    });

    it('should reject expired OTP', async () => {
      const otpCode = '123456';
      const recipientId = 'test-user-id';

      otpRepository.findOne.mockResolvedValue({
        id: 'otp-id',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // Expired
      });

      await expect(
        service.verifyOtp(otpCode, recipientId, OtpType.LOGIN_2FA),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

---

## Quick Commands Reference

```bash
# Start test database
npm run test:db:up

# Stop test database
npm run test:db:down

# Run unit tests
npm test

# Run unit tests with coverage
npm run test:cov

# Run unit tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test:all

# Format code
npm run format

# Lint code
npm run lint
```

---

## Next Steps

1. ✅ Complete Step 1-4 above
2. ✅ Run your first test and see it pass
3. 📖 Read [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for full strategy
4. 📝 Start writing tests for:
   - `src/modules/otp/otp.service.spec.ts`
   - `src/modules/auth/auth.service.spec.ts`
   - `src/modules/user/user.service.spec.ts`
   - `src/modules/company/company.service.spec.ts`

---

## Troubleshooting

### Tests fail with "Cannot find module '@/...'"

**Solution:** Ensure `moduleNameMapper` in `jest.config.js` matches your `tsconfig.json` paths.

### Tests fail with database connection errors

**Solution:** Ensure test database is running:
```bash
docker compose -f docker-compose.test.yml ps
```

### Tests are slow

**Solution:** Use `--maxWorkers=50%` to limit parallel workers:
```bash
npm test -- --maxWorkers=50%
```

### Coverage not showing

**Solution:** Run tests with coverage flag:
```bash
npm run test:cov
```

---

**Ready to start testing? Run the commands above and you're good to go! 🚀**
