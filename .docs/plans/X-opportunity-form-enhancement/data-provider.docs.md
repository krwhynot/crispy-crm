# Data Provider Research

## Overview

The unified data provider (`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`) is a consolidated data layer that replaced 4+ provider layers with a maximum of 2 layers. It implements React Admin's DataProvider interface and handles all CRUD operations with integrated validation, transformation, and error handling.

**Key Statistics:**
- Main file: 731 lines
- Services pattern: Decomposed into specialized services (ValidationService, TransformService, StorageService, JunctionsService, OpportunitiesService, etc.)
- Validation: Single-point at API boundary (Engineering Constitution principle #5)
- Error format: React Admin compatible `{ message: string, errors: { field: string } }`

---

## Current Implementation

### getOne Pattern for Opportunities

**Location:** Lines 260-277

**Flow:**
1. Wraps call with `wrapMethod()` for error logging
2. Determines database resource via `getDatabaseResource(resource, "one")`
   - For opportunities: returns `"opportunities_summary"` (view)
   - View includes joined data (customer org name, principal org name, distributor org name)
3. Executes base provider query
4. Normalizes response data via `normalizeResponseData()`
   - Ensures JSONB array fields (tags, email, phone) are always arrays
5. Returns React Admin format: `{ data: { ...opportunityRecord } }`

**Example Code Pattern:**
```typescript
async getOne(resource: string, params: GetOneParams): Promise<any> {
  return wrapMethod("getOne", resource, params, async () => {
    const dbResource = getDatabaseResource(resource, "one");
    const result = await baseDataProvider.getOne(dbResource, params);
    return {
      ...result,
      data: normalizeResponseData(resource, result.data),
    };
  });
}
```

**Key Details:**
- Uses `opportunities_summary` view for read operations (has denormalized organization names)
- No validation needed for read operations
- Error handling includes idempotent delete support (line 196)
- Returns full record with all fields including stage-specific fields

---

### getList Pattern for Opportunities

**Location:** Lines 238-258

**Flow:**
1. Wraps call with `wrapMethod()` for error logging
2. Applies search parameters via `applySearchParams()`
   - Transforms React Admin filters to PostgREST operators
   - Handles full-text search across searchable fields: `["name", "category", "description"]`
   - Applies soft delete filter: `deleted_at: null` (unless `includeDeleted` flag set)
   - Transforms array filters (e.g., `tags: [1,2,3]` → `tags@cs: "{1,2,3}"`)
3. Gets database resource via `getDatabaseResource(resource, "list")`
   - Returns `"opportunities_summary"` view for list operations
4. Executes query with transformed params
5. Normalizes array of results
6. Returns React Admin format: `{ data: [...], total: number }`

**Example Code Pattern:**
```typescript
async getList(resource: string, params: GetListParams): Promise<any> {
  return wrapMethod("getList", resource, params, async () => {
    const searchParams = applySearchParams(resource, params);
    const dbResource = getDatabaseResource(resource, "list");
    const result = await baseDataProvider.getList(dbResource, searchParams);
    return {
      ...result,
      data: normalizeResponseData(resource, result.data),
    };
  });
}
```

**Search Parameter Processing (dataProviderUtils.ts lines 215-278):**
- **Search query (`q`):** Transforms to PostgREST `@or` operator with `@ilike` on searchable fields
- **Array filters:** Converted to `@in` or `@cs` operators based on field type
- **Soft delete:** Automatically adds `deleted_at: null` for base tables (not views)
- **Caching:** Searchable fields cached via Map for performance

**Filter Transformation Examples:**
```typescript
// Input: { stage: ["new_lead", "qualified"], q: "acme" }
// Output: {
//   "stage@in": "(new_lead,qualified)",
//   "@or": { "name@ilike": "acme", "category@ilike": "acme", "description@ilike": "acme" },
//   "deleted_at": null
// }
```

---

### Create Pattern for Opportunities

**Location:** Lines 337-360

**Flow:**
1. Wraps call with `wrapMethod()` for error logging
2. Gets actual table name via `getResourceName(resource)`
   - For opportunities: returns `"opportunities"` (base table, not view)
3. Processes data via `processForDatabase(resource, data, "create")`
   - **Step 1 - Transform:** Calls `transformData()` (line 150-157)
     - No transformer registered for opportunities (yet)
     - Transformers exist for: contacts, organizations, sales, contactNotes, opportunityNotes
   - **Step 2 - Validate:** Calls `validateData()` (line 114-145)
     - Uses ValidationService → validates against Zod schema
     - For opportunities: calls `validateOpportunityForm()` from `src/atomic-crm/validation/opportunities.ts`
     - Throws React Admin format errors: `{ message, errors: { field: message } }`
4. Executes base provider create with processed data
5. Returns result (no transformation on response yet - line 358 comment indicates future task)

**Example Code Pattern:**
```typescript
async create(resource: string, params: CreateParams): Promise<any> {
  return wrapMethod("create", resource, params, async () => {
    const dbResource = getResourceName(resource);

    // Transform → Validate
    const processedData = await processForDatabase(resource, params.data, "create");

    const result = await baseDataProvider.create(dbResource, {
      ...params,
      data: processedData as any,
    });

    return result;
  });
}
```

**Key Details:**
- Creates in base table (`opportunities`), not view
- Validation happens at API boundary only (Engineering Constitution #5)
- Transform → Validate order matters (line 169 comment)
- No response transformation yet (line 358)

---

### Update Pattern for Opportunities

**Location:** Lines 362-388

**Flow:**
1. Wraps call with `wrapMethod()` for error logging
2. Gets actual table name via `getResourceName(resource)`
   - Returns `"opportunities"` (base table)
3. Processes data via `processForDatabase(resource, data, "update")`
   - Same Transform → Validate flow as create
   - Uses `validateOpportunityForm()` (same schema for create/update operations)
4. Preserves ID in processed data (line 381)
5. Executes base provider update
6. Returns result (no response transformation - line 386 comment)

**Example Code Pattern:**
```typescript
async update(resource: string, params: UpdateParams): Promise<any> {
  return wrapMethod("update", resource, params, async () => {
    const dbResource = getResourceName(resource);

    const processedData = await processForDatabase(resource, params.data, "update");

    const result = await baseDataProvider.update(dbResource, {
      ...params,
      data: {
        ...processedData,
        id: params.id, // Preserve ID
      } as any,
    });

    return result;
  });
}
```

**Key Details:**
- Updates base table, not view
- ID preservation explicit (line 381)
- Same validation as create (opportunities.ts uses single `validateOpportunityForm()` for both)

---

## Transform Patterns Used in Provider

### Transform Service Architecture

**Location:** `src/atomic-crm/providers/supabase/services/TransformService.ts`

**Registered Transformers:**
- **contactNotes / opportunityNotes:** Upload attachments to Supabase Storage (parallel processing)
- **sales:** Upload avatar files
- **contacts:**
  - Process avatar (upload/delete old)
  - Remove `organizations` field (junction table data, not column)
  - Combine `first_name` + `last_name` → `name` field
  - Add `created_at` timestamp for new records
- **organizations:**
  - Process logo (upload if needed)
  - Handle raw file uploads
  - Add `created_at` timestamp for new records

**No transformer registered for opportunities** - opportunities don't have file uploads or special field processing (yet)

**Pattern:**
```typescript
class TransformService {
  private transformerRegistry: Record<string, {
    transform?: TransformerFunction<TransformableData>;
  }>;

  async transform<T>(resource: string, data: T): Promise<T> {
    const transformer = this.transformerRegistry[resource];
    if (!transformer?.transform) return data; // No-op if no transformer
    return transformer.transform(data) as Promise<T>;
  }
}
```

**Storage Integration:**
- TransformService depends on StorageService
- File uploads happen during transformation phase (before validation)
- Uploads are awaited but file metadata remains in data for database insert

---

## Validation Integration

### Where Zod Schemas Are Called

**Validation Flow (unifiedDataProvider.ts lines 114-145):**

1. **Entry point:** `validateData(resource, data, operation)`
2. **Delegation:** Uses `ValidationService.validate()`
3. **Registry lookup:** `ValidationService.validationRegistry[resource]`
4. **For opportunities:**
   - `create`: Calls `validateOpportunityForm(data)`
   - `update`: Calls `validateOpportunityForm(data)`

**ValidationService Registry (ValidationService.ts lines 65-132):**
```typescript
private validationRegistry = {
  opportunities: {
    create: async (data) => validateOpportunityForm(data),
    update: async (data) => validateOpportunityForm(data),
  },
  // ... other resources
};
```

### Opportunity Validation Schema

**Location:** `src/atomic-crm/validation/opportunities.ts`

**Schema Features (lines 86-233):**
- **Base schema:** `opportunitySchema` - comprehensive validation for all fields
- **Required fields:** name, contact_ids (min 1), expected_closing_date
- **Numeric constraints:**
  - amount: min 0
  - probability: 0-100 range
  - finalAmount: min 0
  - contractTermMonths: min 0
  - sentimentScore: 1-5 literals
- **Enums:**
  - stage: 8 values (new_lead → closed_won/lost)
  - status: 5 values (active, on_hold, nurturing, stalled, expired)
  - priority: 4 values (low, medium, high, critical)
  - lossReason: 5 values (price, product_fit, competitor, timing, other)
- **Stage-specific validation (superRefine, lines 176-233):**
  - `demo_scheduled`: requires demoDate
  - `feedback_logged`: requires feedbackNotes
  - `closed_won`: requires finalAmount AND actual_close_date
  - `closed_lost`: requires lossReason AND actual_close_date
- **Legacy field checks:** Throws errors for `company_id` and `archived_at` (removed fields)

**Validation Functions:**
- `validateOpportunityForm(data)` - Main validator (lines 241-262)
- `validateCreateOpportunity(data)` - Stricter (omits id, timestamps, requires core fields)
- `validateUpdateOpportunity(data)` - Flexible (partial schema, id required)

**Current Usage:** Provider uses `validateOpportunityForm()` for both create and update

### Error Handling Approach

**Error Format (React Admin Compatible):**
```typescript
{
  message: "Validation failed",
  errors: {
    fieldName: "Error message for field",
    "nested.field": "Error for nested field",
    _error: "General error if no specific field"
  }
}
```

**Zod Error Transformation (opportunities.ts lines 246-261):**
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors: Record<string, string> = {};
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
  throw error;
}
```

**Error Logging (unifiedDataProvider.ts lines 80-108):**
```typescript
function logError(method, resource, params, error) {
  console.error(`[DataProvider Error]`, {
    method,
    resource,
    params: { id, ids, filter, sort, pagination, data: "[Data Present]" },
    timestamp: new Date().toISOString()
  }, {
    error: error.message || String(error),
    stack: error.stack,
    validationErrors: error.errors, // React Admin format
    fullError: error
  });
}
```

**Error Wrapping (wrapMethod, lines 183-232):**
- Catches all errors from operations
- Handles idempotent deletes (returns success for already-deleted)
- Preserves React Admin error format (line 203-206)
- Extracts Supabase error fields to React Admin format (lines 209-226)
- Logs all errors with context

---

## Related Data Patterns

### How Joins/Relationships Are Handled

**Pattern 1: Summary Views (Denormalized Data)**

**Used for:** List and detail operations (getList, getOne)

**opportunities_summary view includes:**
- All opportunity fields
- Denormalized organization names via LEFT JOINs:
  - customer_organization → `customer_organization_name`
  - principal_organization → `principal_organization_name`
  - distributor_organization → `distributor_organization_name`
- contact_ids array (already stored in opportunities table)

**Configuration (resources.ts line 189-205):**
```typescript
function getDatabaseResource(resource, operation) {
  const actualResource = getResourceName(resource);

  if (operation === "list" || operation === "one") {
    if (resource === "opportunities" || resource === "organizations" || resource === "contacts") {
      return `${actualResource}_summary`; // Use view
    }
  }

  return actualResource; // Use base table for create/update/delete
}
```

**Benefits:**
- Single query returns all display data
- No N+1 query problems
- PostgREST handles view queries efficiently

**Limitations:**
- Views are read-only (write operations use base tables)
- Views have security_invoker = false (bypass RLS for performance)

---

**Pattern 2: Junction Table Operations (Many-to-Many)**

**Used for:** Complex relationships with metadata

**Example: Opportunity Participants (JunctionsService.ts lines 179-303)**

**Getting participants:**
```typescript
async getOpportunityParticipants(opportunityId) {
  // 1. Fetch junction records
  const response = await dataProvider.getList("opportunity_participants", {
    filter: { opportunity_id: opportunityId },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "is_primary", order: "DESC" },
  });

  // 2. Extract organization IDs
  const orgIds = response.data.map(p => p.organization_id).filter(Boolean);

  // 3. Batch fetch organizations (avoid N+1)
  const { data: orgs } = await dataProvider.getMany("organizations", { ids: orgIds });
  const orgMap = new Map(orgs.map(o => [o.id, o]));

  // 4. Combine junction data with organization details
  const participantsWithDetails = response.data.map(participant => ({
    ...participant,
    organization: orgMap.get(participant.organization_id)
  }));

  return { data: participantsWithDetails };
}
```

**Adding participant:**
```typescript
async addOpportunityParticipant(opportunityId, organizationId, params) {
  const response = await dataProvider.create("opportunity_participants", {
    data: {
      opportunity_id: opportunityId,
      organization_id: organizationId,
      role: params.role || "customer",
      is_primary: params.is_primary || false,
      commission_rate: params.commission_rate,
      territory: params.territory,
      notes: params.notes,
      created_at: new Date().toISOString(),
      ...params,
    },
  });
  return { data: response.data };
}
```

**Removing participant:**
```typescript
async removeOpportunityParticipant(opportunityId, organizationId) {
  // Find record by composite key
  const response = await dataProvider.getList("opportunity_participants", {
    filter: { opportunity_id: opportunityId, organization_id: organizationId },
    pagination: { page: 1, perPage: 1 },
    sort: { field: "id", order: "ASC" },
  });

  if (response.data.length > 0) {
    await dataProvider.delete("opportunity_participants", {
      id: response.data[0].id,
    });
  }

  return { data: { id: `${opportunityId}-${organizationId}` } };
}
```

**Key Pattern:**
- Fetch junction table first
- Use `getMany()` for batch fetching related entities (no N+1 queries)
- Build Map for O(1) lookup
- Combine data in memory
- Similar pattern used for: contact_organizations, opportunity_contacts, interaction_participants

---

**Pattern 3: Array Fields (JSONB)**

**Used for:** Opportunities store contact IDs as JSONB array

**Database schema:**
```sql
opportunities.contact_ids JSONB -- e.g., [1, 2, 3]
```

**Normalization (dataProviderUtils.ts lines 294-339):**
```typescript
function normalizeJsonbArrayFields(data) {
  if (!data) return data;

  const ensureArray = (value) => {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) return typeof value === 'object' ? [value] : [];
    return value;
  };

  // For contacts: email, phone, tags are JSONB arrays
  // For opportunities: contact_ids is JSONB array
  if (data.email !== undefined || data.phone !== undefined || data.tags !== undefined) {
    return {
      ...data,
      email: ensureArray(data.email),
      phone: ensureArray(data.phone),
      tags: ensureArray(data.tags),
    };
  }

  return data;
}
```

**Filter transformation for arrays (dataProviderUtils.ts lines 81-137):**
```typescript
// JSONB array fields use @cs (contains) operator
const jsonbArrayFields = ['tags', 'email', 'phone'];

