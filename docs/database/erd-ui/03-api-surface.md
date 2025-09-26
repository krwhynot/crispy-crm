# API Surface Documentation

## Overview
Complete documentation of all API endpoints and operations available in the Atomic CRM system, including React Admin DataProvider methods, Supabase Edge Functions, and database RPC functions.

## Table of Contents
1. [React Admin DataProvider Operations](#react-admin-dataprovider-operations)
2. [Edge Functions](#edge-functions)
3. [Database RPC Functions](#database-rpc-functions)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Error Response Formats](#error-response-formats)

---

## React Admin DataProvider Operations

### Base URL
```
https://[PROJECT_ID].supabase.co/rest/v1
```

### Authentication Header
```http
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Standard CRUD Operations

#### getList - Fetch paginated records
```typescript
// Request
dataProvider.getList('opportunities', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: {
    stage: 'demo_scheduled',
    'amount.gte': 10000,
    'deleted_at.is': null
  }
})

// SQL Generated
SELECT * FROM opportunities_summary
WHERE stage = 'demo_scheduled'
  AND amount >= 10000
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 25 OFFSET 0;

// Response
{
  data: [
    {
      id: 3001,
      name: "Q1 2025 Expansion - Acme Foods",
      stage: "demo_scheduled",
      amount: 150000,
      probability: 85,
      customer_organization: { id: 1001, name: "Acme Foods Inc" },
      // ... other fields
    }
  ],
  total: 42
}
```

#### getOne - Fetch single record
```typescript
// Request
dataProvider.getOne('contacts', { id: 2001 })

// SQL Generated
SELECT * FROM contacts_summary
WHERE id = 2001 AND deleted_at IS NULL;

// Response
{
  data: {
    id: 2001,
    name: "John Smith",
    first_name: "John",
    last_name: "Smith",
    email: [
      { type: "work", value: "john@acme.com", primary: true }
    ],
    phone: [
      { type: "mobile", value: "+1-415-555-0101", primary: true }
    ],
    organizations: [
      { id: 1001, name: "Acme Foods Inc", is_primary: true }
    ]
  }
}
```

#### create - Create new record
```typescript
// Request
dataProvider.create('opportunities', {
  data: {
    name: "New Enterprise Deal",
    stage: "new_lead",
    amount: 250000,
    customer_organization_id: 1001,
    estimated_close_date: "2025-06-30"
  }
})

// Validation (Zod Schema)
opportunitySchema.parse(data) // Validates before sending

// SQL Generated
INSERT INTO opportunities (
  name, stage, amount, customer_organization_id, estimated_close_date
) VALUES (
  'New Enterprise Deal', 'new_lead', 250000, 1001, '2025-06-30'
) RETURNING *;

// Response
{
  data: {
    id: 3002,
    name: "New Enterprise Deal",
    stage: "new_lead",
    probability: 10, // Auto-calculated by trigger
    // ... all fields
  }
}
```

#### update - Update existing record
```typescript
// Request
dataProvider.update('contacts', {
  id: 2001,
  data: {
    title: "Senior VP of Operations",
    phone: [
      { type: "mobile", value: "+1-415-555-0101", primary: true },
      { type: "office", value: "+1-415-555-0100 x123" } // New
    ]
  },
  previousData: { /* ... */ }
})

// SQL Generated
UPDATE contacts
SET title = 'Senior VP of Operations',
    phone = '[...]'::jsonb,
    updated_at = now()
WHERE id = 2001
RETURNING *;

// Response
{
  data: { /* updated record */ }
}
```

#### delete - Soft delete record
```typescript
// Request
dataProvider.delete('opportunities', {
  id: 3001,
  previousData: { /* ... */ }
})

// SQL Generated (Soft Delete)
UPDATE opportunities
SET deleted_at = now()
WHERE id = 3001
RETURNING *;

// Response
{
  data: { /* deleted record with deleted_at set */ }
}
```

#### deleteMany - Bulk soft delete
```typescript
// Request
dataProvider.deleteMany('tasks', {
  ids: [11001, 11002, 11003]
})

// SQL Generated
UPDATE tasks
SET deleted_at = now()
WHERE id IN (11001, 11002, 11003)
RETURNING id;

// Response
{
  data: [11001, 11002, 11003]
}
```

### Custom DataProvider Methods

#### Sales Management
```typescript
// Create new sales user
dataProvider.salesCreate({
  email: "newuser@company.com",
  password: "SecurePass123!",
  first_name: "Jane",
  last_name: "Doe",
  is_admin: false
})
// Calls Edge Function: POST /users

// Update sales user
dataProvider.salesUpdate(1, {
  first_name: "Jane",
  last_name: "Smith",
  avatar_url: "https://..."
})
// Calls Edge Function: PATCH /users/1

// Reset password
dataProvider.updatePassword(1, "NewSecurePass456!")
// Calls Edge Function: PATCH /updatePassword/1
```

#### Opportunity Management
```typescript
// Unarchive soft-deleted opportunity
dataProvider.unarchiveOpportunity({
  id: 3001,
  index: 5 // Reorder position
})
// SQL: UPDATE opportunities SET deleted_at = NULL, index = 5 WHERE id = 3001
```

#### Junction Table Operations
```typescript
// Get all organizations for a contact
dataProvider.getContactOrganizations(2001)
// SQL: SELECT * FROM contact_organizations WHERE contact_id = 2001

// Add contact to organization
dataProvider.addContactToOrganization(2001, 1001, {
  role: 'decision_maker',
  is_primary: true,
  purchase_influence: 85,
  decision_authority: 90
})
// SQL: INSERT INTO contact_organizations ...

// Remove contact from organization
dataProvider.removeContactFromOrganization(2001, 1001)
// SQL: DELETE FROM contact_organizations WHERE contact_id = 2001 AND organization_id = 1001

// Similar methods for opportunity_participants and opportunity_contacts
```

---

## Edge Functions

### Base URL
```
https://[PROJECT_ID].supabase.co/functions/v1
```

### 1. User Management - `/users`

#### Create User (POST)
```http
POST /functions/v1/users
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Doe",
  "is_admin": false
}

Response: 200 OK
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "newuser@company.com",
  "sales_id": 2
}
```

#### Update User (PATCH)
```http
PATCH /functions/v1/users/[user_id]
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "avatar_url": "https://storage.supabase.co/avatars/jane.jpg",
  "disabled": false
}

