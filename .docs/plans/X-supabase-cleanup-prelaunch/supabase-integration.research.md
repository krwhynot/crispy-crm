# Supabase Integration Research - Atomic CRM

Research conducted to understand the Supabase integration architecture, data provider patterns, auth flow, edge functions, database views, and triggers in the Atomic CRM codebase.

## Overview

The Atomic CRM uses a sophisticated Supabase integration architecture with a unified data provider layer that consolidates validation, transformation, and error logging. The system leverages PostgreSQL views for data aggregation, database triggers for automated sync operations, and edge functions for operations requiring elevated privileges. All database operations flow through a single provider that handles React Admin integration, PostgREST query formatting, and JSONB array field transformations.

## Relevant Files

### Data Provider Core
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Central data provider with integrated validation, transformation, and error logging (829 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - Helper utilities for PostgREST escaping, array filter transformation, full-text search, and JSONB normalization
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filterable fields registry preventing 400 errors from stale cached filters
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/resources.ts` - Resource configuration mapping React Admin resources to database tables/views
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/index.ts` - Public exports for data and auth providers
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/supabase.ts` - Supabase client initialization

### Service Layer (Decomposed from unified provider)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/ValidationService.ts` - Zod validation at API boundary with filter validation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/TransformService.ts` - Data transformations for file uploads, avatar processing, field renaming
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/StorageService.ts` - Supabase Storage operations
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/index.ts` - Service exports

### Business Logic Services
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/junctions.service.ts` - Many-to-many relationship operations (contact-organizations, opportunity-participants)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/sales.service.ts` - User management via edge functions
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/opportunities.service.ts` - Opportunity-specific operations
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/activities.service.ts` - Activity log operations

### Authentication
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` - Auth flow with role-based access control and sales table integration

### Edge Functions
- `/home/krwhynot/projects/crispy-crm/supabase/functions/users/index.ts` - User CRUD operations requiring admin privileges (invite, patch)
- `/home/krwhynot/projects/crispy-crm/supabase/functions/updatePassword/index.ts` - Password reset functionality
- `/home/krwhynot/projects/crispy-crm/supabase/functions/_shared/cors-config.ts` - Dynamic CORS configuration with origin allowlist
- `/home/krwhynot/projects/crispy-crm/supabase/functions/_shared/supabaseAdmin.ts` - Admin client for service role operations

### Database Schema
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` - Complete production schema with views, functions, triggers (33k+ tokens)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` - Auth triggers for user-sales sync

## Architectural Patterns

### 1. Unified Data Provider Architecture

**Pattern**: Single provider layer consolidating multiple concerns
- **Location**: `unifiedDataProvider.ts` (lines 244-804)
- **Replaces**: Previous 4+ layer provider chain
- **Integrates**:
  - Validation (via ValidationService)
  - Transformation (via TransformService)
  - Error logging with structured context
  - PostgREST query formatting
  - Array filter transformation for JSONB fields
  - Soft delete filtering
  - Summary view routing

**Key Methods**:
```typescript
// All CRUD operations follow this pattern:
async getList(resource, params) {
  return wrapMethod("getList", resource, params, async () => {
    // 1. Validate and clean filters
    processedParams.filter = validationService.validateFilters(resource, processedParams.filter);

    // 2. Apply search parameters and array transformations
    const searchParams = applySearchParams(resource, processedParams);

    // 3. Route to appropriate database resource (table or view)
    const dbResource = getDatabaseResource(resource, "list");

    // 4. Execute query through base provider
    const result = await baseDataProvider.getList(dbResource, searchParams);

    // 5. Normalize JSONB array fields in response
    return { ...result, data: normalizeResponseData(resource, result.data) };
  });
}

async create(resource, params) {
  return wrapMethod("create", resource, params, async () => {
    // 1. Validate FIRST (original field names like 'products')
    // 2. Transform SECOND (field renames like 'products_to_sync')
    const processedData = await processForDatabase(resource, params.data, "create");

    // 3. Special handling for RPC-based operations (segments, opportunities with products)
    // 4. Execute create through base provider
    return baseDataProvider.create(dbResource, { ...params, data: processedData });
  });
}
```

**Error Handling Pattern**:
- All operations wrapped in `wrapMethod()` for consistent error logging
- Validation errors formatted for React Admin inline display: `{ message: string, errors: { field: message } }`
- Idempotent deletes handle React Admin's undoable mode gracefully
- PostgREST errors parsed to extract field-specific issues

### 2. Filter Registry & Validation

**Pattern**: Prevent 400 errors from stale cached filters
- **Location**: `filterRegistry.ts` (lines 21-186)
- **Purpose**: Define valid filterable fields per resource based on actual database schema
- **Used By**:
  - `ValidationService.validateFilters()` in data provider layer (API protection)
  - `useFilterCleanup()` hook in components (localStorage/UI cleanup)

**Example Schema**:
```typescript
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "id", "first_name", "last_name", "email", "phone", // JSONB fields
    "title", "department", "city", "state", "sales_id",
    "created_at", "updated_at", "deleted_at", "last_seen",
    "gender", "tags", "organization_id", "company_name",
    "q" // Special: full-text search parameter
  ],
  opportunities: [
    "id", "name", "stage", "status", "priority",
    "estimated_close_date", "customer_organization_id",
    "contact_ids", "opportunity_owner_id", "created_by",
    "created_at", "updated_at", "deleted_at", "q"
  ]
};

// Handles React Admin operators: "last_seen@gte" -> "last_seen"
function isValidFilterField(resource: string, filterKey: string): boolean {
  const baseField = filterKey.split('@')[0];
  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
```

### 3. PostgREST Query Formatting

**Pattern**: Transform React Admin filters to PostgREST operators
- **Location**: `dataProviderUtils.ts` (lines 76-142)
- **Key Functions**:
  - `escapeForPostgREST()` - Backslash escaping with LRU cache (1000 entries)
  - `transformArrayFilters()` - Array to PostgREST operator conversion
  - `applyFullTextSearch()` - Multi-column search with soft delete
  - `normalizeJsonbArrayFields()` - Ensure JSONB fields are always arrays

**Array Filter Transformation Logic**:
```typescript
// JSONB array fields (tags, email, phone) use @cs (contains) operator
{ tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }

// Regular enum/text fields use @in operator
{ status: ["active", "pending"] } → { "status@in": "(active,pending)" }

// Single values for JSONB arrays
{ tags: 5 } → { "tags@cs": "{5}" }
```

**Escape Cache Pattern**:
- LRU cache for frequently escaped values
- Max size: 1000 entries
- Eviction: Clear half when limit reached
- Proper backslash escaping: `\` → `\\`, `"` → `\"`

### 4. Database Views for Data Aggregation

**Pattern**: Use PostgreSQL views for denormalized reads, base tables for writes
- **Location**: `20251013000000_cloud_schema_sync.sql` (lines 1384-1645, 2570-2598)

**Contacts Summary View**:
```sql
CREATE OR REPLACE VIEW "public"."contacts_summary" AS
 SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
        c.title, c.department, c.city, c.state, c.tags,
        c.organization_id, o.name AS company_name
   FROM contacts c
   LEFT JOIN organizations o ON (o.id = c.organization_id AND o.deleted_at IS NULL)
  WHERE c.deleted_at IS NULL;
```
- **Purpose**: Includes company name from organization join
- **Soft delete filtering**: Built into view (no need for filters)
- **Used by**: `getList()` and `getOne()` operations for contacts

**Organizations Summary View**:
```sql
CREATE OR REPLACE VIEW "public"."organizations_summary" AS
 SELECT o.id, o.name, o.organization_type, o.is_principal,
        COUNT(DISTINCT opp.id) AS nb_opportunities,
        COUNT(DISTINCT c.id) AS nb_contacts,
        MAX(opp.updated_at) AS last_opportunity_activity
   FROM organizations o
   LEFT JOIN opportunities opp ON ((opp.customer_organization_id = o.id
                                OR opp.principal_organization_id = o.id
                                OR opp.distributor_organization_id = o.id)
                               AND opp.deleted_at IS NULL)
   LEFT JOIN contacts c ON (c.organization_id = o.id AND c.deleted_at IS NULL)
  WHERE o.deleted_at IS NULL
  GROUP BY o.id;
```
- **Purpose**: Aggregate counts and last activity date
- **Reduces**: N+1 queries for list views
- **Alternative**: Could use PostgREST computed columns, but views are more explicit

**View Routing Logic** (`dataProviderUtils.ts:179-199`):
```typescript
function getDatabaseResource(resource, operation = "list") {
  if (operation === "list" || operation === "one") {
    if (resource === "organizations" || resource === "contacts") {
      return `${resource}_summary`; // Use view for reads
    }
  }
  return resource; // Use base table for writes
}
```

### 5. Database Triggers for Automated Operations

**Pattern**: Use PostgreSQL triggers for auth sync and search indexing

**Auth Sync Triggers** (`20251015014019_restore_auth_triggers.sql`):
```sql
-- Auto-create sales record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync email updates from auth.users to sales
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();
```

**Handler Functions** (`20251013000000_cloud_schema_sync.sql:461-492`):
```sql
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.sales (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_update_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.sales
    SET email = NEW.email, updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;
```
- **Why**: Supabase Auth is separate from public schema, triggers keep them in sync
- **Security**: `SECURITY DEFINER` allows function to write to `sales` table
- **Critical**: These triggers were excluded in schema dumps, restored separately

**Full-Text Search Triggers** (`20251013000000_cloud_schema_sync.sql:2602-2614`):
```sql
CREATE TRIGGER trigger_update_contacts_search_tsv
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_organizations_search_tsv
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_organizations_search_tsv();
```
- **Purpose**: Maintain `search_tsv` column for full-text search
- **Performance**: Uses weighted tsvector (`setweight()`) for relevance ranking
- **Alternative**: Could compute at query time, but pre-computing is faster

### 6. RPC Functions for Complex Operations

**Pattern**: Use PostgreSQL functions for atomic multi-table operations

**Opportunity with Products Sync** (`20251013000000_cloud_schema_sync.sql:778-867`):
```sql
CREATE OR REPLACE FUNCTION sync_opportunity_with_products(
  opportunity_data jsonb,
  products_to_create jsonb,
  products_to_update jsonb,
  product_ids_to_delete integer[]
) RETURNS jsonb
LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Upsert opportunity (INSERT ... ON CONFLICT DO UPDATE)
  INSERT INTO opportunities (...) VALUES (...)
  ON CONFLICT (id) DO UPDATE SET ... RETURNING id INTO opportunity_id;

  -- 2. Insert new products
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (...) SELECT ... FROM jsonb_to_recordset(...);
  END IF;

  -- 3. Update existing products
  -- 4. Delete removed products
  -- 5. Return complete opportunity with products
END;
$$;
```

**Usage in Data Provider** (`unifiedDataProvider.ts:379-404, 434-471`):
```typescript
// CREATE with products
if (resource === "opportunities" && processedData.products_to_sync) {
  const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
    opportunity_data: processedData,
    products_to_create: products,
    products_to_update: [],
    products_to_delete: []
  });
}

// UPDATE with products (includes diff logic)
if (resource === "opportunities" && processedData.products_to_sync) {
  const { creates, updates, deletes } = diffProducts(originalProducts, formProducts);
  const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
    opportunity_data: { ...processedData, id: params.id },
    products_to_create: creates,
    products_to_update: updates,
    products_to_delete: deletes
  });
}
```

**Other RPC Functions**:
- `get_or_create_segment(p_name)` - Idempotent segment creation
- `set_primary_organization(p_contact_id, p_organization_id)` - Atomic flag update
- `log_interaction(...)` - Activity logging with participant tracking

### 7. Service Layer Pattern

**Pattern**: Extract business logic from data provider into specialized services
- **Location**: `src/atomic-crm/services/`
- **Services**:
  - `ValidationService` - Zod validation at API boundary
  - `TransformService` - Data mutations (file uploads, field renaming)
  - `StorageService` - Supabase Storage operations
  - `JunctionsService` - Many-to-many relationships
  - `SalesService` - User management via edge functions
  - `OpportunitiesService` - Opportunity-specific operations
  - `ActivitiesService` - Activity log queries

**JunctionsService Example** (`junctions.service.ts:1-174`):
```typescript
export class JunctionsService {
  constructor(private dataProvider: DataProvider & { rpc?: (...) => Promise<any> }) {}

  async getContactOrganizations(contactId: Identifier) {
    // 1. Get junction records
    const response = await this.dataProvider.getList("contact_organizations", {
      filter: { contact_id: contactId },
      sort: { field: "is_primary", order: "DESC" }
    });

    // 2. Batch fetch organizations (avoid N+1)
    const orgIds = response.data.map(co => co.organization_id).filter(Boolean);
    const { data: orgs } = await this.dataProvider.getMany("organizations", { ids: orgIds });
    const orgMap = new Map(orgs.map(o => [o.id, o]));

    // 3. Combine junction data with organization details
    return response.data.map(contactOrg => ({
      ...contactOrg,
      organization: orgMap.get(contactOrg.organization_id)
    }));
  }

  async setPrimaryOrganization(contactId, organizationId) {
    // Uses RPC for atomic operation
    await this.dataProvider.rpc("set_primary_organization", {
      p_contact_id: contactId,
      p_organization_id: organizationId
    });
  }
}
```

**Benefits**:
- **Single Responsibility**: Each service handles one domain
- **Testability**: Services can be tested in isolation
- **Reusability**: Business logic shared across components
- **Type Safety**: Strong typing for service methods

### 8. Authentication Flow

**Pattern**: Supabase Auth + sales table sync + role-based access
- **Location**: `authProvider.ts` (lines 1-89)

**Auth Provider Structure**:
```typescript
export const authProvider: AuthProvider = {
  ...baseAuthProvider, // From ra-supabase-core

  login: async (params) => {
    const result = await baseAuthProvider.login(params);
    cachedSale = undefined; // Clear cache on login
    return result;
  },

  checkAuth: async (params) => {
    // Allow access to set-password and forgot-password pages without auth
    if (window.location.pathname === "/set-password" ||
        window.location.hash.includes("#/set-password")) {
      return;
    }
    return baseAuthProvider.checkAuth(params);
  },

  canAccess: async (params) => {
    const sale = await getSaleFromCache();
    const role = sale.is_admin ? "admin" : "user";
    return canAccess(role, params);
  }
};
```

**Sales Cache Pattern**:
```typescript
let cachedSale: any;
const getSaleFromCache = async () => {
  if (cachedSale != null) return cachedSale;

  // 1. Get session from Supabase Auth
  const { data: dataSession } = await supabase.auth.getSession();

  // 2. Fetch corresponding sales record
  const { data: dataSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin")
    .match({ user_id: dataSession?.session?.user.id })
    .maybeSingle();

  cachedSale = dataSale;
  return dataSale;
};
```

**Identity Resolution**:
```typescript
getIdentity: async () => {
  const sale = await getSaleFromCache();
  return {
    id: sale.id,
    fullName: `${sale.first_name} ${sale.last_name}`,
    avatar: sale.avatar_url
  };
}
```

**Flow**:
1. User logs in via Supabase Auth → `auth.users` record created
2. `on_auth_user_created` trigger → `sales` record auto-created
3. Auth provider fetches `sales` record using `user_id` foreign key
4. Role determined from `sales.is_admin` boolean
5. Access control via `canAccess()` checks role permissions

### 9. Edge Functions for Elevated Privileges

**Pattern**: Use Deno edge functions for operations requiring service role access

**Users Edge Function** (`supabase/functions/users/index.ts`):
```typescript
// POST /users - Invite new user (admin only)
async function inviteUser(req, currentUserSale, corsHeaders) {
  if (!currentUserSale.administrator) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Use supabaseAdmin (service role) to create user
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email, password,
    user_metadata: { first_name, last_name }
  });

  // Send invitation email
  await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  // Update sales table (disabled, administrator flags)
  await updateSaleDisabled(data.user.id, disabled);
  const sale = await updateSaleAdministrator(data.user.id, administrator);

  return new Response(JSON.stringify({ data: sale }), { headers: corsHeaders });
}

// PATCH /users - Update user (admin or self)
async function patchUser(req, currentUserSale, corsHeaders) {
  const { data: sale } = await supabaseAdmin
    .from("sales").select("*").eq("id", sales_id).single();

  // Permission check: admin or updating own profile
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Update auth.users (email, ban status, metadata)
  await supabaseAdmin.auth.admin.updateUserById(sale.user_id, {
    email, ban_duration: disabled ? "87600h" : "none",
    user_metadata: { first_name, last_name }
  });

  // Update sales table (avatar, admin flag if authorized)
  if (avatar) await updateSaleAvatar(data.user.id, avatar);
  if (currentUserSale.administrator) {
    await updateSaleAdministrator(data.user.id, administrator);
  }
}
```

**Update Password Edge Function** (`supabase/functions/updatePassword/index.ts`):
```typescript
async function updatePassword(user, corsHeaders) {
  // Uses admin client to send password reset email
  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email);
  return new Response(JSON.stringify({ data }), { headers: corsHeaders });
}
```

**Shared Utilities**:
- `_shared/cors-config.ts` - Dynamic CORS with origin allowlist
- `_shared/supabaseAdmin.ts` - Service role client initialization

**Why Edge Functions**:
- Supabase lacks public API for user management (CRUD operations)
- Service role key required for `auth.admin.*` methods
- Cannot expose service role key to frontend
- Edge functions provide secure API layer with permission checks

### 10. CORS Configuration Pattern

**Pattern**: Dynamic origin validation with environment-based allowlist
- **Location**: `supabase/functions/_shared/cors-config.ts`

```typescript
const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173", "http://127.0.0.1:5173",
  "http://localhost:3000", "http://127.0.0.1:3000"
];

function parseAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (!envOrigins) {
    const isProduction = Deno.env.get("DENO_ENV") === "production";
    return isProduction ? DEFAULT_PRODUCTION_ORIGINS : DEFAULT_DEVELOPMENT_ORIGINS;
  }
  return envOrigins.split(",").map(o => o.trim()).filter(o => o.length > 0);
}

export function createCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = parseAllowedOrigins();
  let allowOrigin = "null"; // Default fallback

  if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
    allowOrigin = requestOrigin;
  } else if (isDevelopment && allowedOrigins.includes("http://localhost:5173")) {
    allowOrigin = "http://localhost:5173"; // Dev fallback
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, PATCH, DELETE",
    "Access-Control-Allow-Credentials": "true"
  };
}
```

**Security Improvement**:
- Replaces wildcard `*` CORS policy
- Validates request origin against allowlist
- Environment-specific configuration
- Supports credentials for authenticated requests

## Gotchas & Edge Cases

### 1. Validation BEFORE Transformation (Issue 0.4)

**Location**: `unifiedDataProvider.ts:166-183`

**Problem**: If transformation happens first, validation sees renamed fields
```typescript
// WRONG ORDER:
transform({ products: [...] }) → { products_to_sync: [...] }
validate({ products_to_sync: [...] }) → ERROR: "products" field missing
```

**Solution**: Validate first, then transform
```typescript
async function processForDatabase(resource, data, operation) {
  // Validate FIRST (original field names like 'products')
  await validateData(resource, data, operation);

  // Then apply transformations (field renames like 'products_to_sync')
  const processedData = await transformData(resource, data, operation);

  return processedData;
}
```

**Why**: Validation schemas expect original field names from forms, transformations rename fields for database compatibility.

### 2. PreviousData Required for Products Update (Issue 0.1)

**Location**: `unifiedDataProvider.ts:437-448`

**Problem**: Diffing products requires knowing original state
```typescript
// If previousData.products is missing:
const { creates, updates, deletes } = diffProducts(undefined, formProducts);
// ❌ Cannot determine what changed without baseline
```

**Solution**: Form must fetch complete record with `meta.select`
```typescript
if (!params.previousData?.products) {
  throw new Error(
    "Cannot update products: previousData.products is missing. " +
    "Ensure the form fetches the complete record with meta.select."
  );
}
```

**Requirement**: React Admin forms must include `meta: { select: "*, products(*)" }` in dataProvider calls.

### 3. Idempotent Deletes for Undoable Mode

**Location**: `unifiedDataProvider.ts:201-206`

**Problem**: React Admin's undoable mode updates UI before API call
```typescript
// Timeline:
// 1. User clicks delete → UI removes item immediately
// 2. User waits 5 seconds without undo
// 3. API call executes → resource already deleted → 400 error
```

**Solution**: Treat "already deleted" as success
```typescript
if (method === 'delete' && error.message?.includes('Cannot coerce the result to a single JSON object')) {
  // Resource was already deleted (possibly by another client or undoable mode)
  return { data: params.previousData }; // Return success with previous data
}
```

**Why**: PostgREST returns specific error when delete target doesn't exist, gracefully handle this case.

### 4. View vs Table for Soft Delete Filtering

**Location**: `dataProviderUtils.ts:216-226`

**Problem**: Adding `deleted_at@is: null` filter to view queries causes PostgREST errors
```sql
-- View already filters deleted records:
CREATE VIEW contacts_summary AS
  SELECT ... FROM contacts WHERE deleted_at IS NULL;

-- Adding filter again causes error:
SELECT * FROM contacts_summary WHERE deleted_at IS NULL;
-- ❌ ERROR: Column "deleted_at" doesn't exist in view
```

**Solution**: Only apply soft delete filter to base tables
```typescript
const isView = dbResource.includes("_summary") || dbResource.includes("_view");
const needsSoftDeleteFilter = supportsSoftDelete(resource) &&
  !params.filter?.includeDeleted &&
  !isView; // Skip filter for views
```

**Detection**: Check if `dbResource` name includes `_summary` or `_view` suffixes.

### 5. Array Filter Transformation for JSONB Fields

**Location**: `dataProviderUtils.ts:89-142`

**Problem**: JSONB array fields use different PostgREST operators than regular fields
```typescript
// JSONB array (tags stored as [1, 2, 3]):
{ tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" } // Contains operator

// Regular field (status stored as 'active'):
{ status: ["active", "pending"] } → { "status@in": "(active,pending)" } // IN operator
```

**Solution**: Separate handling based on field type
```typescript
const jsonbArrayFields = ['tags', 'email', 'phone'];

if (jsonbArrayFields.includes(key)) {
  transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
} else {
  transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
}
```

**Escaping**: Both require proper PostgREST value escaping (backslash, not double quotes).

### 6. Triggers Excluded from Schema Dumps

**Location**: `20251015014019_restore_auth_triggers.sql`

**Problem**: `supabase db dump` with `--schema public` excludes triggers on `auth.users` table
```bash
# This excludes auth schema triggers:
supabase db dump --linked --schema public > migration.sql
```

**Why**: Triggers are defined in `auth` schema but execute functions in `public` schema, dump doesn't follow cross-schema references.

**Solution**: Manually restore auth triggers in separate migration
```sql
-- Must explicitly recreate after schema sync:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Detection**: If new users don't appear in `sales` table after signup, triggers are missing.

### 7. Filter Registry Must Match Database Schema

**Location**: `filterRegistry.ts:21-186`

**Problem**: After schema migrations, filterable fields may become invalid
```typescript
// Before migration (tasks table had "text" column):
filterableFields.tasks = ["id", "text", "type", "contact_id"];

// After migration (renamed to "title"):
SELECT * FROM tasks WHERE text ILIKE '%foo%';
-- ❌ ERROR: column "text" does not exist
```

**Solution**: Update `filterRegistry.ts` after every schema change
```typescript
filterableFields.tasks = [
  "id",
  "title", // Changed from "text" to match database column
  "type",
  "contact_id"
];
```

**Validation**: `ValidationService.validateFilters()` logs warnings for invalid fields and removes them before API calls.

### 8. RPC Error Parsing

**Location**: `unifiedDataProvider.ts:393-400, 460-467`

**Problem**: RPC functions may return structured errors as JSON strings
```typescript
const { data, error } = await supabase.rpc("sync_opportunity_with_products", {...});

// error.message might be: '{"message":"Validation failed","errors":{"amount":"Required"}}'
// Not a plain string!
```

**Solution**: Try parsing as JSON before throwing
```typescript
if (error) {
  try {
    const parsedError = JSON.parse(error.message);
    throw parsedError; // Structured error for React Admin
  } catch {
    throw error; // Plain error if parse fails
  }
}
```

**Why**: Database functions can construct complex error objects, preserve structure for form field validation.

### 9. JSONB Array Normalization

**Location**: `dataProviderUtils.ts:283-333`

**Problem**: JSONB fields may return as objects instead of arrays due to legacy data
```typescript
// Expected: { email: ["user@example.com"] }
// Reality:  { email: "user@example.com" } // String instead of array
// Or:       { email: { value: "user@example.com" } } // Object wrapper
```

**Solution**: Normalize all responses to ensure array structure
```typescript
function normalizeJsonbArrayFields(data) {
  const ensureArray = (value: any) => {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) {
      return typeof value === 'object' ? [value] : [];
    }
    return value;
  };

  return {
    ...data,
    email: ensureArray(data.email),
    phone: ensureArray(data.phone),
    tags: ensureArray(data.tags)
  };
}
```

**Applied**: All `getList`, `getOne`, `getMany`, `getManyReference` responses normalized before return.

### 10. Service Role Key Security

**Location**: `supabase/functions/_shared/supabaseAdmin.ts`

**Problem**: Service role key has unrestricted database access
```typescript
// ⚠️ NEVER expose service role key to frontend:
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") // Bypasses RLS policies
);
```

**Why Edge Functions**:
- Service role key stored in Supabase secrets (not exposed to client)
- Edge functions run server-side with access to secrets
- Permission checks implemented in edge function code
- Frontend calls edge function with user auth token

**Security Pattern**:
```typescript
// 1. Frontend calls edge function with user token:
const { data } = await supabase.functions.invoke("users", {
  body: { email, password },
  headers: { Authorization: `Bearer ${userToken}` }
});

