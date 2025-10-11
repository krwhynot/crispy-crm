# Schema Drift Remediation - Shared Architecture Reference

The Atomic CRM has 11 identified schema drift issues spanning database schema, Zod validation, TypeScript types, and UI components. This document maps the three-layer validation architecture (Zod schemas → ValidationService → unifiedDataProvider) to database tables, showing exactly which files require updates for each drift issue. The system uses single-point validation at API boundaries with strict resource name mapping through centralized registries.

## Relevant Files

### Core Validation Layer
- `/src/atomic-crm/validation/contacts.ts` - Contact schema; missing `name` field, validates JSONB email/phone arrays
- `/src/atomic-crm/validation/opportunities.ts` - Opportunity schema with three organization relationships, enum defaults
- `/src/atomic-crm/validation/tasks.ts` - Task type enum (8 values), date transformation utilities
- `/src/atomic-crm/validation/organizations.ts` - Organization schema with segment_id UUID validation, URL validators
- `/src/atomic-crm/validation/notes.ts` - Contact/opportunity notes with attachment validation

### Data Provider Architecture
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Main data provider (828 lines), validates BEFORE transforms
- `/src/atomic-crm/providers/supabase/services/ValidationService.ts` - Central validation registry, filter validation
- `/src/atomic-crm/providers/supabase/services/TransformService.ts` - Post-validation data mutations, file uploads
- `/src/atomic-crm/providers/supabase/resources.ts` - RESOURCE_MAPPING (single source for table names), 143 lines
- `/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filterable fields per resource, DRIFT: uses snake_case for notes
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - View selection logic, JSONB normalization, array filter transforms

### Database Configuration
- `/supabase/migrations/` - Migration files using YYYYMMDDHHMMSS_description.sql naming
- `/src/types/database.generated.ts` - Auto-generated TypeScript types from Supabase schema
- `/supabase/config.toml` - Local Supabase configuration

### UI Components (Schema-Dependent)
- `/src/atomic-crm/contacts/ContactInputs.tsx` - Contact form, uses first_name/last_name only
- `/src/atomic-crm/contacts/ContactShow.tsx` - DRIFT: References company_id instead of organization_id (4 occurrences)
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx` - DRIFT: Uses inline defaultValue props (Constitution violation)
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx` - CORRECT pattern: schema.partial().parse({}) for defaults
- `/src/atomic-crm/tasks/AddTask.tsx` - DRIFT: Task types loaded from ConfigurationProvider instead of Zod enum
- `/src/atomic-crm/organizations/OrganizationInputs.tsx` - SegmentComboboxInput for UUID segment selection
- `/src/atomic-crm/notes/NoteCreate.tsx` - Foreign key mapping for contacts/opportunities

## Relevant Tables

### Core Tables
- `contacts` - Has `name` (required), `first_name`/`last_name` (nullable); `email`/`phone` JSONB arrays
- `organizations` - `segment_id` UUID FK to segments; `organization_type` enum
- `opportunities` - Three organization FKs (customer/principal/distributor); `contact_ids` array; 5 enums
- `tasks` - `title` (not "text"), `type` enum (8 values), `completed_at` (not "done_date")
- `contactNotes` / `opportunityNotes` - camelCase naming (DRIFT: filter registry uses snake_case)

### Junction Tables
- `contact_organizations` - Multi-org support with `is_primary` flag, soft deletes
- `opportunity_participants` - Organizations participating in opportunity
- `opportunity_contacts` - Contacts associated with opportunity

### Views (Read-Only)
- `contacts_summary` - Includes computed `company_name` from organizations join
- `organizations_summary` - Includes computed `nb_contacts`, `nb_opportunities`, `last_opportunity_activity`
- Views use `security_invoker = false` and explicit GRANT SELECT to authenticated

### Supporting Tables
- `segments` - UUID primary key, referenced by organizations.segment_id
- `sales` - User profiles, `user_id` FK to auth.users
- `tags` - Tag definitions with semantic colors

## Relevant Patterns

**Three-Schema Validation Pattern**: Each resource has base schema (all fields), create schema (stricter, omits system fields), and update schema (partial with ID required). Used in opportunities.ts (lines 54-162), contacts.ts, organizations.ts. Allows different validation rules per operation.

**Form Defaults from Zod**: React Hook Form `defaultValues` generated via `schema.partial().parse({})` to extract fields with `.default()` method. See OpportunityCreate.tsx (lines 83-91). Prevents drift between UI and validation per Constitution #5.

**JSONB Array Normalization**: Contacts use JSONB for email/phone: `[{"email":"x@y.com","type":"Work"}]`. Normalized via `normalizeJsonbArrayFields()` in dataProviderUtils.ts (lines 288-333). Applied to all read operations in unifiedDataProvider.

**Validation-Before-Transform**: Critical order enforced in `processForDatabase()` (unifiedDataProvider.ts lines 171-183). Validates original field names BEFORE transformation renames (e.g., 'products' → 'products_to_sync'). Prevents Issue 0.4.

**Resource Name Mapping**: RESOURCE_MAPPING in resources.ts (lines 7-38) isolates React Admin resource names from database tables. Single update point for table renames. Used by `getResourceName()` in all CRUD operations.

**View vs Table Selection**: `getDatabaseResource()` in dataProviderUtils.ts (lines 180-199) automatically uses summary views for list/one operations on contacts/organizations. Hardcoded resource checks need update when adding views.

**Filter Validation Prevention**: `validateFilters()` in ValidationService (lines 195-235) removes stale cached filters. Called BEFORE database queries in getList() (line 256). Prevents 400 errors from deprecated columns.

**Junction Sync with RPC**: Opportunities use `sync_opportunity_with_products` RPC for atomic operations. Contact-organizations use direct CRUD + `set_primary_organization` RPC. Pattern: field rename (`*_to_sync`) avoids database column conflicts.

**Enum Validation**: Database enums validated with `z.enum()` - case-sensitive! Task types must match exactly: 'Call', 'Email', 'Meeting' (capitalized). See tasks.ts (lines 14-23).

**Soft Delete Universal Pattern**: All major tables have `deleted_at timestamptz`. Filters applied automatically via `supportsSoftDelete()`, except for views (handle filtering internally).

## Relevant Docs

**validation-architecture.research.md**: MUST read when updating Zod schemas, adding/removing fields, or modifying form defaults. Details three-schema approach, JSONB array patterns, enum validation, and error formatting for React Admin.

**database-migration-system.research.md**: MUST read when creating migrations, adding foreign keys, or renaming tables. Covers migration naming (YYYYMMDDHHMMSS), RLS policy patterns, type generation workflow, and deployment process.

**data-provider-architecture.research.md**: MUST read when renaming tables, updating resource mappings, or adding views. Documents RESOURCE_MAPPING update points (3 core files), junction table patterns, and view recreation procedures.

**affected-resources.research.md**: MUST read when fixing specific schema drift issues in contacts, opportunities, tasks, organizations, or notes. Details exact file locations, line numbers, and drift points for each resource.

**CLAUDE.md**: Engineering Constitution - Read for Constitution principles #4 (validation at API boundary), #5 (form state from Zod defaults), #2 (single source of truth), #8 (semantic colors).
