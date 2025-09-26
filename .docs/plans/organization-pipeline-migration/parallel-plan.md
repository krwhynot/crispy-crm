# Organization & Pipeline Migration - Parallel Implementation Plan

This plan breaks down the migration from "companies" to "organizations" and the update of the opportunity pipeline to the food service-specific 8-stage workflow. The migration involves updating 65+ files with company references, 15+ opportunity pipeline components, database schema changes, and validation layer updates. All tasks are designed for maximum parallelization without backward compatibility requirements.

## Critically Relevant Files and Documentation

**Core Documentation**
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/shared.md`
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md`
- `/home/krwhynot/Projects/atomic/CLAUDE.md`

**Database Schema**
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`
- `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`

**Company/Organization Components**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/` (17 files)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`

**Opportunity Pipeline**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

## Implementation Plan

### Phase 1: Foundation Setup

#### Task 1.1: Create Database Migration [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md` (lines 40-68)
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/database-schema.docs.md`
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (migration naming convention)

**Instructions**

Files to Create
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250126000000_organization_pipeline_migration.sql`

Create a comprehensive database migration that handles in this order:
1. Drop all 8 dependent views (companies_summary, opportunities_summary, opportunities_with_participants, contacts_summary, contact_influence_profile, principal_advocacy_dashboard, product_catalog, product_performance)
2. Drop all indexes on foreign key columns (idx_contacts_company_id, idx_opportunities_company_id, idx_tasks_company_id)
3. Drop RLS policy on companies table
4. Drop trigger trigger_update_companies_search_tsv
5. Rename companies table to organizations
6. Update the opportunity_stage enum to the new 8 food service stages
7. Update all 14 foreign key constraint names to reference organizations
8. Recreate all 9 indexes with organizations naming (idx_organizations_deleted_at, etc.)
9. Update functions: update_search_tsv(), validate_principal_organization(), sync_primary_organization(), validate_opportunity_participants(), get_contact_organizations()
10. Recreate all 8 views with organizations references
11. Create RLS policy for organizations table
12. Update GRANT permissions for new views
13. Recreate trigger for organizations search_tsv

**Tables/Columns to update:**
- companies → organizations (main table rename)
- All 14 foreign key references from requirements
- contact_organizations (update FK constraint names only)

#### Task 1.2: Create Stage Constants File [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md` (lines 71-82)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx` (lines 14-23)

**Instructions**

Files to Create
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

Create a centralized constants file for the new food service pipeline stages with:
- Stage enum values and labels
- Stage colors (using semantic CSS variables from requirements)
- Stage descriptions
- Stage-specific field visibility configuration
- Export functions for stage management

This will eliminate the current duplication across 4+ components.

### Phase 2: Validation & Type Updates

#### Task 2.1: Update Validation Schemas [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md` (lines 84-112)

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`

Files to Rename
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts` (keep as-is, already correct)

Update the opportunity validation:
- Replace the opportunityStageSchema enum values with new food service stages
- Add stage-specific field schemas for sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost
- Update opportunity schema to include stage-specific fields as optional

Remove all backward compatibility aliases for companies in the organizations validation.

#### Task 2.2: Update Data Provider Mappings [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/validation-data-provider.docs.md`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`

Update resource mappings:
- Change companies → organizations in RESOURCE_MAPPING
- Remove dual-naming support (lines 55-58 in unifiedDataProvider)
- Update validation registry to use organizations directly
- Ensure all resource references use "organizations"

### Phase 3: Component Migration

#### Task 3.1: Rename Company Directory [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/company-architecture.docs.md` (lines 7-25)
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md` (lines 116-128)

**Instructions**

Directory to Rename
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/` → `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/`

Files to Rename (all 17 files in directory)
- AutocompleteCompanyInput.tsx → AutocompleteOrganizationInput.tsx
- CompanyAside.tsx → OrganizationAside.tsx
- CompanyAvatar.tsx → OrganizationAvatar.tsx
- CompanyCard.tsx → OrganizationCard.tsx
- CompanyCreate.tsx → OrganizationCreate.tsx
- CompanyEdit.tsx → OrganizationEdit.tsx
- CompanyEmpty.tsx → OrganizationEmpty.tsx
- CompanyInputs.tsx → OrganizationInputs.tsx
- CompanyList.tsx → OrganizationList.tsx
- CompanyList.spec.ts → OrganizationList.spec.ts
- CompanyListFilter.tsx → OrganizationListFilter.tsx
- CompanyOrganizationType.tsx → OrganizationType.tsx
- CompanyOrganizationType.spec.ts → OrganizationType.spec.ts
- CompanyShow.tsx → OrganizationShow.tsx
- All other Company* files similarly

#### Task 3.2: Update Organization Components [Depends on: 3.1]

