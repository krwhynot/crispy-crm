# Infrastructure Layer

## Layer Definition

### What is the Infrastructure Layer?

The Infrastructure Layer is the foundational "plumbing" of Crispy CRM that handles all data access, validation, and transformation. It sits between React Admin's UI components and the Supabase PostgreSQL database, providing a consistent, validated, and composable interface for all data operations.

This layer implements the **Composed Handler Pattern** - a variant of the Proxy pattern where each resource gets its own composed DataProvider with resource-specific behaviors, while maintaining a single entry point for all data operations.

### Why This Layer is Exemplary

This layer scored **5/5 across all metrics** (Clarity, Purity, Completeness). Key reasons:

1. **Single Entry Point**: All database operations flow through `composedDataProvider.ts` - no scattered Supabase calls
2. **Explicit Handler Composition**: Each resource declares its behaviors via factory functions with clear composition order
3. **Comprehensive Validation at API Boundary**: Zod schemas validate data before it touches the database, not in forms
4. **No Retry Logic**: True fail-fast behavior - errors throw immediately without retries or circuit breakers
5. **Decorator Pattern Wrappers**: `withErrorLogging`, `withValidation`, `withLifecycleCallbacks` compose cleanly
6. **Soft Delete by Default**: All resources support `deleted_at` filtering automatically
7. **View/Table Duality**: Reads from summary views, writes to base tables
8. **Service Layer Separation**: Complex business logic in services, not handlers
9. **Type Safety Throughout**: Generated types from Supabase, Zod inference, TypeScript strictness

### Responsibilities

- All database read/write operations via React Admin DataProvider interface
- Data validation using Zod schemas at the API boundary
- Data transformation (stripping computed fields, normalizing JSONB arrays)
- Error logging with structured context and audit trails
- Soft-delete implementation (setting `deleted_at` instead of hard delete)
- Search/filter transformation (ILIKE queries, PostgREST operators)
- Resource routing to appropriate handlers
- Type definitions and schema inference

### Non-Responsibilities

- UI rendering (handled by Feature/UI layers)
- Business workflow orchestration beyond data operations (handled by hooks/components)
- User-facing state management (handled by React Admin)
- Direct Supabase client usage in components (forbidden by architecture)

---

## Data Provider Architecture

### Overview

The data provider follows the **Composed Handler Pattern**:

```
[React Admin Components]
        |
        | calls getList, create, update, delete
        v
[composedDataProvider.ts] ---- routes to ----> [Handler Registry]
        |                                              |
        | Resource routing via type guard              |
        v                                              v
[baseProvider] <-- specific handler methods -- [contactsHandler]
                                               [opportunitiesHandler]
                                               [organizationsHandler]
                                               [tasksHandler]
                                               ... (17 total handlers)
```

### Entry Point: composedDataProvider.ts

**Location**: `src/atomic-crm/providers/supabase/composedDataProvider.ts`
**Lines**: 237

**Key Responsibilities**:
1. Route operations to resource-specific handlers
2. Apply resource-to-database mapping (e.g., `opportunities` -> `opportunities_summary` for reads)
3. Apply search parameter transformations
4. Provide fallback to base provider for unhandled resources

**Handler Registration**:
```typescript
// From composedDataProvider.ts lines 116-144:
const handlers: HandlerRegistry = {
  // Core CRM resources
  contacts: createContactsHandler(baseProvider),
  organizations: createOrganizationsHandler(baseProvider),
  opportunities: createOpportunitiesHandler(baseProvider),
  activities: createActivitiesHandler(baseProvider),
  products: createProductsHandler(baseProvider),
  // Task management
  tasks: createTasksHandler(baseProvider),
  // Notes (3 types)
  contact_notes: createContactNotesHandler(baseProvider),
  opportunity_notes: createOpportunityNotesHandler(baseProvider),
  organization_notes: createOrganizationNotesHandler(baseProvider),
  // Supporting resources
  tags: createTagsHandler(baseProvider),
  sales: createSalesHandler(baseProvider),
  segments: createSegmentsHandler(baseProvider),
  product_distributors: createProductDistributorsHandler(baseProvider),
  // Junction tables (soft delete support)
  opportunity_participants: createOpportunityParticipantsHandler(baseProvider),
  opportunity_contacts: createOpportunityContactsHandler(baseProvider),
  interaction_participants: createInteractionParticipantsHandler(baseProvider),
  distributor_principal_authorizations: createDistributorPrincipalAuthorizationsHandler(baseProvider),
  organization_distributors: createOrganizationDistributorsHandler(baseProvider),
  user_favorites: createUserFavoritesHandler(baseProvider),
  // Notifications
  notifications: createNotificationsHandler(baseProvider),
};
```

