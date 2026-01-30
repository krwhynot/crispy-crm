# Supabase Data Provider Patterns

Standard patterns for the Supabase DataProvider subsystem in Crispy CRM. This is the single most complex subsystem with ~80+ files implementing a layered architecture for data access, validation, transformation, and business logic orchestration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPONENTS / REACT ADMIN                              │
│                    (getList, create, update, delete)                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  EXTENDED DATA PROVIDER (Entry Point)                        │
│               extendWithCustomMethods(composedProvider)                      │
│         ┌─────────────────┬─────────────────┬─────────────────┐             │
│         │  Custom Methods │  Storage Ops    │  RPC/Edge Func  │             │
│         │  (30 methods)   │  (4 methods)    │  (2 methods)    │             │
│         └────────┬────────┴────────┬────────┴────────┬────────┘             │
└──────────────────┼─────────────────┼─────────────────┼──────────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      COMPOSED DATA PROVIDER (Router)                          │
│                        composedDataProvider.ts                                │
│    ┌────────────────────────────────────────────────────────────────────┐    │
│    │ getProviderForResource(resource) → Handler or BaseProvider          │    │
│    │ HANDLED_RESOURCES: contacts, orgs, opportunities, activities, ...  │    │
│    └────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Handler Layer   │    │  Handler Layer   │    │  Fallback to     │
│  (contacts)      │    │  (opportunities) │    │  Base Provider   │
└────────┬─────────┘    └────────┬─────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WRAPPER COMPOSITION (Middleware Stack)                    │
│                                                                              │
│     withErrorLogging                                                         │
│         ↓                                                                    │
│     withLifecycleCallbacks  ◀──── callbacks/[resource]Callbacks.ts          │
│         ↓                                                                    │
│     withValidation          ◀──── services/ValidationService.ts             │
│         ↓                                                                    │
│     BASE SUPABASE PROVIDER  ◀──── ra-supabase PostgREST                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Handler Factory Pattern

Creates fully composed DataProvider instances for each resource by stacking wrappers.

### When to Use
- Every resource that needs custom lifecycle behavior (soft delete, transforms, validation)
- Resources with computed fields from database views
- Resources requiring data normalization

### Code Example

```typescript
// handlers/tasksHandler.ts
import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { tasksCallbacks } from "../callbacks/tasksCallbacks";

/**
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * WHY THIS ORDER:
 * 1. withValidation runs FIRST (innermost) - validates clean data
 * 2. withLifecycleCallbacks runs SECOND - beforeSave strips computed fields AFTER validation
 * 3. withErrorLogging runs LAST (outermost) - catches all errors from inner layers
 */
export function createTasksHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [tasksCallbacks]
    )
  );
}
```

### Key Points
- **Composition Order Matters**: `withLifecycleCallbacks` wraps `withValidation` so `beforeSave` can strip computed fields AFTER Zod validates the user input
- **Each Resource Gets Own Handler**: `createContactsHandler`, `createOpportunitiesHandler`, etc.
- **~20 Lines Per Handler**: Keep handlers thin - logic goes in callbacks/services
- **Handlers Are Registered**: In `composedDataProvider.ts` handlers registry

---

## Pattern B: Resource Callbacks Factory Pattern

Standardizes lifecycle callbacks across resources using a factory function.

### When to Use
- All resources requiring soft delete behavior
- Resources with computed fields from views to strip before save
- Resources needing data transformation on read/write

### Code Example

```typescript
// callbacks/productsCallbacks.ts
import { createResourceCallbacks } from "./createResourceCallbacks";

export const COMPUTED_FIELDS = ["principal_name"] as const;

export const productsCallbacks = createResourceCallbacks({
  resource: "products",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
});
```

### Advanced Example with Transforms

