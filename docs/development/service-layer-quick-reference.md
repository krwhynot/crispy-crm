# Service Layer Quick Reference

## 5-Minute Overview

The service layer sits between the provider and domain models. It handles:
- **Business logic** that spans multiple tables or requires coordination
- **RPC operations** that need atomic guarantees (synchronous operations)
- **Data transformation** specific to business rules
- **Error handling** with context and user-friendly messages

## When to Use a Service

Use a service when:
- ✅ Operation touches multiple tables (e.g., create opportunity + add products)
- ✅ Need atomic RPC function for consistency
- ✅ Operation has business rules (e.g., diffing before update)
- ✅ Want independent unit testing

Don't create a service for:
- ❌ Simple CRUD (let provider handle it)
- ❌ Single-table operations with no special logic
- ❌ Just wrapping validation

## OpportunitiesService Examples

### Create with Products
```typescript
// Provider receives form data with products_to_sync field
// Calls service instead of direct RPC
const result = await opportunitiesService.createWithProducts({
  name: "Enterprise Deal",
  customer_organization_id: 123,
  principal_organization_id: 456,
  products_to_sync: [
    { product_id_reference: 1, notes: "Primary product" },
    { product_id_reference: 2, notes: "Alternative" }
  ]
});
// Returns: Opportunity with ID, created_at, etc.
```

### Update with Product Diffs
```typescript
// Service automatically diffs products
// Only sends creates/updates/deletes to RPC
const result = await opportunitiesService.updateWithProducts(
  123,  // opportunity ID
  {
    name: "Updated Deal Name",
    priority: "critical",
    products_to_sync: [
      { id: 1, product_id_reference: 1, notes: "Updated notes" },  // update
      { product_id_reference: 3, notes: "New product" }            // create
      // product_id_reference: 2 not in list → delete
    ]
  },
  [
    { id: 1, product_id_reference: 1, notes: "Original notes" },
    { id: 2, product_id_reference: 2, notes: "Old product" }
  ]  // previousProducts from database
);
```

### Archive/Unarchive
```typescript
// Cascades soft-delete to all related records
await opportunitiesService.archiveOpportunity(opportunity);

// Restore all related records
await opportunitiesService.unarchiveOpportunity(opportunity);
```

## Service Structure

### Minimal Service Template
```typescript
import type { DataProvider, Identifier } from "ra-core";
import { supabase } from "../providers/supabase/supabase";

export class MyService {
  constructor(private dataProvider: DataProvider) {}

  // Public method for business operation
  async myOperation(id: Identifier, data: MyData): Promise<MyModel> {
    try {
      // Your logic here
      console.log("[MyService] Performing operation", { id });

      const result = await this.dataProvider.update("table", { id, data });
      console.log("[MyService] Operation succeeded", result);
      return result.data as MyModel;
    } catch (error: any) {
      console.error("[MyService] Failed to perform operation", { id, error });
      throw error;
    }
  }

  // Private helper for RPC calls
  private async myRpcCall(params: unknown): Promise<MyModel> {
    const { data, error } = await supabase.rpc("my_rpc_function", params);
    if (error) throw new Error(`RPC failed: ${error.message}`);
    return data as MyModel;
  }
}
```

## Testing Services

### Mocking Supabase
```typescript
import { vi } from "vitest";

// At module level - important!
vi.mock("../providers/supabase/supabase", () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe("MyService", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.mocked(supabase.rpc).mockClear();
  });

  it("should handle RPC success", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: mockData,
      error: null
    });

    const result = await service.myOperation(123, {});

    expect(supabase.rpc).toHaveBeenCalledWith("my_function", {
      expected: "params"
    });
    expect(result).toEqual(mockData);
  });

  it("should handle RPC error", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: "RPC failed" }
    });

    await expect(service.myOperation(123, {})).rejects.toThrow(
      "RPC failed"
    );
  });
});
```

## Provider Integration Pattern