**Type Guard for Routing**:
```typescript
// From composedDataProvider.ts lines 81-83:
function isHandledResource(resource: string): resource is HandledResource {
  return HANDLED_RESOURCES.includes(resource as HandledResource);
}
```

### Handler Composition Pattern

Each handler is created using a factory function that composes multiple wrappers. The composition order is **critical** (innermost to outermost):

```
baseProvider -> withValidation -> withLifecycleCallbacks -> withErrorLogging
```

**Why This Order?**:
1. `withValidation` (innermost): Validates data first, before any database operations
2. `withLifecycleCallbacks`: Runs before/after hooks, strips computed fields
3. `withErrorLogging` (outermost): Catches ALL errors from inner layers, including validation

**Simple Handler Example (contactsHandler.ts)**:
```typescript
// From handlers/contactsHandler.ts lines 29-33:
export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [contactsCallbacks])
  );
}
```

**Complex Handler Example (opportunitiesHandler.ts)**:
```typescript
// From handlers/opportunitiesHandler.ts lines 214-220:
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(customOpportunitiesHandler),  // Custom handler inside the chain!
    [opportunitiesCallbacks]
  )
);
```

The opportunities handler demonstrates a critical pattern: **custom logic must be defined INSIDE the wrapper chain**, not outside, so that `withErrorLogging` catches all errors.

### Lifecycle Hooks Available

Each handler can implement these lifecycle hooks via callbacks:

| Hook | When Called | Use Case |
|------|-------------|----------|
| `beforeGetList` | Before list query | Add soft delete filter, transform search params |
| `afterRead` | After any read operation | Normalize JSONB arrays |
| `beforeCreate` | Before insert | Validate, compute fields, add timestamps |
| `afterCreate` | After insert | Create related records, log activity |
| `beforeUpdate` | Before update | Validate, strip computed fields |
| `afterUpdate` | After update | Sync related data |
| `beforeDelete` | Before delete | Implement soft delete instead of hard delete |
| `afterDelete` | After delete | Cleanup related data (via RPC for cascading) |

**Callback Example (contactsCallbacks.ts)**:
```typescript
// From callbacks/contactsCallbacks.ts lines 109-115:
const baseCallbacks = createResourceCallbacks({
  resource: "contacts",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
  afterReadTransform: normalizeJsonbArrays,
  writeTransforms: [computeNameField],
});
```

### Validation Integration

Validation happens at the handler level via `withValidation`, NOT in forms:

```
[Form submits raw data]
        |
        v
[composedDataProvider receives data]
        |
        v
[Handler's withValidation calls ValidationService]
        |
        +-- Valid: proceed to lifecycle callbacks then database
        |
        +-- Invalid: throw ValidationError (fail-fast)
```

This enforces the "Zod at API boundary" principle from the Engineering Constitution.

### Error Handling

```typescript
// Pattern from withErrorLogging.ts lines 260-284:
try {
  const result = await original.call(provider, resource, params);
  logSuccess(method, resource, params, result);
  return result;
} catch (error: unknown) {
  logError(method, resource, params, error);

  // Idempotent delete handling
  if (method === "delete" && isAlreadyDeletedError(error)) {
    return { data: params.previousData };
  }

  // Pass through React Admin validation errors unchanged
  if (isReactAdminValidationError(error)) {
    throw error;
  }

  // Transform Supabase errors to validation format
  if (isSupabaseError(error)) {
    throw transformSupabaseError(error);
  }

  throw error; // Fail-fast - no retry
}
```

---

## Handler Inventory

### src/atomic-crm/providers/supabase/handlers/

| Handler | Resource | Lines | Hooks Used | Validation Schema | Special Behaviors |
|---------|----------|-------|------------|-------------------|-------------------|
| `contactsHandler.ts` | contacts | 33 | beforeGetList, beforeCreate/Update | contactSchema | Soft delete, JSONB normalization, name computation |
| `organizationsHandler.ts` | organizations | 33 | beforeGetList, beforeCreate/Update | organizationsSchema | Soft delete, computed field stripping |
| `opportunitiesHandler.ts` | opportunities | 220 | All hooks + custom create/update | opportunitySchema | Product sync via RPC, cascading archive, win/loss reasons |
| `activitiesHandler.ts` | activities | 37 | beforeGetList, beforeCreate/Update | activitiesSchema | Soft delete |
| `productsHandler.ts` | products | 326 | All hooks | productsSchema | Distributor sync, computed fields |
| `tasksHandler.ts` | tasks | 38 | beforeGetList, beforeCreate/Update | taskSchema | Soft delete, completion timestamps |
| `notesHandler.ts` | contact/opportunity/organization_notes | 74 | Factory pattern for 3 note types | notesSchema | Soft delete |
| `tagsHandler.ts` | tags | 36 | beforeGetList | tagsSchema | Soft delete |
| `salesHandler.ts` | sales | 100 | beforeGetList, beforeCreate/Update | salesSchema | Soft delete, computed fields |
| `segmentsHandler.ts` | segments | 152 | beforeGetList, beforeCreate/Update | segmentsSchema | Soft delete |
| `productDistributorsHandler.ts` | product_distributors | 287 | All hooks | productDistributorsSchema | Junction table operations |
| `junctionHandlers.ts` | 6 junction tables | 108 | Soft delete for all | N/A | Generic junction table support |
| `notificationsHandler.ts` | notifications | 33 | beforeGetList | N/A | Soft delete |
| **index.ts** | N/A | 54 | N/A | N/A | Re-exports all handlers |

