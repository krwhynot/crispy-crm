# Data Provider Architecture Research

Comprehensive analysis of the Atomic CRM data provider architecture for schema drift remediation planning. This research focuses on understanding how table renames and schema changes would propagate through the system.

## Overview

The Atomic CRM uses a **unified data provider architecture** with strict separation of concerns:
- **Single Source of Truth**: All database operations flow through `unifiedDataProvider.ts` (828 lines)
- **Validation Layer**: Zod schemas at API boundary only (`ValidationService.ts`)
- **Transform Layer**: Data mutations and file uploads (`TransformService.ts`)
- **Resource Mapping**: Centralized table name mapping (`resources.ts`)
- **View Strategy**: Summary views for optimized list queries (`contacts_summary`, `organizations_summary`)
- **Junction Patterns**: RPC-based sync for many-to-many relationships

**Critical Finding**: Table renames require updates in exactly **3 core configuration files** plus validation schemas. The architecture is designed to isolate schema changes to these specific points.

## Relevant Files

### Core Data Provider Layer
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Main data provider (828 lines), orchestrates all CRUD operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - Utility functions for transforms, search, normalization (333 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts` - Resource name mapping registry (143 lines)

### Service Layer
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts` - Zod validation at API boundaries (236 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/TransformService.ts` - Data transformations and file uploads (144 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/StorageService.ts` - Supabase Storage operations (164 lines)

### Business Logic Services
- `/home/krwhynot/Projects/atomic/src/atomic-crm/services/junctions.service.ts` - Junction table operations (424 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/services/sales.service.ts` - Sales user operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/services/opportunities.service.ts` - Opportunity-specific operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/services/activities.service.ts` - Activity operations

### Configuration & Metadata
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filterable fields per resource (202 lines)
- `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` - Generated TypeScript types from Supabase schema

### Validation Schemas (API Boundary)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tags.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/products.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/sales.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/activities.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/segments.ts`

## Architectural Patterns

### 1. Resource Name Mapping (Critical for Table Renames)

**Pattern**: Centralized mapping in `resources.ts` isolates React Admin resource names from database table names.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`

```typescript
// RESOURCE_MAPPING constant (lines 7-38)
export const RESOURCE_MAPPING = {
  // Core entities
  organizations: "organizations",
  contacts: "contacts",
  opportunities: "opportunities",

  // Summary views for optimized queries
  organizations_summary: "organizations_summary",
  contacts_summary: "contacts_summary",

  // Notes (CRITICAL: camelCase resource → database table)
  contactNotes: "contactNotes",        // ← Potential drift point
  opportunityNotes: "opportunityNotes", // ← Potential drift point

  // Junction tables
  contact_organizations: "contact_organizations",
  opportunity_participants: "opportunity_participants",
  opportunity_contacts: "opportunity_contacts",

  // Other resources
  tasks: "tasks",
  tags: "tags",
  sales: "sales",
  activities: "activities",
  products: "products",
} as const;

// getResourceName function (lines 121-125)
export function getResourceName(resource: string): string {
  return RESOURCE_MAPPING[resource as keyof typeof RESOURCE_MAPPING] || resource;
}
```

**Impact of Table Renames**:
- **Single Point of Update**: Changing a table name requires updating `RESOURCE_MAPPING` only
- **No Backward Compatibility**: System explicitly removed legacy mappings (e.g., `deals` → `opportunities` migration)
- **Fallback Behavior**: Unknown resources pass through unchanged (`|| resource`)

**Usage Throughout Codebase**:
- `unifiedDataProvider.ts`: Lines 300, 358, 421, 489, 513, 519 (6 references)
- `dataProviderUtils.ts`: Line 184 (`getDatabaseResource` function)
- All CRUD operations call `getResourceName()` before database access

### 2. Database Resource Resolution (View vs Table Selection)

**Pattern**: `getDatabaseResource()` determines whether to use summary views or base tables based on operation type.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` (lines 180-199)

```typescript
export function getDatabaseResource(
  resource: string,
  operation: "list" | "one" | "create" | "update" | "delete" = "list",
): string {
  const actualResource = getResourceName(resource); // ← First resolves through RESOURCE_MAPPING

  // Use summary views for list operations when available
  if (operation === "list" || operation === "one") {
    const summaryResource = `${actualResource}_summary`;
    if (
      resource === "organizations" ||
      resource === "contacts"
    ) {
      return summaryResource; // Returns "contacts_summary" or "organizations_summary"
    }
    // Note: opportunities_summary removed for MVP - query base table directly
  }

  return actualResource; // Returns base table name
}
```

**View Selection Logic**:
- **List/One Operations**: Use `*_summary` views for `contacts` and `organizations`
- **Create/Update/Delete**: Always use base tables (views are read-only)
- **Opportunities**: No summary view (explicitly removed for MVP, comment on line 195)

**Impact of View Renames**:
- Views follow naming convention: `{table_name}_summary`
- Hardcoded resource checks on lines 190-191 (`resource === "organizations"`)
- Adding new views requires updating this function

### 3. Validation Layer Integration

**Pattern**: Validation happens BEFORE transformations at the API boundary using a registry pattern.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`

**Registry Structure** (lines 71-146):
```typescript
private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
  contacts: {
    create: async (data: unknown) => validateContactForm(data),
    update: async (data: unknown) => validateUpdateContact(data),
  },
  organizations: { /* ... */ },
  opportunities: { /* ... */ },
  contactNotes: {  // ← Uses camelCase resource name
    create: async (data: unknown) => validateCreateContactNote(data),
    update: async (data: unknown) => validateUpdateContactNote(data),
  },
  opportunityNotes: { /* ... */ },
  tasks: { /* ... */ },
  tags: { /* ... */ },
  sales: { /* ... */ },
  activities: { /* ... */ },
  segments: { /* ... */ },
};
```

**Critical for Table Renames**:
- Registry keys must match React Admin resource names (NOT database table names)
- Resources use **camelCase** for notes: `contactNotes`, `opportunityNotes`
- Database uses **camelCase** for note tables: `contactNotes`, `opportunityNotes` (from `database.generated.ts` lines 84, 547)
- **DRIFT POINT**: If note tables are renamed to snake_case (`contact_notes`, `opportunity_notes`), this requires updates in:
  1. `RESOURCE_MAPPING` in `resources.ts`
  2. `validationRegistry` keys in `ValidationService.ts`
  3. `transformerRegistry` keys in `TransformService.ts`
  4. `filterableFields` keys in `filterRegistry.ts`

**Filter Validation** (lines 195-235):
- `validateFilters()` method prevents 400 errors from stale cached filters
- Cross-references `filterRegistry.ts` for allowed fields per resource
- Automatically removes invalid fields with console warnings

### 4. Transform Service Pattern

**Pattern**: Data mutations (file uploads, field renames, computed fields) happen AFTER validation.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/TransformService.ts`

**Registry Structure** (lines 33-123):
```typescript
private transformerRegistry: Record<string, { transform?: TransformerFunction }> = {
  contactNotes: {
    transform: async (data) => {
      // Upload attachments to Supabase Storage
      if (data.attachments && Array.isArray(data.attachments)) {
        await Promise.all(data.attachments.map(att => this.storageService.uploadToBucket(att)));
      }
      return data;
    }
  },
  opportunityNotes: { /* Same pattern */ },
  contacts: {
    transform: async (data) => {
      // 1. Process avatar uploads
      const processedData = await processContactAvatar(data);

      // 2. Extract organizations for junction sync (organizations_to_sync pattern)
      const { organizations, ...cleanedData } = processedData;

      // 3. Combine first_name + last_name → name field (database requirement)
      if (cleanedData.first_name || cleanedData.last_name) {
        cleanedData.name = `${cleanedData.first_name || ''} ${cleanedData.last_name || ''}`.trim();
      }

      // 4. Add created_at timestamp for creates
      if (!cleanedData.id) {
        cleanedData.created_at = new Date().toISOString();
      }

      // 5. Preserve organizations for sync (renamed to avoid column conflict)
      if (organizations) {
        cleanedData.organizations_to_sync = organizations;
      }

      return cleanedData;
    }
  },
  organizations: { /* Logo upload + created_at */ },
  sales: { /* Avatar upload */ },
};
```

**Key Transformation Patterns**:
- **File Uploads**: Notes upload attachments, contacts/orgs upload avatars/logos
- **Field Renames**: `organizations` → `organizations_to_sync` (prevents database column conflict)
- **Computed Fields**: `first_name` + `last_name` → `name` (database requirement)
- **Timestamps**: Auto-add `created_at` for create operations

**Impact of Table Renames**:
- Registry keys must match React Admin resource names
- Transformer logic is resource-specific, not table-aware
- Junction sync pattern uses field renames (`*_to_sync`) to avoid column conflicts

### 5. Junction Table Handling

**Pattern**: Many-to-many relationships use RPC functions for atomic operations.

#### A. Contact-Organization Relationships

**Service**: `/home/krwhynot/Projects/atomic/src/atomic-crm/services/junctions.service.ts`

**Database Table**: `contact_organizations`

**Key Operations**:
```typescript
// GET: Fetch all organizations for a contact
async getContactOrganizations(contactId: Identifier): Promise<{ data: any[] }> {
  // 1. Query junction table
  const response = await this.dataProvider.getList("contact_organizations", {
    filter: { contact_id: contactId },
    sort: { field: "is_primary", order: "DESC" },
  });

  // 2. Batch fetch organizations (O(1) instead of N+1 queries)
  const orgIds = response.data.map(co => co.organization_id).filter(Boolean);
  const { data: orgs } = await this.dataProvider.getMany("organizations", { ids: orgIds });

  // 3. Map organizations to junction records
  const orgMap = new Map(orgs.map(o => [o.id, o]));
  return { data: response.data.map(co => ({ ...co, organization: orgMap.get(co.organization_id) })) };
}

// CREATE: Add contact to organization
async addContactToOrganization(contactId, organizationId, params = {}): Promise<{ data: any }> {
  return await this.dataProvider.create("contact_organizations", {
    data: {
      contact_id: contactId,
      organization_id: organizationId,
      is_primary: params.is_primary || false,
      created_at: new Date().toISOString(),
      ...params,
    },
  });
}

// UPDATE PRIMARY: Atomic RPC to set primary organization
async setPrimaryOrganization(contactId, organizationId): Promise<{ data: { success: boolean } }> {
  await this.dataProvider.rpc("set_primary_organization", {
    p_contact_id: contactId,
    p_organization_id: organizationId,
  });
  return { data: { success: true } };
}

// DELETE: Remove contact from organization
async removeContactFromOrganization(contactId, organizationId): Promise<{ data: { id: string } }> {
  // 1. Find the junction record
  const response = await this.dataProvider.getList("contact_organizations", {
    filter: { contact_id: contactId, organization_id: organizationId },
  });

  // 2. Delete if found
  if (response.data.length > 0) {
    await this.dataProvider.delete("contact_organizations", { id: response.data[0].id });
  }

  return { data: { id: `${contactId}-${organizationId}` } };
}
```

#### B. Opportunity-Product Sync Pattern

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (lines 379-405, 432-471)

**Pattern**: Uses `diffProducts()` algorithm + RPC for atomic sync.

```typescript
// CREATE OPPORTUNITY (lines 379-405)
if (resource === "opportunities") {
  if (processedData.products_to_sync) {
    const products = processedData.products_to_sync;
    delete processedData.products_to_sync; // Remove from opportunity data

    // Atomic RPC: Create opportunity + products in single transaction
    const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
      opportunity_data: processedData,
      products_to_create: products,
      products_to_update: [],
      products_to_delete: [],
    });

    if (error) throw error;
    return { data };
  }
}

// UPDATE OPPORTUNITY (lines 432-471)
if (resource === "opportunities") {
  if (processedData.products_to_sync) {
    // CRITICAL: Requires previousData.products for diff (Issue 0.1)
    if (!params.previousData?.products) {
      throw new Error("Cannot update products: previousData.products is missing");
    }

    const formProducts = processedData.products_to_sync;
    const originalProducts = params.previousData.products;
    delete processedData.products_to_sync;

    // Diff algorithm determines creates/updates/deletes
    const { creates, updates, deletes } = diffProducts(originalProducts, formProducts);

    // Atomic RPC: Update opportunity + sync products
    const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
      opportunity_data: { ...processedData, id: params.id },
      products_to_create: creates,
      products_to_update: updates,
      products_to_delete: deletes,
    });

    if (error) throw error;
    return { data };
  }
}
```

**Diff Algorithm**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/diffProducts.ts`
- Compares database products with form products field-by-field
- Returns `{ creates, updates, deletes }` for RPC function
- Uses Map for O(1) lookups instead of array.find()

#### C. Opportunity Participants & Contacts

**Pattern**: Similar to contact-organizations, uses direct CRUD operations.

**Tables**:
- `opportunity_participants` - Organizations participating in opportunity (customer, principal, distributor)
- `opportunity_contacts` - Contacts associated with opportunity

**Operations**: Same pattern as contact-organizations (getMany optimization, direct CRUD)

**Impact of Junction Table Renames**:
- Update `RESOURCE_MAPPING` in `resources.ts`
- Update RPC function names if they reference table names
- No changes needed in business logic (uses dataProvider abstractions)

### 6. JSONB Field Normalization

**Pattern**: Ensure JSONB array fields (`email`, `phone`, `tags`) are always arrays, never objects.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` (lines 288-333)

```typescript
// Normalize JSONB array fields to ensure they are always arrays
export function normalizeJsonbArrayFields<T extends JsonbArrayRecord>(
  data: T | null | undefined
): T | null | undefined {
  if (!data) return data;

  const ensureArray = (value: any): any[] => {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) {
      // Legacy data migration: wrap objects in array
      return typeof value === 'object' ? [value] : [];
    }
    return value;
  };

  // Normalize contacts JSONB fields
  if (data.email !== undefined || data.phone !== undefined || data.tags !== undefined) {
    return {
      ...data,
      ...(data.email !== undefined && { email: ensureArray(data.email) }),
      ...(data.phone !== undefined && { phone: ensureArray(data.phone) }),
      ...(data.tags !== undefined && { tags: ensureArray(data.tags) }),
    };
  }

  return data;
}

// Applied to all query responses
export function normalizeResponseData<T>(resource: string, data: T | T[]): T | T[] {
  if (Array.isArray(data)) {
    return data.map(record => normalizeJsonbArrayFields(record)).filter(r => r !== null);
  }
  return normalizeJsonbArrayFields(data);
}
```

**Usage**:
- Applied in `unifiedDataProvider.ts` for all read operations:
  - `getList()` line 269-272
  - `getOne()` line 289-291
  - `getMany()` line 314-318
  - `getManyReference()` line 345-349

**Impact of JSONB Field Changes**:
- Adding new JSONB array fields requires updating `normalizeJsonbArrayFields()`
- Filter transformations in `transformArrayFilters()` must be updated (lines 100, 122, 132)
- No changes needed if field types remain JSONB arrays

### 7. Filter Registry & Array Transformations

**Pattern**: Centralized filterable fields definition prevents stale filter errors.

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`

**Registry Structure** (lines 21-182):
```typescript
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "id", "first_name", "last_name",
    "email",    // JSONB field - @cs operator
    "phone",    // JSONB field - @cs operator
    "tags",     // Array field - @cs operator
    "organization_id",
    "company_name", // From organizations join in contacts_summary view
    "q",        // Special: full-text search
    // ... other fields
  ],

  organizations: [
    "id", "name", "organization_type", "segment_id",
    // ... other fields
  ],

  opportunities: [
    "id", "name", "stage", "status",
    "contact_ids",  // Array field
    "tags",         // Array field
    // ... other fields
  ],

  contact_notes: [  // ← DRIFT POINT: Uses snake_case
    "id", "contact_id", "text", "date",
    // ... other fields
  ],

  opportunity_notes: [  // ← DRIFT POINT: Uses snake_case
    "id", "opportunity_id", "text", "date",
    // ... other fields
  ],
};
```

**Array Filter Transformation** (`dataProviderUtils.ts` lines 91-142):
```typescript
export function transformArrayFilters(filter: FilterRecord): FilterRecord {
  const transformed: Record<string, any> = {};
  const jsonbArrayFields = ['tags', 'email', 'phone']; // JSONB arrays use @cs

  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value)) {
      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - format: {1,2,3}
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
      }
    } else if (jsonbArrayFields.includes(key)) {
      // Single value for JSONB array
      transformed[`${key}@cs`] = `{${escapeForPostgREST(value)}}`;
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}
```

**Impact of Schema Changes**:
- **Column Renames**: Update field names in `filterableFields` registry
- **New JSONB Arrays**: Add to `jsonbArrayFields` array in `transformArrayFilters()`
- **View Field Changes**: Update view-specific fields (e.g., `company_name` from `contacts_summary`)

## Views Usage

### Current Views in Database

**From Supabase**: `contacts_summary`, `organizations_summary`

**From Generated Types**: `contacts_summary`, `organizations_summary`, `product_catalog` (lines 290-384, 724-787, 789-876 in `database.generated.ts`)

### View Definitions

#### contacts_summary

**Migration**: `/home/krwhynot/Projects/atomic/supabase/migrations/20251008091000_update_contacts_summary_for_single_org.sql`

**Purpose**: Denormalized view with organization name for list queries

**Schema**:
```sql
SELECT
  c.id, c.name, c.first_name, c.last_name,
  c.email, c.phone, c.title, c.department,
  c.address, c.city, c.state, c.postal_code, c.country,
  c.birthday, c.linkedin_url, c.twitter_handle, c.notes,
  c.sales_id, c.created_at, c.updated_at, c.created_by, c.deleted_at,
  c.search_tsv, c.first_seen, c.last_seen, c.gender, c.tags,
  c.organization_id,
  o.name AS company_name  -- ← JOIN from organizations
FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;
```

**Key Points**:
- Uses direct `contacts.organization_id` relationship (NOT junction table)
- Filters soft-deleted contacts and organizations
- `company_name` computed from organizations join
- Read-only (no INSERT/UPDATE/DELETE)

#### organizations_summary

**Migration**: `/home/krwhynot/Projects/atomic/supabase/migrations/20251008090000_update_organizations_summary_for_single_org.sql`

**Purpose**: Denormalized view with aggregate counts for list queries

**Schema**:
```sql
SELECT
  o.id, o.name, o.organization_type,
  o.is_principal, o.is_distributor, o.priority, o.segment_id,
  o.annual_revenue, o.employee_count, o.created_at,
  COUNT(DISTINCT opp.id) AS nb_opportunities,       -- ← Aggregate
  COUNT(DISTINCT c.id) AS nb_contacts,              -- ← Aggregate
  MAX(opp.updated_at) AS last_opportunity_activity  -- ← Aggregate
FROM organizations o
  LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id OR
    opp.principal_organization_id = o.id OR
    opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;
```

**Key Points**:
- Computes `nb_opportunities`, `nb_contacts`, `last_opportunity_activity`
- Uses direct `contacts.organization_id` (NOT junction table)
- Opportunities joined on multiple FK columns (customer, principal, distributor)
- Filters soft-deleted records
- Additional fields for full-text search: `phone`, `website`, `postal_code`, `city`, `state`, `description` (added in migration `20251008100000`)

#### contact_organization_details (DEPRECATED)

**Status**: Dropped in migration `20251008091000_update_contacts_summary_for_single_org.sql` (line 6)

**Reason**: System migrated from junction-based multi-org contacts to direct single-org relationship

### View Impact on Table Renames

**View Dependency Chain**:
1. Views reference base tables by name in SQL definitions
2. Renaming a base table requires **recreating views** with updated SQL
3. View names may need to follow new naming convention (e.g., `contact_notes_summary` if table renamed to `contact_notes`)

**Migration Pattern for View Recreation**:
```sql
-- Drop existing view
DROP VIEW IF EXISTS contacts_summary;

