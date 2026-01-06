---
active: true
iteration: 1
max_iterations: 30
completion_promise: "PHASE_7_COMPLETE"
started_at: "2026-01-06T07:05:45Z"
---

Read 'TODO_PROVIDER.md'Focus on 'Phase 7: Type Safety'.

1. **Type-Link Filter Registry**:
   - Open 'src/atomic-crm/providers/supabase/filterRegistry.ts'.
   - Import the 'Database' type from 'database.generated.ts'.
   - Refactor 'filterableFields' to use a generic type that enforces keys match Table names and values match Column names (e.g., 'Record<TableName, ColumnName[]>').
   - **Security Fix**: Modify the function to THROW an error if a resource is not in the registry, rather than returning 'undefined' or allowing all filters.

2. **Eliminate Widening Casts**:
   - Scan 'src/atomic-crm/providers/supabase/handlers/' and 'src/atomic-crm/services/' for the pattern 'as Record<string, unknown>'.
   - Replace these unsafe casts with Zod schema parsing ('.parse()') or proper type guards.

3. **Add Drift Prevention Tests**:
   - Create 'src/atomic-crm/providers/supabase/__tests__/schemaDrift.test.ts'.
   - **Test 1**: Verify 'filterableFields' matches the actual DB schema (fail if a column is renamed in DB but not in registry).
   - **Test 2**: Verify 'OPPORTUNITY_FIELDS_TO_STRIP' matches 'opportunities_summary' view columns (fail if view changes).

Mark tasks as [x] in the todo file. Output <promise>PHASE_7_COMPLETE</promise> when finished.