```typescript
// callbacks/tasksCallbacks.ts
import { createResourceCallbacks, type Transform } from "./createResourceCallbacks";

const handleCompletionTimestamp: Transform = {
  name: "handleCompletionTimestamp",
  description: "Sets/clears completed_at based on completed flag",
  apply: (record) => {
    if ("completed" in record) {
      if (record.completed === true && !record.completed_at) {
        return { ...record, completed_at: new Date().toISOString() };
      } else if (record.completed === false) {
        return { ...record, completed_at: null };
      }
    }
    return record;
  },
};

export const tasksCallbacks = createResourceCallbacks({
  resource: "tasks",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
  writeTransforms: [handleCompletionTimestamp, normalizeSnoozeUntil],
});
```

### Factory Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `resource` | `string` | Resource name (must match React Admin) |
| `supportsSoftDelete` | `boolean` | Enable `deleted_at` timestamp on delete |
| `computedFields` | `string[]` | Fields to strip before save (view columns) |
| `readTransforms` | `Transform[]` | Applied after data fetch |
| `writeTransforms` | `Transform[]` | Applied before data save |
| `createDefaults` | `Record<string, unknown>` | Default values for create |

---

## Pattern C: Middleware Wrapper Pattern

Cross-cutting concerns implemented as DataProvider decorators.

### When to Use
- Error logging and transformation
- Validation at API boundary
- Audit logging
- Any cross-cutting concern across all operations

### Code Example: Error Logging Wrapper

```typescript
// wrappers/withErrorLogging.ts
import { logger } from '@/lib/logger';

export function withErrorLogging<T extends DataProvider>(
  provider: T
): T {
  return new Proxy(provider, {
    get(target, prop: string) {
      const original = target[prop as keyof T];
      if (typeof original !== 'function') return original;

      return async (...args: unknown[]) => {
        try {
          return await original.apply(target, args);
        } catch (error) {
          logger.error(`DataProvider operation failed`, {
            operation: prop,
            error: error instanceof Error ? error.message : String(error),
            resource: args[0],
          });
          throw error;
        }
      };
    },
  });
}
```

### Code Example: Validation Wrapper

```typescript
// wrappers/withValidation.ts
export function withValidation<T extends DataProvider>(
  provider: T,
  validationService = new ValidationService()
): T {
  const wrappedProvider = { ...provider } as T;

  wrappedProvider.create = async (resource, params) => {
    try {
      await validationService.validate(resource, "create", params.data);
    } catch (error) {
      if (isZodError(error)) {
        throw transformZodToReactAdmin(error);
      }
      throw error;
    }
    return provider.create(resource, params);
  };

  // Similar for update, getList with filter validation...
  return wrappedProvider;
}
```

### Key Points
- **Order Matters**: Error logging should be outermost to catch all errors
- **Preserve Original Methods**: Use spread operator to copy, then override specific methods
- **Chain Responsibility**: Each wrapper does one thing, then delegates

---

## Pattern D: Resource Router Pattern (Proxy)

Routes DataProvider method calls to appropriate resource-specific handlers.

### When to Use
- Central composition point for all resource handlers
- Automatic fallback to base provider for unhandled resources
- Resource-to-database-view mapping

### Code Example

```typescript
// composedDataProvider.ts
export const HANDLED_RESOURCES = [
  "contacts", "organizations", "opportunities", "activities",
  "products", "tasks", "contact_notes", "opportunity_notes",
  "organization_notes", "tags", "sales",
] as const;

export function createComposedDataProvider(baseProvider: DataProvider): DataProvider {
  const handlers: HandlerRegistry = {
    contacts: createContactsHandler(baseProvider),
    organizations: createOrganizationsHandler(baseProvider),
    opportunities: createOpportunitiesHandler(baseProvider),
    // ... etc
  };

  function getProviderForResource(resource: string): DataProvider {
    if (isHandledResource(resource)) {
      return handlers[resource];
    }
    return baseProvider; // Fallback
  }

  return {
    getList: async (resource, params) => {
      // Map resource to database table/view (e.g., opportunities → opportunities_summary)
      const dbResource = getDatabaseResource(resource, "list");
      const processedParams = applySearchParams(resource, params);
      return getProviderForResource(resource).getList(dbResource, processedParams);
    },
    // ... other methods
  };
}
```