-- Recreate with updated table references
CREATE VIEW contacts_summary AS
SELECT /* ... updated SQL ... */
FROM new_table_name c  -- ← Updated reference
WHERE /* ... */;

-- Restore permissions
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contacts_summary TO anon;

-- Update documentation
COMMENT ON VIEW contacts_summary IS 'Updated description';
```

## Edge Cases & Gotchas

### 1. camelCase vs snake_case Resource Names

**Issue**: Notes tables use camelCase (`contactNotes`, `opportunityNotes`) while most tables use snake_case.

**Evidence**:
- Database tables: `contactNotes`, `opportunityNotes` (from `database.generated.ts` lines 84, 547)
- React Admin resources: `contactNotes`, `opportunityNotes` (from `resources.ts` line 22, 24)
- Filter registry: `contact_notes`, `opportunity_notes` (from `filterRegistry.ts` lines 160, 172)

**DRIFT DETECTED**: Filter registry uses snake_case, but database uses camelCase!

**Impact**:
- Renaming to snake_case (`contact_notes`, `opportunity_notes`) requires updates in:
  1. `RESOURCE_MAPPING` in `resources.ts` (lines 22, 24)
  2. `validationRegistry` in `ValidationService.ts` (lines 98-112)
  3. `transformerRegistry` in `TransformService.ts` (lines 36-62)
  4. `filterableFields` keys in `filterRegistry.ts` (fix existing drift)

**Recommendation**: Standardize on snake_case for consistency with other tables.

### 2. View vs Table Selection Logic is Hardcoded

**Issue**: `getDatabaseResource()` has hardcoded resource checks for view selection.

**Evidence**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` lines 190-191

