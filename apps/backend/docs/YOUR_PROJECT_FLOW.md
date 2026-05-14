# Your EMI Management System - Complete Flow

## 🎯 Understanding Your Project Structure

This document explains how data flows through YOUR specific project with real examples.

---

## 📊 Complete Request Flow Diagram

```mermaid
graph LR
    A[Mobile App] -->|POST /api/v1/clients| B[main.ts]
    B --> C[Global Middleware]
    C --> D{Auth Type?}
    D -->|JWT Token| E[JwtAuthGuard]
    D -->|Device Signature| F[DeviceSignatureGuard]
    E --> G[ValidationPipe]
    F --> G
    G --> H[ClientController]
    H --> I[ClientService]
    I --> J[TypeORM Repository]
    J --> K[PostgreSQL]
    K --> J
    J --> I
    I --> L[CryptoUtil]
    L --> I
    I --> H
    H --> M[TransformInterceptor]
    M --> N[Response to App]
```

---

## 🔄 Example 1: User Login Flow

### Request Journey

**1. User opens app and logs in**

```typescript
// Request from User App
POST /api/v1/auth/login
{
  "email": "user@company.com",
  "password": "SecurePass123!"
}
```

**2. Enters main.ts**
```typescript
// src/main.ts
// Global prefix adds: /api/v1
// Validation pipe enabled globally
// Exception filter catches errors
```

**3. Hits AuthController**
```typescript
// src/modules/auth/auth.controller.ts

@Controller('auth')
export class AuthController {
  @Public()  // ← No JWT needed for login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // ↓ LoginDto auto-validates email & password
    return this.authService.login(loginDto);
  }
}
```

**4. ValidationPipe validates LoginDto**
```typescript
// src/modules/auth/dto/login.dto.ts

export class LoginDto {
  @IsEmail()  // ← Validates email format
  email: string;

  @IsString()
  @MinLength(8)  // ← Validates password length
  password: string;
}

// If validation fails → Returns 400 Bad Request automatically
// If validation passes → Controller method executes
```

**5. AuthService processes login**
```typescript
// src/modules/auth/auth.service.ts

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    // 1. Find user by email
    const user = await this.agentRepository.findOne({
      where: { email: loginDto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password (bcrypt)
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Check if 2FA enabled
    if (user.twoFactorEnabled) {
      // Generate OTP and return temp token
      const otp = CryptoUtil.generateOTP();
      // ... save OTP to database
      return {
        tempToken: 'temp-jwt-token',
        message: '2FA required',
        otpSent: true
      };
    }

    // 4. Generate JWT tokens
    const accessToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '7d' }
    );

    // 5. Save refresh token to database
    await this.agentRepository.update(user.id, { refreshToken });

    // 6. Return tokens
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}
```

**6. Response flows back**
```typescript
// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@company.com",
    "role": "user"
  }
}
```

---

## 🔄 Example 2: Create Client (Zero-Touch Provisioning)

### Request Journey

**1. User creates client from app**

```typescript
// Request from User App (with JWT token)
POST /api/v1/clients
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Body: {
  "imei1": "123456789012345",
  "brand": "Samsung",
  "ram": "8GB",
  "storage": "128GB",
  "modelName": "Galaxy A52",
  "clientName": "Customer Name",
  "clientPhone1": "+919876543210",
  "profileUrl": "https://s3.../photo.jpg",
  "totalAmount": 25000,
  "downPayment": 5000,
  "numberOfEmi": 12,
  "emiAmount": 1666.67,
  "documents": {
    "aadhar1": "https://s3.../aadhar_front.jpg",
    "aadhar2": "https://s3.../aadhar_back.jpg",
    "selfie": "https://s3.../selfie.jpg"
  }
}
```

**2. JwtAuthGuard validates token**
```typescript
// src/common/guards/jwt-auth.guard.ts

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 1. Extract token from Authorization header
    // 2. Verify JWT signature
    // 3. Check expiration
    // 4. Attach user to request.user
    return super.canActivate(context);
  }
}
```

**3. ValidationPipe validates CreateClientDto**
```typescript
// src/modules/client/dto/create-client.dto.ts

export class CreateClientDto {
  @IsString()
  @MinLength(15)
  @MaxLength(15)
  imei1: string;  // ← Validates IMEI length

  @IsPhoneNumber('IN')
  clientPhone1: string;  // ← Validates Indian phone format

  @IsNumber()
  @Min(0)
  totalAmount: number;  // ← Validates positive number

  // ... etc.
}
```

