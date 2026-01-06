---
active: true
iteration: 1
max_iterations: 30
completion_promise: "PHASE_5_COMPLETE"
started_at: "2026-01-06T06:12:53Z"
---

Read 'TODO_PROVIDER.md'Focus on 'Phase 5: Final Switch'.

1. **Create Missing Test**: Create 'src/atomic-crm/providers/supabase/handlers/__tests__/opportunitiesHandler.test.ts'. Test that 'create' calls the service correctly and that view fields are stripped.
2. **Switch Feature Flag**: Update '.env' (and production envs) to set 'VITE_USE_COMPOSED_PROVIDER=true'.
3. **Verify Provider Tests**: Run 'npm test src/atomic-crm/providers/supabase'. **FIX** any failures in the provider/handler tests caused by the switch. (Ignore unrelated UI component tests for now).
4. **Delete The Monolith**: Once provider tests pass, DELETE 'src/atomic-crm/providers/supabase/unifiedDataProvider.ts'.
5. **Update Index**: Remove the import of 'unifiedDataProvider' from 'src/atomic-crm/providers/supabase/index.ts' and ensure 'dataProvider' export uses the composed version directly (remove the feature flag logic since the old one is gone).

Mark tasks as [x] in the todo file. Output <promise>PHASE_5_COMPLETE</promise> when finished.