```typescript
if (
  resource === "organizations" ||
  resource === "contacts"
) {
  return summaryResource; // Uses view
}
```

**Gotcha**: Adding new summary views requires updating this if-condition.

**Better Pattern**: Use configuration-driven approach:
```typescript
const RESOURCES_WITH_SUMMARY_VIEWS = ['organizations', 'contacts'];

if (RESOURCES_WITH_SUMMARY_VIEWS.includes(resource)) {
  return summaryResource;
}
```

### 3. Opportunities Removed Summary View

**Issue**: Opportunities explicitly does NOT use summary view (comment on line 195).

**Reason**: "opportunities_summary removed for MVP - query base table directly"

**Gotcha**: If adding `opportunities_summary` view in future:
- Must update `getDatabaseResource()` logic
- Must update `SEARCHABLE_RESOURCES` in `resources.ts` if view has different searchable fields
- Must ensure view includes all fields needed by forms (especially for edit operations)

### 4. Junction Sync Field Naming Pattern

**Issue**: Transform layer renames fields to avoid database column conflicts.

**Pattern**: `organizations` → `organizations_to_sync`, `products` → `products_to_sync`

**Evidence**:
- Contacts: Line 95 in `TransformService.ts`
- Opportunities: Lines 381-383, 435 in `unifiedDataProvider.ts`

