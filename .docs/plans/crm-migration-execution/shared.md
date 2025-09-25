# CRM Migration Execution - Shared Architecture Reference

The Atomic CRM migration executes a comprehensive database rename (deals→opportunities), implements single-point Zod validation at API boundaries, removes 639-line over-engineered security monitoring to ~20 lines, and adds TanStack Virtual for list performance. The migration follows a "big bang" approach with four phases: database foundation, data integrity, code simplification, and frontend performance optimization.

## Relevant Files

### Database & Migrations
- `/supabase/migrations/`: Production migration files using YYYYMMDDHHMMSS timestamp format
- `/supabase/migrations/20240730075029_init_db.sql`: Initial schema with deals table to rename
- `/supabase/migrations/20250113132532_fixcontactorganizationplural.sql`: Latest migration example
- `/supabase/config.toml`: Database configuration (PostgreSQL v15, port 54322)

### Data Provider & Validation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider (imports missing validation files)
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Legacy provider to deprecate
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource name mappings (deals→opportunities)
- `/src/atomic-crm/validation/`: Missing directory - needs Zod schemas for all resources
- `/src/atomic-crm/transformers/`: Missing directory - referenced but doesn't exist

### Frontend Lists & Virtualization
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board loading 100 items without virtualization
- `/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Column rendering needing virtual scrolling
- `/src/components/ui/VirtualizedList.tsx`: Existing but unused virtual list component
- `/src/atomic-crm/contacts/ContactListContent.tsx`: Contact list to virtualize
- `/src/atomic-crm/companies/GridList.tsx`: Company grid view for virtualization

### Security & Authentication
- `/src/lib/monitoring/security.ts`: 639-line over-engineered security monitor to simplify
- `/src/atomic-crm/providers/supabase/authProvider.ts`: Core auth provider to keep
- `/src/middleware/securityHeaders.ts`: CSP configuration to simplify
- `/src/components/admin/login-page.tsx`: Login form with basic validation
- `/src/lib/sanitization.ts`: DOMPurify HTML sanitization to keep

## Relevant Tables

### Tables to Rename
- `deals` → `opportunities`
- `dealNotes` → `opportunityNotes`

### Foreign Key Columns to Update
- `dealNotes.deal_id` → `opportunityNotes.opportunity_id`
- `tasks.deal_id` → `tasks.opportunity_id`
- `opportunityParticipants.deal_id` → `opportunityParticipants.opportunity_id`

### Views to Recreate
- `companies_summary`: References deals table
- `contacts_summary`: Uses JSONB email/phone extraction
- `init_state`: Initialization status view

### New Tables in Migration
- `opportunity_participants`: Multi-organization opportunities
- `opportunity_products`: Product line items
- `contact_organizations`: Many-to-many relationships

## Relevant Patterns

**Timestamp Migration Naming**: Use YYYYMMDDHHMMSS format for all migrations (e.g., `20250114093000_rename_deals_to_opportunities.sql`) - see `/supabase/migrations/` for examples

**Single-Point Validation**: Implement Zod schemas at data provider boundaries only, remove form-level validation - pattern defined in CLAUDE.md Core Principle #3

**Virtual List with TanStack**: Replace manual `.map()` rendering with `@tanstack/react-virtual` useVirtualizer hook - see unused `/src/components/ui/VirtualizedList.tsx` for reference pattern

**Fail-Fast Error Handling**: No retry logic or backward compatibility, surface errors immediately - see `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` logError pattern

**Resource Name Mapping**: Use resources.ts for all table name references, never hardcode - pattern in `/src/atomic-crm/providers/supabase/resources.ts`

**RLS Policy Simplification**: Single-tenant "authenticated users access all" pattern - see `/supabase/migrations/20240730075029_init_db.sql` for current complex policies to simplify

**Boy Scout Rule Application**: Fix color violations and TypeScript patterns when editing files - documented in CLAUDE.md Core Principle #15

## Relevant Docs

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on validation strategy, avoiding over-engineering, or making architectural decisions.

**`.docs/plans/crm-migration-execution/requirements.md`**: You _must_ read this when implementing any migration phase, understanding success criteria, or checking what NOT to do.

**`.docs/plans/crm-migration-execution/database-architecture.docs.md`**: You _must_ read this when working on database migrations, indexes, or RLS policies.

**`.docs/plans/crm-migration-execution/data-provider-validation.docs.md`**: You _must_ read this when implementing Zod schemas, consolidating validation, or working with data providers.

**`.docs/plans/crm-migration-execution/frontend-virtualization.docs.md`**: You _must_ read this when implementing list virtualization, working with drag-and-drop, or optimizing performance.

**`.docs/plans/crm-migration-execution/security-auth-patterns.docs.md`**: You _must_ read this when simplifying security monitoring, understanding auth flow, or removing over-engineered features.