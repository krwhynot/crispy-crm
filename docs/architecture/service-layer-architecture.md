# Service Layer Architecture

## Overview

The service layer implements **Engineering Constitution Principle #14: Service Layer orchestration for business operations**. It provides a clean separation between the provider layer (data access) and business logic, making code more testable, maintainable, and consistent.

## Architecture Diagram

```
React Components
      ↓
React Admin Framework (with hooks)
      ↓
Unified Data Provider (unifiedDataProvider.ts)
      ├─→ Validation (ValidationService)
      ├─→ Transformation (TransformService)
      ├─→ Storage (StorageService)
      └─→ Business Logic Services ← YOU ARE HERE
            ├─ SalesService
            ├─ OpportunitiesService
            ├─ ActivitiesService
            ├─ JunctionsService
            └─ SegmentsService
                    ↓
            Base Data Provider (Supabase)
```

## Service Layer Pattern

All services follow the same architectural pattern:

### 1. Constructor Dependency Injection
```typescript
export class OpportunitiesService {
  constructor(private dataProvider: DataProvider) {}
}
```
- Receives `DataProvider` for standard CRUD operations
- Enables easier testing through mock injection
- Single source of data access

### 2. Public Methods for Business Operations
```typescript
// Example: Opportunities service
async createWithProducts(data: Partial<OpportunityCreateInput>): Promise<Opportunity>
async updateWithProducts(id: Identifier, data: Partial<OpportunityUpdateInput>, previousProducts: Product[]): Promise<Opportunity>
async archiveOpportunity(opportunity: Opportunity): Promise<any>
async unarchiveOpportunity(opportunity: Opportunity): Promise<any>
```

Each public method:
- Handles one complete business operation
- Accepts type-safe input interfaces
- Returns the final domain model
- Throws descriptive errors

### 3. Private Helper Methods
```typescript
// Example: Opportunities service
private async rpcSyncOpportunity(...): Promise<Opportunity>
private unwrapRpcResponse(response: any): Opportunity
```

Helper methods:
- Eliminate code duplication
- Are independently testable through public method tests
- Handle technical concerns (RPC response unwrapping, error formatting)

### 4. Centralized Error Handling
```typescript
try {
  // Business logic
} catch (error: any) {
  console.error("[ServiceName] Operation failed", { context });
  throw new Error(`User-friendly message: ${error.message}`);
}
```

All services:
- Log with context for debugging
- Re-throw with enhanced error messages
- Maintain error context (IDs, operation type)

## Service Implementations

### OpportunitiesService

**Responsibility:** Manage opportunity lifecycle with product synchronization

**Key Methods:**
```typescript
// Create opportunity with product sync
async createWithProducts(data: Partial<OpportunityCreateInput>): Promise<Opportunity>

// Update opportunity with product diffing
async updateWithProducts(
  id: Identifier,
  data: Partial<OpportunityUpdateInput>,
  previousProducts: Product[] = []
): Promise<Opportunity>

// Archive opportunity and cascade to related records
async archiveOpportunity(opportunity: Opportunity): Promise<any>

// Unarchive opportunity and restore related records
async unarchiveOpportunity(opportunity: Opportunity): Promise<any>
```

**File Location:** `src/atomic-crm/services/opportunities.service.ts`

**Key Features:**
- Product diffing logic (creates, updates, deletes)
- RPC response unwrapping for consistent handling
- Atomic operations via `sync_opportunity_with_products` RPC
- Cascade archiving/unarchiving to related records

**Test Coverage:** 30 unit tests covering:
- Create with/without products
- Update with product diffs
- Archive/unarchive operations
- Error handling and edge cases

### SegmentsService

**Responsibility:** Manage segment get-or-create operations

**Key Methods:**
```typescript
// Get existing segment or create if not found
async getOrCreateSegment(name: string): Promise<Segment>
```

**File Location:** `src/atomic-crm/services/segments.service.ts`

**Key Features:**
- Atomic RPC get-or-create operation
- Array response unwrapping
- Consistent error handling

### SalesService

**Responsibility:** Manage sales user operations

**File Location:** `src/atomic-crm/services/sales.service.ts`

### ActivitiesService

**Responsibility:** Manage activity and interaction operations

**File Location:** `src/atomic-crm/services/activities.service.ts`

### JunctionsService

**Responsibility:** Manage junction table relationships