**Gotcha**: These renamed fields are NOT database columns. They're markers for the data provider to trigger RPC sync operations.

**Impact of Renames**: If junction sync patterns change, search for `*_to_sync` pattern throughout codebase.

### 5. Filter Validation Prevents 400 Errors from Stale Filters

**Issue**: React Admin caches filters in localStorage. Schema changes can cause stale filters to reference non-existent columns.

**Solution**: `ValidationService.validateFilters()` (lines 195-235) automatically removes invalid filters.

**Evidence**: Called in `unifiedDataProvider.getList()` line 256 BEFORE database query:
```typescript
if (processedParams.filter) {
  processedParams.filter = validationService.validateFilters(resource, processedParams.filter);
}
```

**Gotcha**: If `filterableFields` registry is not updated after schema changes, valid filters will be incorrectly removed.

**Best Practice**: Update `filterRegistry.ts` in same commit as schema migration.

### 6. Soft Delete Filtering is Context-Aware

**Issue**: Soft delete filter (`deleted_at@is: null`) is added automatically, but skipped for views.

**Evidence**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` lines 221-225

```typescript
const needsSoftDeleteFilter = supportsSoftDelete(resource) &&
  !params.filter?.includeDeleted &&
  !isView;  // ← Skip for views (they handle filtering internally)