**Total**: 14 handler files (excluding tests), ~1,531 lines of handler code

### Handler Deep Dives

#### opportunitiesHandler.ts (Most Complex)

**Purpose**: Handle opportunity CRUD with atomic product synchronization

**Location**: `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
**Lines**: 220

**Key Innovation**: Custom handler logic is defined INSIDE the wrapper chain:

```typescript
// Lines 94-201: customOpportunitiesHandler defined first
const customOpportunitiesHandler: DataProvider = {
  // Pass through read operations
  getList: (resource, params) => baseProvider.getList(resource, params),
  getOne: (resource, params) => baseProvider.getOne(resource, params),

  // Intercept create for product sync
  create: async (resource, params) => {
    if (resource === "opportunities") {
      const validatedData = handlerInputSchema.parse(params.data);
      const productsToSync = validatedData.products_to_sync;

      if (Array.isArray(productsToSync)) {
        const service = new OpportunitiesService(baseProvider);
        const result = await service.createWithProducts(validatedData);
        return { data: result };
      }
    }
    return baseProvider.create(resource, params);
  },
  // ... similar for update
};

// Lines 214-220: Then wrapped with the standard chain
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(customOpportunitiesHandler),
    [opportunitiesCallbacks]
  )
);
```

**Lifecycle Hooks via opportunitiesCallbacks**:
- `beforeGetList`: Adds soft delete filter
- `beforeCreate`: Strips computed fields, merges defaults
- `beforeDelete`: Calls `archive_opportunity_with_relations` RPC for cascading soft delete
- `afterRead`: Normalizes JSONB arrays

#### contactsHandler.ts (Reference Simple Handler)

**Purpose**: Standard CRUD for contacts with JSONB normalization

**Location**: `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`
**Lines**: 33

**Pattern Demonstration**: This is the canonical "simple handler" pattern:

```typescript
export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [contactsCallbacks])
  );
}
```

**Callback Behaviors**:
- `computeNameField`: Combines first_name + last_name into name (DB NOT NULL constraint)
- `normalizeJsonbArrays`: Ensures email/phone/tags are always arrays
- `stripComputedFields`: Removes nb_notes, nb_tasks, organization_name before save
- `transformQToIlikeSearch`: Converts search query to ILIKE across name fields

---

## Callback Inventory

### src/atomic-crm/providers/supabase/callbacks/

| Callback File | Resource(s) | Lines | Key Behaviors |
|---------------|-------------|-------|---------------|
| `contactsCallbacks.ts` | contacts | 170 | Name computation, JSONB normalization, search transform |
| `organizationsCallbacks.ts` | organizations | ~150 | Computed field stripping, soft delete |
| `opportunitiesCallbacks.ts` | opportunities | ~200 | RPC archive, default merging, products_to_sync stripping |
| `activitiesCallbacks.ts` | activities | ~100 | Soft delete, computed fields |
| `productsCallbacks.ts` | products | ~120 | Distributor field stripping |
| `tasksCallbacks.ts` | tasks | ~80 | Completion timestamp handling |
| `notesCallbacks.ts` | *_notes (3 types) | ~100 | Factory pattern for note types |
| `tagsCallbacks.ts` | tags | ~50 | Soft delete |
| `salesCallbacks.ts` | sales | ~80 | Computed field stripping |
| `notificationsCallbacks.ts` | notifications | ~50 | Soft delete |
| `createResourceCallbacks.ts` | Factory | ~150 | Generic callback factory |
| `commonTransforms.ts` | Shared | ~100 | Reusable transforms |
| **index.ts** | N/A | 92 | Re-exports all callbacks |

**Total**: 13 callback files, ~1,442 lines

### Callback Factory Pattern

The `createResourceCallbacks` factory provides standardized behavior:

```typescript
// From createResourceCallbacks.ts
export function createResourceCallbacks(config: ResourceCallbacksConfig): ResourceCallbacks {
  return {
    resource: config.resource,

    beforeGetList: async (params) => {
      // Add soft delete filter by default
      if (config.supportsSoftDelete && !params.filter?.includeDeleted) {
        return {
          ...params,
          filter: { ...params.filter, "deleted_at@is": null }
        };
      }
      return params;
    },

    beforeCreate: async (params) => {
      let data = stripComputedFields(params.data, config.computedFields);
      for (const transform of config.writeTransforms || []) {
        data = transform(data);
      }
      return { ...params, data };
    },

    afterRead: async (result) => {
      if (config.afterReadTransform) {
        return { ...result, data: config.afterReadTransform(result.data) };
      }
      return result;
    },
    // ... similar for beforeUpdate, beforeDelete
  };
}
```

---

## Wrapper Inventory

### src/atomic-crm/providers/supabase/wrappers/

| Wrapper | Lines | Purpose |
|---------|-------|---------|
| `withErrorLogging.ts` | 296 | Structured error logging, audit trails, idempotent delete handling |
| `withValidation.ts` | 167 | Zod validation integration, Zod-to-React-Admin error transformation |
| **index.ts** | 27 | Re-exports wrappers and types |

**Total**: 3 files, 490 lines

### withErrorLogging.ts Deep Dive

**Purpose**: Wrap all DataProvider methods with comprehensive error handling

**Key Behaviors**:
1. **Structured Logging**: Captures method, resource, params (data redacted), timestamp
2. **Validation Error Detail**: Logs full validation errors for debugging
3. **Supabase Error Transformation**: Extracts field names from error details
4. **Idempotent Delete**: Treats "already deleted" as success (for React Admin's undoable mode)
5. **Audit Trail**: Logs success for sensitive operations (delete, sales, opportunities)

```typescript
// From withErrorLogging.ts lines 72-129
function logError(method, resource, params, error) {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      filter: params?.filter,
      data: params?.data ? "[Data Present]" : undefined, // SECURITY: Redact
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error.message,
    stack: error.stack,
    validationErrors: error.body?.errors,
  });
}
```

### withValidation.ts Deep Dive

**Purpose**: Integrate ValidationService into the DataProvider chain

**Key Behaviors**:
1. **Create Validation**: Calls `validationService.validate(resource, "create", data)` before create
2. **Update Validation**: Adds `id` to data before validating (some schemas require it)
3. **Filter Cleaning**: Validates and cleans filter fields on getList
4. **Zod-to-React-Admin**: Transforms Zod issues to `{ body: { errors: { field: message } } }`

```typescript
// From withValidation.ts lines 70-85
function transformZodToReactAdmin(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    const fieldPath = issue.path.join(".");
    errors[fieldPath || "_error"] = issue.message;
  }
  return {
    message: "Validation failed",
    body: { errors },
  };
}
```

---

## Service Inventory

### src/atomic-crm/services/

| Service | Purpose | Methods | Lines | Used By |
|---------|---------|---------|-------|---------|
| `opportunities.service.ts` | Opportunity business logic | archiveOpportunity, unarchiveOpportunity, createWithProducts, updateWithProducts, updateWithContacts | 286 | opportunitiesHandler, hooks |
| `junctions.service.ts` | Many-to-many relationships | getOpportunityParticipants, addOpportunityParticipant, removeOpportunityParticipant, getOpportunityContacts, addOpportunityContact, removeOpportunityContact | 513 | Components, hooks |
| `activities.service.ts` | Activity log operations | (thin wrapper) | 36 | ActivityFeed |
| `digest.service.ts` | Daily/weekly digests | generateDaily, generateWeekly | 384 | Edge Functions |
| `products.service.ts` | Product operations | (distributor sync) | 321 | productsHandler |
| `productDistributors.service.ts` | Product-distributor junction | (sync operations) | 264 | productDistributorsHandler |
| `sales.service.ts` | Sales rep operations | (CRUD helpers) | 170 | salesHandler |
| `segments.service.ts` | Operator segments | (CRUD helpers) | 176 | segmentsHandler |
| `utils/handleServiceError.ts` | Error handling utility | handleServiceError | ~30 | All services |
| **index.ts** | Re-exports | N/A | 39 | All consumers |

**Total**: 10 service files, ~2,219 lines

### Service Deep Dives

#### OpportunitiesService (Most Complex)

**Location**: `src/atomic-crm/services/opportunities.service.ts`
**Lines**: 286

**Key Methods**:

```typescript
class OpportunitiesService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  // Archive opportunity + all related records via RPC
  async archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    return await this.dataProvider.rpc("archive_opportunity_with_relations", {
      opp_id: opportunity.id,
    });
  }

  // Create opportunity with atomic product sync
  async createWithProducts(data: Partial<OpportunityCreateInput>): Promise<Opportunity> {
    const productsToSync = data.products_to_sync || [];
    const { products_to_sync: _, ...opportunityData } = data;

    if (productsToSync.length === 0) {
      const result = await this.dataProvider.create("opportunities", { data: opportunityData });
      return result.data;
    }

    // Call RPC for atomic creation
    return await this.rpcSyncOpportunity(opportunityData, productsToSync, [], []);
  }

  // Update with product diffing
  async updateWithProducts(id, data, previousProducts): Promise<Opportunity> {
    const { creates, updates, deletes } = diffProducts(previousProducts, data.products_to_sync);
    return await this.rpcSyncOpportunity(data, creates, updates, deletes);
  }
}
```

**Why Service Layer?**:
- Handlers are for translation (React Admin <-> Supabase)
- Services contain business logic (diffing, RPC orchestration)
- Services can be reused across handlers and components

#### JunctionsService

**Location**: `src/atomic-crm/services/junctions.service.ts`
**Lines**: 513

**Purpose**: Manage many-to-many relationships through junction tables

**Pattern**: Uses DataProvider exclusively (no direct Supabase calls):

```typescript
class JunctionsService {
  constructor(private dataProvider: DataProviderWithRpc) {}