if (Array.isArray(value)) {
  if (jsonbArrayFields.includes(key)) {
    // JSONB array contains: {1,2,3}
    transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
  } else {
    // Regular IN operator: (val1,val2,val3)
    transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
  }
}
```

**Benefits:**
- Simple storage of multi-value relationships
- No junction table needed
- PostgREST native support via `@cs` operator
- Used when relationship has no metadata

---

### Example of Multi-Table Operations

**OpportunitiesService.unarchiveOpportunity (opportunities.service.ts lines 17-55):**

**Business logic:** Unarchive opportunity and reorder all opportunities in same stage

```typescript
async unarchiveOpportunity(opportunity) {
  // 1. Fetch all opportunities in same stage
  const { data: opportunities } = await dataProvider.getList("opportunities", {
    filter: { stage: opportunity.stage },
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "index", order: "ASC" },
  });

  // 2. Recalculate indices
  const updatedOpportunities = opportunities.map((o, index) => ({
    ...o,
    index: o.id === opportunity.id ? 0 : index + 1, // Unarchived goes first
    deleted_at: o.id === opportunity.id ? null : o.deleted_at, // Clear deleted_at
  }));

  // 3. Update all in parallel
  return await Promise.all(
    updatedOpportunities.map((updated) =>
      dataProvider.update("opportunities", {
        id: updated.id,
        data: updated,
        previousData: opportunities.find(o => o.id === updated.id),
      })
    )
  );
}
```

**Pattern:**
- Single getList to fetch related records
- Business logic to compute updates
- Parallel updates via Promise.all
- All operations go through dataProvider (no direct Supabase access)

---

## RPC Function Usage

### Current RPC Implementation

**Location:** unifiedDataProvider.ts lines 532-553

**Pattern:**
```typescript
async rpc(functionName: string, params: any = {}): Promise<any> {
  try {
    console.log(`[DataProvider RPC] Calling ${functionName}`, params);

    // TODO: Add Zod validation for RPC params based on function name

    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      logError('rpc', functionName, params, error);
      throw new Error(`RPC ${functionName} failed: ${error.message}`);
    }

    console.log(`[DataProvider RPC] ${functionName} succeeded`, data);
    return data;
  } catch (error) {
    logError('rpc', functionName, params, error);
    throw error;
  }
}
```

**Current Usage Example (JunctionsService.ts lines 148-177):**

```typescript
async setPrimaryOrganization(contactId, organizationId) {
  if (!this.dataProvider.rpc) {
    throw new Error('DataProvider does not support RPC operations');
  }

  try {
    await this.dataProvider.rpc("set_primary_organization", {
      p_contact_id: contactId,
      p_organization_id: organizationId,
    });

    return { data: { success: true } };
  } catch (error) {
    console.error(`[JunctionsService] Failed to set primary organization`, error);
    throw error;
  }
}
```

**Database Function (set_primary_organization):**
- Atomic operation: unsets all `is_primary` flags, then sets one
- Prevents race conditions with multiple updates
- Transaction handled at database level

**Key Details:**
- RPC capability optional (type-safe check via `dataProvider.rpc?`)
- No validation yet (TODO at line 537)
- Logging for all RPC calls
- Direct Supabase client access via `supabase.rpc()`

**Extension Point for Opportunities:**
- RPC pattern ready for complex operations
- Could use for multi-step opportunity operations
- Example: "promote_opportunity_stage" RPC with business logic validation

---

## Key Patterns to Follow

### 1. Data Flow Architecture

**Read Operations (getOne, getList):**
```
React Admin Component
  → unifiedDataProvider.getOne/getList
    → wrapMethod (error handling wrapper)
      → applySearchParams (transform filters, add soft delete)
      → getDatabaseResource (use summary view)
      → baseDataProvider query
      → normalizeResponseData (ensure JSONB arrays)
    → return to component