### Key Points
- **Summary Views for List**: `getDatabaseResource('opportunities', 'list')` returns `'opportunities_summary'`
- **Base Tables for Mutation**: Create/update/delete use base table names
- **Fallback Strategy**: Unknown resources go directly to base Supabase provider

---

## Pattern E: Service Layer Delegation Pattern

Business logic extracted into service classes, delegated from custom DataProvider methods.

### When to Use
- Complex operations involving multiple tables
- Edge Function invocations
- RPC function calls with business logic
- Junction table management

### Code Example

```typescript
// services/index.ts (ServiceContainer)
export function createServiceContainer(baseProvider: DataProvider): ServiceContainer {
  return {
    sales: new SalesService(baseProvider),       // Edge Functions
    opportunities: new OpportunitiesService(baseProvider), // RPC + Product sync
    activities: new ActivitiesService(baseProvider),       // Activity log
    junctions: new JunctionsService(baseProvider),         // Many-to-many
    segments: new SegmentsService(baseProvider),           // Get-or-create
  };
}

// extensions/customMethodsExtension.ts
export function extendWithCustomMethods(config: ExtensionConfig): ExtendedDataProvider {
  const { composedProvider, services, supabaseClient } = config;

  return {
    ...composedProvider,

    // Delegate to service
    salesCreate: async (body) => services.sales.salesCreate(body),
    archiveOpportunity: async (opp) => services.opportunities.archiveOpportunity(opp),
    getActivityLog: async (companyId, salesId) =>
      services.activities.getActivityLog(companyId, salesId),
  };
}
```

### Service Responsibilities

| Service | Methods | Responsibility |
|---------|---------|----------------|
| `SalesService` | 3 | Account manager CRUD via Edge Functions |
| `OpportunitiesService` | 2 | Archive/unarchive via RPC, product sync |
| `ActivitiesService` | 1 | Activity log aggregation via RPC |
| `JunctionsService` | 13 | Many-to-many relationships (contacts-orgs, opp-contacts) |
| `SegmentsService` | 1 | Get-or-create pattern for segments |

---

## Pattern F: Zod Validation at API Boundary

Centralized validation using Zod schemas at the DataProvider layer only.

### When to Use
- All create/update operations
- Filter validation to prevent invalid PostgREST queries
- RPC parameter validation
- Edge Function body validation

### Code Example

```typescript
// services/ValidationService.ts
export class ValidationService {
  private validationRegistry: Record<string, ValidationHandlers> = {
    contacts: {
      create: async (data) => validateContactForm(data),
      update: async (data) => validateUpdateContact(data),
    },
    organizations: {
      create: async (data) => validateCreateOrganization(data),
      update: async (data) => validateUpdateOrganization(data),
    },
    // ... etc
  };

  async validate(resource: string, method: string, data: unknown): Promise<void> {
    const validator = this.validationRegistry[resource];
    if (!validator) return; // No validation configured

    if (method === "create" && validator.create) {
      await validator.create(data);
    } else if (method === "update" && validator.update) {
      await validator.update(data);
    }
  }
}
```

### Zod Error Transformation

```typescript
// wrappers/withValidation.ts
function transformZodToReactAdmin(zodError: ZodError): ReactAdminValidationError {
  const errors: Record<string, string> = {};

  for (const issue of zodError.issues) {
    // Join nested paths with dots (e.g., ["address", "city"] -> "address.city")
    const fieldPath = issue.path.join(".");
    const key = fieldPath || "_error";
    errors[key] = issue.message;
  }

  return {
    message: "Validation failed",
    body: { errors },
  };
}
```

### Key Points
- **NO Form-Level Validation**: Forms use `mode: "onSubmit"`, Zod runs at API boundary
- **Fail-Fast on Invalid Filters**: Throw 400, don't silently ignore
- **Schema Per Operation**: Separate schemas for create vs update

---

## Pattern G: Transform Service Pattern

Data transformation logic centralized in callback transforms.

