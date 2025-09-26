# CRM Migration Database Research

This research documents the current database schema and migration structure for the Atomic CRM system, focusing on the planned migration from the current schema to an enhanced enterprise-grade CRM architecture.

## Current Schema Overview

The current Atomic CRM uses a straightforward relational schema centered around core CRM entities:
- **Companies**: Organization records with basic contact information
- **Contacts**: People associated with companies, using JSONB for flexible email/phone storage
- **Deals**: Sales opportunities with stages and amounts
- **Tasks**: Activity tracking and reminders
- **Notes**: Communication history for both contacts and deals
- **Tags**: Flexible categorization system
- **Sales**: User management for CRM access

## Migration Target Schema

The migration introduces a sophisticated B2B relationship model supporting:
- **Principal-Distributor Relationships**: Many-to-many company relationships with commission tracking
- **Enhanced Opportunity Management**: Replacing deals with opportunities that support multi-party relationships
- **Product Catalog System**: Principals can manage product catalogs with distributor access
- **Advanced Contact Relationships**: Many-to-many contact-organization relationships with role tracking
- **Activity System**: Comprehensive interaction and engagement tracking

## Key Tables and Relationships

### Core Tables (Current Schema)

**Companies** (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:1-21`)
```sql
- id (bigint, primary key)
- name (text, required)
- sector, size, linkedin_url, website, phone_number
- address, zipcode, city, stateAbbr, country
- sales_id (bigint, FK to sales.id)
- context_links (json), description, revenue, tax_identifier
- logo (jsonb)
```

**Contacts** (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:39-61`)
```sql
- id (bigint, primary key)
- first_name, last_name, gender, title
- email_jsonb (jsonb) - migrated from text field
- phone_jsonb (jsonb) - migrated from separate phone_1/phone_2 fields
- avatar (jsonb), linkedin_url, background
- company_id (bigint, FK to companies.id)
- sales_id (bigint, FK to sales.id)
- tags (bigint[]), status, has_newsletter
```

**Deals** (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:79-94`)
```sql
- id (bigint, primary key)
- name (text, required), category, stage (text, required)
- company_id (bigint, FK to companies.id)
- contact_ids (bigint[])
- amount (bigint), description
- created_at, updated_at, archived_at, expected_closing_date
- sales_id (bigint, FK to sales.id)
- index (smallint) - for stage ordering
```

### Enhanced Schema (Migration Target)

**Enhanced Companies** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql:104-116`)
```sql
+ organization_type (enum: customer, principal, distributor, prospect, vendor, partner)
+ is_principal (boolean)
+ is_distributor (boolean)
+ parent_company_id (bigint, self-reference)
+ segment (text), priority (varchar(1): A,B,C,D)
+ deleted_at (timestamptz), search_tsv (tsvector)
```

**Opportunities** (replaces Deals) (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql:167-199`)
```sql
- Renamed from deals table
+ stage (opportunity_stage enum: lead, qualified, needs_analysis, proposal, negotiation, closed_won, closed_lost, nurturing)
+ status (opportunity_status enum: active, on_hold, nurturing, stalled, expired)
+ priority (priority_level enum: low, medium, high, critical)
+ probability (integer 0-100), estimated_close_date, actual_close_date
+ customer_organization_id, principal_organization_id, distributor_organization_id (bigint FKs)
+ founding_interaction_id (bigint)
+ stage_manual, status_manual (boolean)
+ next_action (text), next_action_date (date)
+ competition, decision_criteria (text)
+ deleted_at (timestamptz), search_tsv (tsvector)
```

**Contact Organizations Junction** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql:14-35`)
```sql
- Many-to-many relationships between contacts and organizations
- is_primary_decision_maker, is_primary_contact (boolean)
- role (contact_role enum), purchase_influence, decision_authority
- relationship_start_date, relationship_end_date
- notes, soft deletes
```

**Products** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql:15-46`)
```sql
- principal_id (bigint, FK to companies.id)
- name, description, sku, category
- unit_price, unit_cost (numeric)
- is_active (boolean), min_order_quantity (integer)
- Unique SKU per principal constraint
```

**Principal Distributor Relationships** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql:57-101`)
```sql
- principal_id, distributor_id (bigint FKs)
- relationship_status (active, pending, terminated)
- start_date, end_date, commission_percent
- Validation constraints ensuring proper principal/distributor flags
```

