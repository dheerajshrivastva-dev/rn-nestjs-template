# NestJS Cheat Sheet - Quick Reference

## 🚀 Common Commands

```bash
# Generate files
nest g module modules/product        # Create module
nest g controller modules/product    # Create controller
nest g service modules/product       # Create service
nest g class modules/product/dto/create-product.dto --no-spec

# Run application
pnpm start:dev                       # Development with watch
pnpm start:debug                     # Debug mode
pnpm build                           # Build for production
pnpm start:prod                      # Run production build

# Testing
pnpm test                            # Run unit tests
pnpm test:watch                      # Watch mode
pnpm test:cov                        # With coverage
pnpm test:e2e                        # E2E tests

# Database
pnpm migration:generate src/database/migrations/AddUsers
pnpm migration:run                   # Run migrations
pnpm migration:revert                # Rollback last migration
```

---

## 📦 Decorators Reference

### Class Decorators

```typescript
@Controller('users')        // Define controller with base path
@Injectable()              // Make class injectable (services, guards, etc.)
@Module({ ... })           // Define module
@Entity('users')           // Define database entity
@Global()                  // Make module globally available
```

### Method Decorators (Controllers)

```typescript
@Get()                     // GET request
@Post()                    // POST request
@Put()                     // PUT request
@Patch()                   // PATCH request
@Delete()                  // DELETE request
@All()                     // Any HTTP method

@Get(':id')                // Route with parameter
@UseGuards(AuthGuard)      // Apply guard
@UseInterceptors(...)      // Apply interceptor
@UsePipes(...)             // Apply pipe
@HttpCode(201)             // Custom status code
@Header('Cache-Control', 'none')  // Set response header
```

### Parameter Decorators

```typescript
@Body()                    // Request body → req.body
@Param('id')               // Route parameter → req.params.id
@Query('page')             // Query parameter → req.query.page
@Headers('authorization')  // Header → req.headers.authorization
@Req()                     // Full request object
@Res()                     // Full response object
@Session()                 // Session object
@Ip()                      // Client IP
@HostParam()               // Sub-domain parameter

// Custom decorators
@CurrentUser()             // Your custom decorator
```

### Entity Decorators (TypeORM)

```typescript
@PrimaryGeneratedColumn('uuid')    // Auto-generated UUID primary key
@PrimaryColumn()                   // Primary key
@Column()                          // Simple column
@Column('text')                    // Text column
@Column({ unique: true })          // Unique column
@Column({ nullable: true })        // Nullable column
@Column('decimal', { precision: 10, scale: 2 })  // Decimal

@CreateDateColumn()                // Auto timestamp on create
@UpdateDateColumn()                // Auto timestamp on update
@DeleteDateColumn()                // Soft delete timestamp

@ManyToOne(() => User)             // Many-to-one relation
@OneToMany(() => Post, post => post.user)  // One-to-many
@OneToOne(() => Profile)           // One-to-one
@ManyToMany(() => Tag)             // Many-to-many
@JoinColumn()                      // Join column
@JoinTable()                       // Join table (for many-to-many)
```

### Swagger Decorators

```typescript
@ApiTags('users')                  // Group endpoints
@ApiOperation({ summary: '...' })  // Endpoint description
@ApiResponse({ status: 200, description: '...' })  // Response
@ApiBearerAuth()                   // Requires JWT
@ApiProperty({ example: 'John' })  // DTO property documentation
@ApiPropertyOptional()             // Optional property
```

### Validation Decorators (class-validator)

```typescript
@IsString()                        // Must be string
@IsNumber()                        // Must be number
@IsBoolean()                       // Must be boolean
@IsEmail()                         // Must be valid email
@IsPhoneNumber('IN')               // Valid phone (India)
@IsUUID()                          // Must be UUID
@IsDate()                          // Must be date
@IsEnum(Status)                    // Must be enum value
@IsArray()                         // Must be array
@IsObject()                        // Must be object

@Min(0)                            // Minimum value
@Max(100)                          // Maximum value
@MinLength(8)                      // Min string length
@MaxLength(255)                    // Max string length
@Length(8, 255)                    // Length range

@IsOptional()                      // Field is optional
@IsNotEmpty()                      // Must not be empty
@Matches(/regex/)                  // Must match regex
@ValidateNested()                  // Validate nested object
@Type(() => Class)                 // Type transformation
```