```

**Write Operations (create, update):**
```
React Admin Component
  → unifiedDataProvider.create/update
    → wrapMethod (error handling wrapper)
      → getResourceName (use base table)
      → processForDatabase
        → transformData (file uploads, field processing)
        → validateData (Zod validation at API boundary)
      → baseDataProvider mutation
      → return result (no transformation yet)
    → return to component
```

**Junction Operations:**
```
React Admin Component
  → JunctionsService method
    → dataProvider.getList (fetch junction records)
    → dataProvider.getMany (batch fetch related entities)
    → Map-based join in memory
    → return combined data
```

### 2. Service Layer Delegation

**Current Services:**
- **ValidationService:** Zod schema validation registry
- **TransformService:** File uploads, field processing
- **StorageService:** Supabase Storage operations
- **JunctionsService:** Many-to-many relationships
- **OpportunitiesService:** Opportunity business logic
- **ActivitiesService:** Activity log operations
- **SalesService:** Sales rep management

**Pattern:**
```typescript
// In unifiedDataProvider.ts
const validationService = new ValidationService();
const transformService = new TransformService(storageService);
const junctionsService = new JunctionsService(baseDataProvider);

// Delegate to service
await validationService.validate(resource, operation, data);
const transformed = await transformService.transform(resource, data);
```

**For New Features:**
- Add service for complex business logic (e.g., opportunity stage transitions)
- Keep dataProvider thin (orchestration only)
- Service methods use dataProvider for database access (no direct Supabase)

### 3. Validation Registry Pattern

**Add Opportunity Stage Validation:**
```typescript
// In ValidationService.ts
private validationRegistry = {
  opportunities: {
    create: async (data) => validateOpportunityForm(data),
    update: async (data) => validateOpportunityForm(data),
    // Could add stage-specific validation
    stageTransition: async (data) => validateStageTransition(data),
  },
  // ...
};
```

**Create New Schema:**
```typescript
// In src/atomic-crm/validation/opportunities.ts
export const stageTransitionSchema = z.object({
  stage: opportunityStageSchema,
  // Stage-specific required fields validated via superRefine
}).superRefine((data, ctx) => {
  // Custom validation logic
});

