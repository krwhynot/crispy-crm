# Rate Limit Integration - Code Snippets

This file contains the exact code changes needed to integrate RateLimitService into the unified data provider.

## Step 1: Update Imports in unifiedDataProvider.ts

**Location**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Add this import after line 39** (after other service imports):

```typescript
// Import RateLimitService for production resilience
import { rateLimitService } from "./services";
```

## Step 2: Wrap create() Method

**Location**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - the `create()` method (starting at line 446)

**CURRENT CODE** (what's there now):

```typescript
async create(
  resource: string,
  params: CreateParams,
): Promise<any> {
  return wrapMethod("create", resource, params, async () => {
    const dbResource = getResourceName(resource);

    // Validate and process data
    const processedData = await processForDatabase(
      resource,
      params.data,
      "create",
    );

    // Check for preview/dry-run mode
    if (params.meta?.dryRun === true) {
      return {
        data: {
          ...processedData,
          id: 'dry-run-provisional-id',
        },
      };
    }

    // Special handling for segments - use RPC for get_or_create
    if (resource === "segments") {
      const { data, error} = await supabase
        .rpc('get_or_create_segment', { p_name: processedData.name });

      if (error) throw error;

      // RPC returns array, return first item
      return { data: data[0] };
    }

    // Special handling for opportunities
    if (resource === "opportunities") {
      // Handle products sync if present
      if (processedData.products_to_sync) {
        const products = processedData.products_to_sync;
        delete processedData.products_to_sync;

        console.log('[RPC sync_opportunity_with_products] Calling with:', {
          opportunity_data: processedData,
          products_to_create: products,
          products_to_update: [],
          product_ids_to_delete: [],
        });

        // Call RPC function to create opportunity with products atomically
        const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
          opportunity_data: processedData,
          products_to_create: products,
          products_to_update: [],
          product_ids_to_delete: [],
        });

        if (error) {
          console.error('[RPC sync_opportunity_with_products] Error:', error);
          console.error('[RPC sync_opportunity_with_products] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          // Use helper function for consistent error handling
          handleRpcError(error);
        }

        console.log('[RPC sync_opportunity_with_products] Success:', data);
        // Use helper function for consistent response formatting
        return formatRpcResponse(data);
      }
    }

    // Execute create
    const result = await baseDataProvider.create(dbResource, {
      ...params,
      data: processedData as any,
    });

    // No transformation needed yet (will be added in a future task)
    return result;
  });
}
```

**NEW CODE** (replace the above with this):

```typescript
async create(
  resource: string,
  params: CreateParams,
): Promise<any> {
  return wrapMethod("create", resource, params, async () => {
    const dbResource = getResourceName(resource);

    // Validate and process data
    const processedData = await processForDatabase(
      resource,
      params.data,
      "create",
    );

    // Check for preview/dry-run mode
    if (params.meta?.dryRun === true) {
      return {
        data: {
          ...processedData,
          id: 'dry-run-provisional-id',
        },
      };
    }

    // Special handling for segments - use RPC for get_or_create
    if (resource === "segments") {
      const { data, error} = await rateLimitService.executeWithRetry(
        () => supabase.rpc('get_or_create_segment', { p_name: processedData.name }),
        { resourceName: resource, operation: "get_or_create_segment" }
      );

      if (error) throw error;

      // RPC returns array, return first item
      return { data: data[0] };
    }

    // Special handling for opportunities
    if (resource === "opportunities") {
      // Handle products sync if present
      if (processedData.products_to_sync) {
        const products = processedData.products_to_sync;
        delete processedData.products_to_sync;

        console.log('[RPC sync_opportunity_with_products] Calling with:', {
          opportunity_data: processedData,
          products_to_create: products,
          products_to_update: [],
          product_ids_to_delete: [],
        });

        // Call RPC function to create opportunity with products atomically
        const { data, error } = await rateLimitService.executeWithRetry(
          () => supabase.rpc("sync_opportunity_with_products", {
            opportunity_data: processedData,
            products_to_create: products,
            products_to_update: [],
            product_ids_to_delete: [],
          }),
          { resourceName: resource, operation: "sync_opportunity_with_products" }
        );

        if (error) {
          console.error('[RPC sync_opportunity_with_products] Error:', error);
          console.error('[RPC sync_opportunity_with_products] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          // Use helper function for consistent error handling
          handleRpcError(error);
        }

        console.log('[RPC sync_opportunity_with_products] Success:', data);
        // Use helper function for consistent response formatting
        return formatRpcResponse(data);
      }
    }

    // Execute create with rate limit handling
    const result = await rateLimitService.executeWithRetry(
      () => baseDataProvider.create(dbResource, {
        ...params,
        data: processedData as any,
      }),
      { resourceName: resource, operation: "create" }
    );

    return result;
  });
}
```

**Changes Summary**:
1. Line ~476: Wrap `supabase.rpc('get_or_create_segment'...)` with `rateLimitService.executeWithRetry()`
2. Line ~510: Wrap `supabase.rpc("sync_opportunity_with_products"...)` with `rateLimitService.executeWithRetry()`
3. Line ~531: Wrap `baseDataProvider.create(dbResource...)` with `rateLimitService.executeWithRetry()`

## Step 3: Wrap update() Method

**Location**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - the `update()` method (starting at line 536)

**Find and replace the RPC call** (around line 573):

**BEFORE**:
```typescript
// Call RPC function to update opportunity with products atomically
const { data, error } = await supabase.rpc("sync_opportunity_with_products", {
  opportunity_data: { ...processedData, id: params.id },
  products_to_create: creates,
  products_to_update: updates,
  product_ids_to_delete: deletes,
});
```

**AFTER**:
```typescript
// Call RPC function to update opportunity with products atomically
const { data, error } = await rateLimitService.executeWithRetry(
  () => supabase.rpc("sync_opportunity_with_products", {
    opportunity_data: { ...processedData, id: params.id },
    products_to_create: creates,
    products_to_update: updates,
    product_ids_to_delete: deletes,
  }),
  { resourceName: resource, operation: "sync_opportunity_with_products" }
);
```

**Find and replace the baseDataProvider.update call** (around line 591):

**BEFORE**:
```typescript
// Execute update
const result = await baseDataProvider.update(dbResource, {
  ...params,
  data: {
    ...processedData,
    id: params.id, // Preserve ID
  } as any,
});
```

**AFTER**:
```typescript
// Execute update with rate limit handling
const result = await rateLimitService.executeWithRetry(
  () => baseDataProvider.update(dbResource, {
    ...params,
    data: {
      ...processedData,
      id: params.id, // Preserve ID
    } as any,
  }),
  { resourceName: resource, operation: "update" }
);
```

## Step 4: Wrap delete() and deleteMany() Methods

**Location**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**delete() method (around line 624)**:

**BEFORE**:
```typescript
async delete(
  resource: string,
  params: DeleteParams,
): Promise<any> {
  return wrapMethod("delete", resource, params, async () => {
    const dbResource = getResourceName(resource);
    return baseDataProvider.delete(dbResource, params);
  });
}
```

**AFTER**:
```typescript
async delete(
  resource: string,
  params: DeleteParams,
): Promise<any> {
  return wrapMethod("delete", resource, params, async () => {
    const dbResource = getResourceName(resource);
    return rateLimitService.executeWithRetry(
      () => baseDataProvider.delete(dbResource, params),
      { resourceName: resource, operation: "delete" }
    );
  });
}
```

**deleteMany() method (around line 634)**:

**BEFORE**:
```typescript
async deleteMany(resource: string, params: DeleteManyParams): Promise<any> {
  return wrapMethod("deleteMany", resource, params, async () => {
    const dbResource = getResourceName(resource);
    return baseDataProvider.deleteMany(dbResource, params);
  });
}
```

**AFTER**:
```typescript
async deleteMany(resource: string, params: DeleteManyParams): Promise<any> {
  return wrapMethod("deleteMany", resource, params, async () => {
    const dbResource = getResourceName(resource);
    return rateLimitService.executeWithRetry(
      () => baseDataProvider.deleteMany(dbResource, params),
      { resourceName: resource, operation: "deleteMany" }
    );
  });
}
```

## Step 5: Optional - Update useContactImport.tsx

If you want to add explicit rate limit handling to bulk imports:

**Location**: `src/atomic-crm/contacts/useContactImport.tsx` (line 250)

**Add import**:
```typescript
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";
```

**BEFORE** (lines 249-257):
```typescript
if (preview) {
  await dataProvider.create("contacts", {
    data: contactPayload,
    meta: { dryRun: true },
  });
} else {
  await dataProvider.create("contacts", {
    data: contactPayload,
  });
}
```

**AFTER**:
```typescript
if (preview) {
  await dataProvider.create("contacts", {
    data: contactPayload,
    meta: { dryRun: true },
  });
} else {
  await rateLimitService.executeWithRetry(
    () => dataProvider.create("contacts", {
      data: contactPayload,
    }),
    { resourceName: "contacts", operation: "create_during_import" }
  );
}
```

## Testing the Integration

### 1. Run existing tests to ensure nothing broke:
```bash
npm test -- unifiedDataProvider.test.ts
```

### 2. Run new RateLimitService tests:
```bash
npm test -- RateLimitService.test.ts
```

### 3. Manual testing - inject 429 error:
```typescript
// In browser console
import { supabase } from '@/atomic-crm/providers/supabase/supabase';

// Save original method
const originalInsert = supabase.from('contacts').insert.bind(supabase.from('contacts'));

// Mock to always throw 429
supabase.from('contacts').insert = async () => {
  const error = new Error('Too Many Requests');
  (error as any).status = 429;
  throw error;
};

// Try to create a contact - should auto-retry
// Watch the console for retry logs
```

### 4. Test bulk import:
1. Go to Contacts > Import
2. Upload CSV with 50+ contacts
3. (Optional) Inject 429 error via console
4. Observe: Import continues despite rate limit errors

## Integration Checklist

- [ ] RateLimitService.ts created and tested
- [ ] services/index.ts exports RateLimitService
- [ ] Import added to unifiedDataProvider.ts
- [ ] create() method wrapped
- [ ] update() method wrapped
- [ ] delete() method wrapped
- [ ] deleteMany() method wrapped
- [ ] Existing tests still pass
- [ ] RateLimitService tests pass
- [ ] Manual testing with 429 injection successful
- [ ] Bulk import tested with rate limit simulation
- [ ] Error messages reviewed (user-friendly)
- [ ] Monitoring setup verified
- [ ] Documentation reviewed

## Rollback Plan

If issues occur after integration:

1. **Quick rollback** (revert code):
   ```bash
   git revert <commit-sha>
   npm run dev
   ```

2. **Gradual rollback** (feature flag):
   ```typescript
   if (import.meta.env.VITE_ENABLE_RATE_LIMIT_HANDLING === 'true') {
     return rateLimitService.executeWithRetry(operation, context);
   } else {
     return operation();
   }
   ```

3. **Manual circuit reset** (if needed):
   ```typescript
   import { rateLimitService } from "@/atomic-crm/providers/supabase/services";
   rateLimitService.resetCircuit();
   ```

## Performance Impact

Expected latency additions (measured in milliseconds):
- No 429 errors: 0ms (transparent)
- One 429: +100-200ms
- Two 429s: +300-500ms
- Three 429s: +700-1400ms

Memory impact: Negligible (circuit state + failure counter)

Throughput: Improved (fewer retry storms, better load distribution)

## Support & Troubleshooting

See `docs/rate-limit-handling.md` for:
- Complete configuration options
- Monitoring setup
- Troubleshooting guide
- Performance characteristics
- Test coverage details