  async getOpportunityContacts(opportunityId): Promise<{ data: OpportunityContactWithDetails[] }> {
    // 1. Get junction records
    const response = await this.dataProvider.getList("opportunity_contacts", {
      filter: { opportunity_id: opportunityId },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "is_primary", order: "DESC" },
    });

    // 2. Batch fetch contacts (avoid N+1)
    const contactIds = response.data.map(oc => oc.contact_id).filter(Boolean);
    const { data: contacts } = await this.dataProvider.getMany("contacts", { ids: contactIds });
    const contactMap = new Map(contacts.map(c => [c.id, c]));

    // 3. Combine junction records with contact details
    return {
      data: response.data.map(junction => ({
        ...junction,
        contact: contactMap.get(junction.contact_id),
      })),
    };
  }
}
```

---

## Validation Inventory

### src/atomic-crm/validation/

| Schema File | Lines | Schemas Exported | Coverage |
|-------------|-------|------------------|----------|
| `contacts.ts` | 756 | contactBaseSchema, contactSchema, createContactSchema, updateContactSchema, quickCreateContactSchema, importContactSchema, contactOrganizationSchema | Full CRUD + import + relationships |
| `opportunities.ts` | 735 | opportunitySchema, createOpportunitySchema, updateOpportunitySchema, quickCreateOpportunitySchema, closeOpportunitySchema, checkExactDuplicate | Full CRUD + close modal + duplicate check |
| `activities.ts` | 581 | activitiesSchema, createActivitySchema | Full CRUD with sample tracking |
| `operatorSegments.ts` | 481 | operatorSegmentSchema | Segment management |
| `notes.ts` | 341 | noteSchema, createNoteSchema | Notes for all resources |
| `distributorAuthorizations.ts` | 302 | authorizationSchema | Principal-distributor auth |
| `sales.ts` | 292 | salesSchema, createSalesSchema | Sales rep records |
| `organizations.ts` | 287 | organizationSchema, createOrganizationSchema | Organization CRUD |
| `tags.ts` | 197 | tagsSchema | Tag management |
| `segments.ts` | 197 | segmentSchema | Operator segments |
| `rpc.ts` | 167 | RPC parameter schemas | RPC function validation |
| `products.ts` | 156 | productSchema | Product records |
| `task.ts` | 147 | taskSchema, taskCreateSchema, taskUpdateSchema | Task management |
| `organizationDistributors.ts` | 143 | orgDistributorSchema | Junction table |
| `productDistributors.ts` | 129 | productDistributorSchema | Junction table |
| `productWithDistributors.ts` | 84 | productWithDistributorsSchema | Product + relations |
| `favorites.ts` | 84 | favoriteSchema | User favorites |
| `constants.ts` | 59 | Shared constants | Enums, limits |
| `quickAdd.ts` | 53 | quickAddSchema | Quick-add forms |
| `categories.ts` | 33 | categorySchema | Product categories |
| **index.ts** | 42 | Re-exports | All schemas |

**Total**: 21 schema files, ~5,267 lines

### Validation Deep Dives

#### contacts.ts (Largest Schema)

**Location**: `src/atomic-crm/validation/contacts.ts`
**Lines**: 756

**Schemas Exported**:

```typescript
// Base schema with all fields (exported for form defaults)
export const contactBaseSchema = z.strictObject({
  id: z.coerce.number().optional(),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),  // JSONB array
  phone: z.array(phoneNumberAndTypeSchema).default([]),  // JSONB array
  title: z.string().trim().max(100).optional().nullable(),
  department_type: contactDepartmentSchema.nullable().optional(),
  linkedin_url: isLinkedinUrl,  // LinkedIn domain validation
  organization_id: z.coerce.number().nullable().optional(),
  notes: z.string().trim().max(5000).optional().nullable()
    .transform(val => val ? sanitizeHtml(val) : val),  // XSS prevention
  // ... 30+ more fields
});