### In unifiedDataProvider.ts
```typescript
// 1. Import service
import { MyService } from "../../services";

// 2. Instantiate with dependency injection
const myService = new MyService(baseDataProvider);

// 3. In create/update method:
async create<RecordType extends RaRecord = RaRecord>(
  resource: string,
  params: CreateParams<RecordType>
): Promise<CreateResult<RecordType>> {
  return wrapMethod("create", resource, params, async () => {
    // ... validation ...

    // DELEGATE TO SERVICE
    if (resource === "my_resource") {
      const result = await myService.myOperation(processedData as any);
      return { data: result as unknown as RecordType };
    }

    // Fall through for standard resources
    return baseDataProvider.create(dbResource, params);
  });
}
```

## Error Handling Pattern

### In Service
```typescript
async myOperation(data: MyData): Promise<MyModel> {
  try {
    // Business logic
    const result = await supabase.rpc("my_func", params);
    if (error) {
      // RPC-level error
      console.error("[MyService] RPC call failed:", error);
      throw new Error(`Operation failed: ${error.message}`);
    }
    return result;
  } catch (error: any) {
    // Catch wrapper - logs context
    console.error("[MyService] Failed to perform operation", {
      dataId: data.id,
      error,
    });
    throw error;  // Let provider layer handle
  }
}
```

### In Provider (automatically handled)
```typescript
return wrapMethod("create", resource, params, async () => {
  // Service errors bubble up
  // wrapMethod catches and logs them
  // Error is thrown back to React Admin for user notification
});
```

## Validation

Services receive **pre-validated data** from the provider:

```typescript
// Provider layer:
const processedData = await processForDatabase(
  resource,
  dataToProcess,
  "create"  // Validates against schemas
);

// Then passes to service:
const result = await myService.myOperation(processedData);
```

**Don't re-validate in services** - validation happened in provider layer.

## Common Pitfalls

### ❌ Don't: Direct Supabase in Provider
```typescript
// WRONG - in unifiedDataProvider.ts
const { data, error } = await supabase.rpc("my_func", params);
```

### ✅ Do: Delegate to Service
```typescript
// RIGHT - in unifiedDataProvider.ts
if (resource === "myresource") {
  const result = await myService.myOperation(params);
  return { data: result };
}
```

---

### ❌ Don't: Return raw RPC response
```typescript
// WRONG
return { data: data[0] };  // Unwrapped in provider
```

### ✅ Do: Unwrap in Service
```typescript
// RIGHT
private unwrapRpc(data: any[]) {
  return data[0] as MyModel;  // Service responsibility
}
```

---

### ❌ Don't: Throw without context
```typescript
// WRONG
throw new Error("Failed");
```

### ✅ Do: Include context
```typescript
// RIGHT
throw new Error(`Operation failed for ID ${id}: ${error.message}`);
```

---

### ❌ Don't: Forget try/catch wrapper
```typescript
// WRONG
async myOp() {
  return await supabase.rpc(...);
}
```

### ✅ Do: Wrap in try/catch
```typescript
// RIGHT
async myOp() {
  try {
    return await supabase.rpc(...);
  } catch (error: any) {
    console.error("[MyService] Failed", { error });
    throw error;
  }
}
```

## Checklist: Adding Business Logic

- [ ] Create service file: `src/atomic-crm/services/myresource.service.ts`
- [ ] Define input interfaces (match validation schemas)
- [ ] Implement public method(s) with try/catch
- [ ] Extract private helpers to eliminate duplication
- [ ] Export from `src/atomic-crm/services/index.ts`
- [ ] Add service instance to `unifiedDataProvider.ts`
- [ ] Delegate in provider's `create()` or `update()` methods
- [ ] Write unit tests with mocked Supabase
- [ ] Run tests: `npm test -- myresource.service.test.ts`
- [ ] Build: `npm run build`
- [ ] Git commit with description of business logic moved to service

## See Also

- **Full Architecture:** `docs/architecture/service-layer-architecture.md`
- **OpportunitiesService Reference:** `src/atomic-crm/services/opportunities.service.ts`
- **Example Tests:** `src/atomic-crm/services/__tests__/opportunities.service.test.ts`
- **Engineering Constitution:** `docs/claude/engineering-constitution.md`

## Quick Links to Services

| Service | File | Methods | Tests |
|---------|------|---------|-------|
| Opportunities | `opportunities.service.ts` | 6 public | 30 tests |
| Segments | `segments.service.ts` | 1 public | — |
| Sales | `sales.service.ts` | — | — |
| Activities | `activities.service.ts` | — | — |
| Junctions | `junctions.service.ts` | — | — |
