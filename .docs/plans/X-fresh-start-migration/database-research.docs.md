# Database Architecture Research for Fresh-Start Migration

Database architecture and migration patterns analysis for recreating the Atomic CRM database from scratch.

## Current Migration Structure

### Migration File Organization
- **Primary Location**: `/supabase/migrations/` - Contains timestamped migration files (YYYYMMDDHHMMSS format)
- **Merged Migrations**: `/docs/merged/migrations/` - Contains comprehensive staged migrations with phase numbering
- **Migration Scripts**: `/scripts/mcp-*.js` - NodeJS scripts for migration management using MCP tools

### Migration Naming Convention
- **Current System**: Timestamp format (e.g., `20250113132532_fixcontactorganizationplural.sql`)
- **Merged System**: Phase-based naming (e.g., `001_phase_1_1_foundation_setup.sql`)
- **Migration Tracking**: `migration_history` table tracks applied migrations with status and rollback capabilities

## Database Schema Overview

### Core Entity Tables
- `/supabase/migrations/20240730075029_init_db.sql`: Primary schema initialization
- `/supabase/migrations/20240730075425_init_triggers.sql`: Authentication triggers and functions

### Essential Tables (Base Schema)
1. **companies** - Organization records with sectors, addresses, and metadata
2. **contacts** - Person records with flexible email/phone JSONB storage
3. **opportunities** (formerly deals) - Sales pipeline management
4. **contactNotes** - Communication history for contacts
5. **dealNotes** (legacy) - Notes related to deals/opportunities
6. **sales** - User management and authentication integration
7. **tags** - Flexible categorization with semantic color tokens
8. **tasks** - Activity tracking and reminders

### Enhanced Schema (Via Merged Migrations)
- **contact_organizations** - Many-to-many relationship between contacts and organizations
- **opportunity_participants** - Multi-principal support for opportunities
- **opportunity_products** - Product line items for opportunities
- **migration_history** - Migration tracking and rollback support

## Key Tables and Relationships

### Primary Foreign Key Relationships
```sql
-- Core relationships from init_db.sql
companies.sales_id → sales.id
contacts.company_id → companies.id (CASCADE DELETE)
contacts.sales_id → sales.id
contactNotes.contact_id → contacts.id (CASCADE DELETE)
contactNotes.sales_id → sales.id (CASCADE DELETE)
deals/opportunities.company_id → companies.id (CASCADE DELETE)
deals/opportunities.sales_id → sales.id
dealNotes.deal_id → deals.id (CASCADE DELETE)
tasks.contact_id → contacts.id (CASCADE DELETE)
sales.user_id → auth.users.id (Supabase Auth)
```

### Enhanced Relationships (Merged Migrations)
```sql
-- From merged migration system
companies.parent_company_id → companies.id (hierarchical)
contact_organizations.contact_id → contacts.id
contact_organizations.organization_id → companies.id
opportunity_participants.opportunity_id → opportunities.id (CASCADE DELETE)
opportunity_participants.organization_id → companies.id
opportunity_products.opportunity_id → opportunities.id (CASCADE DELETE)
```

### Critical Indexes
- Soft delete support: `idx_companies_deleted_at`, `idx_contacts_deleted_at`
- Performance: `idx_opportunity_participants_*` family for participant lookups
- Full-text search: GIN indexes on `search_tsv` columns

## Views and Functions

### Database Views
- **companies_summary** (`/supabase/migrations/20240730075029_init_db.sql`): Companies with deal/contact counts
- **contacts_summary** (evolves across migrations): Contact details with company names and task counts
- **init_state**: Authentication state checker
- **opportunities_with_participants**: Enhanced view with participant details (merged migrations)
- **opportunities_legacy**: Backward compatibility view mapping participants to legacy columns

### Functions and Triggers
- **handle_new_user()** (`/supabase/migrations/20240730075425_init_triggers.sql`): Auto-creates sales record on auth signup
- **handle_update_user()**: Syncs user profile updates to sales table
- **create_opportunity_with_participants()**: Creates opportunities with multi-principal support
- **sync_opportunity_participants()**: Manages participant relationships
- **validate_opportunity_participants()**: Business rule enforcement trigger

### Stored Procedures
- Comprehensive business logic functions for opportunity management
- Validation functions with trigger integration
- Helper functions for complex queries and data transformations

## Security Patterns (RLS)

### Row Level Security Implementation
All tables have RLS enabled with standard patterns:

```sql
-- Standard RLS pattern from init_db.sql
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

-- Basic authenticated user policies
CREATE POLICY "Enable read access for authenticated users"
    ON "public"."table_name"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON "public"."table_name"
    FOR INSERT TO authenticated
    WITH CHECK (true);
```

### Authentication Integration
- **Sales Table**: Directly linked to `auth.users` via `user_id`
- **First User Admin**: First registered user automatically becomes administrator
- **Session Management**: Handled by Supabase Auth with custom user metadata

### Storage Policies
- **Attachments Bucket**: Public bucket with authenticated user policies
- File access controlled via RLS on storage objects

## Migration Best Practices Found

### Transaction Safety
```sql
-- From merged migrations - comprehensive error handling
BEGIN;
SAVEPOINT phase_1_1_start;
-- Migration operations...
-- Validation queries with RAISE EXCEPTION
COMMIT;
```

### Data Migration Patterns
1. **Backup Creation**: Create backup tables before destructive operations
2. **Soft Deletes**: Use `deleted_at` columns instead of hard deletes
3. **Migration History**: Track all changes in `migration_history` table
4. **Rollback Support**: Store rollback SQL in migration history

### Schema Evolution Patterns
```sql
-- Safe column additions
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name type DEFAULT value;

-- View recreation pattern
DROP VIEW IF EXISTS view_name CASCADE;
-- Recreate view with new structure
```

### Validation and Integrity
- **Migration validation**: Comprehensive DO blocks with data integrity checks
- **Constraint validation**: Check constraints on enums and business rules
- **Foreign key validation**: Ensure referential integrity during migrations
- **Data consistency**: Validate migrated data meets business requirements

### Edge Functions Integration
- **CORS Configuration**: `/supabase/functions/_shared/cors-config.ts` - Secure domain allowlist
- **Database Admin**: Shared utilities for database operations
- **Email Integration**: Postmark integration for email capture and processing

### Advanced Features
- **Full-text Search**: tsvector columns with GIN indexes for search functionality
- **JSONB Storage**: Flexible email/phone storage with JSONPath queries for filtering
- **Computed Columns**: Generated columns for calculated fields (pricing, totals)
- **Hierarchical Data**: Support for parent-child company relationships
- **Multi-tenant Ready**: Sales-based data isolation with RLS policies

## Critical Dependencies for Fresh Start

### Required Extensions
- Standard PostgreSQL extensions (likely enabled by default in Supabase)
- Full-text search support
- JSONB and JSONPath functionality

### Authentication Setup
- Supabase Auth integration
- Custom user metadata handling
- Trigger-based user profile synchronization

### Storage Configuration
- Public `attachments` bucket creation
- Storage RLS policies for authenticated access

### Initial Data Requirements
- At least one admin user for proper system initialization
- Tag system with semantic color tokens
- Basic opportunity stages and statuses via enum types