// Main schema with business rules
export const contactSchema = contactBaseSchema
  .transform(transformContactData)  // Compute name from first_name + last_name
  .superRefine((data, ctx) => {
    // Validate either name OR first_name/last_name provided
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "..." });
    }
    // Prevent self-manager circular reference
    if (data.manager_id && data.id && data.manager_id === data.id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["manager_id"], message: "..." });
    }
  });

// Create-specific (stricter)
export const createContactSchema = contactBaseSchema
  .omit({ id: true, created_at: true, ... })
  .superRefine((data, ctx) => {
    // Require first_name, last_name, sales_id, organization_id
  });

// Quick create (minimal)
export const quickCreateContactSchema = z.strictObject({
  first_name: z.string().trim().min(1).max(100),
  organization_id: z.coerce.number().int().positive(),
  quickCreate: z.literal(true),
  // Optional fields...
});
```

**Validation Patterns**:
- `z.strictObject()`: Prevents extra fields (mass assignment prevention)
- `.max()` on all strings: DoS prevention
- `z.coerce`: Type coercion for form inputs
- `.transform()`: Data normalization (sanitizeHtml, name computation)
- `.superRefine()`: Complex cross-field validation

#### opportunities.ts (Business Logic Heavy)

**Location**: `src/atomic-crm/validation/opportunities.ts`
**Lines**: 735

**Win/Loss Reason Validation**:

```typescript
// Win/Loss reasons (industry standard - Salesforce/HubSpot)
export const winReasonSchema = z.enum([
  "relationship", "product_quality", "price_competitive", "timing", "other"
]);

