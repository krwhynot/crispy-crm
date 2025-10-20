# CSV Import/Export Enhancement - Shared Architecture

The CSV import/export system follows a layered architecture with clear separation of concerns: UI components manage user interaction and state, a reusable parser handles CSV parsing and batching, business logic hooks contain domain-specific import rules, and React Admin's data provider interfaces with Supabase for persistence. The enhancement adds intelligent column mapping, preview validation, and error reporting while maintaining the browser-based, fail-fast philosophy.

## Relevant Files

### Core Import Components
- `/src/atomic-crm/contacts/ContactImportButton.tsx`: Entry point button component that triggers the import modal
- `/src/atomic-crm/contacts/ContactImportDialog.tsx`: Main import dialog UI with 5-state machine (idle→parsing→running→complete/error) and progress tracking
- `/src/atomic-crm/misc/usePapaParse.tsx`: Reusable CSV parsing hook with configurable batch processing (default: 10 records per batch)
- `/src/atomic-crm/contacts/useContactImport.tsx`: Contact-specific import business logic with organization/tag caching strategy
- `/src/atomic-crm/contacts/contacts_export.csv`: Sample CSV template showing expected format

### New Components (Phase 1)
- `/src/atomic-crm/contacts/columnAliases.ts`: Column mapping registry with 50+ common header variations and name splitting utility
- `/src/atomic-crm/contacts/ContactImportPreview.tsx`: Pre-import validation modal showing column mappings, sample data, and warnings
- `/src/atomic-crm/contacts/ContactImportResult.tsx`: Enhanced error reporting modal with detailed per-row error messages
- `/src/atomic-crm/contacts/ContactExportTemplateButton.tsx`: Template download button generating blank CSV with canonical headers

### Data Provider & Validation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider with validation-then-transform flow and error handling
- `/src/atomic-crm/providers/supabase/services/ValidationService.ts`: Registry-based validation service orchestrating Zod schema validation
- `/src/atomic-crm/providers/supabase/services/TransformService.ts`: Registry-based transformation service handling avatars, name composition, timestamps
- `/src/atomic-crm/providers/supabase/filterRegistry.ts`: Valid filterable fields registry preventing stale filter errors
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: Filter transformation utilities for JSONB arrays (@cs) and enums (@in)

### Validation Schemas
- `/src/atomic-crm/validation/contacts.ts`: Contact Zod schemas (base, create, update) with email/phone array validation
- `/src/atomic-crm/validation/organizations.ts`: Organization validation with URL patterns and priority checks
- `/src/atomic-crm/validation/tags.ts`: Tag validation with semantic color transformation (hex → semantic names)
- `/src/atomic-crm/validation/index.ts`: Central export point for all validation schemas

### UI Components (shadcn/ui)
- `/src/components/ui/dialog.tsx`: Controlled dialog component based on Radix UI with overlay and animations
- `/src/components/ui/alert.tsx`: Alert component with default and destructive variants
- `/src/components/ui/button.tsx`: Button with 6 variants (default, destructive, outline, secondary, ghost, link)
- `/src/components/ui/progress.tsx`: Progress indicator for long-running operations
- `/src/components/ui/spinner.tsx`: Loading spinner with size variants
- `/src/components/admin/file-input.tsx`: React Dropzone-based file input with preview and remove functionality
- `/src/components/admin/notification.tsx`: Notification system using Sonner for toast messages
- `/src/components/admin/form.tsx`: Form components with React Hook Form and Zod integration

### React Admin Integration
- `/src/atomic-crm/root/CRM.tsx`: Root component where resources are registered with lazy loading
- `/src/atomic-crm/contacts/ContactList.tsx`: Contact list with exporter function and TopToolbar actions
- `/src/atomic-crm/contacts/index.ts`: Resource module export pattern (list, show, edit, create, recordRepresentation)
- `/src/atomic-crm/layout/TopToolbar.tsx`: Right-aligned action button toolbar for list views
- `/src/components/admin/export-button.tsx`: Export button component accessing list context for filters/sort
- `/src/hooks/useBulkExport.tsx`: Bulk export hook for exporting only selected records

### Type Definitions
- `/src/atomic-crm/types.ts`: Core TypeScript interfaces (Contact, Organization, Tag, ContactOrganization)
- `/src/atomic-crm/tags/types.ts`: Tag interface definition

## Relevant Tables

### Core Tables
- `contacts`: Stores contact records with JSONB email/phone arrays, NO organization_id FK, tags bigint array
- `organizations`: Organization master data with organization_type enum, priority (A/B/C/D), segment_id FK
- `tags`: Tag master data with unique name constraint, color (semantic names), usage_count
- `contact_organizations`: Junction table for contact-org relationships (PRIMARY pattern - NOT deprecated, used for ALL contact-org relationships)

### Summary Views (Performance)
- `contacts_summary`: Optimized view for list operations with aggregated data
- Used by data provider for getList/getOne operations instead of base table

### Phase 2 Tables (Conditional)
- `import_jobs`: Background job tracking (user_id, file_url, mapping_config, status, progress counters)
- `saved_import_mappings`: User-saved column mapping templates (user_id, name, resource_type, mapping_config JSONB)

## Relevant Patterns

**State Machine Pattern**: The import dialog implements a 5-state FSM (idle→parsing→running→complete/error) preventing impossible UI states like "showing progress while idle". See `/src/atomic-crm/misc/usePapaParse.tsx:4-25` for type definitions.

