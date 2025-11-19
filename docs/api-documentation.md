# API Documentation

## Overview

Atomic CRM uses Supabase for its backend, providing a REST-like API through the Supabase client library. The application uses React Admin's `DataProvider` pattern to abstract all data operations.

## Authentication

**Method:** Supabase Auth with JWT tokens

**Supported Providers:**
- Email/Password (default)
- Google OAuth
- Azure AD
- Keycloak
- Auth0

**Auth Flow:**
1. User logs in via `/login` page
2. Supabase returns JWT access token and refresh token
3. Tokens stored in browser (httpOnly cookies or localStorage depending on config)
4. All API requests include JWT in `Authorization: Bearer <token>` header
5. Row Level Security (RLS) policies enforce access control using `auth.uid()`

**Auth Configuration:**
- URL: `VITE_SUPABASE_URL` environment variable
- Anonymous Key: `VITE_SUPABASE_ANON_KEY` (safe to expose in client)
- Service Role Key: `SUPABASE_SERVICE_ROLE_KEY` (server-side only, NEVER expose)

**Auth Provider Implementation:**
```typescript
// Location: src/atomic-crm/providers/supabase/authProvider.ts
import { supabaseAuthProvider } from "ra-supabase-core";
import { supabase } from "./supabase";

export const authProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { id: "", fullName: "" };
    return {
      id: data.user.id,
      fullName: data.user.email || "",
    };
  },
});
```

---

## Data Provider Pattern

**Architecture:** Unified Data Provider consolidates transformation, validation, and database operations into a single layer.

**Location:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Key Methods:**

### getList
Fetch a list of records with pagination, sorting, and filtering

**Request Pattern:**
```typescript
dataProvider.getList('contacts', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'last_seen', order: 'DESC' },
  filter: { organization_id: 123, tags: [5, 12] }
})
```

**Response:**
```typescript
{
  data: [
    { id: 42, name: "John Doe", email: [...], ... },
    { id: 83, name: "Jane Smith", email: [...], ... }
  ],
  total: 150  // Total count for pagination
}
```

---

### getOne
Fetch a single record by ID

**Request:**
```typescript
dataProvider.getOne('contacts', { id: 42 })
```

**Response:**
```typescript
{
  data: {
    id: 42,
    name: "John Doe",
    email: [{ email: "john@example.com", type: "Work" }],
    phone: [{ phone: "555-1234", type: "Mobile" }],
    organization_id: 123,
    sales_id: 7,
    created_at: "2025-01-15T10:30:00Z"
  }
}
```

---

### create
Create a new record

**Request:**
```typescript
dataProvider.create('contacts', {
  data: {
    name: "Alice Johnson",
    email: [{ email: "alice@example.com", type: "Work" }],
    organization_id: 123,
    sales_id: 7
  }
})
```

**Response:**
```typescript
{
  data: {
    id: 999,  // Auto-generated
    name: "Alice Johnson",
    // ... all fields including defaults
    created_at: "2025-01-21T09:00:00Z"
  }
}
```

**Validation:** Zod schemas validate data at the API boundary before database insert.

---

### update
Update an existing record

**Request:**
```typescript
dataProvider.update('contacts', {
  id: 42,
  data: {
    title: "Senior VP of Operations",
    email: [
      { email: "john@example.com", type: "Work" },
      { email: "john.personal@gmail.com", type: "Personal" }
    ]
  },
  previousData: { ... }  // React Admin provides this
})
```

**Response:**
```typescript
{
  data: {
    id: 42,
    title: "Senior VP of Operations",
    // ... all fields
    updated_at: "2025-01-21T10:15:00Z"
  }
}
```

---

### delete
Soft delete a record (sets `deleted_at` timestamp)

**Request:**
```typescript
dataProvider.delete('contacts', {
  id: 42,
  previousData: { ... }
})
```

**Response:**
```typescript
{
  data: {
    id: 42
  }
}
```

**Note:** This is a soft delete. The record remains in the database with `deleted_at` set. Queries filter `WHERE deleted_at IS NULL` to exclude deleted records.

---

### deleteMany
Soft delete multiple records

**Request:**
```typescript
dataProvider.deleteMany('contacts', {
  ids: [42, 83, 99]
})
```

**Response:**
```typescript
{
  data: [42, 83, 99]
}
```

---

## Edge Functions

Supabase Edge Functions (Deno runtime) provide server-side operations that require elevated privileges or complex business logic.

**Location:** `supabase/functions/`

**Available Functions:**

### users (POST)
Create a new sales user with authentication credentials

**Endpoint:** `POST /functions/v1/users`

**Request:**
```json
{
  "email": "newsales@example.com",
  "password": "SecurePass123!",
  "profile": {
    "first_name": "New",
    "last_name": "User"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "newsales@example.com"
  },
  "sales_record": {
    "id": 15,
    "user_id": "uuid-here",
    "email": "newsales@example.com"
  }
}
```

**Auth Required:** Service role key (admin only)

**Errors:**
- `400` - Invalid email format or weak password
- `409` - Email already exists

---

### updatePassword (POST)
Update user password (admin operation)

**Endpoint:** `POST /functions/v1/updatePassword`

