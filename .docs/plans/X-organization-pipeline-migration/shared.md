# Organization & Pipeline Migration - Shared Architecture

This migration involves renaming "companies" to "organizations" throughout the entire stack and updating the opportunity pipeline to an 8-stage food service workflow. The system currently uses a dual-naming architecture where the database uses "companies" but validation/types reference "organizations", indicating a partially-complete migration. The opportunity pipeline uses a drag-drop kanban board with stage definitions hardcoded across multiple components.

## Critical Success Factors (Validated by Analysis)

### 1. Stage Constants Enforcement
- **Risk**: The success of centralizing stage definitions depends on ALL components actually using the new constants file
- **Mitigation**: Add ESLint rules to enforce imports from `stageConstants.ts`
- **Affected Components**: OpportunityListContent, OpportunityColumn, OpportunityInputs, OpportunityList, OpportunitiesChart must ALL import from the centralized file

### 2. Database Migration Complexity
- **Risk Level**: HIGHEST - This is the most critical and error-prone part of the migration
- **Complexity**: Must handle 8 views (not just 3), 14 FK dependencies, 9 indexes in precise dependency order
- **Validation**: The detailed step-by-step approach in Task 1.1 of parallel-plan.md has been validated as necessary
- **Testing Required**: Must test database migration in isolation before any code changes

### 3. Hidden Dependencies
- **Risk**: Often-missed components that would cause runtime failures if overlooked
- **Critical Components Found**:
  - Navigation: Header.tsx with hardcoded `/companies/*` routes
  - Analytics: OpportunitiesChart.tsx with hardcoded stage multipliers
  - Edge Functions: Supabase functions directly querying companies table
  - Monitoring: SQL queries in alert configurations
  - Additional Views: 5 extra database views beyond the obvious 3
- **Mitigation**: Use the comprehensive task list in parallel-plan.md which includes all hidden dependencies

## Relevant Files

### Core Company/Organization Components
- `/src/atomic-crm/companies/`: Directory containing 17 component files (needs rename to `/organizations/`)
- `/src/atomic-crm/companies/CompanyList.tsx`: Main list view with filtering and pagination
- `/src/atomic-crm/companies/CompanyShow.tsx`: Detail view for individual companies
- `/src/atomic-crm/companies/CompanyEdit.tsx`: Edit form component
- `/src/atomic-crm/companies/CompanyCreate.tsx`: Create form component
- `/src/atomic-crm/companies/CompanyAvatar.tsx`: Avatar component used across 8+ modules
- `/src/atomic-crm/companies/AutocompleteCompanyInput.tsx`: Company selection autocomplete
- `/src/atomic-crm/companies/index.ts`: Resource configuration export for React Admin

### Opportunity Pipeline Components
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Core kanban board with drag-drop logic and stage definitions
- `/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Stage column rendering with totals
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form inputs with hardcoded stage dropdown
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: List view with stage filters
- `/src/atomic-crm/opportunities/stages.ts`: Helper functions for grouping by stage
- `/src/atomic-crm/opportunities/opportunity.ts`: Stage label lookup utilities

### Data Provider & Validation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Maps companies→organizations in validation registry
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration
- `/src/atomic-crm/validation/organizations.ts`: Organization schemas (aliased as company schemas)
- `/src/atomic-crm/validation/opportunities.ts`: Opportunity validation with stage enum
- `/src/atomic-crm/root/CRM.tsx`: Main app resource registration (line 148)

### Database Migrations
- `/supabase/migrations/20250125000000_fresh_crm_schema.sql`: Complete schema with companies table and opportunity_stage enum
- `/src/types/database.generated.ts`: Auto-generated TypeScript types from database

### Cross-Module Dependencies
- `/src/atomic-crm/contacts/MultiOrganizationInput.tsx`: Multi-organization relationship management
- `/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx`: Imports CompanyAvatar
- `/src/atomic-crm/activity/ActivityLogCompanyCreated.tsx`: Company creation activity logging

## Relevant Tables

### Primary Tables
- `companies`: Main organization entity (rename target → `organizations`)
- `opportunities`: Sales pipeline with stage enum and multi-organization FKs
- `contacts`: People with primary company_id and multi-org support
- `contact_organizations`: Junction table for many-to-many relationships
- `opportunity_participants`: Multi-principal opportunity support

### Foreign Key Dependencies on companies(id)
- `companies.parent_company_id`: Self-referencing hierarchy
- `contacts.company_id`: Primary organization (backward compatibility)
- `opportunities.customer_organization_id`: Customer organization
- `opportunities.principal_organization_id`: Principal organization
- `opportunities.distributor_organization_id`: Distributor organization
- `opportunities.company_id`: Legacy backward compatibility field
- `contact_organizations.organization_id`: Many-to-many relationships
- `opportunity_participants.organization_id`: Multi-principal support
- 6 additional tables with company references

### Summary Views
- `companies_summary`: Optimized view with contact/opportunity counts
- `opportunities_summary`: Opportunity details with company information
- `opportunities_with_participants`: Complex JSON aggregation

## Relevant Patterns

**Resource Registration Pattern**: React Admin resources registered in CRM.tsx with lazy loading for opportunities. Each module exports `{ list, create, edit, show }` components from index.ts

**Dual-Naming Architecture**: System maintains both "companies" and "organizations" resource names via aliases in unifiedDataProvider (lines 55-58). Validation uses organizations.ts but exports company aliases for compatibility

**Kanban Drag-Drop Pattern**: Uses @hello-pangea/dnd with complex index management for filtered views. Opportunities have numeric index field for ordering within stages

**Stage Definition Duplication**: Opportunity stages hardcoded in 4+ components (OpportunityListContent, OpportunityColumn, OpportunityInputs, OpportunityList). Should be centralized

**Single-Point Validation**: Zod schemas validate at API boundary only via validation registry in unifiedDataProvider. No multi-layer validation per CLAUDE.md

**Multi-Organization Support**: Contacts can belong to multiple organizations via contact_organizations junction table. Primary relationship maintained via company_id for backward compatibility

**Stage-Probability Automation**: Database trigger auto-calculates probability based on stage unless manually overridden (stage_manual flag)

**Soft Delete Pattern**: All core tables use deleted_at timestamps with RLS policies filtering by `deleted_at IS NULL`

**Search Integration**: Full-text search via search_tsv columns updated by triggers on companies, opportunities, and contacts

**Migration Convention**: Timestamp format YYYYMMDDHHMMSS for ordering (e.g., 20250125000000_fresh_crm_schema.sql)

## Relevant Docs

**`.docs/plans/organization-pipeline-migration/requirements.md`**: You _must_ read this when working on any aspect of the migration. Contains complete specifications for the 8-stage pipeline and organization rename

**`.docs/plans/organization-pipeline-migration/company-architecture.docs.md`**: You _must_ read this when updating company/organization components. Lists all 65+ files with company references

**`.docs/plans/organization-pipeline-migration/pipeline-architecture.docs.md`**: You _must_ read this when modifying the opportunity pipeline. Details kanban implementation and stage mechanics

**`.docs/plans/organization-pipeline-migration/database-schema.docs.md`**: You _must_ read this when creating database migrations. Maps all 14 foreign key dependencies and affected views

**`.docs/plans/organization-pipeline-migration/validation-data-provider.docs.md`**: You _must_ read this when updating validation or data provider layers. Explains dual-provider system and validation registry

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this for project conventions. Enforces fail-fast approach with no backward compatibility