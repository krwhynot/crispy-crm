# Opportunity Page Redesign - Shared Architecture Reference

The Opportunity redesign transforms a basic Kanban board into an interaction-rich pipeline with CSV migration, real-time collaboration, and mobile responsiveness. The architecture leverages React Admin's List/Show patterns with custom Kanban layout, Supabase's unified activities table (engagement vs interaction distinction), and PostgREST filter translation with localStorage persistence. Key challenge: merge 1,062 legacy opportunities with numbered stages into 8 semantic stages while displaying interaction counts that currently exist in database but are invisible in UI.

## Relevant Files

### Opportunity Core Components
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityList.tsx`: List wrapper with FilterChipsPanel, localStorage sync for stage preferences, and archived list integration
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board renderer - groups opportunities by stage, filters columns based on active filters, no drag-and-drop currently implemented
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Stage column with count, elevation-based shadows, manual index ordering
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCard.tsx`: Card showing name, customer, principal, priority badge (missing: interaction count, days in stage, attention flags)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityShow.tsx`: Detail page with tabs (Details, Notes & Activity - though Activity not yet displayed)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared form inputs with multi-organization support and contact filtering by customer org

### Stage Management & Configuration
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts`: Single source of truth for 8 pipeline stages (OpportunityStage interface with color, label, elevation)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stages.ts`: Utility to group opportunities by stage and sort by index within columns
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/opportunityStagePreferences.ts`: localStorage persistence for stage filter with priority: URL > localStorage > defaults

### Activities & Interactions System
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/ActivityNoteForm.tsx`: Quick-add interaction form (exists but not rendered in OpportunityShow)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/activities.ts`: Zod schemas with business rule validation (interaction requires opportunity_id, engagement forbids it)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018152315_cloud_schema_fresh.sql` (lines 1103-1133): activities table with activity_type enum, rich metadata (sentiment, follow-up, attachments)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018152315_cloud_schema_fresh.sql` (lines 946-991): validate_activity_consistency trigger enforcing contact-org relationships and auto-populating founding_interaction_id

### Data Provider & Filtering
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Single data provider layer with validation, PostgREST query building, and error logging
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: PostgREST filter transformation (array → @in operator, JSONB → @cs operator, full-text search → @or)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`: Whitelist of valid filterable fields per resource to prevent 400 errors from stale localStorage
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/useOpportunityFilters.tsx`: Centralized filter configuration (search, customer_org, priority, stage, only_mine)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/FilterChipsPanel.tsx`: Active filter display with removable chips and entity name fetching

### Type Definitions & Validation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts` (lines 194-220): Opportunity type with multi-org support, contact_ids array, stage/status fields
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts` (lines 125-157): ActivityRecord type (⚠️ missing 5 interaction types: trade_show, site_visit, contract_review, check_in, social)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/opportunities.ts`: Zod schemas with separate create/update schemas (create requires contact_ids.min(1), update allows partial)

### Services & Business Logic
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/opportunities.service.ts`: OpportunitiesService with unarchive + full index reordering (performance bottleneck)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/useAutoGenerateName.ts`: Auto-generate names from customer + principal + date, manual refresh in edit mode

### Notes System (for comparison)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteCreate.tsx`: Simple text + attachments form (simpler than activities)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NotesIterator.tsx`: Timeline display pattern to reference for ActivityTimeline component

## Relevant Tables

**`opportunities`**: Core opportunity records with stage (enum), status, priority (inherited from customer org), index (for Kanban ordering), contact_ids (bigint array), soft delete support

**`activities`**: Unified table for engagements (standalone) and interactions (opportunity-linked) with activity_type discriminator, 11 interaction types (call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social), sentiment tracking, follow-up management, and rich metadata (attachments, location, attendees)

**`opportunity_participants`**: Many-to-many junction for multi-stakeholder opportunities (customer, principal, distributor, partner, competitor roles) with is_primary flag and commission tracking

**`interaction_participants`**: Many-to-many junction for multi-person activities (meetings with multiple contacts)

**`organizations`**: Referenced by opportunities via customer_organization_id, principal_organization_id, distributor_organization_id

**`contacts`**: Referenced by opportunities via contact_ids array and activities via contact_id

**`contacts_summary`**: View for list operations with pre-computed joins (avoids N+1 queries)

**`opportunities_summary`** (proposed): View to add calculated nb_interactions and last_interaction_date fields for card display

## Relevant Patterns