export async function validateStageTransition(data: any): Promise<void> {
  try {
    stageTransitionSchema.parse(data);
  } catch (error) {
    // Transform to React Admin format
  }
}
```

### 4. Transform Registry Pattern

**Add Opportunity File Upload:**
```typescript
// In TransformService.ts
private transformerRegistry = {
  opportunities: {
    transform: async (data: TransformableData) => {
      const oppData = data as Partial<Opportunity>;

      // Example: Upload proposal documents
      if (oppData.proposalDocuments && Array.isArray(oppData.proposalDocuments)) {
        const uploadPromises = oppData.proposalDocuments
          .filter(doc => doc && typeof doc === 'object')
          .map(doc => this.storageService.uploadToBucket(doc as RAFile));
        await Promise.all(uploadPromises);
      }

      return oppData;
    }
  },
  // ...
};
```

### 5. Error Handling Best Practices

**Always wrap operations:**
```typescript
async customOperation(params: any): Promise<any> {
  return wrapMethod("customOperation", "opportunities", params, async () => {
    // Implementation
  });
}
```

**Format errors for React Admin:**
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors: Record<string, string> = {};
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      errors: formattedErrors, // React Admin expects this format
    };
  }
  throw error;
}
```

**Log errors with context:**
```typescript
console.error(`[ServiceName] Operation failed`, {
  operationParams,
  error,
  timestamp: new Date().toISOString()
});
```