// 2. Edge function validates user permission:
const localClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await localClient.auth.getUser();
const { data: currentUserSale } = await supabaseAdmin
  .from("sales").select("*").eq("user_id", user.id).single();

if (!currentUserSale.administrator) {
  return createErrorResponse(401, "Not Authorized");
}

// 3. Only if authorized, use admin client:
await supabaseAdmin.auth.admin.createUser({ email, password });
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Admin App                              │
│  (Forms, Lists, Detail Views)                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Unified Data Provider                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ wrapMethod(operation, resource, params, callback)            │   │
│  │  1. Validate filters (ValidationService)                     │   │
│  │  2. Transform data (TransformService)                        │   │
│  │  3. Route to view/table (getDatabaseResource)                │   │
│  │  4. Execute operation (baseDataProvider)                     │   │
│  │  5. Normalize response (normalizeJsonbArrayFields)           │   │
│  │  6. Log errors with context                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────┬────────────────────┬────┘
                 │                          │                    │
                 ▼                          ▼                    ▼
┌────────────────────────────┐ ┌───────────────────┐ ┌─────────────────┐
│  ValidationService          │ │ TransformService  │ │ StorageService  │
│  - Zod schemas              │ │ - File uploads    │ │ - Bucket ops    │
│  - Filter validation        │ │ - Avatar/logo     │ │ - Public URLs   │
│  - React Admin error format │ │ - Field renames   │ │ - File removal  │
└─────────────┬──────────────┘ └────────┬──────────┘ └────────┬────────┘
              │                         │                      │
              ▼                         ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ra-supabase-core Provider                         │
