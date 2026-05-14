# User ID System Documentation

## Overview

The system now uses auto-generated unique **User IDs** for user identification and login purposes. These IDs are automatically generated when creating users and follow a specific format that encodes useful information.

## User ID Format

### Structure

```
[Suffix][RoleCode][StateISO][DistrictISO][YY][MM][Last4Digits]
```

### Components

1. **Suffix** (2-4 characters): Company/business identifier
   - Uppercase letters and numbers only
   - Examples: `ABC`, `XYZ`, `DEF`, `SYS`

2. **RoleCode** (3 characters): User role identifier
   - `SUA`: SUPER_ADMIN
   - `SUO`: SUPER
   - `DBR`: DISTRIBUTOR
   - `RTR`: RETAILER

3. **StateISO** (2 digits): State ISO code
   - Examples: `27` (Maharashtra), `09` (Uttar Pradesh)
   - For SUPER_ADMIN: `XX` (no state)

4. **DistrictISO** (3 digits): District ISO code
   - Examples: `501` (Pune), `001` (Mumbai)
   - For SUPER_ADMIN: `XXX` (no district)

5. **YY** (2 digits): Year of creation (last 2 digits)
   - Example: `26` for 2026

6. **MM** (2 digits): Month of creation (01-12)
   - Example: `01` for January

7. **Last4Digits** (4 digits): Last 4 digits of phone number
   - Extracted from the user's mobile number

### Examples

```
ABCSUO2750126011234
└─┬─┘└┬┘└┬┘└─┬┘└┬┘└┬┘└──┬─┘
  │   │  │   │  │  │    └─ Phone last 4 digits: 1234
  │   │  │   │  │  └────── Month: 01 (January)
  │   │  │   │  └───────── Year: 26 (2026)
  │   │  │   └──────────── District: 501 (Pune)
  │   │  └──────────────── State: 27 (Maharashtra)
  │   └─────────────────── Role: SUO (Super)
  └─────────────────────── Suffix: ABC (Company)

XYZDBR2750126021234 - XYZ company, Distributor, MH-Pune, Feb 2026, phone ending 1234
DEFRTR2750126031234 - DEF company, Retailer, MH-Pune, Mar 2026, phone ending 1234
SYSSUAXXXXXX26041234 - System, Super Admin, no state/district, Apr 2026, phone ending 1234
```

## IMPORTANT Security Notice

⚠️ **The User ID is for identification and login purposes ONLY.**

- **DO NOT** use the embedded role code for role verification or access control
- **ALWAYS** use the actual `role` field from the User entity for authorization checks
- The role code in userId is informational and may not reflect the current role if changed
- User IDs are immutable once created, but user roles can be changed in the system

## User Creation DTOs

### 1. CreateSuperDto

Creates a SUPER user (top-level company distributor).

**Required Fields:**
- `companyId` (UUID): Company to associate with
- `name` (string, 2-255 chars): Full name
- `email` (string): Email address
- `phone` (string): Phone number with country code (required)
- `suffix` (string, 2-4 chars): Company suffix for userId
- `stateIso` (string, 2 digits): State ISO code
- `districtIso` (string, 3 digits): District ISO code
- `commissionPercentage` (number, 0-30): Commission percentage
- `address` (AddressDto): **Required** address details

**Optional Fields:**
- `password` (string, min 8 chars): If not provided, auto-generated
- `profilePictureUrl` (string): Profile picture URL

**Example:**
```json
{
  "companyId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "+919876543210",
  "suffix": "ABC",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 15,
  "address": {
    "street": "123 Main Street",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411001"
  }
}
```

**Generated User ID:** `ABCSUO2750126011234`

---

### 2. CreateDistributorDto

Creates a DISTRIBUTOR user (mid-tier distributor).

**Required Fields:**
- `parentUserId` (UUID): Parent user ID (must be a SUPER user)
- `name` (string, 2-255 chars): Full name
- `email` (string): Email address
- `phone` (string): Phone number with country code (required)
- `suffix` (string, 2-4 chars): Company suffix for userId
- `stateIso` (string, 2 digits): State ISO code
- `districtIso` (string, 3 digits): District ISO code
- `commissionPercentage` (number, 0-30): Commission percentage
- `address` (AddressDto): **Required** address details

**Optional Fields:**
- `password` (string, min 8 chars): If not provided, auto-generated
- `profilePictureUrl` (string): Profile picture URL

**Example:**
```json
{
  "parentUserId": "parent-super-uuid",
  "name": "Jane Smith",
  "email": "jane.smith@distributor.com",
  "phone": "+919876543210",
  "suffix": "XYZ",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 10,
  "address": {
    "street": "456 Market Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001"
  }
}
```

