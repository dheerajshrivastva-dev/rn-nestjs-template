# RBAC (Role-Based Access Control) Guide

## Overview

Your NestJS backend now has a complete RBAC system with 4 role levels and ownership validation.

## Role Hierarchy

```
SUPER_ADMIN (Platform Admin)
    ↓
OWNER (Company Owner)
    ↓
ADMIN (Company Admin)
    ↓
AGENT (Field User)
```

### Role Permissions

| Role | Can Do |
|------|--------|
| **SUPER_ADMIN** | • Create/manage companies<br>• Access ALL data across ALL companies<br>• Manage all agents<br>• Full system access |
| **OWNER** | • CRUD all agents in their company<br>• CRUD all clients in their company<br>• View company dashboard<br>• Manage company settings |
| **ADMIN** | • View agents in their company<br>• CRUD their own clients<br>• View company dashboard |
| **AGENT** | • View their own profile<br>• CRUD their own clients<br>• Cannot access other agents' data |

---

## Three Types of Guards

### 1. **JwtAuthGuard** - Authentication
Verifies the user is logged in (has valid JWT token).

```typescript
// Applied GLOBALLY in app.module.ts
// All routes require authentication by default

// To bypass authentication (public routes):
@Public()
@Post('login')
async login() { ... }
```

### 2. **RolesGuard** - Role-Based Authorization
Checks if the user has the required role(s).

```typescript
@Roles(AgentRole.OWNER, AgentRole.ADMIN)
@Get('agents')
async getAllAgents() {
  // Only OWNER and ADMIN can access
  // SUPER_ADMIN can always access (bypasses check)
}
```

### 3. **OwnershipGuard** - Resource Ownership
Ensures agents can only access resources within their company.

```typescript
@UseGuards(JwtAuthGuard, OwnershipGuard)
@Get('clients/:clientId')
async getClient(@Param('clientId') clientId: string) {
  // SUPER_ADMIN: Can access any client
  // OWNER: Can access any client in their company
  // ADMIN/AGENT: Can only access their own clients
}
```

---

## Usage Examples

### Example 1: User Controller

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { OwnershipGuard } from '@/common/guards/ownership.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentRole } from '@/common/enums';
import { User } from './entities/user.entity';

@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard) // All routes need auth + role check
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // Only OWNER and SUPER_ADMIN can view all agents
  @Roles(AgentRole.OWNER)
  @Get()
  async getAllAgents(@CurrentUser() user: User) {
    // Returns all agents in user's company (filtered by service)
    return this.agentService.findAll(user.companyId);
  }

  // Any authenticated user can view their own profile
  @Get('me')
  async getMyProfile(@CurrentUser() user: User) {
    return user;
  }

  // OWNER can view any user in their company
  @Roles(AgentRole.OWNER)
  @UseGuards(OwnershipGuard)
  @Get(':userId')
  async getAgent(@Param('userId') userId: string) {
    return this.agentService.findOne(userId);
  }

  // Only OWNER can create new agents
  @Roles(AgentRole.OWNER)
  @Post()
  async createAgent(@Body() createAgentDto: CreateAgentDto, @CurrentUser() user: User) {
    return this.agentService.create({
      ...createAgentDto,
      companyId: user.companyId, // Ensure same company
    });
  }

  // OWNER can update any user, others can update themselves
  @UseGuards(OwnershipGuard)
  @Patch(':userId')
  async updateAgent(
    @Param('userId') userId: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentService.update(userId, updateAgentDto);
  }

  // Only OWNER can delete agents
  @Roles(AgentRole.OWNER)
  @UseGuards(OwnershipGuard)
  @Delete(':userId')
  async deleteAgent(@Param('userId') userId: string) {
    return this.agentService.remove(userId);
  }
}
```

### Example 2: Client Controller

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { OwnershipGuard } from '@/common/guards/ownership.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentRole } from '@/common/enums';
import { User } from '../user/entities/user.entity';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // OWNER sees all company clients, others see their own
  @Get()
  async getAllClients(@CurrentUser() user: User) {
    if (user.role === AgentRole.OWNER) {
      return this.clientService.findByCompany(user.companyId);
    }
    return this.clientService.findByAgent(user.id);
  }

  // Anyone can create a client (will be assigned to them)
  @Post()
  async createClient(@Body() createClientDto: CreateClientDto, @CurrentUser() user: User) {
    return this.clientService.create({
      ...createClientDto,
      userId: user.id,
      companyId: user.companyId,
    });
  }

  // Ownership check ensures proper access
  @UseGuards(OwnershipGuard)
  @Get(':clientId')
  async getClient(@Param('clientId') clientId: string) {
    return this.clientService.findOne(clientId);
  }

  // Ownership check ensures proper access
  @UseGuards(OwnershipGuard)
  @Patch(':clientId')
  async updateClient(
    @Param('clientId') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(clientId, updateClientDto);
  }

  // Only OWNER can delete clients
  @Roles(AgentRole.OWNER)
  @UseGuards(OwnershipGuard)
  @Delete(':clientId')
  async deleteClient(@Param('clientId') clientId: string) {
    return this.clientService.remove(clientId);
  }
}
```