**4. ClientController receives request**
```typescript
// src/modules/client/client.controller.ts

@Controller('clients')
@UseGuards(JwtAuthGuard)  // ← All routes need JWT
export class ClientController {
  @Post()
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: User  // ← Custom decorator extracts user from JWT
  ) {
    return this.clientService.create(createClientDto, user);
  }
}
```

**5. ClientService creates client**
```typescript
// src/modules/client/client.service.ts

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private configService: ConfigService,
  ) {}

  async create(createClientDto: CreateClientDto, user: User) {
    // 1. Check user has available balance
    if (user.balance < 1) {
      throw new BadRequestException('Insufficient balance');
    }

    // 2. Generate 256-char unique code (for QR)
    const uniqueCode = CryptoUtil.generateSecureCode(256);

    // 3. Create client record
    const client = this.clientRepository.create({
      ...createClientDto,
      uniqueCode,
      userId: user.id,
      companyId: user.companyId,
      status: ClientStatus.DEVICE_NOT_REGISTERED,
    });

    // 4. Save to database
    await this.clientRepository.save(client);

    // 5. Deduct 1 from user balance
    await this.agentRepository.decrement(
      { id: user.id },
      'balance',
      1
    );

    // 6. Create balance sheet entry
    await this.balanceSheetService.create({
      type: BalanceSheetType.KEY_USE,
      amount: -1,
      userId: user.id,
      clientId: client.id,
    });

    // 7. Generate QR code data
    const qrCodeData = CryptoUtil.generateQRCodeData({
      uniqueCode: client.uniqueCode,
      companyId: client.companyId,
      imei1: client.imei1,
      imei2: client.imei2,
      serverUrl: this.configService.get('APP_URL'),
    });

    // 8. Return response with QR data
    return {
      clientId: client.id,
      uniqueCode: client.uniqueCode,
      companyId: client.companyId,
      imei1: client.imei1,
      status: client.status,
      qrCodeData: JSON.parse(qrCodeData),
      createdAt: client.createdAt,
    };
  }
}
```

