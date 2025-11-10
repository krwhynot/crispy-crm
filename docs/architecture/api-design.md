# API Design

**Status:** Living Document | **Last Updated:** 2025-11-09
**Owner:** Architecture Team | **Scope:** All Backend Operations

## Overview

This document defines the complete API architecture for Atomic CRM. The system uses **Supabase (PostgreSQL + PostgREST)** as the backend with **React Admin** as the frontend framework.

**Core Architecture:**
- **Data Provider:** Unified data provider (`unifiedDataProvider.ts`) for all CRUD operations
- **Auth Provider:** Supabase Auth with email/password and magic link
- **Validation:** Zod schemas at API boundary only (single source of truth)
- **Security:** Row Level Security (RLS) + GRANT permissions (two-layer model)
- **Error Handling:** Fail fast, no fallbacks (Engineering Constitution #1)

**API Patterns:**
- **RESTful via PostgREST** - Auto-generated from database schema
- **RPC functions** - Custom business logic (e.g., `sync_opportunity`, `log_engagement`)
- **Real-time subscriptions** - Supabase Realtime (not yet implemented)

---

## Data Provider Architecture

### Unified Data Provider

**Location:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Purpose:** Single interface for all CRUD operations, adhering to React Admin `DataProvider` interface.

**Core Methods:**

```typescript
interface DataProvider {
  getList(resource: string, params: GetListParams): Promise<GetListResult>;
  getOne(resource: string, params: GetOneParams): Promise<GetOneResult>;
  getMany(resource: string, params: GetManyParams): Promise<GetManyResult>;
  getManyReference(resource: string, params: GetManyReferenceParams): Promise<GetManyReferenceResult>;
  create(resource: string, params: CreateParams): Promise<CreateResult>;
  update(resource: string, params: UpdateParams): Promise<UpdateResult>;
  updateMany(resource: string, params: UpdateManyParams): Promise<UpdateManyResult>;
  delete(resource: string, params: DeleteParams): Promise<DeleteResult>;
  deleteMany(resource: string, params: DeleteManyParams): Promise<DeleteManyResult>;
}
```

---

### Resource Configuration

**Location:** `src/atomic-crm/providers/supabase/resources.ts`

**Purpose:** Map React Admin resources to Supabase tables with custom configuration.

**Resource Config Schema:**

```typescript
interface ResourceConfig {
  table: string;                  // Database table/view name
  primaryKey?: string;             // Default: 'id'
  softDelete?: boolean;            // Use deleted_at (default: true)
  validate?: (data: any) => Promise<void>;  // Validation function
  beforeCreate?: (data: any) => any;       // Transform before insert
  afterCreate?: (record: any) => any;      // Transform after insert
  beforeUpdate?: (data: any) => any;       // Transform before update
  afterUpdate?: (record: any) => any;      // Transform after update
}
```

**Example:**

```typescript
const resourceConfigs: Record<string, ResourceConfig> = {
  contacts: {
    table: 'contacts_summary',  // Use view for enriched data
    softDelete: true,
    validate: validateContactForm,
    beforeCreate: (data) => {
      // Compute name from first_name + last_name
      if (!data.name) {
        data.name = [data.first_name, data.last_name].filter(Boolean).join(' ');
      }
      return data;
    },
  },
  opportunities: {
    table: 'opportunities_summary',
    softDelete: true,
    validate: validateOpportunityForm,
  },
  tasks: {
    table: 'tasks',
    softDelete: true,
    validate: validateTaskForm,
  },
};
```

---

## CRUD Operations

### GET List

**Method:** `getList(resource, params)`

**Params:**

```typescript
interface GetListParams {
  pagination: { page: number; perPage: number };
  sort: { field: string; order: 'ASC' | 'DESC' };
  filter: Record<string, any>;
}
```

**Example Request:**

```typescript
dataProvider.getList('contacts', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'name', order: 'ASC' },
  filter: { sales_id: 5, deleted_at: null },
});
```

**SQL Generated:**

```sql
SELECT * FROM contacts_summary
WHERE sales_id = 5 AND deleted_at IS NULL
ORDER BY name ASC
LIMIT 25 OFFSET 0;
```

**Response:**

```typescript
{
  data: Contact[],
  total: number,  // Total count (for pagination)
}
```

---

### GET One

**Method:** `getOne(resource, { id })`

**Example Request:**

```typescript
dataProvider.getOne('contacts', { id: 123 });
```

**SQL Generated:**

```sql
SELECT * FROM contacts_summary WHERE id = 123;
```

**Response:**

```typescript
{
  data: Contact,
}
```

---

### CREATE

**Method:** `create(resource, { data })`

**Flow:**

1. **Validate** - Run Zod schema validation
2. **Transform** - Apply `beforeCreate` hook
3. **Insert** - Execute INSERT query
4. **Transform** - Apply `afterCreate` hook
5. **Return** - Created record

**Example Request:**

```typescript
dataProvider.create('contacts', {
  data: {
    first_name: 'John',
    last_name: 'Doe',
    email: [{ email: 'john@example.com', type: 'Work' }],
    sales_id: 5,
  },
});
```

**Validation (Zod):**

```typescript
// src/atomic-crm/validation/contacts.ts
export const createContactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.array(emailAndTypeSchema).min(1),  // At least one email
  sales_id: z.number(),
});

export async function validateContactForm(data: any): Promise<void> {
  createContactSchema.parse(data);  // Throws on validation error
}
```

**SQL Generated:**

```sql
INSERT INTO contacts (first_name, last_name, name, email, sales_id, created_by)
VALUES ('John', 'Doe', 'John Doe', '[{"email":"john@example.com","type":"Work"}]', 5, 5)
RETURNING *;
```

**Response:**

```typescript
{
  data: Contact,  // Created record with id
}
```

---

### UPDATE

**Method:** `update(resource, { id, data })`

**Flow:**

1. **Validate** - Run Zod schema validation
2. **Transform** - Apply `beforeUpdate` hook
3. **Update** - Execute UPDATE query
4. **Transform** - Apply `afterUpdate` hook
5. **Return** - Updated record

**Example Request:**

```typescript
dataProvider.update('contacts', {
  id: 123,
  data: {
    title: 'Senior Manager',
    department: 'Sales',
  },
});
```

**SQL Generated:**

```sql
UPDATE contacts
SET title = 'Senior Manager',
    department = 'Sales',
    updated_at = NOW()
WHERE id = 123
RETURNING *;
```

**Optimistic Locking (opportunities):**

```sql
UPDATE opportunities
SET stage = 'closed_won',
    version = version + 1,
    updated_at = NOW()
WHERE id = 456 AND version = 3  -- Check current version
RETURNING *;
```

**Response:**

```typescript
{
  data: Contact,  // Updated record
}
```

---

### DELETE (Soft Delete)

**Method:** `delete(resource, { id })`

**Default:** Soft delete (set `deleted_at = NOW()`)

**Example Request:**

```typescript
dataProvider.delete('contacts', { id: 123 });
```

**SQL Generated:**

```sql
UPDATE contacts
SET deleted_at = NOW()
WHERE id = 123
RETURNING *;
```

**Hard Delete (admin-only, rare):**

```sql
DELETE FROM contacts WHERE id = 123;
```

**Response:**

```typescript
{
  data: Contact,  // Deleted/soft-deleted record
}
```

---

## Filter Registry

**Location:** `src/atomic-crm/providers/supabase/filterRegistry.ts`

**Purpose:** Prevent 400 errors from stale React Admin filters (e.g., removed database columns).

**Pattern:**

```typescript
const filterRegistry: Record<string, string[]> = {
  contacts: ['name', 'email', 'sales_id', 'organization_id', 'deleted_at'],
  opportunities: ['name', 'stage', 'priority', 'customer_organization_id', 'principal_organization_id'],
  tasks: ['title', 'type', 'sales_id', 'due_date', 'completed_at'],
};

export function sanitizeFilters(resource: string, filters: Record<string, any>): Record<string, any> {
  const allowedFilters = filterRegistry[resource] || [];
  return Object.keys(filters)
    .filter(key => allowedFilters.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: filters[key] }), {});
}
```

**Why:** React Admin stores filters in localStorage. If a column is removed, old filters cause API errors. Filter registry prevents this.

---

## RPC Functions (Custom Business Logic)

### sync_opportunity

**Purpose:** Create or update opportunity with multi-participant support and products.

**Signature:**

```sql
CREATE FUNCTION sync_opportunity(
  p_opportunity_data JSONB,
  p_contacts_to_sync JSONB[],
  p_products_to_sync JSONB[]
) RETURNS opportunities
```

**Usage:**

```typescript
const { data, error } = await supabase.rpc('sync_opportunity', {
  p_opportunity_data: {
    id: 456,  // Omit for create
    name: 'Acme Corp Deal',
    stage: 'demo_scheduled',
    customer_organization_id: 10,
    principal_organization_id: 20,
  },
  p_contacts_to_sync: [
    { contact_id: 5 },
    { contact_id: 12 },
  ],
  p_products_to_sync: [
    { product_id_reference: 3, notes: 'High priority' },
  ],
});
```

**Business Logic:**

1. Upsert opportunity record
2. Sync opportunity_contacts junction (add/remove as needed)
3. Sync opportunity_products junction
4. Return enriched opportunity

**Error Handling:**

```typescript
if (error) {
  if (error.code === '23503') {
    // Foreign key violation
    throw new Error('Invalid customer, principal, or contact ID');
  }
  throw error;  // Fail fast
}
```

---

### log_engagement

**Purpose:** Log activity with auto-populated organization from contact.

**Signature:**

```sql
CREATE FUNCTION log_engagement(
  p_type interaction_type,
  p_subject TEXT,
  p_description TEXT DEFAULT NULL,
  p_contact_id BIGINT DEFAULT NULL,
  p_organization_id BIGINT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS BIGINT  -- Returns activity_id
```

**Usage:**

```typescript
const { data, error } = await supabase.rpc('log_engagement', {
  p_type: 'call',
  p_subject: 'Follow-up call about pricing',
  p_contact_id: 123,  // Organization auto-populated from contact's primary org
  p_activity_date: new Date().toISOString(),
});
```

**Business Logic:**

1. Validate: at least one of `contact_id` or `organization_id` required
2. If `contact_id` provided without `organization_id`, lookup contact's primary org
3. Insert activity record
4. Return `activity_id`

---

### get_or_create_tag / get_or_create_segment

**Purpose:** Upsert pattern for tags/segments (autocomplete, case-insensitive).

**Signature:**

```sql
CREATE FUNCTION get_or_create_tag(p_name TEXT) RETURNS tags
```

**Usage:**

```typescript
const { data, error } = await supabase.rpc('get_or_create_tag', {
  p_name: 'VIP Customer',
});

// Returns existing tag or creates new one (case-insensitive)
```

**Implementation:**

```sql
INSERT INTO tags (name, created_by)
VALUES (trim(p_name), auth.uid())
ON CONFLICT (LOWER(name)) DO NOTHING;

RETURN QUERY
SELECT * FROM tags
WHERE LOWER(name) = LOWER(trim(p_name));
```

---

## Authentication & Authorization

### Auth Provider

**Location:** `src/atomic-crm/providers/supabase/authProvider.ts`

**Methods:**

```typescript
interface AuthProvider {
  login(params: { username: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<void>;
  checkError(error: any): Promise<void>;
  getIdentity(): Promise<UserIdentity>;
  getPermissions(): Promise<Permissions>;
}
```

---

### Login

**Method:** `login({ username, password })`

**Flow:**

1. Call `supabase.auth.signInWithPassword({ email, password })`
2. On success, fetch user's `sales` record
3. Store user identity in React Admin
4. Redirect to dashboard

**Example:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'john@example.com',
  password: 'password123',
});