**Request:**
```json
{
  "userId": "uuid-here",
  "newPassword": "NewSecurePass456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Auth Required:** Service role key (admin only)

---

### check-overdue-tasks (scheduled)
Background function to send notifications for overdue tasks

**Trigger:** Scheduled (cron-like, configured in Supabase dashboard)

**No HTTP endpoint** - runs automatically

---

## RPC Functions

PostgreSQL stored procedures callable via Supabase RPC mechanism.

### get_contact_organizations
Get all organizations associated with a contact

**Request:**
```typescript
supabase.rpc('get_contact_organizations', {
  p_contact_id: 42
})
```

**Response:**
```typescript
{
  data: [
    {
      organization_id: 123,
      organization_name: "Acme Corporation",
      is_primary: true,
      is_primary_decision_maker: true
    },
    {
      organization_id: 456,
      organization_name: "Beta Industries",
      is_primary: false,
      is_primary_decision_maker: false
    }
  ]
}
```

---

### get_organization_contacts
Get all contacts associated with an organization

**Request:**
```typescript
supabase.rpc('get_organization_contacts', {
  p_organization_id: 123
})
```

**Response:**
```typescript
{
  data: [
    {
      contact_id: 42,
      contact_name: "John Doe",
      role: "decision_maker",
      is_primary_decision_maker: true,
      purchase_influence: 9
    }
  ]
}
```

---

### create_opportunity_with_participants
Create opportunity with multiple participant organizations in a single transaction

**Request:**
```typescript
supabase.rpc('create_opportunity_with_participants', {
  p_opportunity_data: {
    name: "Q1 Widget Deal",
    stage: "new_lead",
    priority: "high",
    opportunity_owner_id: 7
  },
  p_participants: [
    { organization_id: 123, role: "customer", is_primary: true },
    { organization_id: 50, role: "principal", is_primary: true },
    { organization_id: 75, role: "distributor", is_primary: false }
  ]
})
```

**Response:**
```typescript
{
  data: 456  // New opportunity ID
}
```

**Business Rules Enforced:**
- Must have at least one customer participant
- Rolls back entire transaction if any validation fails

---

## Service Layer Classes

The application uses service classes for complex business logic. These are invoked by the data provider but are not directly exposed as HTTP endpoints.

**Location:** `src/atomic-crm/services/`

**Available Services:**

### SalesService
Operations for managing sales users

```typescript
class SalesService {
  async createSalesUser(data: SalesFormData): Promise<Sale>
  async updateSalesUser(id: string, data: Partial<SalesFormData>): Promise<Sale>
  async deleteSalesUser(id: string): Promise<void>
}
```

---

### OpportunitiesService
Complex opportunity operations (multi-participant management, product associations)

```typescript
class OpportunitiesService {
  async createOpportunity(data: OpportunityInput): Promise<Opportunity>
  async updateOpportunity(id: string, data: Partial<OpportunityInput>): Promise<Opportunity>
  async addParticipants(opportunityId: string, participants: OpportunityParticipant[]): Promise<void>
}
```

---

### ActivitiesService
Activity logging and interaction tracking

```typescript
class ActivitiesService {
  async logActivity(data: ActivityInput): Promise<Activity>
  async getActivitiesForOpportunity(opportunityId: string): Promise<Activity[]>
}
```

---

## Error Handling

**Error Response Format:**
```typescript
{
  message: "Validation error",
  body: {
    errors: [
      { field: "email", message: "Invalid email format" },
      { field: "name", message: "Name is required" }
    ]
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (validation errors, malformed data)
- `401` - Unauthorized (no auth token or expired token)
- `403` - Forbidden (RLS policy violation)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate key, constraint violation)
- `500` - Internal Server Error (database error, unexpected failure)

**Error Logging:**
All errors are logged with context via `console.error` in the data provider:
```typescript
logError(method: string, resource: string, params: any, error: unknown)
```

---

## Rate Limiting

**Not Currently Implemented** - Supabase provides rate limiting at the project level (configurable in Supabase dashboard).

Default limits (Supabase Free Tier):
- 500,000 reads/month
- 100,000 writes/month
- 1GB database size

---

## CORS Configuration

**Not Required** - Supabase handles CORS automatically for whitelisted domains configured in the Supabase dashboard.

---

## Validation

**Framework:** Zod schemas define validation rules

**Location:** `src/atomic-crm/validation/`

**Pattern:**
```typescript
// Define schema
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.array(z.object({
    email: z.string().email("Invalid email"),
    type: z.enum(["Work", "Personal", "Other"]).default("Work")
  })).default([]),
  organization_id: z.number().positive().optional()
});

// Validate in data provider
const validated = contactSchema.parse(input);
```

**Validation Happens:**
- At API boundary in unified data provider (before database operations)
- In forms via React Hook Form + Zod resolver
- Single source of truth: Zod schemas (not duplicated in database and UI)

---

## Direct Supabase Client Usage

**Discouraged** - Always use the `DataProvider` abstraction

**Why:** The data provider handles:
- Transformation (JSONB arrays, enums, timestamps)
- Validation (Zod schemas)
- Error logging
- Soft delete filtering
- RLS policy compliance

**When Direct Access Is Acceptable:**
- RPC function calls (`supabase.rpc(...)`)
- Auth operations (`supabase.auth.*`)
- Storage operations (`supabase.storage.*`)

---

## Testing the API

**Local Development:**
```bash
# Start local Supabase (includes REST API)
npm run db:local:start

# Access points:
# - REST API: http://127.0.0.1:54321
# - Studio (GUI): http://localhost:54323
# - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Example cURL Request:**
```bash
# Get contacts (requires auth token)
curl -X GET "http://127.0.0.1:54321/rest/v1/contacts?deleted_at=is.null" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Testing with Postman/Insomnia:**
1. Get JWT token from browser DevTools (Application → Storage → Local Storage → `sb-<project>-auth-token`)
2. Use token in `Authorization: Bearer <token>` header
3. Set `apikey` header to `VITE_SUPABASE_ANON_KEY` value from `.env`

---

## API Reference

**Complete API reference is auto-generated by Supabase:**
- Local: http://localhost:54323/project/default/api (Supabase Studio → API Docs)
- Cloud: https://app.supabase.com/project/<your-project>/api/docs

**Supabase Client Documentation:**
- https://supabase.com/docs/reference/javascript/introduction