│  (React Admin → PostgREST query translation)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase Client                                 │
│  (PostgREST API, Auth, Storage, Functions)                           │
└────────────┬──────────────┬──────────────┬─────────────────────┬────┘
             │              │              │                     │
             ▼              ▼              ▼                     ▼
┌────────────────┐ ┌───────────────┐ ┌──────────────┐ ┌────────────────┐
│  PostgreSQL    │ │ Supabase Auth │ │ Storage      │ │ Edge Functions │
│  - Tables      │ │ - auth.users  │ │ - Avatars    │ │ - users        │
│  - Views       │ │ - Sessions    │ │ - Logos      │ │ - updatePwd    │
│  - Functions   │ │ - Tokens      │ │ - Files      │ └────────────────┘
│  - Triggers    │ └───────────────┘ └──────────────┘
└────────────────┘

Service Layer (Business Logic):
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│ JunctionsService│ │ SalesService     │ │ OpportunitiesService│
│ - Contact-Orgs  │ │ - User mgmt      │ │ - Unarchive         │
│ - Opp-Contacts  │ │ - Edge fn calls  │ │ - Product sync      │
│ - Opp-Parties   │ │ - Password reset │ └─────────────────────┘
└─────────────────┘ └──────────────────┘

Auth Flow:
┌─────────────────────────────────────────────────────────────────────┐
│  1. User logs in → Supabase Auth creates session                    │
│  2. on_auth_user_created trigger → public.sales record created      │
│  3. authProvider.getIdentity() → fetch sales record by user_id      │
│  4. authProvider.canAccess() → check sales.is_admin for permissions │
│  5. Cached sale used for subsequent requests                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Takeaways

