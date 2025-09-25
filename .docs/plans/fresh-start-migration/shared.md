# Fresh Start Migration: Shared Architecture Document

This migration creates a clean Atomic CRM database schema with correct "opportunities" naming from inception, removing all legacy "deals" code and backward compatibility layers. The approach leverages an empty database to avoid data transformation complexity while implementing proper Zod validation at API boundaries.

## Relevant Files

### Database Schema & Migrations
- `/supabase/migrations/`: Current timestamped migration files to be archived
- `/docs/merged/migrations/`: Comprehensive staged migrations with complete schema
- `/scripts/mcp-migrate.js`: Migration execution script using MCP tools
- `/scripts/mcp-migrate-create.js`: Migration creation helper
- `/scripts/mcp-migrate-status.js`: Migration status checker

### Opportunities Module (Target State)
- `/src/atomic-crm/opportunities/`: Complete module with CRUD operations (22 files)
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board with drag-and-drop
- `/src/atomic-crm/opportunities/opportunity.ts`: Type definitions with multi-org support
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form validation patterns to migrate to Zod

### Deals Legacy Code (To Delete)
- `/src/atomic-crm/deals/`: Entire legacy module (17 files, 35KB total)
- `/src/atomic-crm/providers/commons/backwardCompatibility.ts`: 377-line compatibility layer
- `/src/atomic-crm/dashboard/DealsPipeline.tsx`: Deprecated dashboard component
- `/src/atomic-crm/dashboard/DealsChart.tsx`: Legacy revenue chart

### Data Provider Architecture
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Production data provider with lifecycle callbacks
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Under-development consolidated provider
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration
- `/src/atomic-crm/root/CRM.tsx`: Main application entry with resource registration

### Validation Infrastructure
- `/src/components/admin/`: Admin form layer for consistent validation
- `/src/atomic-crm/misc/isLinkedInUrl.ts`: Custom validator pattern example
- `/src/atomic-crm/tags/tag-colors.ts`: Business rule validation example
- `/supabase/functions/`: Edge Functions requiring Zod validation

## Relevant Tables

### Core Tables (Fresh Schema)
- `opportunities`: Sales pipeline with multi-org relationships (NOT deals)
- `opportunityNotes`: Communication history (NOT dealNotes)
- `companies`: Organizations with hierarchical support
- `contacts`: People with JSONB email/phone storage
- `tasks`: Activity tracking with reminders
- `sales`: User management linked to auth.users
- `tags`: Flexible categorization with semantic colors

### Junction Tables
- `contact_organizations`: Many-to-many contacts↔companies
- `opportunity_participants`: Multi-principal opportunity support
- `opportunity_products`: Product line items for opportunities

### Views
- `opportunities_summary`: Optimized opportunity queries
- `companies_summary`: Companies with counts
- `contacts_summary`: Contact details with relationships

## Relevant Patterns

**Migration Numbering**: Use timestamp format YYYYMMDDHHMMSS (e.g., `20250125000000_fresh_crm_schema.sql`), never sequential numbers - see `/supabase/migrations/20250113132532_fixcontactorganizationplural.sql`

**Resource Registration**: React Admin resources registered in `/src/atomic-crm/root/CRM.tsx` with lazy-loaded components and minimal exports from feature modules

**Validation Pattern**: Currently uses React Admin validators (`required()`, `email()`) - migrate to Zod schemas at API boundaries per Core Principle #3

**Data Provider Lifecycle**: Pre/post operation hooks in dataProvider for transformations, see attachment handling in `contactNotes` lifecycle callbacks

**Soft Delete Pattern**: Use `deleted_at` timestamps instead of hard deletes, with `unarchiveOpportunity()` custom method for restoration

**Summary View Optimization**: List operations use `*_summary` views for performance, configured in `/src/atomic-crm/providers/supabase/resources.ts`

**Form Structure**: Use admin form layer components from `/src/components/admin/` for consistent validation and error handling

**Kanban Index Management**: Complex drag-drop reordering using index field, see `/src/atomic-crm/opportunities/OpportunityListContent.tsx` for implementation

**RLS Security**: Simple authenticated user policies - `FOR ALL USING (auth.role() = 'authenticated')` - no complex security monitoring

**Storage Integration**: Supabase Storage for attachments with public bucket and RLS policies, processed via lifecycle callbacks

## Relevant Docs

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on validation (Core Principle #3), data provider consolidation (Core Principle #1), and migration approach (Core Principle #9 - no backward compatibility)

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/requirements.md`**: You _must_ read this when implementing any migration phase - contains complete file lists, SQL templates, and execution workflow

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/database-research.docs.md`**: You _must_ read this when creating the fresh schema migration - contains all table structures, indexes, views, functions, and RLS policies

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/opportunities-research.docs.md`**: You _must_ read this when understanding the target state - shows correct component patterns and business logic

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/deals-legacy-research.docs.md`**: You _must_ read this when removing legacy code - contains complete list of files to delete and modify

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/data-provider-research.docs.md`**: You _must_ read this when updating the data provider - shows transformation logic and resource configuration

**`/home/krwhynot/Projects/atomic/.docs/plans/fresh-start-migration/validation-research.docs.md`**: You _must_ read this when implementing Zod schemas - identifies all validation points and consolidation opportunities

**`/home/krwhynot/Projects/atomic/docs/database/09-developer-getting-started.md`**: Reference for database setup and environment configuration

**`/home/krwhynot/Projects/atomic/README.md`**: Project overview and development commands