### When to Use
- File uploads (attachments, avatars, logos)
- JSONB array field handling
- Computed field extraction for junction sync
- Timestamp injection

### Code Example

```typescript
// callbacks/createResourceCallbacks.ts
export interface Transform {
  name: string;
  description: string;
  apply: TransformFn;
}

function composeTransforms(
  transforms: TransformInput[],
  strategy: CompositionStrategy = "sequential"
): TransformFn {
  if (transforms.length === 0) {
    return (record) => record;
  }

  return (record: RaRecord): RaRecord => {
    let result = record;
    for (const transform of transforms) {
      const fn = isTransform(transform) ? transform.apply : transform;
      result = fn(result);
    }
    return result;
  };
}
```

### Key Points
- **Resource-Specific Transforms**: Each resource can have custom transformation
- **Transform Pipeline**: Multiple transforms compose sequentially
- **Computed Field Handling**: Extract and rename fields for junction sync

---

## Pattern H: RPC Atomic Operations Pattern

Database functions for multi-table operations with transaction guarantees.

### When to Use
- Creating related records atomically (booth visitor: org + contact + opportunity)
- Cascading operations (archive opportunity with related records)
- Complex queries not expressible in PostgREST

### Code Example

```typescript
// extensions/customMethodsExtension.ts
createBoothVisitor: async (data: QuickAddInput): Promise<{ data: BoothVisitorResult }> => {
  const { data: result, error } = await supabaseClient.rpc(
    "create_booth_visitor_opportunity",
    { _data: data }
  );

  if (error) throw new Error(`Create booth visitor failed: ${error.message}`);
  return { data: result };
},
```

### Key Points
- **All-or-Nothing**: RPC functions run in transactions
- **Validation Before RPC**: Zod validates input before calling database function
- **Structured Returns**: RPC returns IDs of all created records

---

## Pattern I: Filter Registry Pattern

Explicit allowlist of filterable fields per resource.

### When to Use
- Preventing stale filter errors from old localStorage values
- Security (limiting which fields can be filtered)
- Documentation of available filters

### Code Example

```typescript
// filterRegistry.ts
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "id", "first_name", "last_name", "email", "phone", "title",
    "sales_id", "created_at", "deleted_at", "tags",
    "q", // Special: full-text search
  ],
  opportunities: [
    "id", "name", "stage", "status", "priority",
    "customer_organization_id", "principal_organization_id",
    "created_at", "deleted_at", "tags",
    "q", // Full-text search
    "stale", // Virtual filter: transformed to last_activity_date
  ],
};

export function isValidFilterField(resource: string, filterKey: string): boolean {
  const allowedFields = filterableFields[resource];
  if (!allowedFields) return false;

  // Handle logical operators
  if (["$or", "$and", "@or"].includes(filterKey)) return true;

  // Extract base field from operator suffix
  const baseField = filterKey.split("@")[0];
  return allowedFields.includes(baseField);
}
```

### Key Points
- **Base Field + Operator**: `"last_seen@gte"` matches `"last_seen"` in registry
- **Virtual Filters**: `"stale"` is transformed to actual filters
- **Logical Operators Whitelisted**: `$or`, `@or`, etc. always allowed

---

## Pattern J: PostgREST Query Transformation

Utilities for transforming React Admin filters to PostgREST syntax.

### When to Use
- Array values to IN/Contains operators
- Full-text search across multiple columns
- MongoDB-style `$or` to PostgREST `or` parameter
- Virtual filter expansion (e.g., `stale` filter)

### Code Example

```typescript
// dataProviderUtils.ts

// Array filter transformation
export function transformArrayFilters(filter: FilterRecord): FilterRecord {
  const jsonbArrayFields = ["tags", "email", "phone"];
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value) && value.length > 0) {
      if (jsonbArrayFields.includes(key)) {
        // JSONB contains: { "tags@cs": "{1,2,3}" }
        transformed[`${key}@cs`] = `{${value.join(",")}}`;
      } else {
        // Regular IN: { "status@in": "(active,pending)" }
        transformed[`${key}@in`] = `(${value.join(",")})`;
      }
    } else {
      transformed[key] = value;
    }
  }
  return transformed;
}
```