if (error) throw error;

// Fetch sales record
const { data: salesRecord } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', data.user.id)
  .single();

return { id: salesRecord.id, fullName: salesRecord.name, avatar: salesRecord.avatar_url };
```

---

### Row Level Security (RLS)

**Pattern:** RLS policies enforce data access based on `auth.uid()`.

**Shared Team Access (contacts, organizations):**

```sql
CREATE POLICY select_contacts ON contacts
FOR SELECT TO authenticated
USING (true);  -- All authenticated users can read
```

**Personal Data (tasks):**

```sql
CREATE POLICY select_tasks ON tasks
FOR SELECT TO authenticated
USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Admin-Only (UPDATE/DELETE on shared tables):**

```sql
CREATE POLICY update_contacts ON contacts
FOR UPDATE TO authenticated
USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);
```

---

### Permissions

**Method:** `getPermissions()`

**Returns:**

```typescript
interface Permissions {
  role: 'admin' | 'user';
}
```

**Usage in Components:**

```tsx
const { permissions } = usePermissions();

return (
  <>
    {permissions?.role === 'admin' && <DeleteButton />}
    {permissions?.role === 'user' && <EditButton />}
  </>
);
```

---

## Error Handling

### Error Types

**Validation Errors (Zod):**

```typescript
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address",
  }
}
```