### 6. Junction Table Operations

**Use 3-step pattern:**
```typescript
// 1. Fetch junction records
const response = await dataProvider.getList("junction_table", {
  filter: { parent_id: parentId },
  pagination: { page: 1, perPage: 100 },
  sort: { field: "id", order: "ASC" },
});

// 2. Batch fetch related entities (avoid N+1)
const relatedIds = response.data.map(r => r.related_id).filter(Boolean);
const { data: related } = await dataProvider.getMany("related_resource", { ids: relatedIds });
const relatedMap = new Map(related.map(r => [r.id, r]));

// 3. Combine in memory
const combined = response.data.map(record => ({
  ...record,
  relatedEntity: relatedMap.get(record.related_id)
}));
```

### 7. RPC Function Usage

**When to use RPC:**
- Atomic operations (multiple updates must succeed/fail together)
- Complex business logic best handled in database
- Performance-critical operations (reduce round trips)

**Pattern:**
```typescript
// Check RPC support
if (!dataProvider.rpc) {
  throw new Error('RPC not supported');
}

// Call with logging
try {
  const result = await dataProvider.rpc("function_name", {
    param1: value1,
    param2: value2,
  });
  return { data: result };
} catch (error) {
  console.error(`[Service] RPC failed`, { params, error });
  throw error;
}
```