**READ THESE BEFORE TASK**
- Renamed files from Task 3.1
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/requirements.md` (lines 129-133)

**Instructions**

Files to Modify
- All 17 renamed files in `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/`

Update component internals:
- Replace all Company* class/function names with Organization*
- Update all company/companyId variables to organization/organizationId
- Update resource references from "companies" to "organizations"
- Update route references from /companies to /organizations
- Update display text from "Company"/"Companies" to "Organization"/"Organizations"
- Ensure NO use of abbreviated forms (no "org" or "orgs")

#### Task 3.3: Update Cross-Module Imports [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/organization-pipeline-migration/company-architecture.docs.md` (lines 44-51)
- List of renamed components from Task 3.1

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/notes/Note.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/MultiOrganizationInput.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/activity/ActivityLogOpportunityNoteCreated.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/activity/ActivityLogCompanyCreated.tsx`

Update all imports:
- Change import paths from /companies/ to /organizations/
- Update imported component names (CompanyAvatar → OrganizationAvatar, etc.)
- Update any local variable names referencing companies

#### Task 3.4: Update Utility Functions [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/getCompanyAvatar.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/getCompanyAvatar.spec.ts`

**Instructions**

Files to Rename
- `getCompanyAvatar.ts` → `getOrganizationAvatar.ts`
- `getCompanyAvatar.spec.ts` → `getOrganizationAvatar.spec.ts`

Files to Modify
- Renamed files above
- Any files importing these utilities

Update function names and parameters to use organization terminology.

#### Task 3.5: Update Navigation and Layout [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/layout/Header.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/ContactOption.tsx`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/layout/Header.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/ContactOption.tsx`

Update Header component:
- Change route matching from `/companies/*` to `/organizations/*`
- Update navigation tab label from "Companies" to "Organizations"
- Update route from `/companies` to `/organizations`

Update ContactOption:
- Change `company_name` field references to `organization_name`

#### Task 3.6: Update Edge Functions and Scripts [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/supabase/functions/postmark/addNoteToContact.ts`
- `/home/krwhynot/Projects/atomic/monitoring/alerts/opportunity-alerts.json`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/supabase/functions/postmark/addNoteToContact.ts`
- `/home/krwhynot/Projects/atomic/monitoring/alerts/opportunity-alerts.json`
- `/home/krwhynot/Projects/atomic/scripts/seed-data.js`

Update Supabase edge function:
- Change queries from `companies` table to `organizations`
- Update `company_id` field to `organization_id`

Update monitoring alerts:
- Update SQL queries to reference `organizations` table
- Update field references from `company_id` to `organization_id`

Update seed data script:
- Update table and field references

#### Task 3.7: Update Test Files [Depends on: 3.1]

**READ THESE BEFORE TASK**
- All test files identified in validation

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/tests/e2e/opportunity-lifecycle.test.ts`
- `/home/krwhynot/Projects/atomic/src/tests/e2e/user-journey.test.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`
- All other test files with company references

Update test files:
- Change `faker.company.name()` to `faker.company.name()` (keep faker API but update variable names)
- Update field references from `company_id` to `organization_id`
- Update assertions and expectations

### Phase 4: Pipeline UI Updates

#### Task 4.1: Update Opportunity Kanban Board [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`
- Stage constants file from Task 1.2

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

Update kanban implementation:
- Import and use stage constants from new constants file
- Update opportunityStages array to use new stages
- Apply new stage colors per requirements
- Ensure drag-drop functionality works with new stages
- Update stage grouping logic in stages.ts

#### Task 4.2: Update Opportunity Forms [Depends on: 1.2, 2.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`
- Stage-specific fields from requirements (lines 84-112)

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`

Update opportunity forms:
- Import stage constants from new file
- Update stage dropdown to use new stages and labels
- Implement conditional field rendering based on selected stage
- Add stage-specific fields (sample info, feedback, demo details, etc.)
- Ensure validation works with new fields

#### Task 4.3: Update Opportunity List Views [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunity.ts`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunity.ts`

Update list views:
- Import and use stage constants
- Update stage filters to show new stages
- Update stage label lookups in opportunity.ts
- Ensure stage colors display correctly in list view

#### Task 4.4: Update Dashboard Analytics [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/OpportunitiesChart.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/OpportunitiesChart.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx`

Update OpportunitiesChart:
- Replace multiplier object with new stage values:
  - new_lead: 0.1
  - initial_outreach: 0.2
  - sample_visit_offered: 0.3
  - awaiting_response: 0.25
  - feedback_logged: 0.5
  - demo_scheduled: 0.7
- Update stage filtering for "closed_won" and "closed_lost"

Update WhatsNew page:
- Update stage documentation to reflect food service pipeline
- Update "Companies now have types..." text to use Organizations

#### Task 4.5: Update Pipeline Test Files [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities.test.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.spec.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityWorkflows.spec.tsx`

**Instructions**

