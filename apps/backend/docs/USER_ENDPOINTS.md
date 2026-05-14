# User Management API Endpoints

## Base URL
```
/api/v1/users
```

## Authentication
All endpoints require JWT Bearer token authentication (except where noted).

```
Authorization: Bearer <access_token>
```

---

## User Creation Endpoints

### 1. Create SUPER User
**Endpoint:** `POST /users/super`
**Role Required:** `SUPER_ADMIN`
**Description:** Creates a top-level company distributor (SUPER user)

**Request Body:**
```json
{
  "companyId": "uuid",
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+919876543210",
  "suffix": "ABC",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 15,
  "address": {
    "street": "123 Main St",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411001"
  },
  "password": "optional",
  "profilePictureUrl": "optional"
}
```

**Response:**
```json
{
  "id": "user-uuid",
  "userId": "ABCSUO2750126011234",
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+919876543210",
  "role": "super",
  "status": "active",
  "companyId": "company-uuid",
  "message": "SUPER user created successfully. Credentials sent to email."
}
```

---

### 2. Create DISTRIBUTOR User
**Endpoint:** `POST /users/distributor`
**Role Required:** `SUPER`, `SUPER_ADMIN`
**Description:** Creates a mid-tier distributor

**Request Body:**
```json
{
  "parentUserId": "super-user-uuid",
  "name": "Jane Smith",
  "email": "jane@distributor.com",
  "phone": "+919876543210",
  "suffix": "XYZ",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 10,
  "address": {
    "street": "456 Market Rd",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001"
  },
  "password": "optional",
  "profilePictureUrl": "optional"
}
```

**Response:**
```json
{
  "id": "user-uuid",
  "userId": "XYZDBR2750126011234",
  "name": "Jane Smith",
  "email": "jane@distributor.com",
  "role": "distributor",
  "status": "active",
  "parentUserId": "super-user-uuid",
  "hierarchyLevel": 2,
  "message": "DISTRIBUTOR user created successfully. Credentials sent to email."
}
```

---

### 3. Create RETAILER User
**Endpoint:** `POST /users/retailer`
**Role Required:** `SUPER`, `DISTRIBUTOR`, `SUPER_ADMIN`
**Description:** Creates an end-tier retailer who can create clients

**Request Body:**
```json
{
  "parentUserId": "distributor-uuid-or-super-uuid",
  "name": "Mike Johnson",
  "email": "mike@retailer.com",
  "phone": "+919876543210",
  "suffix": "DEF",
  "stateIso": "27",
  "districtIso": "501",
  "commissionPercentage": 5,
  "address": {
    "street": "789 Commerce St",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411038"
  },
  "password": "optional",
  "profilePictureUrl": "optional"
}
```

**Response:**
```json
{
  "id": "user-uuid",
  "userId": "DEFRTR2750126011234",
  "name": "Mike Johnson",
  "email": "mike@retailer.com",
  "role": "retailer",
  "status": "active",
  "parentUserId": "parent-uuid",
  "hierarchyLevel": 3,
  "message": "RETAILER user created successfully. Credentials sent to email."
}
```

---

## User Retrieval Endpoints

### 4. Get All Users (with filters)
**Endpoint:** `GET /users`
**Role Required:** Any authenticated user
**Description:** Retrieves users based on role and hierarchy