### 8. Summary View vs Base Table

**Use summary views for:**
- List operations (getList)
- Detail operations (getOne)
- Read-only queries with joins

**Use base tables for:**
- Create operations
- Update operations
- Delete operations
- Any write operation

**Configuration:**
```typescript
// Automatically handled by getDatabaseResource()
const dbResource = getDatabaseResource(resource, operation);
// operation = "list" → opportunities_summary
// operation = "create" → opportunities
```

### 9. JSONB Array Handling

**Always normalize:**
```typescript
// Response normalization happens automatically
const result = normalizeResponseData(resource, result.data);
```

**Filter transformation:**
```typescript
// Automatic in applySearchParams
// Input: { tags: [1, 2, 3] }
// Output: { "tags@cs": "{1,2,3}" }
```

**Validation:**
```typescript
// In Zod schema
contact_ids: z.array(z.union([z.string(), z.number()])).min(1, "Required")
```

### 10. Caching Strategy

**Searchable fields cached:**
```typescript
const searchableFieldsCache = new Map<string, readonly string[]>();
// Cache invalidation: Never (static configuration)
```

**PostgREST escape cache:**
```typescript
const escapeCache = new Map<string, string>();
const MAX_ESCAPE_CACHE_SIZE = 1000;
// Eviction: Clear half when size exceeded
```

