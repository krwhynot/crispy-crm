# Fresh Start Migration: Parallel Implementation Plan

This plan orchestrates a complete fresh-start migration from the legacy "deals" naming to "opportunities" across database, code, and validation layers. The migration first clears the Crispy Supabase database completely, then creates a clean schema from inception, removes all backward compatibility code, and implements Zod validation at API boundaries following Core Principle #3.

**⚠️ WARNING: Phase 0 will permanently delete ALL data in the Crispy database without backup.**

## Critically Relevant Files and Documentation

### Core Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Engineering constitution with core principles
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md` - Complete migration requirements
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/shared.md` - Architecture patterns and file mappings
- `/home/krwhynot/Projects/atomic/docs/internal-docs/fresh-start-migration-codebase-analysis.docs.md` - Complete database catalog

### Database Resources
- `/docs/merged/migrations/` - Comprehensive staged migrations with complete schema
- `/supabase/migrations/` - Current timestamped migrations to archive
- `/scripts/mcp-migrate.js` - Migration execution script
- `/scripts/mcp-migrate-create.js` - Migration creation helper

### Code Architecture
- `/src/atomic-crm/deals/` - Legacy module to delete (17 files)
- `/src/atomic-crm/opportunities/` - Target state module (22 files)
- `/src/atomic-crm/providers/commons/backwardCompatibility.ts` - Compatibility layer to remove
- `/src/atomic-crm/providers/supabase/dataProvider.ts` - Production data provider
- `/src/atomic-crm/root/CRM.tsx` - Application root with resource registration

## Implementation Plan

### Phase 0: Database Preparation

#### Task 0.1: Clear Existing Database - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Core Principle #9 on no backward compatibility
- MCP documentation for database operations

**Instructions**

Clear the Crispy Supabase database completely:

1. **Execute via MCP tools** (mcp__supabase__execute_sql):
   ```sql
   -- Drop all existing schemas and recreate clean public schema
   DROP SCHEMA IF EXISTS public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO anon;
   GRANT ALL ON SCHEMA public TO authenticated;
   GRANT ALL ON SCHEMA public TO service_role;
   ```

2. **Verify empty state**:
   ```sql
   -- Should return no tables
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

**CRITICAL**: This will permanently delete all data. No backup is being taken per requirements.

Commit: "chore: clear database for fresh migration"

### Phase 1: Database Foundation

#### Task 1.1: Archive Existing Migrations - Depends on [none]

**READ THESE BEFORE TASK**
- `/supabase/migrations/` - All current migration files
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md` - Section 5: Implementation Workflow

**Instructions**

Files to Create
- `/docs/deprecated-migrations/` - Archive directory

Files to Modify
- Move all files from `/supabase/migrations/` to `/docs/deprecated-migrations/`

Create archive directory and move all existing migrations preserving their timestamps. This clears the migrations directory for the fresh schema. Commit with message: "chore: archive old migrations for fresh start"

#### Task 1.2: Create Fresh Database Schema - Depends on [0.1, 1.1]