## Migration Scripts Analysis

### Stage 1 - Foundation (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/`)

**Phase 1.1 - Foundation Setup**
- Creates enum types for organization types, contact roles, opportunity stages
- Enhances companies table with organization type flags
- Renames deals → opportunities with enhanced fields
- Adds soft delete support and full-text search
- Migration tracking with `migration_history` table

**Phase 1.2 - Contact-Organization Relationships**
- Creates `contact_organizations` junction table
- Adds `contact_preferred_principals` for advocacy tracking
- Helper functions for relationship management
- Creates influence profile views

**Phase 1.3 - Opportunity Enhancements** (referenced but not examined)
- Likely adds opportunity participants and product relationships

**Phase 1.4 - Activities System** (referenced but not examined)
- Probably implements interaction and engagement tracking

### Stage 1.5 - Basic Principal Features (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1_5/`)

**Phase 1.5 - Products and Relationships**
- Creates basic products table with principal ownership
- Implements principal-distributor relationships
- Auto-populates relationships from existing opportunity data
- Helper functions for distributor product access

### Current Schema Modifications

**Email/Phone JSONB Migration**
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250109152531_email_jsonb.sql` - Migrates email from text to JSONB array
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250113132531_phone_jsonb.sql` - Migrates phone fields to JSONB array

## RLS Policies and Security

### Current RLS Implementation (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:317-551`)

All tables use basic authenticated user policies:
- **Select**: `authenticated` role can read all records
- **Insert**: `authenticated` role can create records
- **Update**: `authenticated` role can update records
- **Delete**: `authenticated` role can delete records

### Enhanced Security (Migration Target)

**Soft Delete Aware Policies** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql:336-353`)
```sql
-- Updated policies respect soft deletes
USING (deleted_at IS NULL)
```

**Storage Policies** (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:560-562`)
- Attachments bucket with authenticated user access
- SELECT, INSERT, DELETE policies for 'attachments' bucket

### Migration Constraints and Validation

**Principal/Distributor Validation** (`/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql:89-100`)
```sql
-- Ensures companies are properly flagged before relationships
CONSTRAINT must_be_principal CHECK (EXISTS (SELECT 1 FROM companies WHERE id = principal_id AND is_principal = true))
CONSTRAINT must_be_distributor CHECK (EXISTS (SELECT 1 FROM companies WHERE id = distributor_id AND is_distributor = true))
```

**Unique Constraints with Soft Deletes**
```sql
-- SKU uniqueness per principal
UNIQUE (principal_id, sku) WHERE deleted_at IS NULL
-- Contact-organization relationship uniqueness
UNIQUE(contact_id, organization_id, deleted_at)
```

## Key Database Views

**Summary Views** (`/home/krwhynot/Projects/atomic/supabase/migrations/20240730075029_init_db.sql:565-599`)
- `companies_summary` - Aggregates deal and contact counts
- `contacts_summary` - Includes company name and task counts with email/phone FTS fields

**Migration Target Views**
- `contact_influence_profile` - Cross-organization influence tracking
- `principal_advocacy_dashboard` - Principal relationship metrics
- `principal_product_summary` - Product and distributor counts
- `distributor_relationship_summary` - Available products and principals

## TypeScript Interface Alignment

The current TypeScript types (`/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`) align with the basic schema:
- `Company`, `Contact`, `Deal` types match current database structure
- Email/phone fields use JSONB array types: `EmailAndType[]`, `PhoneNumberAndType[]`
- React Admin integration via `RaRecord` base type

**Migration Requirements**:
- New types needed for `Opportunity` (replacing `Deal`)
- Junction table types: `ContactOrganization`, `PrincipalDistributorRelationship`
- Product catalog types: `Product`
- Enhanced enum types for opportunity stages, contact roles, organization types

## Data Provider Integration

The Supabase data provider (`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`) uses:
- Summary views for list operations (`companies_summary`, `contacts_summary`)
- Full-text search on specific fields via `@ilike` operators
- JSONB path queries for email/phone search: `jsonb_path_query_array(email_jsonb, '$[*].email')`
- Lifecycle callbacks for avatar generation and tag color validation

**Migration Impact**:
- New resources need provider support: `opportunities`, `products`, `contact_organizations`
- Enhanced search capabilities for new tsvector fields
- Multi-organization contact handling in data transformations