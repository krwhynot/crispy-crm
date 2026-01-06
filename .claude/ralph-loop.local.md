---
active: true
iteration: 1
max_iterations: 40
completion_promise: "PHASE_3_COMPLETE"
started_at: "2026-01-06T05:37:01Z"
---

Read T/home/krwhynot/projects/crispy-crm/docs/TODOs/TODO_PROVIDER.md. Focus ONLY on 'Phase 3: Service Layer Extraction'.

1. **Create ProductsService.ts**: Read 'src/atomic-crm/providers/supabase/unifiedDataProvider.ts' to find the raw 'supabase.from(products)' logic (specifically: getOneWithDistributors, createWithDistributors, updateWithDistributors, softDelete, softDeleteMany). **COPY** this logic into a new class 'ProductsService' in 'src/atomic-crm/services/ProductsService.ts'. Ensure it follows the dependency injection pattern (accepting 'baseProvider' or 'supabase' client).
2. **Create ProductDistributorsService.ts**: COPY the composite key logic (getOne, update, delete for 'product_distributors') from 'unifiedDataProvider.ts' into 'src/atomic-crm/services/ProductDistributorsService.ts'.
3. **Test ProductsService**: Create 'src/atomic-crm/services/__tests__/ProductsService.test.ts'. Write unit tests for 'createWithDistributors' (verifying transaction logic) and 'softDelete' (verifying RPC calls).
4. **Important**: Do NOT remove code from 'unifiedDataProvider.ts' yet. We are building the parallel infrastructure.

Mark tasks as [x] in TODO_PROVIDER.md as you finish them. Output <promise>PHASE_3_COMPLETE</promise> when all Phase 3 tasks are done.