---

## 🎯 Common Patterns

### 1. Basic CRUD Controller

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createDto: CreateUserDto) {
    return this.userService.create(createDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### 2. Basic Service

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
```

### 3. DTO with Validation

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
```

### 4. Entity with Relations

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @ManyToOne(() => Company, company => company.users)
  company: Company;
}
```

### 5. Guard (Authentication)

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    // Your validation logic
    return true;
  }
}

// Usage
@UseGuards(AuthGuard)
@Get('protected')
getProtected() { ... }
```

### 6. Interceptor (Transform Response)

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// Usage (globally in main.ts)
app.useGlobalInterceptors(new TransformInterceptor());
```

### 7. Custom Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### 8. Exception Handling

```typescript
// Built-in exceptions
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Not authenticated');
throw new NotFoundException('User not found');
throw new ForbiddenException('Access denied');
throw new ConflictException('Email already exists');
throw new InternalServerErrorException('Server error');

// Custom exception
export class CustomException extends HttpException {
  constructor() {
    super('Custom message', HttpStatus.BAD_REQUEST);
  }
}
```

---

## 🔧 TypeORM Query Examples

```typescript
// Find all
await this.userRepository.find();

// Find with conditions
await this.userRepository.find({ where: { email: 'test@example.com' } });

// Find one
await this.userRepository.findOne({ where: { id } });

// Find with relations
await this.userRepository.find({ relations: ['posts', 'company'] });

// Find with select specific fields
await this.userRepository.find({ select: ['id', 'name'] });

// Find with pagination
await this.userRepository.find({ skip: 0, take: 10 });

// Find with ordering
await this.userRepository.find({ order: { createdAt: 'DESC' } });

// Count
await this.userRepository.count();

// Create and save
const user = this.userRepository.create(createUserDto);
await this.userRepository.save(user);

// Update
await this.userRepository.update(id, updateUserDto);

// Delete
await this.userRepository.delete(id);

// Soft delete
await this.userRepository.softDelete(id);

// Query builder
await this.userRepository
  .createQueryBuilder('user')
  .where('user.age > :age', { age: 18 })
  .andWhere('user.status = :status', { status: 'active' })
  .orderBy('user.createdAt', 'DESC')
  .getMany();
```

---

## 🎨 Module Configuration Patterns

### Basic Module
```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Module with Database
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],  // Allow other modules to use
})
export class UserModule {}
```

### Module with Dependencies
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,           // Import other modules
    ConfigModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

### Global Module
```typescript
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

---

## 🌐 Environment Configuration

```typescript
// main.ts
import { ConfigService } from '@nestjs/config';

const configService = app.get(ConfigService);
const port = configService.get('PORT');

// In service
constructor(private configService: ConfigService) {}

const dbHost = this.configService.get('DB_HOST');
const jwtSecret = this.configService.get<string>('JWT_SECRET');
```

---

## 📝 Testing Patterns

### Unit Test (Service)
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should find all users', async () => {
    const users = [{ id: '1', name: 'John' }];
    jest.spyOn(repository, 'find').mockResolvedValue(users);

    expect(await service.findAll()).toEqual(users);
  });
});
```

### E2E Test
```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect('Content-Type', /json/);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## 🚨 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module` | Check imports and file paths |
| `Circular dependency` | Use `forwardRef()` or restructure |
| `Provider not found` | Add to module's `providers` array |
| `Entity not found` | Add to `TypeOrmModule.forFeature([Entity])` |
| `Validation failed` | Check DTO decorators and ValidationPipe |
| `Cannot read property of undefined` | Check dependency injection |

---

## 💡 Pro Tips

1. **Always use DTOs** for request/response validation
2. **Keep controllers thin** - move logic to services
3. **Use dependency injection** - don't use `new` keyword
4. **Leverage decorators** - they make code cleaner
5. **Use built-in exceptions** - better error handling
6. **Enable auto-validation** globally in main.ts
7. **Use Swagger** - auto-document your API
8. **Write tests** - NestJS has great testing support
9. **Use configuration** - never hardcode values
10. **Follow module structure** - one feature per module

---

## 📚 Useful Links

- [Official Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://swagger.io)

---

**Quick Start Template**: Copy the Product module example from the main guide and modify it for your needs!