export const lossReasonSchema = z.enum([
  "price_too_high", "no_authorization", "competitor_relationship",
  "product_fit", "timing", "no_response", "other"
]);

// Update schema with cross-field validation
export const updateOpportunitySchema = opportunityBaseSchema.partial()
  .refine(data => {
    // If closing as won, win_reason required
    if (data.stage === "closed_won") return !!data.win_reason;
    return true;
  }, { message: "Win reason is required", path: ["win_reason"] })
  .refine(data => {
    // If closing as lost, loss_reason required
    if (data.stage === "closed_lost") return !!data.loss_reason;
    return true;
  }, { message: "Loss reason is required", path: ["loss_reason"] })
  .refine(data => {
    // If reason is "other", notes required
    if (data.win_reason === "other" || data.loss_reason === "other") {
      return !!data.close_reason_notes?.trim();
    }
    return true;
  }, { message: "Notes required for 'Other'", path: ["close_reason_notes"] });
```

**Duplicate Check Function**:

```typescript
export async function checkExactDuplicate(dataProvider, params) {
  // Find opportunities with matching principal + customer
  const { data: matches } = await dataProvider.getList("opportunities", {
    filter: {
      principal_organization_id: params.principal_id,
      customer_organization_id: params.customer_id,
      "deleted_at@is": null,
    },
  });

  // Check each for matching product
  for (const opp of matches) {
    const { data: products } = await dataProvider.getList("opportunity_products", {
      filter: { opportunity_id: opp.id, product_id: params.product_id },
    });

    if (products.length > 0) {
      throw new Error(`Duplicate: "${opp.name}" (${opp.stage})`);
    }
  }
}
```

---

## Type Definitions

### src/types/

| File | Purpose | Lines | Generated? |
|------|---------|-------|------------|
| `database.types.ts` | Supabase generated types | ~45,000+ | Yes (`supabase gen types`) |
| `database.generated.ts` | Additional generated | ~1,000 | Yes |

### Type Naming Conventions

| Pattern | Example | Use |
|---------|---------|-----|
| `[Resource]` | `Contact` | Database row type (z.infer) |
| `[Resource]Input` | `ContactInput` | Form input type (z.input) |
| `[Resource]Create` | `OpportunityCreateInput` | Insert payload |
| `[Resource]Update` | `OpportunityUpdateInput` | Update payload |
| `[Resource]WithRelations` | `OpportunityContactWithDetails` | Joined query result |

### Generated Types Structure

```typescript
// From database.types.ts
export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: { id: number; first_name: string | null; ... }
        Insert: { id?: number; first_name?: string | null; ... }
        Update: { id?: number; first_name?: string | null; ... }
      }
      // ... all tables
    }
    Views: {
      contacts_summary: { Row: { ... } }
      // ... all views
    }
    Functions: {
      archive_opportunity_with_relations: { Args: { opp_id: number }; Returns: unknown }
      // ... all RPC functions
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "sample" | "other"
      // ... all enums
    }
  }
}
```

---

## Utilities Inventory

### src/lib/

| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| `utils.ts` | `cn()` class merge function | 9 | clsx, tailwind-merge |
| `date-utils.ts` | Date formatting helpers | ~50 | date-fns |
| `sanitization.ts` | HTML sanitization | ~80 | DOMPurify |
| `devLogger.ts` | Development logging | ~60 | None |
| `logger.ts` | Production logging | ~40 | None |
| `csvUploadValidator.ts` | CSV import validation | ~100 | papaparse |
| `i18nProvider.ts` | Internationalization | ~30 | ra-core |
| `genericMemo.ts` | Generic memoization | ~40 | None |
| `field.type.ts` | Field type definitions | ~20 | None |
| `color-types.ts` | Color type definitions | ~30 | None |
| `sanitizeInputRestProps.ts` | Input prop cleaning | ~20 | None |
| `utils/pluralize.ts` | Pluralization utility | ~15 | None |
| **PATTERNS.md** | Documentation | ~100 | N/A |

**Total**: 14 files, ~594 lines

### src/atomic-crm/utils/

| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| `autocompleteDefaults.ts` | Default values for autocomplete | 71 | None |
| `formatters.ts` | Display formatting (currency, phone) | ~80 | Intl APIs |
| `formatRelativeTime.ts` | Relative time display | ~50 | date-fns |
| `formatName.ts` | Name formatting | ~30 | None |
| `exportHelpers.ts` | CSV/Excel export | ~120 | xlsx |
| `stalenessCalculation.ts` | Opportunity staleness | ~80 | date-fns |
| `levenshtein.ts` | String similarity | ~40 | None |
| `getActivityIcon.tsx` | Activity type icons | ~60 | lucide-react |
| `getContextAwareRedirect.ts` | Smart redirects | ~50 | None |
| `listPatterns.ts` | List display patterns | ~40 | None |
| `rateLimiter.ts` | Rate limiting | ~50 | None |
| `safeJsonParse.ts` | Safe JSON parsing | ~20 | None |
| `saleOptionRenderer.ts` | Sales dropdown rendering | ~30 | None |
| `secureStorage.ts` | Secure localStorage | ~60 | None |
| `csvUploadValidator.ts` | CSV validation | ~100 | papaparse |
| `avatar/` | Avatar utilities (3 files) | ~100 | None |
| `useNotifyWithRetry.tsx` | Notification hook | ~40 | ra-core |
| **index.ts** | Re-exports | ~30 | N/A |
| **PATTERNS.md** | Documentation | ~50 | N/A |

**Total**: 20 files, ~1,151 lines

---

## dataProviderUtils.ts Deep Dive

**Location**: `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
**Lines**: 507

