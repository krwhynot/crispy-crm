---
active: true
iteration: 1
max_iterations: 50
completion_promise: "PHASE_4_COMPLETE"
started_at: "2026-01-06T05:50:09Z"
---

Read 'TODO_PROVIDER_MASTER.md' (or 'docs/TODOs/TODO_PROVIDER.md'). Focus ONLY on 'Phase 4: High-Risk Migration'.

1. **Create Missing Handlers**:
   - Create 'src/atomic-crm/providers/supabase/handlers/segmentsHandler.ts' (copy logic from unified).
   - Create 'src/atomic-crm/providers/supabase/handlers/productDistributorsHandler.ts' (inject 'ProductDistributorsService').
   - Register both in 'composedDataProvider.ts'.

2. **Migrate Products**:
   - Create 'src/atomic-crm/providers/supabase/handlers/productsHandler.ts'.
   - Inject 'ProductsService'.
   - Implement create/update interception (using the Service) and delete (using the Service).
   - Cleanup 'Products' logic from 'unifiedDataProvider.ts'.

3. **Migrate Opportunities (The Boss)**:
   - Create 'src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts'.
   - Inject 'OpportunitiesService'.
   - **CRITICAL**: Ensure 'create' calls 'opportunitiesService.createWithProducts' and 'update' calls 'opportunitiesService.updateWithProducts'.
   - Implement 'deleteMany' cascade logic.
   - **Type Safety**: Bind 'OPPORTUNITY_FIELDS_TO_STRIP' to 'keyof Opportunity' (fix the time bomb).
   - Cleanup 'Opportunities' logic from 'unifiedDataProvider.ts'.

4. **Refactor Sales**:
   - Update 'salesHandler.ts' to add the RLS bypass logic (delegating to the Edge Function/Service).
   - Cleanup 'Sales' logic from 'unifiedDataProvider.ts'.

Mark tasks as [x] in the todo file as you finish them. Output <promise>PHASE_4_COMPLETE</promise> when all Phase 4 tasks are done.
