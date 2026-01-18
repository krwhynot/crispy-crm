# Service Layer Patterns

Standard patterns for business logic services in Crispy CRM.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Components                             │
│              (OpportunityCreate, ContactEdit, etc.)                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      composedDataProvider                            │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │                   Service Registry                       │     │
│     │  ┌──────────────┬──────────────┬──────────────────────┐ │     │
│     │  │ SalesService │ Opportunities│ ActivitiesService    │ │     │
│     │  │              │ Service      │                      │ │     │
│     │  ├──────────────┼──────────────┼──────────────────────┤ │     │
│     │  │ Junctions    │ Segments     │ DigestService        │ │     │
│     │  │ Service      │ Service      │                      │ │     │
│     │  └──────────────┴──────────────┴──────────────────────┘ │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                      │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │              Internal Services (Cross-Cutting)          │     │
│     │  ValidationService │ TransformService │ StorageService  │     │
│     └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase Client                              │
│            (RPC Functions, CRUD, Edge Functions, Storage)            │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** Components NEVER import services directly. All access flows through `composedDataProvider`.

---

## Pattern A: Service Class Structure

Service classes use constructor injection to receive the DataProvider.

```typescript
// src/atomic-crm/services/activities.service.ts
import type { DataProvider, Identifier } from "ra-core";
import { getActivityLog } from "../providers/commons/activity";

/**
 * Activities service handles activity log aggregation and management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class ActivitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Get activity log for an organization or sales person
   * Uses optimized RPC function to consolidate 5 queries into 1 server-side UNION ALL
   */
  async getActivityLog(
    organizationId?: Identifier,
    salesId?: Identifier
  ): Promise<Record<string, unknown>[]> {
    try {
      return await getActivityLog(this.dataProvider, organizationId, salesId);
    } catch (error: unknown) {
      console.error(`[ActivitiesService] Failed to get activity log`, {
        organizationId,
        salesId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get activity log failed: ${errorMessage}`);
    }
  }
}
```

**When to use:**
- Creating a new domain service (opportunities, contacts, etc.)
- Encapsulating business logic that spans multiple database operations
- Operations that require RPC calls or Edge Functions

**Key points:**
- Constructor receives `DataProvider` (not Supabase client directly)
- Private `dataProvider` field for internal use
- All public methods are `async` and return Promises
- Error handling wraps all operations

**Example:** `src/atomic-crm/services/opportunities.service.ts`

---

## Pattern B: RPC Wrapper Pattern

Safe RPC calls with response unwrapping and error handling.

```typescript
// src/atomic-crm/services/opportunities.service.ts
export class OpportunitiesService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  async archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    try {
      return await this.dataProvider.rpc<Opportunity[]>(
        "archive_opportunity_with_relations",
        { opp_id: opportunity.id }
      );
    } catch (error: unknown) {
      devError("OpportunitiesService", "Failed to archive opportunity", {
        opportunityId: opportunity.id,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Archive opportunity failed: ${errorMessage}`);
    }
  }

  // Handle Supabase's inconsistent response wrapping
  private unwrapRpcResponse(
    response: Opportunity | { data: Opportunity }
  ): Opportunity {
    if (
      response !== null &&
      typeof response === "object" &&
      "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "id" in response.data
    ) {
      return response.data;
    }
    return response as Opportunity;
  }

  private async rpcSyncOpportunity(
    opportunityData: Partial<OpportunityCreateInput>,
    productsToCreate: Product[],
    productsToUpdate: Product[],
    productIdsToDelete: (string | number)[],
    expectedVersion?: number
  ): Promise<Opportunity> {
    const rpcData = await this.dataProvider.rpc<Opportunity | { data: Opportunity }>(
      "sync_opportunity_with_products",
      {
        opportunity_data: opportunityData,
        products_to_create: productsToCreate,
        products_to_update: productsToUpdate,
        product_ids_to_delete: productIdsToDelete,
        expected_version: expectedVersion,
      }
    );

    return this.unwrapRpcResponse(rpcData);
  }
}
```

**When to use:**
- Calling PostgreSQL RPC functions via Supabase
- Operations that modify multiple tables atomically
- Complex queries that benefit from server-side execution

**Key points:**
- Use generic type parameter: `rpc<ReturnType>(functionName, params)`
- Always handle the double-wrapped response case (`{ data: T }` vs `T`)
- Log context before re-throwing errors
- RPC function names match exactly what's in the database

**Example:** `src/atomic-crm/services/opportunities.service.ts`

---

## Pattern C: Activity Log via RPC

Optimized activity log fetching using a PostgreSQL RPC function to consolidate multiple queries server-side.

```typescript
// src/atomic-crm/providers/commons/activity.ts
import type { DataProvider, Identifier } from "ra-core";
import type { Activity } from "../../types";

/**
 * Get activity log using optimized RPC function
 * Replaces 5 separate queries with single server-side UNION ALL
 * Engineering Constitution: BOY SCOUT RULE - improved from 5 queries to 1
 */
export async function getActivityLog(
  dataProvider: DataProvider,
  organizationId?: Identifier,
  salesId?: Identifier
): Promise<Activity[]> {
  // Call RPC function with parameters
  const data = await dataProvider.rpc("get_activity_log", {
    p_organization_id: organizationId || null,
    p_sales_id: salesId || null,
    p_limit: 250,
  });

  // RPC returns null if no results, handle gracefully
  return data || [];
}
```

**When to use:**
- Aggregating data from multiple resources server-side
- Building timeline/feed views with optimal performance
- Any multi-table query that benefits from database-level UNION ALL

**Key points:**
- **RPC over Promise.all**: Server-side UNION ALL is 5x faster than 5 round-trips
- **Null-safe return**: RPC returns null for empty results, always coerce to array
- **Parameter naming**: Use `p_` prefix for RPC parameters (PostgreSQL convention)
- **Limit enforcement**: Pass pagination limit to RPC, not client-side

**Performance comparison:**
| Approach | Round-trips | Latency |
|----------|-------------|---------|
| Promise.all (5 getList) | 5 | ~500ms |
| RPC UNION ALL | 1 | ~100ms |

**Example:** `src/atomic-crm/providers/commons/activity.ts`

---

## Pattern D: Error Handling Wrapper

Structured error logging with context for debugging.

```typescript
// src/atomic-crm/services/utils/handleServiceError.ts
import { DEV, devError } from "@/lib/devLogger";

/**
 * Handle service errors with consistent logging and re-throwing
 * @param serviceName - Name of the service (for logging)
 * @param operation - Description of the failed operation
 * @param context - Additional context for debugging
 * @param error - The caught error
 * @throws Error with formatted message
 */
export function handleServiceError(
  serviceName: string,
  operation: string,
  context: Record<string, unknown>,
  error: unknown
): never {
  const message = error instanceof Error ? error.message : String(error);

  if (DEV) {
    devError(serviceName, `Failed to ${operation}`, { ...context, error });
  }

  throw new Error(`${operation} failed: ${message}`);
}
```

**Usage in services:**

```typescript
// src/atomic-crm/services/junctions.service.ts
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithMessage).message === "string"
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

// In service method:
async addOpportunityParticipant(
  opportunityId: Identifier,
  organizationId: Identifier,
  isPrimary = false
): Promise<OpportunityParticipant> {
  try {
    // ... operation logic
  } catch (error: unknown) {
    devError("JunctionsService", "Failed to add opportunity participant", {
      opportunityId,
      organizationId,
      isPrimary,
      error,
    });
    throw new Error(`Failed to add participant: ${getErrorMessage(error)}`);
  }
}
```

**When to use:**
- Every `catch` block in service methods
- Any operation that can fail (database, RPC, Edge Functions)

**Key points:**
- Always include context (IDs, parameters) for debugging
- Use type guards for safe error message extraction
- Return type `never` ensures TypeScript knows function always throws
- Log in DEV mode only to avoid production noise

**Example:** `src/atomic-crm/services/utils/handleServiceError.ts`

---

## Pattern E: Service Registry

How services are initialized and exposed through the data provider.

```typescript
// src/atomic-crm/providers/supabase/composedDataProvider.ts

// 1. Import service classes
import {
  SalesService,
  OpportunitiesService,
  ActivitiesService,
  JunctionsService,
  SegmentsService,
} from "../../services";

// 2. Initialize with base data provider (CRUD-only, breaks circular deps)
const salesService = new SalesService(baseDataProvider);
const opportunitiesService = new OpportunitiesService(baseDataProvider);
const activitiesService = new ActivitiesService(baseDataProvider);
const junctionsService = new JunctionsService(baseDataProvider);
const segmentsService = new SegmentsService(baseDataProvider);

// 3. Expose through extended data provider methods
export const composedDataProvider: ExtendedDataProvider = {
  ...baseDataProvider,

  // Service delegation for opportunities
  async create<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: CreateParams<RecordType>
  ): Promise<CreateResult<RecordType>> {
    // ... validation and transform ...

    if (resource === "opportunities") {
      const result = await opportunitiesService.createWithProducts(
        processedData as Partial<OpportunityCreateInput>
      );
      return { data: result as unknown as RecordType };
    }

    // Default CRUD
    return baseDataProvider.create(resource, { data: processedData });
  },

  // Direct service method exposure
  async salesCreate(body: SalesFormData): Promise<Sale> {
    return salesService.salesCreate(body);
  },

  async getActivityLog(
    organizationId?: Identifier,
    salesId?: Identifier
  ): Promise<Record<string, unknown>[]> {
    return activitiesService.getActivityLog(organizationId, salesId);
  },

  // Junction service methods
  async getContactOrganizations(contactId: Identifier) {
    return junctionsService.getContactOrganizations(contactId);
  },

  async addContactToOrganization(
    contactId: Identifier,
    organizationId: Identifier,
    params: JunctionParams = {}
  ) {
    return junctionsService.addContactToOrganization(contactId, organizationId, params);
  },
};
```

**When to use:**
- Adding a new domain service to the application
- Exposing service methods to React Admin components

**Key points:**
- Services receive `baseDataProvider` (not the extended one) to avoid circular deps
- Override CRUD methods when business logic is needed (e.g., opportunities)
- Add custom methods for operations outside standard CRUD
- Keep the registry in one place for discoverability

**Example:** `src/atomic-crm/providers/supabase/composedDataProvider.ts`

---

## Pattern F: Type-Safe Service Methods

Zod validation at service boundaries for runtime type safety.

```typescript
// src/atomic-crm/services/digest.service.ts
import { z } from "zod";

// 1. Define strict schema
export const OverdueTaskSchema = z.strictObject({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string(), // ISO date string
  days_overdue: z.number().int().min(1),
  opportunity_id: z.number().nullable(),
  opportunity_name: z.string().nullable(),
  organization_id: z.number().nullable(),
  organization_name: z.string().nullable(),
});

// 2. Infer TypeScript type from schema
export type OverdueTask = z.infer<typeof OverdueTaskSchema>;

export class DigestService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  // 3. Validate RPC response at service boundary
  async getOverdueTasksForUser(salesId: number): Promise<OverdueTask[]> {
    try {
      const data = await this.dataProvider.rpc("get_overdue_tasks_for_user", {
        p_sales_id: salesId,
      });

      // Validate and parse response
      const parsed = z.array(OverdueTaskSchema).safeParse(data);
      if (!parsed.success) {
        const errorDetails = parsed.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Overdue tasks validation failed: ${errorDetails}`);
      }

      return parsed.data;
    } catch (error: unknown) {
      console.error("[DigestService] Failed to get overdue tasks", { salesId, error });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get overdue tasks: ${errorMessage}`);
    }
  }
}
```

**RPC Parameter Validation:**

```typescript
// src/atomic-crm/validation/rpc.ts
import { z } from "zod";

export const syncOpportunityWithProductsParamsSchema = z.strictObject({
  opportunity_data: z.record(z.unknown()),
  products_to_create: z.array(z.record(z.unknown())),
  products_to_update: z.array(z.record(z.unknown())),
  product_ids_to_delete: z.array(z.union([z.string(), z.number()])),
  expected_version: z.number().optional(),
});

export const RPC_SCHEMAS = {
  get_or_create_segment: getOrCreateSegmentParamsSchema,
  set_primary_organization: setPrimaryOrganizationParamsSchema,
  archive_opportunity_with_relations: archiveOpportunityWithRelationsParamsSchema,
  sync_opportunity_with_products: syncOpportunityWithProductsParamsSchema,
  check_authorization: checkAuthorizationParamsSchema,
  check_authorization_batch: checkAuthorizationBatchParamsSchema,
} as const;

export type RPCFunctionName = keyof typeof RPC_SCHEMAS;
```

**When to use:**
- Validating RPC function responses
- Validating Edge Function payloads
- Any data crossing system boundaries

**Key points:**
- Use `z.strictObject()` to reject unknown keys (mass assignment prevention)
- All strings need `.max()` limits (DoS prevention)
- Use `z.coerce` for form inputs that arrive as strings
- `safeParse()` for graceful error handling with detailed messages

**Example:** `src/atomic-crm/services/digest.service.ts`, `src/atomic-crm/validation/rpc.ts`

---

## Comparison: Service Method vs Direct RPC

| Aspect | Service Method | Direct RPC Call |
|--------|----------------|-----------------|
| **Import** | Through `unifiedDataProvider` | `supabase.rpc()` directly |
| **Error Handling** | Standardized with context | Manual per call site |
| **Response Unwrap** | Handled automatically | Must check for `{ data: T }` |
| **Validation** | Zod at service boundary | None or duplicated |
| **Testability** | Mock `dataProvider` | Mock Supabase client |
| **Discoverability** | Centralized in service | Scattered across components |
| **Logging** | Consistent with `devError` | Inconsistent or missing |

**Prefer Service Methods when:**
- Operation is used in multiple components
- Complex error handling or retries needed
- Response requires transformation or validation
- Business logic beyond simple CRUD

**Use Direct RPC when:**
- One-off operation in a single component
- Prototyping new functionality
- RPC response is simple and well-typed

---

## Anti-Patterns

### ❌ Business Logic in Components

```typescript
// BAD: Logic scattered in component
const OpportunityCreate = () => {
  const handleSubmit = async (data) => {
    // DON'T: Direct Supabase calls
    const { data: opp } = await supabase
      .from("opportunities")
      .insert(data)
      .select()
      .single();

    // DON'T: Manual product sync
    for (const product of data.products) {
      await supabase.from("products").insert({
        opportunity_id: opp.id,
        ...product,
      });
    }
  };
};

// GOOD: Delegate to service via data provider
const OpportunityCreate = () => {
  const dataProvider = useDataProvider();

  const handleSubmit = async (data) => {
    await dataProvider.create("opportunities", { data });
    // Service handles product sync internally
  };
};
```

### ❌ Missing Error Context

```typescript
// BAD: No context for debugging
try {
  await dataProvider.rpc("archive_opportunity", { id });
} catch (e) {
  throw new Error("Failed"); // What failed? Which ID?
}

// GOOD: Rich context for debugging
try {
  await dataProvider.rpc("archive_opportunity", { id });
} catch (error: unknown) {
  devError("OpportunityActions", "Failed to archive", { opportunityId: id, error });
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Archive opportunity ${id} failed: ${message}`);
}
```

### ❌ Importing Supabase Directly

```typescript
// BAD: Direct import bypasses validation and logging
import { supabase } from "@/lib/supabase";