**Batch Processing with ETA**: Sequential batching (default 10 records) prevents API overload while calculating estimated time remaining based on mean processing time per batch. See `/src/atomic-crm/misc/usePapaParse.tsx:76-111`.

**Caching Strategy**: In-memory Map-based caching for organizations and tags reduces API calls by ~90% during imports by fetching/creating once and reusing for subsequent records in same import. See `/src/atomic-crm/contacts/useContactImport.tsx:31-71`.

**Controlled Dialog Pattern**: All dialogs use controlled state (parent manages `open` prop) enabling programmatic close after async operations and state reset on close. See `/src/atomic-crm/contacts/ContactImportButton.tsx` for implementation.

**Validate-Then-Transform Flow**: Critical data provider pattern where validation happens FIRST on original field names, transformation happens SECOND (file uploads, field renames, timestamps). Reversing this breaks validation. See `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` and Issue 0.4 fix.

**ZEN GAP FIX - Preview Validation Pattern (DryRun Contract)**:
To respect "Zod at API boundary only" principle, preview validation MUST use data provider with dry-run flag: `dataProvider.create("contacts", { data, meta: { dryRun: true } })` rather than duplicating validation logic.

**Technical Contract for `meta: { dryRun: true }`**:
- When `dryRun: true` is passed, the data provider MUST execute the full validation and transformation pipeline (`processForDatabase` function)
- On success: Return `{ data: { ...processedData, id: 'dry-run-provisional-id' } }` with fully transformed data that would have been sent to database
- On failure: Throw standard React Admin formatted validation error exactly as it would for real operations
- Database operations MUST NOT be executed - no commits, no transactions
- This enables frontend to verify data validity and see transformation results without database side effects

**Registry-Based Services**: ValidationService and TransformService use resource→method→function lookup tables enabling extensible, maintainable service architecture. See `/src/atomic-crm/providers/supabase/services/ValidationService.ts:71-146`.

**Three-Tier Zod Schemas**: Each resource defines base (all fields), create (stricter, omits system fields), and update (partial) schemas. See `/src/atomic-crm/validation/contacts.ts:268-299` for pattern.

**JSONB Array Validation**: Email/phone stored as JSONB arrays require nested Zod validation with custom superRefine for each array element. See `/src/atomic-crm/validation/contacts.ts:153-166`.

**Filter Transformation**: JSONB arrays use `@cs` (contains) operator, regular fields use `@in` (array membership) when transforming React Admin filters to Supabase queries. See `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`.

**React Admin Exporter**: Exporter functions receive records, fetchRelatedRecords (curried), dataProvider, and resource name. They fetch relationships, flatten JSONB arrays to separate columns, and return CSV via downloadCSV. See `/src/atomic-crm/contacts/ContactList.tsx:73-141`.

**Lazy Loading Resources**: All resource modules use React.lazy() for code splitting with module pattern exporting {list, show, edit, create, recordRepresentation}. See `/src/atomic-crm/contacts/index.ts`.

**Avatar Generation Cascade**: TransformService automatically generates avatars from first/last names when avatar field is empty using dicebear API. May slow bulk imports. See `/src/atomic-crm/utils/avatar.utils.ts:157-176`.

**Semantic Colors Only**: UI components and validation schemas enforce semantic color variables (--primary, --brand-700) never hex codes. Tags accept hex in CSV but transform to semantic names. See `/src/atomic-crm/validation/tags.ts:18-102`.

## Relevant Docs

**`/docs/import-contacts.md`**: Read when implementing import UI flow, understanding state machine transitions, or debugging import errors.

**`CLAUDE.md`**: Read for Engineering Constitution principles (NO OVER-ENGINEERING, SINGLE SOURCE OF TRUTH, BOY SCOUT RULE), fail-fast philosophy, and Zod validation boundary rules.

**`docs/supabase/WORKFLOW.md`**: Read when working with database migrations, RLS policies, or understanding cloud vs local Supabase workflows.

**`.docs/plans/csv-import-export-enhancement/requirements.md`**: Read for complete feature specifications, user stories, Phase 1 vs Phase 2 scope, success metrics, and out-of-scope boundaries.

**`.docs/plans/csv-import-export-enhancement/csv-import-architecture.research.md`**: Read when modifying import components, understanding caching strategy, or extending to other resources (organizations, opportunities).

**`.docs/plans/csv-import-export-enhancement/react-admin-patterns.research.md`**: Read when integrating with React Admin data provider, implementing exporters, or working with list context and filters.

**`.docs/plans/csv-import-export-enhancement/ui-component-patterns.research.md`**: Read when building new dialogs, forms, alerts, or understanding shadcn/ui component APIs and styling conventions.

**`.docs/plans/csv-import-export-enhancement/validation-architecture.research.md`**: Read when adding validation schemas, understanding transformation order, or debugging Zod validation errors.

**`docs/claude/engineering-constitution.md`**: Read for complete architectural principles, examples of over-engineering to avoid, and rationale behind design decisions.

**`docs/claude/architecture-essentials.md`**: Read for module structure, entry flow (main.tsx→App.tsx→CRM.tsx), data layer architecture, and path alias conventions.

**`src/atomic-crm/validation/contacts.ts:1-50`**: Read for JSONB email/phone array format, LinkedIn URL validation pattern, and name field computation rules.

**`src/atomic-crm/providers/supabase/unifiedDataProvider.ts:1-100`**: Read for understanding data provider method signatures, error wrapping patterns, and integration points for new features.