**Generated User ID:** `XYZDBR2750126011234`

---

### 3. CreateRetailerDto

Creates a RETAILER user (end-tier seller who creates clients).

**Required Fields:**
- `parentUserId` (UUID): Parent user ID (must be SUPER or DISTRIBUTOR)
- `name` (string, 2-255 chars): Full name
- `email` (string): Email address
- `phone` (string): Phone number with country code (required)
- `suffix` (string, 2-4 chars): Company suffix for userId
- `stateIso` (string, 2 digits): State ISO code
- `districtIso` (string, 3 digits): District ISO code
- `commissionPercentage` (number, 0-30): Commission percentage
- `address` (AddressDto): **Required** address details

**Optional Fields:**
- `password` (string, min 8 chars): If not provided, auto-generated
- `profilePictureUrl` (string): Profile picture URL

**Example:**
```json
{
  "parentUserId": "parent-distributor-uuid",
  "name": "Mike Johnson",
  "email": "mike.johnson@retailer.com",
  "phone": "+919876543210",
  "suffix": "DEF",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 5,
  "address": {
    "street": "789 Commerce Street",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411038"
  }
}
```

**Generated User ID:** `DEFRTR2750126011234`

---

## AddressDto Structure

All user types now **require** an address.

```typescript
{
  street: string;       // Required, max 255 chars
  city: string;         // Required, max 100 chars
  state: string;        // Required, max 100 chars
  country: string;      // Required, max 100 chars
  postalCode: string;   // Required, max 20 chars
  latitude?: number;    // Optional
  longitude?: number;   // Optional
}
```

## Login with User ID

Users can now login using **userId**, **email**, OR **phone number**.

### Login DTO

```typescript
{
  userId?: string;    // User ID (e.g., "ABCSUO2750126011234")
  email?: string;     // Email address
  phone?: string;     // Phone number with country code
  password: string;   // Required
}
```

**Note:** At least ONE of `userId`, `email`, or `phone` must be provided.

### Login Examples

**Login with User ID:**
```json
{
  "userId": "ABCSUO2750126011234",
  "password": "SecurePass123!"
}
```

