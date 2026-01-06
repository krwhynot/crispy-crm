---
active: true
iteration: 1
max_iterations: 30
completion_promise: "HEALTH_95_ACHIEVED"
started_at: "2026-01-06T14:01:17Z"
---

Read 'TODO_PROVIDER.md'Focus on 'Phase 8: Health & Hardening'.

1. **Fix Resources**: Open 'src/atomic-crm/providers/supabase/resources.ts'. Rename the note keys to snake_case ('contact_notes', etc.) and add entries for 'segments' and 'product_distributors' to RESOURCE_MAPPING.
2. **Protect Junctions**: Create 'src/atomic-crm/providers/supabase/handlers/junctionHandlers.ts'. Export handlers for 'opportunity_participants', 'opportunity_contacts', 'interaction_participants', 'distributor_principal_authorizations', 'organization_distributors', 'user_favorites'. Use 'createContactsHandler' as a template but use 'createResourceCallbacks({ supportsSoftDelete: true })'. Register them in 'composedDataProvider.ts'.
3. **Silence Logs**: Remove console.logs from 'withValidation.ts' and 'customMethodsExtension.ts'.
4. **DRY Search**: In 'opportunitiesCallbacks.ts', remove the 'transformQToIlikeSearch' call inside 'beforeGetList'.
5. **Docs**: Update 'src/atomic-crm/providers/supabase/README.md' with the final architecture details.

Mark tasks as [x] in the master plan. Output <promise>HEALTH_95_ACHIEVED</promise> when done.