### Example 3: Company Controller (SUPER_ADMIN only)

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AgentRole } from '@/common/enums';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AgentRole.SUPER_ADMIN) // ALL routes require SUPER_ADMIN
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getAllCompanies() {
    return this.companyService.findAll();
  }

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get(':id')
  async getCompany(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  async updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
```

---

## Service Layer Filtering

Guards protect routes, but services should also filter data by company:

```typescript
@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  // Filter by company for OWNER
  async findByCompany(companyId: string): Promise<Client[]> {
    return this.clientRepository.find({
      where: { companyId },
      relations: ['user', 'company'],
    });
  }

  // Filter by user for ADMIN/AGENT
  async findByAgent(userId: string): Promise<Client[]> {
    return this.clientRepository.find({
      where: { userId },
      relations: ['user', 'company'],
    });
  }

  // Create with proper ownership
  async create(createClientDto: CreateClientDto & { userId: string; companyId: string }) {
    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }
}
```

---

## Guard Combination Patterns

### Pattern 1: Public Route
```typescript
@Public() // No authentication required
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### Pattern 2: Authenticated Only
```typescript
// No decorator needed - JwtAuthGuard is global
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Pattern 3: Role-Based
```typescript
@Roles(AgentRole.OWNER, AgentRole.ADMIN)
@Get('dashboard')
getDashboard() {
  return { ... };
}
```

### Pattern 4: Role + Ownership
```typescript
@Roles(AgentRole.OWNER) // Must be OWNER
@UseGuards(OwnershipGuard) // And must own the resource
@Delete('agents/:userId')
deleteAgent(@Param('userId') id: string) {
  return this.agentService.remove(id);
}
```

### Pattern 5: Ownership Only (any authenticated user)
```typescript
@UseGuards(OwnershipGuard)
@Get('clients/:clientId')
getClient(@Param('clientId') id: string) {
  // OWNER can access any client in company
  // AGENT can only access their own clients
  return this.clientService.findOne(id);
}
```

---

## How OwnershipGuard Works

### For User Resources (`/agents/:userId`)

```
SUPER_ADMIN → ✅ Always allowed
OWNER → ✅ If user.companyId === user.companyId
ADMIN/AGENT → ✅ If userId === user.id (own profile only)
```

### For Client Resources (`/clients/:clientId`)

```
SUPER_ADMIN → ✅ Always allowed
OWNER → ✅ If client.companyId === user.companyId
ADMIN/AGENT → ✅ If client.userId === user.id (own clients only)
```

---

## Testing RBAC

### Create Test Users

```typescript
// In a seed script or test setup
const superAdmin = await agentRepository.save({
  email: 'superadmin@platform.com',
  password: await bcrypt.hash('password', 10),
  role: AgentRole.SUPER_ADMIN,
  companyId: null, // No company association
});

const owner = await agentRepository.save({
  email: 'owner@company1.com',
  password: await bcrypt.hash('password', 10),
  role: AgentRole.OWNER,
  companyId: company1.id,
});

const user = await agentRepository.save({
  email: 'user@company1.com',
  password: await bcrypt.hash('password', 10),
  role: AgentRole.AGENT,
  companyId: company1.id,
});
```

### Test with cURL

```bash
# Login as owner
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@company1.com","password":"password"}'

# Save the accessToken
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get all agents (should work for OWNER)
curl -X GET http://localhost:3000/api/v1/agents \
  -H "Authorization: Bearer $TOKEN"

# Try as AGENT (should fail with 403)
curl -X GET http://localhost:3000/api/v1/agents \
  -H "Authorization: Bearer $AGENT_TOKEN"
```

---

## Best Practices

### 1. **Apply Guards in Order**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
// Order matters: Auth → Role → Ownership
```

### 2. **Use @Public() for Public Routes**
```typescript
@Public()
@Post('login')
@Post('register')
@Get('health')
```

### 3. **Filter in Service Layer**
Don't rely solely on guards - also filter in services:
```typescript
async findAll(user: User) {
  if (user.role === AgentRole.OWNER) {
    return this.repo.find({ where: { companyId: user.companyId } });
  }
  return this.repo.find({ where: { userId: user.id } });
}
```

### 4. **Use @CurrentUser() Decorator**
```typescript
@Get('profile')
getProfile(@CurrentUser() user: User) {
  // user is automatically injected from JWT
}
```

### 5. **Handle SUPER_ADMIN Properly**
```typescript
// SUPER_ADMIN should bypass company filters
if (user.role !== AgentRole.SUPER_ADMIN) {
  query.andWhere('companyId = :companyId', { companyId: user.companyId });
}
```

---

## Error Messages

| Error | Status | Meaning |
|-------|--------|---------|
| `No authenticated user found` | 403 | JwtAuthGuard failed - invalid token |
| `Access denied. Required roles: owner` | 403 | RolesGuard failed - insufficient role |
| `Cannot access agents from other companies` | 403 | OwnershipGuard failed - wrong company |
| `You can only access your own clients` | 403 | OwnershipGuard failed - not your resource |
| `User not found` | 404 | Resource doesn't exist |

---

## Summary

✅ **Authentication**: JwtAuthGuard (applied globally)
✅ **Authorization**: RolesGuard (check user role)
✅ **Ownership**: OwnershipGuard (check company/user ownership)
✅ **4 Roles**: SUPER_ADMIN, OWNER, ADMIN, AGENT
✅ **Company Isolation**: Agents can't cross company boundaries
✅ **Flexible**: Use `@Public()`, `@Roles()`, and `@UseGuards()` as needed

Your RBAC system is production-ready! 🚀