```

**Gotcha**: Views must include `WHERE deleted_at IS NULL` in their SQL definition. Otherwise, deleted records will appear in lists.

**Verification**: Both `contacts_summary` and `organizations_summary` have this filter (migrations lines 45, 31).

### 7. RPC Function Names Follow Conventions

**Issue**: RPC functions use snake_case naming convention.

**Evidence**:
- `sync_opportunity_with_products` (unifiedDataProvider.ts lines 386, 452)
- `set_primary_organization` (junctions.service.ts line 160)
- `get_or_create_segment` (unifiedDataProvider.ts line 370)

**Gotcha**: Renaming tables may require renaming RPC functions for consistency (e.g., `sync_contact_notes_with_attachments`).

**Migration Pattern**: RPC renames require:
1. Create new RPC with new name
2. Update all code references
3. Drop old RPC (or keep as deprecated alias)

### 8. TypeScript Type Generation from Database

**Issue**: `database.generated.ts` is auto-generated from Supabase schema.

**Regeneration Required After**:
- Table renames
- Column additions/removals
- View schema changes

**Command**: `npm run supabase:generate-types` (assumes configured in package.json) OR use MCP tool `mcp__supabase-lite__generate_typescript_types`

**Gotcha**: Manual edits to this file will be overwritten. Use database migrations to change schema, then regenerate types.

## Summary of Impact Points for Table Renames

### Required Updates (3 Core Files)

1. **`resources.ts`** - Update `RESOURCE_MAPPING` constant
2. **`ValidationService.ts`** - Update `validationRegistry` keys
3. **`TransformService.ts`** - Update `transformerRegistry` keys

### Conditional Updates (Based on Rename Type)

4. **`filterRegistry.ts`** - Update `filterableFields` keys (ALWAYS for new resource names)
5. **`dataProviderUtils.ts`** - Update `getDatabaseResource()` if adding/removing views
6. **View Migrations** - Recreate views if they reference renamed tables
7. **RPC Functions** - Rename if following table naming conventions
8. **Validation Schemas** - Update imports if file paths change (e.g., `/validation/contact_notes.ts`)

### Automatic Updates

9. **`database.generated.ts`** - Regenerate after migrations complete

### No Updates Needed

- Feature components (use resource names, not table names)
- Business logic services (use dataProvider abstractions)
- React Admin configuration (resource names are stable)

## Relevant Docs

### Internal Documentation
- Engineering Constitution: `/home/krwhynot/Projects/atomic/CLAUDE.md`
- Recent migration example: Deals → Opportunities rename (git commit `6d5d367`, `bac394e`)
- Recent schema change: Industry → Segment rename (migration `20251008010145_rename_industry_to_segment.sql`)

### External References
- React Admin Data Provider Interface: https://marmelab.com/react-admin/DataProviderIntroduction.html
- Supabase PostgREST API: https://postgrest.org/en/stable/references/api/resource_embedding.html
- PostgREST Operators: https://postgrest.org/en/stable/references/api/tables_views.html#operators

### Migration Patterns
- View recreation: See migrations `20251008091000`, `20251008090000`
- RLS policy updates: See migration `20251007140000_fix_rls_policies.sql`
- Junction table patterns: See migration `20251007120000_create_sync_contact_organizations_function.sql`