**No data caching:**
- React Query handles query caching (React Admin integration)
- No custom cache implementation in provider

---

## Implementation Checklist for New Features

When adding new functionality to opportunities:

**1. Validation:**
- [ ] Add Zod schema to `src/atomic-crm/validation/opportunities.ts`
- [ ] Register in ValidationService if new operation type
- [ ] Include stage-specific validation in `superRefine` if needed
- [ ] Format errors for React Admin: `{ message, errors: { field: message } }`

**2. Transformation:**
- [ ] Add transformer to TransformService if file uploads or field processing needed
- [ ] Use StorageService for file operations
- [ ] Add timestamps if creating records
- [ ] Remove junction table fields from data before insert

**3. Service Layer:**
- [ ] Create service class if complex business logic (e.g., OpportunityStageService)
- [ ] Use dataProvider for all database access (no direct Supabase)
- [ ] Batch fetch with `getMany()` to avoid N+1 queries
- [ ] Log all operations with context

**4. Error Handling:**
- [ ] Wrap operations with `wrapMethod()` or custom error handling
- [ ] Log errors with operation context
- [ ] Return React Admin compatible error format
- [ ] Handle edge cases (idempotent operations, missing data)

**5. Testing Considerations:**
- [ ] Test validation with invalid data
- [ ] Test transformation with file uploads
- [ ] Test error handling (network failures, validation errors)
- [ ] Test junction table operations (N+1 query prevention)
- [ ] Test RPC functions with transaction rollback scenarios

---

## Notes

- **No backward compatibility:** System migrated from "deals" to "opportunities" with fresh schema
- **Engineering Constitution adherence:**
  - Single source of truth: Supabase only
  - Validation: Zod at API boundary only
  - No over-engineering: Fail fast, no circuit breakers
  - Boy Scout Rule: Fix inconsistencies when editing
- **Performance optimizations:**
  - Summary views for read operations
  - Batch fetching with `getMany()`
  - Cached searchable fields
  - Parallel file uploads
- **Future work:**
  - Response transformation for create/update (lines 358, 386)
  - RPC param validation (line 537)
  - Edge function param validation (line 682)