**READ THESE BEFORE TASK**
- `/docs/merged/migrations/` - ALL phase migration files (001 through 009) for complete schema
- `/home/krwhynot/Projects/atomic/docs/internal-docs/fresh-start-migration-codebase-analysis.docs.md` - Complete database object catalog
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/database-research.docs.md` - Schema relationships

**Instructions**

Files to Create
- `/supabase/migrations/20250125000000_fresh_crm_schema.sql`

Consolidate ALL database objects from phase migrations into single file:
- **Tables**: All 18+ core tables including opportunities (not deals), opportunityNotes (not dealNotes), products, product_pricing_models, product_features, etc.
- **Enum Types**: All 8 types (organization_type, opportunity_stage, product_status, pricing_model_type, etc.)
- **Views**: All views including summaries, opportunities_legacy (backward compatibility), and materialized views
- **Functions**: ALL functions from phase files including search updates, pricing calculations, business logic
- **Triggers**: All trigger functions for search vectors, validation, and data sync
- **Indexes**: All 50+ indexes including GIN for full-text search, performance indexes
- **RLS Policies**: Simple pattern: `FOR ALL USING (auth.role() = 'authenticated')`

**CRITICAL**: Review EVERY file in `/docs/merged/migrations/` to ensure nothing is missed.

Apply migration using MCP tools. Commit: "feat: create fresh opportunities schema"

### Phase 2: Code Cleanup

#### Task 2.1: Remove Legacy Deals Module - Depends on [none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/deals/` - Entire legacy module structure
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/deals-legacy-research.docs.md` - Complete deletion list

**Instructions**

Files to Delete
- `/src/atomic-crm/deals/` - Entire directory (16 files)
- `/src/atomic-crm/providers/commons/backwardCompatibility.ts`
- `/src/atomic-crm/providers/commons/backwardCompatibility.spec.ts`
- `/src/atomic-crm/pages/MigrationStatusPage.tsx`
- `/src/atomic-crm/components/MigrationChecklist.tsx`
- `/src/atomic-crm/components/MigrationNotification.tsx`
- `/src/atomic-crm/components/MigrationBanner.tsx`

Remove all legacy deals code and backward compatibility infrastructure. Commit: "refactor: remove deals legacy code and backward compatibility"

#### Task 2.2: Update Root Configuration - Depends on [2.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/root/CRM.tsx` - Main application configuration
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md` - Section 2: Code Cleanup

**Instructions**

Files to Modify
- `/src/atomic-crm/root/CRM.tsx`

Remove from CRM component:
- Import statement: `import deals from "../deals"`
- Resource registration: `<Resource name="deals" {...deals} />`
- Resource: `<Resource name="dealNotes" />`
- Props: `dealCategories`, `dealPipelineStatuses`, `dealStages`
- useEffect: `handleDealUrlRedirect()` and all redirect logic

Commit: "refactor: clean root configuration from deals references"

#### Task 2.3: Update Dashboard Components - Depends on [2.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/dashboard/DealsPipeline.tsx` - Component to rename
- `/src/atomic-crm/dashboard/DealsChart.tsx` - Component to rename
- `/src/atomic-crm/dashboard/Dashboard.tsx` - Parent component

**Instructions**

Files to Rename
- `/src/atomic-crm/dashboard/DealsPipeline.tsx` → `OpportunitiesPipeline.tsx`
- `/src/atomic-crm/dashboard/DealsChart.tsx` → `OpportunitiesChart.tsx`

Files to Modify
- `/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx` - Update imports and function names
- `/src/atomic-crm/dashboard/OpportunitiesChart.tsx` - Update imports and function names
- `/src/atomic-crm/dashboard/Dashboard.tsx` - Update imports to new component names
- `/src/atomic-crm/dashboard/LatestNotes.tsx` - Update dealNotes to opportunityNotes

Change all imports from `"../deals/"` to `"../opportunities/"`. Rename functions like `findDealLabel` to `findOpportunityLabel`. Commit: "refactor: rename dashboard components to opportunities"

### Phase 3: Data Provider Cleanup

#### Task 3.1: Clean Production Data Provider - Depends on [2.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` - Production provider
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/data-provider-research.docs.md` - Transformation logic

**Instructions**

Files to Modify
- `/src/atomic-crm/providers/supabase/dataProvider.ts`

Remove:
- All deals/dealNotes resource handling
- Transformation logic mapping deals↔opportunities
- Legacy lifecycle callbacks for deals
- Any references to backward compatibility

Keep:
- Attachment handling for opportunityNotes
- Error logging patterns
- Authentication integration

Commit: "refactor: remove deals transformations from data provider"

#### Task 3.2: Update Unified Data Provider - Depends on [3.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Under-development provider
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Core Principle #1 on data providers

**Instructions**

Files to Modify
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Update transformation registry:
- Remove all deals-related transformers
- Ensure opportunities transformer uses correct field names
- Remove any backward compatibility logic
- Simplify provider chain to single layer

Commit: "refactor: simplify unified data provider for opportunities"

#### Task 3.3: Clean Resource Mapping - Depends on [3.1, 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/resources.ts` - Resource configuration
- `/src/atomic-crm/companies/CompanyShow.tsx` - Component using imports