This file contains critical transformation utilities:

### Key Functions

**1. transformStaleFilter**: Virtual filter transformation
```typescript
// Transforms { stale: true } into PostgREST-compatible filter
export function transformStaleFilter(filter, resource) {
  if (resource !== "opportunities" || filter.stale !== true) return filter;

  const { stale: _, ...restFilter } = filter;
  const thresholdDate = subDays(new Date(), 7);  // Minimum threshold

  return {
    ...restFilter,
    "stage@not.in": "(closed_won,closed_lost)",
    "or@": `(last_activity_date.lt.${thresholdISO},last_activity_date.is.null)`,
  };
}
```

**2. transformArrayFilters**: PostgREST operator transformation
```typescript
// Transforms { tags: [1,2,3] } → { "tags@cs": "{1,2,3}" }
export function transformArrayFilters(filter) {
  const jsonbArrayFields = ["tags", "email", "phone"];

  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value) && jsonbArrayFields.includes(key)) {
      transformed[`${key}@cs`] = `{${value.join(",")}}`;  // Contains
    } else if (Array.isArray(value)) {
      transformed[`${key}@in`] = `(${value.join(",")})`;  // IN
    }
  }
}
```

**3. getDatabaseResource**: View/Table routing
```typescript
// Maps resources to database views for reads
export function getDatabaseResource(resource, operation) {
  if (operation === "list" &&
      ["organizations", "contacts", "opportunities", "products"].includes(resource)) {
    return `${resource}_summary`;  // Use view for aggregations
  }
  return resource;  // Use base table for writes
}
```

**4. applyFullTextSearch**: ILIKE search construction
```typescript
// Builds PostgREST OR condition for multi-column search
export function applyFullTextSearch(columns, addSoftDelete) {
  return (params) => {
    const escaped = escapeForIlike(params.filter.q);
    const orConditions = columns.map(col => `${col}.ilike.*${escaped}*`).join(",");
    return {
      ...params,
      filter: { ...params.filter, "or@": `(${orConditions})` },
    };
  };
}
```

---

## Constitution Enforcement

This layer is the primary enforcer of the Engineering Constitution:

### Principle 1: Fail-Fast
**Requirement**: No retry logic, circuit breakers, or graceful fallbacks
**Implementation**: All handlers throw on error, no catch-and-retry
**Evidence** (withErrorLogging.ts line 283):
```typescript
throw error; // Re-throw - no retry
```

### Principle 2: Single Data Entry Point
**Requirement**: All DB operations via data provider
**Implementation**: composedDataProvider is the only Supabase consumer
**Evidence**: No direct `supabase.from()` calls in components/hooks (enforced by code review)

### Principle 3: Zod at API Boundary
**Requirement**: Validation in data provider, not forms
**Implementation**: withValidation wrapper calls ValidationService
**Evidence** (withValidation.ts lines 113-114):
```typescript
await validationService.validate(resource, "create", params.data);
```

### Principle 4: Schema Defaults
**Requirement**: `zodSchema.partial().parse({})` for form defaults
**Implementation**: Base schemas exported with `.default()` methods
**Evidence** (contacts.ts line 87):
```typescript
export const contactBaseSchema = z.strictObject({
  email: z.array(emailAndTypeSchema).default([]),
  // ...
});
```

### Principle 5: z.strictObject for Security
**Requirement**: Prevent mass assignment
**Implementation**: All API boundary schemas use `z.strictObject()`
**Evidence** (contacts.ts line 87, opportunities.ts line 84):
```typescript
const contactBaseSchema = z.strictObject({ ... });
const opportunityBaseSchema = z.strictObject({ ... });
```

### Principle 6: String Length Limits
**Requirement**: All strings must have `.max()` for DoS prevention
**Implementation**: Every string field has explicit max length
**Evidence** (contacts.ts lines 93-94):
```typescript
first_name: z.string().trim().max(100, "First name too long")
```

### Principle 7: Soft Delete
**Requirement**: Use `deleted_at` instead of hard delete
**Implementation**: Handlers automatically filter soft-deleted records
**Evidence** (createResourceCallbacks.ts):
```typescript
beforeGetList: async (params) => ({
  ...params,
  filter: { ...params.filter, "deleted_at@is": null }
})
```

---

## Why This Layer Excels

### Pattern 1: Single Composition Point

Instead of scattered data access:
```typescript
// BAD: Multiple entry points, inconsistent behavior
const contacts = await supabase.from('contacts').select('*');
const opps = await supabase.from('opportunities').select('*');
```

Single composed provider:
```typescript
// GOOD: One entry point, consistent validation/logging/soft-delete
const contacts = await dataProvider.getList('contacts', params);
```

**Benefits**:
- Consistent logging across ALL operations
- Validation ALWAYS applied (can't bypass)
- Soft-delete ALWAYS honored
- Easy to add cross-cutting concerns (audit, caching)

### Pattern 2: Explicit Handler Registration

Each resource explicitly declares its behavior:
```typescript
const handlers = {
  contacts: createContactsHandler(baseProvider),
  opportunities: createOpportunitiesHandler(baseProvider),
  // ... explicitly listed
};
```

**Benefits**:
- No magic auto-discovery
- Easy to trace: "What happens when I call getList('contacts')?"
- Handlers can be tested independently
- Clear ownership per resource

### Pattern 3: Validation at Entry Point

```
Form -> Data Provider -> [VALIDATION HERE] -> Database
```

**Benefits**:
- Forms stay simple (no validation logic duplication)
- Validation rules in ONE place per resource
- Impossible to bypass validation
- Type safety through Zod inference

### Pattern 4: Wrapper Composition

The decorator pattern allows clean separation:
```typescript
withErrorLogging(        // Cross-cutting: logging
  withLifecycleCallbacks( // Resource-specific: hooks
    withValidation(       // Cross-cutting: validation
      baseProvider        // Core: database operations
    )
  )
)
```

**Benefits**:
- Single responsibility per wrapper
- Easy to add/remove concerns
- Clear execution order
- Each wrapper independently testable

### Pattern 5: Service Layer Separation

Handlers translate, services orchestrate:
```typescript
// Handler: Translation only
const result = await service.createWithProducts(data);

// Service: Business logic
async createWithProducts(data) {
  const { products_to_sync, ...opportunityData } = data;
  const { creates, updates, deletes } = diffProducts(...);
  return await this.rpcSyncOpportunity(...);
}
```

**Benefits**:
- Handlers stay thin (~30 lines for simple resources)
- Business logic reusable across handlers/hooks
- Clear separation of concerns
- Services can be unit tested with mock DataProvider

---

## Related Documentation

- [Architecture Overview](./00-architecture-overview.md)
- [Domain Layer](./02-domain-layer.md)
- [Feature Slices](./04-feature-slices.md)
- [Provider Rules](../../.claude/rules/PROVIDER_RULES.md)