**Query Parameters:**
- `companyId` (optional): Filter by company (SUPER_ADMIN only)
- `role` (optional): Filter by role (`super`, `distributor`, `retailer`)
- `status` (optional): Filter by status (`active`, `inactive`, `suspended`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example:**
```
GET /users?role=retailer&status=active&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "DEFRTR2750126011234",
      "name": "Mike Johnson",
      "email": "mike@retailer.com",
      "role": "retailer",
      "status": "active",
      "balance": 100,
      "totalClients": 25,
      "activeClients": 20
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5. Get My Profile
**Endpoint:** `GET /users/me`
**Role Required:** Any authenticated user
**Description:** Retrieves the authenticated user's profile

**Response:**
```json
{
  "id": "uuid",
  "userId": "ABCSUO2750126011234",
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+919876543210",
  "role": "super",
  "status": "active",
  "companyId": "company-uuid",
  "parentUserId": null,
  "hierarchyLevel": 1,
  "hierarchyPath": "super-uuid",
  "commissionPercentage": 15,
  "balance": 5000,
  "totalClients": 0,
  "activeClients": 0,
  "profilePictureUrl": "https://...",
  "emailVerified": true,
  "phoneVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2026-01-15T10:30:00Z",
  "lastLoginAt": "2026-01-18T08:15:00Z"
}
```

---

### 6. Get User by ID
**Endpoint:** `GET /users/:id`
**Role Required:** Any authenticated user (access controlled by hierarchy)
**Description:** Retrieves a specific user by UUID

**Example:**
```
GET /users/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "XYZDBR2750126011234",
  "name": "Jane Smith",
  "email": "jane@distributor.com",
  "phone": "+919876543210",
  "role": "distributor",
  "status": "active",
  "companyId": "company-uuid",
  "parentUserId": "super-uuid",
  "hierarchyLevel": 2,
  "commissionPercentage": 10,
  "balance": 1500,
  "totalClients": 0,
  "activeClients": 0,
  "createdAt": "2026-01-10T12:00:00Z"
}
```

---

### 7. Get Downstream Users
**Endpoint:** `GET /users/me/downstream`
**Role Required:** `SUPER`, `DISTRIBUTOR`
**Description:** Retrieves all users below current user in hierarchy

**Response:**
```json
{
  "distributors": [
    {
      "id": "uuid",
      "userId": "XYZDBR2750126011234",
      "name": "Jane Smith",
      "role": "distributor",
      "balance": 1500,
      "activeClients": 0
    }
  ],
  "retailers": [
    {
      "id": "uuid",
      "userId": "DEFRTR2750126011234",
      "name": "Mike Johnson",
      "role": "retailer",
      "balance": 100,
      "activeClients": 20
    }
  ],
  "total": {
    "distributors": 1,
    "retailers": 1
  }
}
```

---

### 8. Get Hierarchy Tree
**Endpoint:** `GET /users/hierarchy/tree`
**Role Required:** `SUPER_ADMIN`, `SUPER`
**Description:** Retrieves complete user hierarchy tree

**Query Parameters:**
- `companyId` (optional): Company ID (SUPER_ADMIN only)

**Example:**
```
GET /users/hierarchy/tree?companyId=company-uuid
```

**Response:**
```json
{
  "company": {
    "id": "company-uuid",
    "name": "ABC Company"
  },
  "tree": [
    {
      "id": "super-uuid",
      "userId": "ABCSUO2750126011234",
      "name": "John Doe",
      "role": "super",
      "children": [
        {
          "id": "distributor-uuid",
          "userId": "XYZDBR2750126011234",
          "name": "Jane Smith",
          "role": "distributor",
          "children": [
            {
              "id": "retailer-uuid",
              "userId": "DEFRTR2750126011234",
              "name": "Mike Johnson",
              "role": "retailer",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

---

## User Update Endpoints

### 9. Update User
**Endpoint:** `PUT /users/:id`
**Role Required:** User themselves, SUPER (for their company), or SUPER_ADMIN
**Description:** Updates user information

**Request Body (all fields optional):**
```json
{
  "name": "John Updated Doe",
  "email": "john.updated@company.com",
  "phone": "+919876543211",
  "commissionPercentage": 20,
  "status": "active",
  "address": {
    "street": "New Street",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411001"
  },
  "profilePictureUrl": "https://...",
  "contactPhone": "+919876543212",
  "contactEmail": "contact@company.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "ABCSUO2750126011234",
  "name": "John Updated Doe",
  "email": "john.updated@company.com",
  "message": "User updated successfully"
}
```

---

### 10. Update User Status
**Endpoint:** `PATCH /users/:id/status`
**Role Required:** `SUPER_ADMIN`, `SUPER`, `DISTRIBUTOR` (for their retailers)
**Description:** Updates user status (active/inactive/suspended)

**Request Body:**
```json
{
  "status": "suspended"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "suspended",
  "message": "User status updated successfully"
}
```

---

### 11. Update Commission Percentage
**Endpoint:** `PATCH /users/:id/commission`
**Role Required:** `SUPER_ADMIN`, `SUPER`, `DISTRIBUTOR` (only for direct children)
**Description:** Updates commission percentage for downstream user

**Request Body:**
```json
{
  "commissionPercentage": 12
}
```

**Response:**
```json
{
  "id": "uuid",
  "commissionPercentage": 12,
  "message": "Commission updated successfully"
}
```

---

## Hierarchy Management

### 12. Transfer User to New Parent
**Endpoint:** `PATCH /users/:id/transfer`
**Role Required:** `SUPER_ADMIN`, `SUPER`
**Description:** Transfers a user and their entire downstream network to a new parent

**Request Body:**
```json
{
  "newParentUserId": "new-parent-uuid"
}
```

**Response:**
```json
{
  "id": "transferred-user-uuid",
  "oldParentUserId": "old-parent-uuid",
  "newParentUserId": "new-parent-uuid",
  "message": "User transferred successfully. Hierarchy paths updated for 5 downstream users."
}
```

---

## Delete Endpoints

### 13. Delete User (Soft Delete)
**Endpoint:** `DELETE /users/:id`
**Role Required:** `SUPER_ADMIN`, `SUPER`
**Description:** Soft deletes a user (sets status to inactive)

**Response:**
```json
{
  "id": "uuid",
  "status": "inactive",
  "message": "User deleted successfully"
}
```

**Error Response (if user has active downstream users):**
```json
{
  "statusCode": 400,
  "message": "Cannot delete user with active downstream users. Transfer or delete them first.",
  "error": "Bad Request"
}
```

---

## Search & Lookup

### 14. Search Users
**Endpoint:** `GET /users/search`
**Role Required:** `SUPER_ADMIN`, `SUPER`
**Description:** Search for users by userId, email, or phone

**Query Parameters (at least one required):**
- `userId`: User ID to search
- `email`: Email to search
- `phone`: Phone to search

**Example:**
```
GET /users/search?userId=ABCSUO2750126011234
GET /users/search?email=john@company.com
GET /users/search?phone=+919876543210
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "userId": "ABCSUO2750126011234",
      "name": "John Doe",
      "email": "john@company.com",
      "phone": "+919876543210",
      "role": "super",
      "status": "active",
      "companyId": "company-uuid"
    }
  ],
  "total": 1
}
```

---

## Balance & Statistics

### 15. Get User Balance
**Endpoint:** `GET /users/:id/balance`
**Role Required:** User themselves, SUPER (for their company), or SUPER_ADMIN
**Description:** Retrieves detailed balance information

**Response:**
```json
{
  "userId": "uuid",
  "balance": 5000,
  "totalReceived": 10000,
  "totalUsed": 4500,
  "totalTransferred": 500,
  "commissionEarned": 1250,
  "recentTransactions": [
    {
      "type": "key_transfer_received",
      "amount": 100,
      "date": "2026-01-18T10:00:00Z"
    }
  ]
}
```

---

### 16. Get User Statistics
**Endpoint:** `GET /users/:id/stats`
**Role Required:** User themselves, SUPER (for their company), or SUPER_ADMIN
**Description:** Retrieves key performance metrics

**Response:**
```json
{
  "userId": "uuid",
  "totalClients": 125,
  "activeClients": 100,
  "inactiveClients": 25,
  "totalRevenue": 250000,
  "commissionEarned": 37500,
  "downstreamUsers": {
    "distributors": 5,
    "retailers": 20
  },
  "performance": {
    "thisMonth": {
      "newClients": 12,
      "revenue": 24000,
      "commission": 3600
    },
    "lastMonth": {
      "newClients": 15,
      "revenue": 30000,
      "commission": 4500
    }
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have permission to perform this action
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate email, phone, or userId

---

## Access Control Summary

| Endpoint | SUPER_ADMIN | SUPER | DISTRIBUTOR | RETAILER |
|----------|-------------|-------|-------------|----------|
| Create SUPER | ✅ | ❌ | ❌ | ❌ |
| Create DISTRIBUTOR | ✅ | ✅ | ❌ | ❌ |
| Create RETAILER | ✅ | ✅ | ✅ | ❌ |
| Get All Users | All | Own Company | Downstream | Self Only |
| Get My Profile | ✅ | ✅ | ✅ | ✅ |
| Get User by ID | All | Own Company | Downstream | Self Only |
| Get Downstream | ✅ | ✅ | ✅ | ❌ |
| Get Hierarchy Tree | All | Own Company | ❌ | ❌ |
| Update User | All | Own Company | Downstream | Self Only |
| Update Status | All | Own Company | Retailers Only | ❌ |
| Update Commission | All | Own Company | Direct Children | ❌ |
| Transfer User | ✅ | ✅ | ❌ | ❌ |
| Delete User | ✅ | ✅ | ❌ | ❌ |
| Search Users | ✅ | ✅ | ❌ | ❌ |
| Get Balance | All | Own Company | Downstream | Self Only |
| Get Stats | All | Own Company | Downstream | Self Only |

---

## Hierarchy Rules

1. **SUPER_ADMIN**:
   - Can create companies and SUPER users
   - Can view and manage all users across all companies
   - No company association (companyId is NULL)

2. **SUPER**:
   - Can create DISTRIBUTOR and RETAILER users in their company
   - Can view all users in their company
   - Orders keys from SUPER_ADMIN (via Orders API)
   - Transfers keys to downstream users

3. **DISTRIBUTOR**:
   - Can create RETAILER users only
   - Can view their downstream retailers
   - Receives keys from SUPER
   - Transfers keys to retailers

4. **RETAILER**:
   - Cannot create other users
   - Creates and manages clients (via Clients API)
   - Receives keys from SUPER or DISTRIBUTOR
   - Can only view their own profile and clients

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- User IDs are auto-generated and sent via email
- Passwords are auto-generated if not provided
- Address is required for all user types
- Phone number must be in international format (+country code)
- Commission percentage must be between 0-30
- Balance is measured in number of keys (licenses)
- Soft delete is used - users are never permanently deleted
- Hierarchy paths are automatically updated on user transfers