---

## Pattern Comparison Table

| Pattern | Use Case | Location | Example |
|---------|----------|----------|---------|
| **A: Handler Factory** | Resource-specific composition | `handlers/*.ts` | `createTasksHandler()` |
| **B: Callbacks Factory** | Standardized lifecycle hooks | `callbacks/*.ts` | `createResourceCallbacks()` |
| **C: Wrapper Middleware** | Cross-cutting concerns | `wrappers/*.ts` | `withErrorLogging()` |
| **D: Resource Router** | Central dispatch | `composedDataProvider.ts` | `getProviderForResource()` |
| **E: Service Delegation** | Business logic | `services/*.ts` | `SalesService.salesCreate()` |
| **F: Validation Boundary** | Zod at API layer | `ValidationService.ts` | `validate(resource, method, data)` |
| **G: Transform Service** | Data mutation | callbacks | `composeTransforms()` |
| **H: RPC Atomic** | Multi-table transactions | Database functions | `create_booth_visitor_opportunity` |
| **I: Filter Registry** | Allowed filter fields | `filterRegistry.ts` | `filterableFields[resource]` |
| **J: Query Transform** | PostgREST syntax | `dataProviderUtils.ts` | `transformArrayFilters()` |

---

## Anti-Patterns to Avoid

### 1. Direct Supabase Import in Components

```typescript
// WRONG
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('contacts').select();

// RIGHT
const dataProvider = useDataProvider();
const { data } = await dataProvider.getList('contacts', { ... });
```

### 2. Form-Level Zod Validation

```typescript
// WRONG - Validation in form
<SimpleForm validate={zodResolver(contactSchema)}>

// RIGHT - Validation at API boundary
// ValidationService.validate() called in withValidation wrapper
<SimpleForm mode="onSubmit">
```

### 3. Computed Fields in Save Data

```typescript
// WRONG - Sending view columns to base table
await dataProvider.update('contacts', {
  data: { id: 1, company_name: 'Acme' } // company_name is from view!
});

// RIGHT - Stripped by beforeSave callback
// productsCallbacks strips COMPUTED_FIELDS automatically
```

### 4. Business Logic in Handlers

```typescript
// WRONG - Handler doing too much
export function createContactsHandler(baseProvider) {
  return {
    ...baseProvider,
    create: async (resource, params) => {
      // 50 lines of business logic here
      await sendWelcomeEmail(params.data.email);
      await createDefaultTasks(params.data.id);
    }
  };
}

// RIGHT - Delegate to service
// Handler stays thin, service handles complexity
```

---

## Adding a New Resource

Follow this checklist when adding a new resource:

1. [ ] **Create Callbacks** (`callbacks/[resource]Callbacks.ts`)
   - Define `COMPUTED_FIELDS` from view columns
   - Use `createResourceCallbacks()` factory
   - Add custom transforms if needed

2. [ ] **Create Handler** (`handlers/[resource]Handler.ts`)
   - Compose with wrapper chain
   - Add to handler exports in `handlers/index.ts`

3. [ ] **Register Handler** (`composedDataProvider.ts`)
   - Add to `HANDLED_RESOURCES` array
   - Add to `handlers` object

4. [ ] **Add Validation** (`validation/[resource].ts` + `ValidationService.ts`)
   - Create Zod schemas for create/update
   - Register in `ValidationService.validationRegistry`

5. [ ] **Add Filter Registry** (`filterRegistry.ts`)
   - Add resource to `filterableFields`
   - Include all database columns that can be filtered

6. [ ] **Add to Soft Delete** (if applicable)
   - Set `supportsSoftDelete: true` in callbacks config

7. [ ] **Add Service** (if complex business logic)
   - Create service class in `services/`
   - Add to `ServiceContainer`
   - Expose via custom methods extension