**Instructions**

Files to Modify
- `/src/atomic-crm/providers/supabase/resources.ts` - Verify no deals references
- `/src/atomic-crm/companies/CompanyShow.tsx` - Update import from `"../opportunities/opportunity"`

Clean any remaining deals references in resource configuration. Update component imports. Commit: "refactor: clean resource mapping and imports"

### Phase 4: Validation Implementation

#### Task 4.1: Create Validation Directory Structure - Depends on [none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Core Principle #3 on validation
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/validation-research.docs.md` - Current patterns

**Instructions**

Files to Create
- `/src/atomic-crm/validation/` - Directory for Zod schemas
- `/src/atomic-crm/validation/index.ts` - Export barrel file

Create validation directory and setup export structure for schema modules. Commit: "feat: create validation directory structure"

#### Task 4.2: Implement Core Entity Schemas - Depends on [4.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx` - Current validation patterns
- `/src/atomic-crm/companies/CompanyInputs.tsx` - Company validation
- `/src/atomic-crm/contacts/ContactInputs.tsx` - Contact validation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Expected validation function signatures

**Instructions**

Files to Create
- `/src/atomic-crm/validation/opportunities.ts` (not .schema.ts to match expected imports)
- `/src/atomic-crm/validation/organizations.ts` (not companies.ts to match imports)
- `/src/atomic-crm/validation/contacts.ts`

Implement Zod schemas AND validation functions matching expected signatures:
- Export `validateOpportunityForm` function using Zod schema
- Export `validateOrganizationForSubmission` function
- Export `validateContactForm` function
- Include all current validation rules (required fields, custom validators)
- Business rules (probability 0-100, stage validation)
- Export both schemas and inferred types

Commit: "feat: implement core entity Zod schemas and validation functions"

#### Task 4.3: Implement Supporting Schemas - Depends on [4.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/tasks/AddTask.tsx` - Task validation
- `/src/atomic-crm/tags/tag-colors.ts` - Tag color validation
- `/src/atomic-crm/notes/NoteCreate.tsx` - Note validation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Expected tag validation functions

**Instructions**

Files to Create
- `/src/atomic-crm/validation/tasks.ts`
- `/src/atomic-crm/validation/tags.ts`
- `/src/atomic-crm/validation/notes.ts`

Implement schemas AND validation functions:
- Export `validateCreateTag` and `validateUpdateTag` functions
- Task schemas with reminder validation
- Tag schemas with semantic color validation
- Notes schemas for both contact and opportunity notes
- Include attachment validation patterns

Commit: "feat: implement supporting entity Zod schemas and validation functions"

#### Task 4.4: Fix Data Provider Validation Imports - Depends on [4.2, 4.3, 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Provider with existing imports
- `/src/atomic-crm/validation/` - All created validation modules

**Instructions**

Files to Modify
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Update validation integration:
- The imports are already in place (lines 88-91) pointing to the newly created validation functions
- Verify the validation functions are being called correctly in the provider
- Test that validation errors are properly formatted and returned
- Ensure create/update operations use the validation functions

Commit: "feat: connect validation functions with data provider"

### Phase 5: Testing and Verification

#### Task 5.1: Create Migration Verification Tests - Depends on [1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md` - Testing requirements
- Existing test patterns in codebase

**Instructions**

Files to Create
- `/src/atomic-crm/__tests__/migration-verification.test.ts`

Write tests to verify:
- `opportunities` table exists
- `deals` table does NOT exist
- All foreign keys use `opportunity_id`
- Views reference opportunities correctly

Commit: "test: add migration verification tests"

#### Task 5.2: Update Component Tests - Depends on [2.2, 2.3]

**READ THESE BEFORE TASK**
- Any existing component tests for deals
- `/src/atomic-crm/opportunities/` - Target component structure

**Instructions**