Response: 200 OK
{
  "message": "User updated successfully"
}
```

### 2. Password Management - `/updatePassword`

#### Reset Password (PATCH)
```http
PATCH /functions/v1/updatePassword/[user_id]
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json

{
  "password": "NewSecurePass456!"
}

Response: 200 OK
{
  "message": "Password updated successfully"
}
```

### 3. Email Webhook - `/postmark`

#### Inbound Email Processing (POST)
```http
POST /functions/v1/postmark
Authorization: Basic [BASE64_ENCODED_CREDENTIALS]
X-Forwarded-For: [WHITELISTED_IP]
Content-Type: application/json

{
  "FromFull": {
    "Email": "customer@example.com",
    "Name": "John Customer"
  },
  "Subject": "Re: Product inquiry",
  "TextBody": "I'm interested in placing a large order...",
  "MessageID": "msg_123456",
  "Date": "2025-01-25T10:30:00Z"
}

Response: 200 OK
{
  "message": "Email processed and note created"
}
```

---

## Database RPC Functions

### Business Logic Functions

#### calculate_opportunity_probability
```sql
-- Automatically calculates probability based on stage
SELECT calculate_opportunity_probability('demo_scheduled');
-- Returns: 85
```

#### create_opportunity_with_participants
```sql
-- Atomic creation of opportunity with participants
SELECT create_opportunity_with_participants(
  p_name := 'Q2 Enterprise Deal',
  p_stage := 'new_lead',
  p_amount := 500000,
  p_customer_id := 1001,
  p_principal_id := 1002,
  p_distributor_id := 1003
);
-- Returns: opportunity_id (e.g., 3003)
```

#### calculate_product_price
```sql
-- Calculate price with volume discounts
SELECT calculate_product_price(
  p_product_id := 4001,
  p_quantity := 150,
  p_distributor_id := 1003
);
-- Returns: { unit_price: 7.50, total: 1125.00, discount_applied: "Volume Discount" }
```

### Activity Functions

#### log_engagement
```sql
-- Create general activity (no opportunity)
SELECT log_engagement(
  p_type := 'call',
  p_subject := 'Initial contact',
  p_contact_id := 2001,
  p_organization_id := 1001,
  p_description := 'Discussed potential needs'
);
-- Returns: activity_id
```

#### log_interaction
```sql
-- Create opportunity-specific activity
SELECT log_interaction(
  p_type := 'meeting',
  p_subject := 'Product demo',
  p_opportunity_id := 3001,
  p_contact_id := 2001,
  p_outcome := 'Very positive response'
);
-- Returns: activity_id
```

### Query Functions

#### get_contact_organizations
```sql
-- Get all organizations for a contact with details
SELECT * FROM get_contact_organizations(2001);
-- Returns: organization records with relationship details
```

#### get_organization_contacts
```sql
-- Get all contacts for an organization
SELECT * FROM get_organization_contacts(1001);
-- Returns: contact records with roles and influence scores
```

---

## Authentication Endpoints

### Supabase Auth Endpoints

#### Sign Up
```http
POST /auth/v1/signup
apikey: [ANON_KEY]
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Sign In
```http
POST /auth/v1/token?grant_type=password
apikey: [ANON_KEY]
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "access_token": "eyJ...",
  "refresh_token": "refresh_token_here",
  "expires_in": 3600,
  "user": { /* user object */ }
}
```

