---
active: true
iteration: 1
max_iterations: 25
completion_promise: "PHASE_6_COMPLETE"
started_at: "2026-01-06T06:47:55Z"
---

Read 'TODO_PROVIDER.md'Focus on 'Phase 6: Architecture Debt'.

1. **Extract Shared Utilities**:
   - Locate 'transformQToIlikeSearch' (it is duplicated in multiple callback files like 'contactsCallbacks', 'salesCallbacks', etc.).
   - Move it to 'src/atomic-crm/providers/supabase/callbacks/commonTransforms.ts'.
   - Update all callback files to import it from there.
   - Do the same for the 'escapeForIlike' pattern if applicable.

2. **Refactor Opportunities Callbacks**:
   - Open 'src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts'.
   - Currently, it defines callbacks inline. Refactor this to use the 'createResourceCallbacks' factory pattern (like 'contactsCallbacks' or 'tasksCallbacks'), passing the specific logic (like 'beforeSave' stripping) as overrides.
   - Add a comment block explaining why Opportunities needs specific overrides (Products sync, etc.).

Mark tasks as [x] in the todo file. Output <promise>PHASE_6_COMPLETE</promise> when finished.