**Form State from Zod Schema (Constitution #5)**: Extract form defaults via `opportunitySchema.partial().parse({})` which evaluates `.default()` values, merge with identity-specific values, eliminates duplicate logic between validation and forms. Example: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCreate.tsx:89-94`

**Centralized Stage Constants**: Single source of truth in `stageConstants.ts` with OpportunityStage interface (value, label, color as CSS variable, description, elevation 1-3), helper functions (getOpportunityStageLabel, getOpportunityStageColor, isActiveStage), replaces hardcoded arrays across components

**Index Management for Kanban Ordering**: Each opportunity has integer `index` field for sort order within stage, new opportunities get index=0 and shift all existing opportunities +1 (performance concern: creates N updates), unarchive resets ALL indexes in stage, alternative approaches: fractional indexing, lexorank, or timestamp-based ordering

**Filter Registry Pattern**: Centralized whitelist in `filterRegistry.ts` prevents 400 errors from stale localStorage filters, validation at data provider level strips invalid fields before query execution, `useFilterCleanup` hook runs on mount to remove invalid filters

**PostgREST Query Translation**: React Admin filters → PostgREST operators via `transformArrayFilters()` - arrays become `field@in=(val1,val2)` for regular columns or `field@cs={val1,val2}` for JSONB arrays, escape special characters properly (backslashes first, then quotes), full-text search via `q` parameter becomes `@or` with `field@ilike` across multiple columns

**localStorage Filter Persistence**: Save user preferences across sessions with priority: URL params > localStorage > component defaults, example in `opportunityStagePreferences.ts` with save/load/getInitial functions, useEffect monitors filterValues changes to persist

**React Query Cache Management**: React Admin wraps React Query with queryKey pattern `[resource, method, params]`, optimistic updates via `queryClient.setQueryData`, invalidation via `queryClient.invalidateQueries`, no realtime subscriptions yet (manual invalidation only)

**ReferenceField N+1 Prevention**: Use summary views for list operations (contacts_summary instead of contacts), `fetchRelatedRecords` for batch loading, avoid multiple ReferenceFields in loops without view support

**Engagement vs Interaction Distinction**: Database constraint enforces `activity_type = 'interaction'` requires `opportunity_id`, `activity_type = 'engagement'` forbids it, validate_activity_consistency trigger auto-populates founding_interaction_id on first interaction, validates contact belongs to customer organization

**Semantic Color System (Constitution #6)**: All colors use CSS variables (`var(--primary)`, `var(--brand-700)`, `var(--destructive)`), never hex codes, validated via `npm run validate:colors`, stage colors defined in stageConstants as semantic tokens

**React Admin List Pattern**: List component wraps ListBase, provides ListContext via useListContext hook with data/filterValues/setFilters/isPending, custom layouts use useListContext to access data and render custom UI (Kanban vs table), permanent filters in `filter` prop (not removable), toggleable filters in `filters` array prop

## Relevant Docs

**`/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md`**: You _must_ read this when implementing any code - defines NO OVER-ENGINEERING (fail fast, no circuit breakers), SINGLE SOURCE OF TRUTH (Supabase + Zod at API boundary), BOY SCOUT RULE (fix inconsistencies when editing), FORM STATE FROM SCHEMA (zodSchema.partial().parse({})), SEMANTIC COLORS ONLY (CSS variables, never hex)

**`/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md`**: You _must_ read this when working on database migrations, creating views, or modifying schema - covers local development workflow, migration creation with proper timestamps, cloud deployment, production safety warnings

**`/home/krwhynot/projects/crispy-crm/docs/claude/architecture-essentials.md`**: You _must_ read this when adding new resources, understanding data layer, or working with ConfigurationContext - covers module pattern (lazy-loaded exports), entry flow (main.tsx → App.tsx → CRM.tsx), path aliases (@/* maps to src/*)

**`.docs/plans/opportunity-redesign/opportunities-architecture.docs.md`**: You _must_ read this when modifying OpportunityList, OpportunityCard, stage management, or index ordering - comprehensive analysis of current implementation with gotchas (no drag-and-drop wired up, contact array filter clearing bug fix, stage filter hides columns, index management performance impact)

**`.docs/plans/opportunity-redesign/interactions-activities.docs.md`**: You _must_ read this when implementing interaction display, interaction counts, activity timeline, or sentiment tracking - identifies critical gap (activities created but never displayed), type definition mismatch (5 missing interaction types), founding_interaction_id not highlighted, provides ActivityTimeline component recommendations

**`.docs/plans/opportunity-redesign/filtering-react-admin.docs.md`**: You _must_ read this when adding new filters, implementing filter persistence, or working with React Query cache - covers filter registry pattern, PostgREST operator mapping, localStorage persistence with priority ordering, gotchas (escaping special characters, JSONB vs regular array operators, soft delete on views vs tables)

---

**Note**: CSV migration strategy (many-to-one stage mapping with fail-fast on ambiguity) requires additional planning document. Priority inheritance from customer organization requires database trigger implementation. Real-time collaboration via Supabase Realtime channels not yet implemented but documented in requirements.