const getContacts = async () => {
  return supabase.from("contacts").select("*");
};

// GOOD: Use data provider
import { useDataProvider } from "react-admin";

const ContactList = () => {
  const dataProvider = useDataProvider();
  const { data } = useQuery(["contacts"], () =>
    dataProvider.getList("contacts", { ... })
  );
};
```

### ❌ N+1 Queries in Services

```typescript
// BAD: N+1 fetches for related data
async getOpportunityParticipants(opportunityId: Identifier) {
  const participants = await this.dataProvider.getList("participants", {
    filter: { opportunity_id: opportunityId },
  });

  // DON'T: Loop with individual fetches
  for (const p of participants.data) {
    p.organization = await this.dataProvider.getOne("organizations", { id: p.org_id });
  }
}

// GOOD: Batch fetch with getMany
async getOpportunityParticipants(opportunityId: Identifier) {
  const participants = await this.dataProvider.getList("participants", {
    filter: { opportunity_id: opportunityId },
  });

  const orgIds = participants.data.map((p) => p.org_id).filter(Boolean);
  const { data: orgs } = await this.dataProvider.getMany("organizations", { ids: orgIds });
  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  return participants.data.map((p) => ({
    ...p,
    organization: orgMap.get(p.org_id),
  }));
}
```

---

## Migration Checklist: Adding a New Service

1. [ ] Create service file: `src/atomic-crm/services/{domain}.service.ts`
2. [ ] Define class with `constructor(private dataProvider: DataProvider) {}`
3. [ ] Implement methods with try/catch and `devError` logging
4. [ ] Add Zod schemas for any RPC responses in `src/atomic-crm/validation/`
5. [ ] Export from `src/atomic-crm/services/index.ts`
6. [ ] Initialize in `composedDataProvider.ts` with `baseDataProvider`
7. [ ] Add delegation methods to `composedDataProvider` (custom or override CRUD)
8. [ ] Update `ExtendedDataProvider` type if adding new methods
9. [ ] Add unit tests in `src/atomic-crm/services/__tests__/`
10. [ ] Document complex methods with JSDoc comments

---

## Factory Functions (Optional Pattern)

For services that need special initialization or singleton behavior:

```typescript
// src/atomic-crm/services/digest.service.ts
export const createDigestService = (dataProvider: ExtendedDataProvider) =>
  new DigestService(dataProvider);
```

**When to use:**
- Lazy initialization for expensive services
- Services with complex setup requirements
- Testing scenarios that need fresh instances

---

## Input/Output Type Separation

Separate types for create vs update operations:

```typescript
// src/atomic-crm/services/opportunities.service.ts
export interface OpportunityCreateInput {
  name: string;
  customer_organization_id: Identifier;
  principal_id: Identifier;
  stage: OpportunityStage;
  products_to_sync?: Product[];
}

export interface OpportunityUpdateInput extends Partial<OpportunityCreateInput> {
  id: Identifier;
  version?: number; // Optimistic locking
}
```

**Key points:**
- Create inputs have all required fields
- Update inputs are partial + required `id`
- Include `version` for optimistic concurrency control
- Keep `products_to_sync` separate from persisted fields
