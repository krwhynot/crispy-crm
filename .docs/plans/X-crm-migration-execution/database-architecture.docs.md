# Database Architecture Research - Atomic CRM

Analysis of current database structure, migration patterns, and the planned deals→opportunities migration execution.

## Current Schema Overview

### Core Tables (Production)
- **companies**: Organizations with sectors, contact info, logo (JSONB)
- **contacts**: Person records with JSONB email/phone fields (migrated to JSONB in 2025-01)
- **deals**: Sales opportunities (to be renamed to `opportunities`)
- **dealNotes**: Notes related to deals (to be renamed to `opportunityNotes`)
- **contactNotes**: Notes for contacts
- **tasks**: Activity tracking with due dates
- **tags**: Categorization with color system
- **sales**: User/salesperson records linked to auth.users

### Junction/Relationship Tables (Planned)
- **contact_organizations** (renamed from `contact_organization` in latest migration)
- **opportunity_participants**: Multi-organization opportunity tracking
- **opportunity_products**: Product line items for opportunities

### Summary Views
- **companies_summary**: Aggregated company data with deal/contact counts
- **contacts_summary**: Contact data with JSONB email/phone extraction
- **init_state**: Initialization status view

## Migration Patterns Used

### Naming Convention
- **Timestamp Format**: `YYYYMMDDHHMMSS_description.sql` (e.g., `20250113132532_fixcontactorganizationplural.sql`)
- **Sequential Execution**: Chronological ordering ensures proper dependency resolution
- **Descriptive Names**: Clear indication of migration purpose

### Migration Structure Examples
```sql
-- Basic pattern from actual migrations
alter table contacts add column email_jsonb jsonb;
update contacts set email_jsonb = ('[{"email": "' || email || '", "type": "Other"}]')::jsonb;
drop view contacts_summary;
alter table contacts drop column email;
create view contacts_summary as select...;
```

### Planned Advanced Migration Pattern (Stage 1)
```sql
-- Transaction safety with savepoints
BEGIN;
SAVEPOINT phase_1_1_start;

-- Migration tracking
CREATE TABLE migration_history (
    phase_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ROLLBACK TO phase_1_1_start; if needed
```

## Tables Affected by deals→opportunities Rename

### Direct Renames Required
1. **`deals` → `opportunities`**: Main table rename
2. **`dealNotes` → `opportunityNotes`**: Related notes table
3. **View Updates**: `companies_summary` references deals table
4. **Foreign Keys**: Cascade updates for deal_id references

### New Tables in Migration
- **opportunity_participants**: Multi-organization support
- **opportunity_products**: Product catalog integration
- **contact_organizations**: Many-to-many contact-company relationships

### Backward Compatibility Strategy
From `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`:
```typescript
// NO BACKWARD COMPATIBILITY approach
// deals: REMOVED - use opportunities
// dealNotes: REMOVED - use opportunityNotes
```

## Missing Indexes and Performance Issues

### Current Index Coverage
**Primary Keys Only**: All tables have basic primary key indexes
```sql
CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);
CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id);
```

### Missing Performance Indexes
1. **Foreign Key Indexes**: No indexes on `sales_id`, `company_id`, `contact_id` columns
2. **Search Indexes**: No full-text search indexes for companies.name, contacts names
3. **Date Range Indexes**: No indexes on created_at, updated_at, expected_closing_date
4. **Status/Stage Indexes**: No indexes on deals.stage, contacts.status
5. **JSONB Indexes**: No GIN indexes on email_jsonb, phone_jsonb for efficient queries

### Planned Performance Indexes (from stage migrations)
```sql
CREATE INDEX idx_opportunity_participants_opp_id
ON opportunity_participants(opportunity_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_contact_id
ON contact_organizations(contact_id) WHERE deleted_at IS NULL;
```

## RLS Policy Analysis

### Current RLS Pattern
**Simple Authentication-Based**: All policies use basic authenticated user pattern
```sql
create policy "Enable read access for authenticated users"
on "public"."companies" as permissive for select to authenticated using (true);

create policy "Enable insert for authenticated users only"
on "public"."deals" as permissive for insert to authenticated with check (true);
```

### RLS Policy Coverage
- **Full Coverage**: All main tables have RLS enabled with CRUD policies
- **Storage Bucket**: Attachments bucket has proper policies
- **No Row-Level Filtering**: Policies allow access to all data for authenticated users (no multi-tenancy)

### Policy Issues
1. **No Multi-Tenancy**: All authenticated users see all data
2. **No Sales Territory**: No filtering by sales_id for user-specific data
3. **Missing Delete Policies**: Some tables lack explicit delete policies
4. **Tags Policy Gap**: Tags policies added separately in migration `20240813084010_tags_policy.sql`

## Key Files and Locations

### Migration Files
- **`/home/krwhynot/Projects/atomic/supabase/migrations/`**: Official production migrations
- **`/home/krwhynot/Projects/atomic/docs/merged/migrations/`**: Staged migration plans
- **Latest**: `20250113132532_fixcontactorganizationplural.sql` (contact_organization → contact_organizations)

### Configuration
- **`/home/krwhynot/Projects/atomic/supabase/config.toml`**: Database configuration (port 54322, version 15)
- **`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`**: Resource mapping and configuration

### Data Provider
- **`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`**: Supabase data access layer
- **`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`**: Unified provider implementation

### Database Schema
- **`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql`**: Initial schema (companies, contacts, deals, etc.)
- **`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075425_init_triggers.sql`**: User management triggers

## Migration Dependencies and Risks

### Schema Dependencies
1. **Views**: companies_summary, contacts_summary depend on main tables
2. **Foreign Keys**: Cascading relationships between deals→companies, contacts→companies
3. **JSONB Migration**: Contact phone/email fields already migrated to JSONB
4. **Triggers**: User creation/update triggers for sales table

### Risk Areas
1. **No Rollback Testing**: Production migrations lack tested rollback procedures
2. **View Recreation**: Views must be dropped/recreated during column changes
3. **Data Integrity**: No transaction wrapping in current migration files
4. **Index Performance**: Missing indexes could cause performance degradation during migration

### Critical Migration Constraints
- **PostgreSQL 15**: Database major version constraint
- **RLS Policies**: Must be recreated for renamed tables
- **Storage Bucket**: Attachments bucket policies reference table names
- **Authentication**: Supabase Auth integration through sales.user_id foreign key