#### OAuth Sign In
```http
GET /auth/v1/authorize?provider=google
apikey: [ANON_KEY]

Redirects to Google OAuth flow
Callback returns to: /auth/v1/callback
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
apikey: [ANON_KEY]
Content-Type: application/json

{
  "refresh_token": "current_refresh_token"
}
```

#### Get Session
```http
GET /auth/v1/user
Authorization: Bearer [ACCESS_TOKEN]
apikey: [ANON_KEY]

Response:
{
  "id": "user_uuid",
  "email": "user@example.com",
  "app_metadata": { /* ... */ },
  "user_metadata": { /* ... */ }
}
```

---

## Error Response Formats

### Standard Error Structure
```typescript
interface ErrorResponse {
  message: string;           // Human-readable error
  errors?: {                // Field-specific errors
    [fieldPath: string]: string;
  };
  status?: number;          // HTTP status code
  code?: string;            // Error code
}
```

### Validation Error (400)
```json
{
  "message": "Validation failed",
  "errors": {
    "probability": "Must be between 0 and 100",
    "email[0].value": "Invalid email format"
  },
  "status": 400
}
```

### Authentication Error (401)
```json
{
  "message": "Invalid authentication credentials",
  "status": 401,
  "code": "INVALID_CREDENTIALS"
}
```

### Authorization Error (403)
```json
{
  "message": "Admin privileges required",
  "status": 403,
  "code": "INSUFFICIENT_PRIVILEGES"
}
```

### Not Found Error (404)
```json
{
  "message": "Opportunity not found",
  "status": 404,
  "code": "RESOURCE_NOT_FOUND"
}
```

### Database Error (500)
```json
{
  "message": "Database operation failed",
  "status": 500,
  "code": "DATABASE_ERROR",
  "details": "Foreign key violation: organization does not exist"
}
```

### RLS Policy Violation
```json
{
  "message": "Row level security policy violation",
  "status": 403,
  "code": "RLS_VIOLATION",
  "hint": "User is not authenticated"
}
```

## Rate Limiting

### Default Limits
- **Anonymous requests**: 60 requests/minute
- **Authenticated requests**: 300 requests/minute
- **Edge Functions**: 1000 requests/minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 250
X-RateLimit-Reset: 1706189400
```

## Query Parameters

### Filtering
```
?column=eq.value         // Equals
?column=neq.value        // Not equals
?column=gt.value         // Greater than
?column=gte.value        // Greater than or equal
?column=lt.value         // Less than
?column=lte.value        // Less than or equal
?column=like.*value*     // Pattern matching
?column=in.(value1,value2) // In list
?column=is.null          // Is null
?deleted_at=is.null      // Active records only
```

### Sorting
```
?order=column.desc       // Descending
?order=column.asc        // Ascending
?order=column1.desc,column2.asc // Multiple
```

### Pagination
```
?limit=25               // Page size
?offset=50              // Skip records
?range=0-24             // Range header alternative
```

### Selecting Fields
```
?select=id,name,email   // Specific fields
?select=*,organization:organizations(*) // With relations
```

### Full-Text Search
```
?search_tsv=phfts.search+term // PostgreSQL full-text search
```

This API surface documentation provides comprehensive coverage of all available endpoints, operations, and response formats in the Atomic CRM system.