**6. Response**
```json
{
  "clientId": "uuid-1234",
  "uniqueCode": "256-character-unique-code...",
  "companyId": "company-uuid",
  "imei1": "123456789012345",
  "status": "deviceNotRegistered",
  "qrCodeData": {
    "uniqueCode": "256-character-unique-code...",
    "companyId": "company-uuid",
    "imei1": "123456789012345",
    "serverUrl": "https://api.yourservice.com",
    "version": "1.0"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**7. User app generates and displays QR code**

---

## 🔄 Example 3: Device Registration (Zero-Touch)

### Request Journey

**1. Customer device scans QR code and sends registration**

```typescript
// Request from Customer Device App (NO JWT - uses headers)
POST /api/v1/clients/register-device
Headers: {
  X-Unique-Code: "256-character-unique-code...",
  X-Company-Id: "company-uuid"
}
Body: {
  "imei1": "123456789012345",  // Actual device IMEI
  "imei2": "123456789012346",
  "deviceInfo": {
    "brand": "Samsung",
    "model": "SM-A525F",
    "androidVersion": "12",
    "sdkVersion": 31,
    "manufacturer": "Samsung",
    "serialNumber": "RF8N1234567",
    "deviceId": "android-device-id"
  },
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjAN...\n-----END PUBLIC KEY-----"
}
```

**2. NO Guard (public endpoint)**
```typescript
// This endpoint is public - no JWT required
// Will use headers for initial validation
```

**3. ClientController handles registration**
```typescript
@Public()  // ← No JWT needed
@Post('register-device')
async registerDevice(
  @Headers('x-unique-code') uniqueCode: string,
  @Headers('x-company-id') companyId: string,
  @Body() registerDto: RegisterDeviceDto,
) {
  return this.clientService.registerDevice(
    uniqueCode,
    companyId,
    registerDto
  );
}
```

**4. ClientService processes registration**
```typescript
async registerDevice(
  uniqueCode: string,
  companyId: string,
  registerDto: RegisterDeviceDto,
) {
  // 1. Find client by uniqueCode
  const client = await this.clientRepository.findOne({
    where: { uniqueCode, companyId }
  });

  if (!client) {
    throw new NotFoundException('Invalid registration code');
  }

  // 2. Check if already registered
  if (client.status !== ClientStatus.DEVICE_NOT_REGISTERED) {
    throw new BadRequestException('Device already registered');
  }

  // 3. Compare IMEI numbers
  const imeiMatch = client.imei1 === registerDto.imei1;

  if (!imeiMatch) {
    // IMEI mismatch - return warning
    return {
      status: 'imei_mismatch_confirmation_required',
      storedImei1: client.imei1,
      actualImei1: registerDto.imei1,
      requiresConfirmation: true,
      message: 'IMEI mismatch detected. Please confirm to proceed.'
    };
  }

  // 4. Generate server RSA key pair
  const { publicKey, privateKey } = CryptoUtil.generateRSAKeyPair();

  // 5. Generate deviceUniqueCode (256 chars)
  const deviceUniqueCode = CryptoUtil.generateSecureCode(256);

  // 6. Encrypt server private key with AES
  const encryptedPrivateKey = CryptoUtil.encryptAES(
    privateKey,
    this.configService.get('AES_SECRET_KEY')
  );

  // 7. Update client record
  await this.clientRepository.update(client.id, {
    deviceUniqueCode,
    devicePublicKey: registerDto.publicKey,
    serverPublicKey: publicKey,
    serverPrivateKey: encryptedPrivateKey,
    actualImei1: registerDto.imei1,
    actualImei2: registerDto.imei2,
    ...registerDto.deviceInfo,
    status: ClientStatus.DEVICE_VERIFIED,
    deviceRegisteredAt: new Date(),
  });

  // 8. Create audit log
  await this.auditService.create({
    action: AuditAction.DEVICE_REGISTERED,
    entityId: client.id,
    entityType: 'client',
  });

  // 9. Send push notification to user
  await this.notificationService.sendPush(client.userId, {
    title: 'Device Registered',
    body: `Device for ${client.clientName} registered successfully`,
  });

  // 10. Return device credentials
  return {
    status: 'success',
    deviceUniqueCode,
    serverPublicKey: publicKey,
    clientId: client.id,
    message: 'Device registered successfully'
  };
}
```

**5. Device stores credentials**
```typescript
// Device app stores in secure storage:
// - deviceUniqueCode (for authentication)
// - serverPublicKey (to verify server responses)
// - devicePrivateKey (already generated, kept in Android Keystore)
```

---

## 🔄 Example 4: Device Sync (Signature Authentication)

### Request Journey

**1. Device sends sync request**

```typescript
// Request from Customer Device App
POST /api/v1/clients/uuid-1234/sync

// Headers with signature authentication
Headers: {
  X-Device-Unique-Code: "256-char-device-code",
  X-Client-Id: "uuid-1234",
  X-Timestamp: "2024-01-01T12:00:00.000Z",
  X-Signature: "base64-encoded-rsa-signature"
}

// Signature calculation on device:
const payload = `POST:/api/v1/clients/uuid-1234/sync:2024-01-01T12:00:00.000Z:{}`;
const signature = rsaSign(payload, devicePrivateKey);
```

**2. DeviceSignatureGuard validates**
```typescript
// src/common/guards/device-signature.guard.ts