**Database Errors (PostgreSQL):**

```typescript
{
  code: "23503",  // Foreign key violation
  message: "insert or update on table \"opportunities\" violates foreign key constraint...",
}
```

**RLS Policy Violations:**

```typescript
{
  code: "42501",  // Insufficient privilege
  message: "new row violates row-level security policy for table \"contacts\"",
}
```

---

### Error Handling Pattern

**Fail Fast (Engineering Constitution #1):**

```typescript
try {
  const { data, error } = await supabase
    .from('contacts')
    .insert(newContact)
    .select()
    .single();

  if (error) throw error;  // NO fallbacks, NO silent degradation

  return { data };
} catch (error) {
  // Let React Admin handle error display
  throw error;
}
```

**Validation Errors:**

```typescript
export async function validateContactForm(data: any): Promise<void> {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        errors: formattedErrors,  // React Admin expects this format
      };
    }
    throw error;
  }
}
```

---

## Data Caching

**Location:** `src/atomic-crm/providers/supabase/dataProviderCache.ts`

**Purpose:** Simple in-memory cache for reference data (sales, organizations).

**Pattern:**

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

export async function getCachedOrFetch(
  key: string,
  fetchFn: () => Promise<any>
): Promise<any> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**Usage:**

```typescript
const sales = await getCachedOrFetch('sales', () =>
  supabase.from('sales').select('*')
);
```

---

## API Conventions

### Naming Conventions

**Tables:** `snake_case` (PostgreSQL standard)

```sql
CREATE TABLE opportunity_contacts (...);
CREATE TABLE contact_organizations (...);
```

**Columns:** `snake_case`

```sql
customer_organization_id
estimated_close_date
```

**Enums:** `snake_case` values

```sql
CREATE TYPE opportunity_stage AS ENUM ('new_lead', 'demo_scheduled', 'closed_won');
```

**Resources (React Admin):** `camelCase` or `PascalCase`

```typescript
<Resource name="contacts" />
<Resource name="opportunityNotes" />  // Maps to "opportunityNotes" table
```

---

### Date Handling

**Database:** `TIMESTAMPTZ` (timestamp with time zone)

**API:** ISO 8601 strings

```typescript
{
  created_at: "2025-11-09T10:30:00.000Z",
  due_date: "2025-11-15"  // Date-only fields
}
```

**Client:**

```typescript
new Date(record.created_at);  // Parse to Date object
record.due_date  // Keep as string for date inputs
```

---

### JSONB Arrays (email, phone)

**Database:**

```sql
email JSONB DEFAULT '[]'::jsonb
```

**API Request:**

```json
{
  "email": [
    {"email": "john@work.com", "type": "Work"},
    {"email": "john@home.com", "type": "Home"}
  ]
}
```

**Validation:** See `src/atomic-crm/validation/contacts.ts`

```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
});
```

---

## Performance Considerations

### Pagination

**Default:** 25 records per page

**Query:**

```sql
SELECT * FROM contacts LIMIT 25 OFFSET 0;  -- Page 1
SELECT * FROM contacts LIMIT 25 OFFSET 25; -- Page 2
```

**Total Count:**

```sql
SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL;
```

---

### Indexes

**Critical indexes:**

- Primary keys (auto-indexed)
- Foreign keys (auto-indexed)
- `deleted_at` (for soft delete filtering)
- `search_tsv` (GIN for full-text search)
- `LOWER(name)` unique indexes (tags, segments)

---

### Views for Performance

**Use summary views for list queries:**

```typescript
contacts: {
  table: 'contacts_summary',  // Includes company_name, sales_name (JOIN pre-computed)
}
```

**Benefits:**
- Reduce JOIN operations in app code
- Consistent data shape
- Easier to optimize (materialized views later if needed)

---

## Related Documentation

- [Database Schema](./database-schema.md) - Tables, relationships, RLS
- [Business Rules](./business-rules.md) - Validation and constraints
- [Engineering Constitution](../claude/engineering-constitution.md#2-single-source-of-truth) - Data layer principles
- [Supabase Workflow](../supabase/WORKFLOW.md) - Migration and deployment