Files to Modify
- Update any test files referencing deals to use opportunities
- Fix import paths in test files
- Update test data to use opportunity structure

Ensure all component tests pass with new structure. Commit: "test: update component tests for opportunities"

#### Task 5.3: Add Validation Tests - Depends on [4.4]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/validation/` - All Zod schemas
- Provider integration from Task 4.4

**Instructions**

Files to Create
- `/src/atomic-crm/validation/__tests__/` - Test directory
- Test files for each schema

Write tests for:
- Schema validation with valid data
- Schema rejection with invalid data
- Error message formatting
- API boundary integration

Commit: "test: add Zod schema validation tests"

### Phase 6: Final Integration

#### Task 6.1: Update Notes Components - Depends on [2.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/notes/NoteCreate.tsx` - Note creation component
- `/src/atomic-crm/notes/NotesIterator.tsx` - Note listing component

**Instructions**

Files to Modify
- `/src/atomic-crm/notes/NoteCreate.tsx`
- `/src/atomic-crm/notes/NotesIterator.tsx`

Update all references from `dealNotes` to `opportunityNotes`. Fix resource names and imports. Commit: "refactor: update notes components for opportunities"

#### Task 6.2: Update Layout and Navigation - Depends on [2.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/layout/Header.tsx` - Navigation header with deals references
- Any other layout components with deals references

**Instructions**

Files to Modify
- `/src/atomic-crm/layout/Header.tsx`

Update navigation:
- Change all navigation links from `/deals/*` to `/opportunities/*`
- Update menu labels from "Deals" to "Opportunities"
- Fix any icon or styling references related to deals
- Ensure breadcrumbs use opportunities terminology

Commit: "refactor: update navigation for opportunities"

#### Task 6.3: Generate TypeScript Types - Depends on [1.2]

**READ THESE BEFORE TASK**
- `/scripts/mcp-generate-types.cjs` - Type generation script
- MCP documentation for type generation

**Instructions**

Execute type generation:
- Run MCP type generation for new schema
- Update type imports across codebase
- Ensure no TypeScript errors

Commit: "feat: generate TypeScript types for fresh schema"

#### Task 6.4: Final Cleanup and Verification - Depends on [all previous tasks]

**READ THESE BEFORE TASK**
- All modified files from previous tasks
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Core principles

**Instructions**

Final verification:
- Run `npm run build` - Ensure no TypeScript errors
- Run `npm test` - All tests pass
- Run `npm run dev` - Manual testing
- Search codebase for any remaining "deal" references
- Verify no imports from deleted directories

Commit: "chore: final cleanup and verification"

## Advice

- **Critical First Step**: Phase 0 (Task 0.1) MUST be executed first. This will permanently delete all data in Crispy. Ensure you're connected to the correct database before executing.

- **Migration Execution Order**: Phase 0 must complete first, then Phase 1 (database schema) must complete before testing any code changes. The fresh schema is the foundation.

- **Backward Compatibility View**: The database migration includes a `deals` view with DML rules for any external systems. This is database-only compatibility, not maintained in code.

- **Search Vector Triggers**: When creating the fresh schema, ensure all trigger functions for search vectors are included. These are critical for full-text search functionality.

- **RLS Policy Simplification**: Use only `auth.role() = 'authenticated'` patterns. Avoid complex multi-tenant logic per Core Principle #2.

- **Validation Migration**: When implementing Zod schemas, maintain exact validation rules from current React Admin validators to avoid breaking changes in business logic.

- **Type Generation**: After database migration, immediately generate TypeScript types to catch any schema mismatches early in the implementation.

- **Component Testing**: The opportunities module is already fully implemented and tested. Focus on removing deals code rather than rewriting opportunities logic.

- **Data Provider Simplification**: This is an opportunity to remove 3 layers of provider chaining and reduce to a single unified provider per Core Principle #1.

- **Git Checkpoints**: Create commits after each task completion to enable easy rollback if issues arise. The entire migration should be revertable.

- **Environment Variables**: Update any DEAL_* environment variables to OPPORTUNITY_* in both code and `.env` files.