**Login with Email:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!"
}
```

**Login with Phone:**
```json
{
  "phone": "+919876543210",
  "password": "SecurePass123!"
}
```

## Update User

The update endpoint uses the user's UUID (not the userId string) for identification.

### UpdateUserDto

All fields are optional:

```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  commissionPercentage?: number;  // 0-30
  status?: UserStatus;            // 'active' | 'inactive' | 'suspended'
  address?: AddressDto;
  profilePictureUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
}
```

**Example:**
```json
{
  "name": "John Updated Doe",
  "commissionPercentage": 20,
  "status": "active"
}
```

## User Entity Changes

### New Field

```typescript
@Column({ type: 'varchar', length: 30, unique: true, name: 'user_id' })
@Index()
userId: string;  // Auto-generated, unique, indexed
```

### Migration

Run the migration to add the `user_id` column:

```bash
npm run migration:run
```

**Migration file:** `1737200000000-AddUserIdToUsers.ts`

## UserIdGeneratorService

A dedicated service handles User ID generation and validation.

### Methods

#### `generateUserId(suffix, role, stateIso, districtIso, phone): string`

Generates a user ID based on the provided parameters.

```typescript
const userId = userIdGenerator.generateUserId(
  'ABC',
  UserRole.SUPER,
  '27',
  '501',
  '+919876543210'
);
// Returns: ABCSUO2750126011234
```

#### `generateSuperAdminUserId(phone): string`

Generates a user ID for SUPER_ADMIN (uses 'SYS' suffix and 'XXXXXX' for state/district).

```typescript
const userId = userIdGenerator.generateSuperAdminUserId('+919876543210');
// Returns: SYSSUAXXXXXX26011234
```

#### `validateUserId(userId): boolean`

Validates if a userId follows the correct format.

```typescript
const isValid = userIdGenerator.validateUserId('ABCSUO2750126011234');
// Returns: true
```

#### `extractRole(userId): UserRole | null`

Extracts the role from a userId (for informational purposes only).

```typescript
const role = userIdGenerator.extractRole('ABCSUO2750126011234');
// Returns: UserRole.SUPER
```

#### `parseUserId(userId): object | null`

Parses a userId into its components.

```typescript
const parsed = userIdGenerator.parseUserId('ABCSUO2750126011234');
// Returns:
// {
//   suffix: 'ABC',
//   roleCode: 'SUO',
//   stateIso: '27',
//   districtIso: '501',
//   year: '26',
//   month: '01',
//   last4Digits: '1234'
// }
```

## API Endpoints

### User Creation

```
POST /api/v1/users/super         - Create SUPER user
POST /api/v1/users/distributor   - Create DISTRIBUTOR user
POST /api/v1/users/retailer      - Create RETAILER user
```

### User Update

```
PUT /api/v1/users/:id            - Update user by UUID
```

### Authentication

```
POST /api/v1/auth/login          - Login with userId/email/phone + password
```

## Hierarchy Rules

- **SUPER_ADMIN**: Can create companies and SUPER users
- **SUPER**: Can create DISTRIBUTOR and RETAILER users
- **DISTRIBUTOR**: Can create RETAILER users only
- **RETAILER**: Cannot create other users (creates clients instead)

## Password Management

- If `password` is not provided during user creation, it will be **auto-generated**
- The auto-generated password is sent to the user via email along with their userId
- Users can change their password after first login
- Minimum password length: 8 characters

## Email Notification

When a user is created, they receive an email containing:
- Their unique **User ID**
- Their **auto-generated password** (if password was not provided)
- Login instructions
- Company details (for non-SUPER_ADMIN users)

## State and District ISO Codes

### India State ISO Codes (Examples)

| State | ISO Code |
|-------|----------|
| Maharashtra | 27 |
| Uttar Pradesh | 09 |
| Karnataka | 29 |
| Tamil Nadu | 33 |
| Delhi | 07 |
| Gujarat | 24 |
| West Bengal | 19 |

### District ISO Codes

District codes are 3-digit numbers specific to each state. Consult the official ISO 3166-2:IN standard for complete codes.

**Examples (Maharashtra):**
- Mumbai: 001
- Pune: 501
- Nagpur: 311

## Best Practices

1. **Always validate userId format** before using it for login or lookup
2. **Never use userId role code for authorization** - always check the actual `role` field
3. **Store userId in logs** for better traceability and debugging
4. **Include userId in email notifications** to help users login
5. **Validate address completeness** during user creation
6. **Ensure phone numbers are in international format** (+country code)
7. **Generate strong passwords** if not provided by admin
8. **Send welcome email** with userId and credentials after successful creation

## Testing

### Unit Tests

Test the `UserIdGeneratorService`:

```typescript
describe('UserIdGeneratorService', () => {
  it('should generate valid user ID for SUPER', () => {
    const userId = service.generateUserId('ABC', UserRole.SUPER, '27', '501', '+919876543210');
    expect(userId).toMatch(/^ABC[A-Z]{3}[0-9]{13}$/);
    expect(userId).toContain('SUO');
  });

  it('should generate valid user ID for SUPER_ADMIN', () => {
    const userId = service.generateSuperAdminUserId('+919876543210');
    expect(userId).toContain('SUA');
    expect(userId).toContain('XXXXXX');
  });

  it('should validate correct userId format', () => {
    expect(service.validateUserId('ABCSUO2750126011234')).toBe(true);
    expect(service.validateUserId('INVALID')).toBe(false);
  });
});
```

### Integration Tests

Test user creation and login:

```typescript
describe('User Creation & Login', () => {
  it('should create SUPER user with auto-generated userId', async () => {
    const dto: CreateSuperDto = {
      companyId: 'company-uuid',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
      suffix: 'ABC',
      stateIso: '27',
      districtIso: '501',
      commissionPercentage: 15,
      address: { /* ... */ }
    };

    const user = await userService.createSuper(dto);

    expect(user.userId).toBeDefined();
    expect(user.userId).toContain('SUO');
  });

  it('should login with userId', async () => {
    const loginDto = {
      userId: 'ABCSUO2750126011234',
      password: 'Password123!'
    };

    const result = await authService.login(loginDto);

    expect(result.accessToken).toBeDefined();
  });
});
```

## Troubleshooting

### User ID Generation Fails

**Problem:** User ID generation throws an error

**Solutions:**
- Verify suffix is 2-4 uppercase alphanumeric characters
- Ensure stateIso is exactly 2 digits
- Ensure districtIso is exactly 3 digits
- Confirm phone number contains at least 4 digits

### Login with User ID Fails

**Problem:** Cannot login with userId

**Solutions:**
- Verify userId format is correct (use `validateUserId()`)
- Check if user exists in database with that userId
- Ensure password is correct
- Check if user status is 'active'

### Duplicate User ID

**Problem:** User ID already exists error

**Solutions:**
- This is rare but can happen if two users with same phone last 4 digits are created in same month
- The system should handle this by checking uniqueness before insert
- If collision occurs, contact system administrator

## Future Enhancements

- [ ] Add userId collision detection and auto-retry with incremental suffix
- [ ] Support for international country codes in userId generation
- [ ] Bulk user import with auto-generated userIds
- [ ] User ID regeneration tool for data migration
- [ ] Analytics dashboard showing userId distribution by region/role
