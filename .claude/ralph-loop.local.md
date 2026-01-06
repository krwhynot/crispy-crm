---
active: true
iteration: 1
max_iterations: 30
completion_promise: "PHASE_2_COMPLETE"
started_at: "2026-01-06T05:24:28Z"
---

Read T/home/krwhynot/projects/crispy-crm/docs/TODOs/TODO_PROVIDER.md. Focus ONLY on 'Phase 2: Low-Risk Migration & Cleanup'.

1. **Repair Existing Handlers**: Open 'src/atomic-crm/providers/supabase/handlers/activitiesHandler.ts', 'tasksHandler.ts', and 'salesHandler.ts'. Change the wrapper composition to the CORRECT order: 'withErrorLogging(withLifecycleCallbacks(withValidation(baseHandler)))'. This ensures fields are stripped before validation.
2. **Migrate Tags**: Read 'unifiedDataProvider.ts' to find the Tags logic. Create 'src/atomic-crm/providers/supabase/handlers/tagsHandler.ts'. Register it in 'composedDataProvider.ts'. Delete the Tags logic from 'unifiedDataProvider.ts'.
3. **Migrate Notes**: Create 'src/atomic-crm/providers/supabase/handlers/notesHandler.ts' using a factory pattern. Register 'contact_notes', 'opportunity_notes', 'organization_notes' in 'composedDataProvider.ts'. Delete Notes logic from 'unifiedDataProvider.ts'.

Mark tasks as [x] in TODO_PROVIDER.md as you finish them. Output <promise>PHASE_2_COMPLETE</promise> when all Phase 2 tasks are done.