**File Location:** `src/atomic-crm/services/junctions.service.ts`

## Provider Layer Integration

The unified data provider delegates to services at strategic points:

### Create Method Pattern
```typescript
async create<RecordType extends RaRecord = RaRecord>(
  resource: string,
  params: CreateParams<RecordType>
): Promise<CreateResult<RecordType>> {
  return wrapMethod("create", resource, params, async () => {
    // ... validation and preprocessing ...

    // DELEGATE TO SERVICE
    if (resource === "opportunities") {
      const result = await opportunitiesService.createWithProducts(processedData as any);
      return { data: result as unknown as RecordType };
    }

    if (resource === "segments") {
      const result = await segmentsService.getOrCreateSegment(processedData.name);
      return { data: result as unknown as RecordType };
    }

    // Fall through to base provider for standard resources
    return baseDataProvider.create(dbResource, params);
  });
}
```

### Update Method Pattern
```typescript
async update<RecordType extends RaRecord = RaRecord>(
  resource: string,
  params: UpdateParams<RecordType>
): Promise<UpdateResult<RecordType>> {
  return wrapMethod("update", resource, params, async () => {
    // ... validation and preprocessing ...

    // DELEGATE TO SERVICE
    if (resource === "opportunities") {
      const previousProducts = params.previousData?.products || [];
      const result = await opportunitiesService.updateWithProducts(
        params.id,
        processedData as any,
        previousProducts
      );
      return { data: result as unknown as RecordType };
    }

    // Fall through to base provider for standard resources
    return baseDataProvider.update(dbResource, params);
  });
}
```

## Type Safety

Each service defines input interfaces matching validation schemas:

```typescript
// OpportunitiesService input types
export interface OpportunityCreateInput {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id: Identifier;
  estimated_close_date: string;
  // ... other fields ...
  products_to_sync?: Product[];
}

export interface OpportunityUpdateInput extends Partial<OpportunityCreateInput> {
  id: Identifier;
}
```

**Benefits:**
- Compile-time validation of service inputs
- Clear API contract for each service method
- IDE autocomplete and type checking
- Consistency with Zod validation schemas

## Testing Strategy

### Unit Testing Services

Services are independently testable with mocked Supabase:

```typescript
describe("OpportunitiesService", () => {
  let service: OpportunitiesService;

  beforeEach(() => {
    // Mock dataProvider and supabase
    service = new OpportunitiesService(mockDataProvider);
  });

  it("should create opportunity with products via RPC", async () => {
    // Mock RPC response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: mockOpportunity,
      error: null
    });

    const result = await service.createWithProducts(mockData);

    expect(supabase.rpc).toHaveBeenCalledWith(
      "sync_opportunity_with_products",
      expect.objectContaining({ products_to_create: [...] })
    );
    expect(result).toEqual(mockOpportunity);
  });
});
```

**Test Coverage Goals:**
- ✓ Happy path (success cases)
- ✓ Error paths (RPC failures, validation errors)
- ✓ Edge cases (empty arrays, null values, type coercion)
- ✓ Integration with helpers (RPC unwrapping, diffing)

## RPC Operations

Services coordinate atomic database operations via RPC functions:

### sync_opportunity_with_products

**Purpose:** Atomic synchronization of opportunity and related products

**Parameters:**
```typescript
{
  opportunity_data: Record<string, unknown>,      // Opportunity fields
  products_to_create: Product[],                  // New products
  products_to_update: Product[],                  // Modified products
  product_ids_to_delete: (string | number)[]      // Products to remove
}
```

**Returns:** Updated opportunity record

**Used By:** `OpportunitiesService.createWithProducts()` and `updateWithProducts()`

### get_or_create_segment

**Purpose:** Atomic get-or-create operation for segments

**Parameters:**
```typescript
{
  p_name: string  // Segment name
}
```

**Returns:** Array containing segment record (wrapped in array by RPC)

**Used By:** `SegmentsService.getOrCreateSegment()`

### archive_opportunity_with_relations

**Purpose:** Soft-delete opportunity and cascade to related records

**Parameters:**
```typescript
{
  opp_id: Identifier  // Opportunity ID
}
```

**Returns:** RPC response

**Used By:** `OpportunitiesService.archiveOpportunity()`

## Error Handling

### Service Layer Error Handling

All services follow consistent error handling:

```typescript
try {
  // Business operation
  const result = await someRpcCall();
  if (error) {
    console.error("[ServiceName] Operation failed:", error);
    throw new Error(`User-friendly message: ${error.message}`);
  }
  return result;
} catch (error: any) {
  console.error("[ServiceName] Failed to perform operation", {
    relevantId: id,
    error,
  });
  throw error;  // Re-throw for provider layer to handle
}
```

### Provider Layer Error Handling

The provider's `wrapMethod` catches and logs all service errors:

```typescript
const wrapMethod = async (operation, resource, params, fn) => {
  try {
    return await fn();
  } catch (error: any) {
    logError(operation, resource, params, error);
    throw error;  // Let React Admin handle user notification
  }
};
```

## Best Practices

### Do's ✅

1. **Keep services focused** - One responsibility per service
2. **Use private helpers** - Eliminate duplication with private methods
3. **Validate inputs** - Services receive pre-validated data from provider
4. **Handle errors** - Log with context, throw with messages
5. **Use type safety** - Input interfaces match validation schemas
6. **Test thoroughly** - Mock external dependencies (Supabase, DataProvider)
7. **Log strategically** - Include operation type and relevant IDs

### Don'ts ❌

1. **Don't bypass the provider** - Always go through service→provider→supabase
2. **Don't skip error handling** - Every operation needs try/catch
3. **Don't create duplicate RPC logic** - Extract to private helpers
4. **Don't use `any` without reason** - Type-safe where possible
5. **Don't hardcode values** - Use services for business logic
6. **Don't test helpers directly** - Test through public methods

## Adding a New Service

When adding a new resource with business logic:

### 1. Create the Service Class
```typescript
// src/atomic-crm/services/myresource.service.ts
export class MyResourceService {
  constructor(private dataProvider: DataProvider) {}

  async performBusinessOperation(data: MyInput): Promise<MyResource> {
    try {
      // Your business logic here
    } catch (error: any) {
      console.error("[MyResourceService] Failed", { error });
      throw error;
    }
  }
}
```

### 2. Export from Services Index
```typescript
// src/atomic-crm/services/index.ts
export { MyResourceService } from "./myresource.service";
```

### 3. Integrate with Provider
```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts

// Import
import { MyResourceService } from "../../services";

// Instantiate
const myResourceService = new MyResourceService(baseDataProvider);

// Delegate in create/update
if (resource === "myresource") {
  const result = await myResourceService.performBusinessOperation(processedData);
  return { data: result as unknown as RecordType };
}
```

### 4. Write Unit Tests
```typescript
// src/atomic-crm/services/__tests__/myresource.service.test.ts
describe("MyResourceService", () => {
  // Mock supabase
  // Test happy path
  // Test error paths
  // Test edge cases
});
```

## Refactoring Timeline

The service layer has evolved through systematic extraction:

| Commit | Date | Feature | Impact |
|--------|------|---------|--------|
| `bbb65cbc` | 2025-11-24 | OpportunitiesService: createWithProducts + updateWithProducts | -73 lines duplicate RPC logic |
| `c767be4e` | 2025-11-24 | OpportunitiesService: rpcSyncOpportunity helper | -32 lines RPC duplication |
| `3a30af9b` | 2025-11-24 | SegmentsService: getOrCreateSegment | -10 lines inline RPC logic |

## Testing Opportunities

Current test coverage:
- ✅ OpportunitiesService: 30 tests (100% coverage)
- ⏳ SegmentsService: 0 tests (planned)
- ⏳ SalesService: 0 tests (planned)
- ⏳ ActivitiesService: 0 tests (planned)
- ⏳ JunctionsService: 0 tests (planned)

Next steps: Add unit tests for remaining services following the OpportunitiesService pattern.

## References

- **Engineering Constitution:** `docs/claude/engineering-constitution.md`
- **Database Design:** `docs/architecture/data-model.md`
- **Supabase Workflow:** `docs/supabase/WORKFLOW.md`
- **Validation Schemas:** `src/atomic-crm/validation/`

## Key Takeaways

1. **Services encapsulate business logic** - Not just CRUD wrappers
2. **Consistent patterns** - Every service follows the same structure
3. **Testable by design** - Dependencies are injected and mockable
4. **Type-safe APIs** - Input interfaces prevent runtime errors
5. **Centralized error handling** - Consistent logging and error messages
6. **Provider delegation** - Provider routes to services based on resource type