Files to Modify
- All opportunity test files
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities.test.ts`

Update test files:
- Replace old stage values with new food service stages
- Update mock data to use new stages
- Fix stage-specific test assertions
- Update validation tests

#### Task 4.6: Update Seed Data for Pipeline [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/scripts/seed-data.js`
- `/home/krwhynot/Projects/atomic/scripts/migration-transform.js`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/scripts/seed-data.js`
- All migration scripts referencing stages

Update seed data:
- Update PIPELINE_STAGES environment variable default
- Create getStatusForStage() mapping for new stages
- Update getProbabilityForStage() if exists
- Update stage generation logic for test data

### Phase 5: Application Integration

#### Task 5.1: Update Root Application Configuration [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/defaultConfiguration.ts`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/defaultConfiguration.ts`

Update application root:
- Change resource registration from "companies" to "organizations"
- Update import path from /companies to /organizations
- Update any default configuration referencing companies

#### Task 5.2: Update Activity Logging [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/activity/ActivityLogCompanyCreated.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/consts.ts`

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/src/atomic-crm/activity/ActivityLogCompanyCreated.tsx` (rename to ActivityLogOrganizationCreated.tsx)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/consts.ts`

Update activity system:
- Rename component to ActivityLogOrganizationCreated
- Update COMPANY_CREATED constant to ORGANIZATION_CREATED
- Update route references from /companies to /organizations
- Update display text appropriately

### Phase 6: Type Generation & Testing

#### Task 6.1: Generate TypeScript Types [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (MCP database tools section)
- Database migration from Task 1.1

**Instructions**

After database migration is applied:
- Use MCP tool `mcp__supabase__generate_typescript_types` to regenerate types
- Save generated types to `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`
- Verify new organization types and opportunity_stage enum are correct

#### Task 6.2: Fix TypeScript Compilation Errors [Depends on: all other tasks]

**READ THESE BEFORE TASK**
- All modified files from previous tasks
- Generated types from Task 6.1

**Instructions**

Run TypeScript compilation and fix any remaining errors:
- Update any missed company references
- Fix type mismatches from schema changes
- Ensure all imports are correctly updated
- Verify no "company" references remain (except in historical migrations)

#### Task 6.3: Run Build & Validation [Depends on: 6.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (build commands section)
- Validation checklist from requirements.md

**Instructions**

Execute validation steps:
- Run `npm run build` to ensure production build succeeds
- Run `npm run lint:check` to catch any code issues
- Run `npm run prettier:check` for formatting
- Test all CRUD operations for organizations
- Test opportunity pipeline with new stages
- Verify stage colors and field visibility

## Advice

- **No Backward Compatibility**: Per CLAUDE.md, do NOT maintain any backward compatibility. Remove all dual-naming support and aliases completely.

- **Database Migration Order Critical**: The migration must drop objects in reverse dependency order and recreate in forward dependency order. There are 8 views, not just 3, that depend on the companies table.

- **Hidden View Dependencies**: Beyond the obvious 3 views, there are 5 additional views (contacts_summary, contact_influence_profile, principal_advocacy_dashboard, product_catalog, product_performance) that reference companies and will fail if not handled.

- **Navigation Component**: The Header.tsx component contains hardcoded route matching that WILL break navigation if not updated. This is a runtime-critical change.

- **Stage Multiplier Logic**: The OpportunitiesChart component has hardcoded multipliers for probability calculations. These MUST be updated or the dashboard analytics will show incorrect values.

- **Edge Function Failure Risk**: The Supabase edge function directly queries the companies table. If not updated, it will cause runtime failures when processing emails.

- **Stage Duplication**: The current pipeline stages are duplicated in 4+ components. Task 1.2 creates a single source of truth - ensure ALL components import from this new file.

- **Full Word Usage**: Always use "organization" and "organizations" - never abbreviate to "org" or "orgs" in code or routes.

- **Index Recreation**: All 9 indexes on the companies table plus 3 FK indexes must be recreated with new names. Missing these will severely impact query performance.

- **Function Updates**: 5 database functions reference companies by name. These must be updated or triggers and validations will fail.

- **RLS Policy**: The RLS policy must be recreated for the organizations table or all authenticated users will lose access.

- **Test File Updates**: Test files use faker.company.name() - keep the faker API but update variable names storing the results.

- **Monitoring Queries**: Alert configurations contain raw SQL that will fail against the renamed table. Update these to prevent monitoring blindness.

- **Type Generation**: After applying the database migration, you MUST regenerate TypeScript types to avoid compilation errors. Use the MCP tool for this.

- **Stage Colors**: Use ONLY the semantic CSS variables specified in requirements (--info-subtle, --teal, etc.) - no hex values.

- **Testing Order**: Test the database migration first in isolation before proceeding with code changes. This ensures the schema is correct.

- **Search Verification**: After completion, do a global search for "company" and "companies" (case-insensitive) to ensure no references remain except in historical migration files.

- **Component Dependencies**: CompanyAvatar is used in 8+ modules. When renaming, update ALL import statements to avoid runtime errors.