@Injectable()
export class DeviceSignatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract headers
    const deviceUniqueCode = request.headers['x-device-unique-code'];
    const clientId = request.headers['x-client-id'];
    const timestamp = request.headers['x-timestamp'];
    const signature = request.headers['x-signature'];

    // 2. Find client
    const client = await this.clientRepository.findOne({
      where: { id: clientId }
    });

    // 3. Verify deviceUniqueCode matches
    if (client.deviceUniqueCode !== deviceUniqueCode) {
      throw new UnauthorizedException('Invalid device code');
    }

    // 4. Check timestamp (5-minute window)
    const requestTime = new Date(timestamp);
    const now = new Date();
    const diff = Math.abs(now.getTime() - requestTime.getTime());

    if (diff > 5 * 60 * 1000) {  // 5 minutes
      throw new UnauthorizedException('Request expired');
    }

    // 5. Reconstruct payload
    const method = request.method;
    const path = request.url;
    const body = JSON.stringify(request.body);
    const payload = `${method}:${path}:${timestamp}:${body}`;

    // 6. Verify signature using device's public key
    const isValid = this.verifySignature(
      payload,
      signature,
      client.devicePublicKey
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 7. Attach client to request
    request.client = client;

    // 8. Update last sync time
    await this.clientRepository.update(client.id, {
      lastDeviceSyncAt: new Date()
    });

    return true;
  }
}
```

**3. Controller receives authenticated request**
```typescript
@UseGuards(DeviceSignatureGuard)  // ← Signature auth
@Post(':id/sync')
async syncDevice(@CurrentClient() client: Client) {
  // client is automatically attached by guard
  return this.deviceService.sync(client);
}
```

---

## 📂 Your Project File Organization

```
src/
├── common/                          # Shared across all modules
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # For user APIs
│   │   └── device-signature.guard.ts  # For device APIs
│   ├── decorators/
│   │   ├── public.decorator.ts     # @Public() - skip JWT
│   │   └── current-user.decorator.ts  # @CurrentUser() & @CurrentClient()
│   ├── utils/
│   │   └── crypto.util.ts          # RSA, AES, OTP utilities
│   └── enums/
│       └── index.ts                # All enums
│
├── modules/
│   ├── auth/                       # Authentication module
│   │   ├── dto/
│   │   │   └── login.dto.ts       # Login validation
│   │   ├── auth.controller.ts     # Login, refresh, reset endpoints
│   │   ├── auth.service.ts        # JWT generation, validation
│   │   └── auth.module.ts         # Auth module config
│   │
│   ├── client/                     # Client & device management
│   │   ├── dto/
│   │   │   ├── create-client.dto.ts      # Client creation
│   │   │   └── register-device.dto.ts    # Device registration
│   │   ├── entities/
│   │   │   └── client.entity.ts   # Database model
│   │   ├── client.controller.ts   # HTTP endpoints
│   │   ├── client.service.ts      # Business logic
│   │   └── client.module.ts       # Module config
│   │
│   ├── company/                    # Company management
│   ├── user/                      # User management
│   ├── otp/                        # OTP generation & validation
│   └── ... (other modules)
│
├── config/
│   ├── database.config.ts         # PostgreSQL settings
│   └── validation.schema.ts       # Environment validation
│
├── app.module.ts                  # Root module (imports all)
└── main.ts                        # Entry point
```

---

## 🎯 How to Add a New Feature

### Example: Add "Mark Client as Paid"

**1. Add DTO**
```typescript
// src/modules/client/dto/mark-paid.dto.ts
export class MarkPaidDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  emiNumber: number;
}
```

**2. Add Service Method**
```typescript
// src/modules/client/client.service.ts
async markEmiPaid(clientId: string, markPaidDto: MarkPaidDto) {
  const client = await this.findOne(clientId);

  // Update paid EMIs
  client.paidEmis += 1;
  client.remainingAmount -= client.emiAmount;

  await this.clientRepository.save(client);

  // Create balance sheet entry
  await this.balanceSheetService.create({
    type: BalanceSheetType.EMI_PAYMENT,
    amount: client.emiAmount,
    clientId: client.id,
  });

  return client;
}
```

**3. Add Controller Endpoint**
```typescript
// src/modules/client/client.controller.ts
@Patch(':id/mark-paid')
@UseGuards(JwtAuthGuard)
async markPaid(
  @Param('id') id: string,
  @Body() markPaidDto: MarkPaidDto,
) {
  return this.clientService.markEmiPaid(id, markPaidDto);
}
```

**Done!** The endpoint is now available at:
```
PATCH /api/v1/clients/:id/mark-paid
```

---

## 🔍 Debugging Your Project

### 1. Check if endpoint is registered
```bash
# Start dev server
pnpm start:dev

# Visit Swagger docs
open http://localhost:3000/api/docs
# All endpoints should be listed here
```

### 2. Check database queries
```typescript
// Enable logging in database config
logging: true,  // Shows all SQL queries in console
```

### 3. Check validation errors
```typescript
// Validation errors are automatically returned as:
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 4. Check authentication
```typescript
// JWT errors
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// Add logging in guards to debug
console.log('Token:', request.headers.authorization);
```

---

## 🎓 Key Takeaways

1. **Request Flow**: Client → Guards → Validation → Controller → Service → Repository → Database
2. **Two Auth Types**:
   - JWT for agents (login with email/password)
   - Signature for devices (cryptographic keys)
3. **Auto-validation**: DTOs validate automatically via ValidationPipe
4. **Modular Structure**: Each feature is self-contained module
5. **Dependency Injection**: Services injected via constructor
6. **TypeORM**: Handles all database operations
7. **Swagger**: Auto-generates API documentation

Your project is ready to implement business logic! Focus on one module at a time, starting with Auth and Client modules.