1. **Single Provider Layer**: All database operations flow through `unifiedDataProvider`, which integrates validation, transformation, error logging, and PostgREST formatting.

2. **View-Based Optimization**: `contacts_summary` and `organizations_summary` views reduce N+1 queries by pre-joining related data and aggregating counts.

3. **Filter Validation Critical**: `filterRegistry.ts` prevents 400 errors from stale cached filters after schema changes. Must be updated with every migration.

4. **JSONB Array Handling**: Contacts' `email`, `phone`, and `tags` fields require special handling for PostgREST `@cs` operator and response normalization.

5. **RPC for Complex Operations**: `sync_opportunity_with_products` provides atomic upsert of opportunity with related products, avoiding race conditions.

6. **Edge Functions for Privileged Ops**: User management requires service role access via edge functions, as Supabase doesn't expose admin API publicly.

7. **Triggers for Auth Sync**: `on_auth_user_created` and `on_auth_user_updated` keep `auth.users` and `public.sales` tables in sync automatically.

8. **Validate BEFORE Transform**: Critical ordering ensures Zod schemas see original field names before transformations rename fields for database compatibility.

9. **Service Layer Pattern**: Business logic extracted into specialized services (`JunctionsService`, `SalesService`, etc.) for better testability and reusability.

10. **Security by Design**: CORS with origin allowlist, service role key isolation in edge functions, permission checks before privileged operations.

## Relevant Docs

### Internal Documentation
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project architecture overview and development guidelines
- `/home/krwhynot/projects/crispy-crm/doc/developer/architecture-choices.md` - Architectural decision records

### External Resources
- [PostgREST API Documentation](https://postgrest.org/en/stable/api.html) - Query syntax, operators, filtering
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) - Writing and calling PostgreSQL functions
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers) - Database trigger patterns
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - Deno runtime, deployment, secrets
- [Supabase Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-api) - Service role user management
- [React Admin Data Providers](https://marmelab.com/react-admin/DataProviders.html) - Custom provider development
- [ra-supabase Documentation](https://github.com/marmelab/ra-supabase) - React Admin + Supabase integration
