# Database Architecture

## Overview

Atomic CRM employs a PostgreSQL database hosted on Supabase, featuring a sophisticated architecture designed for multi-user collaboration, data integrity, and security. The database consists of 57 migrations that have evolved the schema from initial setup through multiple refinements, incorporating industry-standard patterns like soft deletes, audit trails, optimistic locking, and full-text search.

The architecture implements a **two-layer security model** combining PostgreSQL GRANT permissions with Row Level Security (RLS) policies, ensuring both table-level access control and row-level data isolation. This design supports a small team sharing contacts, organizations, and opportunities while maintaining personal task lists.

## Database Type and Platform

**PostgreSQL 14+ via Supabase**

- **Local Development**: Docker-based PostgreSQL instance managed by Supabase CLI
- **Production**: Supabase hosted PostgreSQL with automatic backups and replication
- **Version Control**: All schema changes tracked in `supabase/migrations/` directory
- **Migration Tool**: Supabase CLI with support for both migration-first and Studio-first workflows

The database leverages PostgreSQL-specific features including:
- JSONB data type for flexible array storage (email, phone, attachments)
- Full-text search with `tsvector` columns and GIN indexes
- Triggers for automatic timestamp updates and data validation
- Custom ENUM types for controlled vocabularies
- Foreign key constraints with cascading deletes
- Check constraints for data validation

## Core Schema Design

### Primary Tables

The database revolves around eight core entity tables that form the backbone of the CRM:

#### 1. **sales** - User Accounts
```sql
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID,  -- Links to auth.users
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

This table serves as the **identity hub** for the application. Every authenticated user has a corresponding sales record created automatically via the `handle_new_user()` trigger function. The `sales.id` (bigint) is used throughout the application for ownership and audit tracking, rather than auth.uid() (UUID), providing a simpler and more efficient foreign key reference.

#### 2. **organizations** - Companies and Entities
```sql
CREATE TABLE organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  organization_type organization_type DEFAULT 'unknown',
  is_principal BOOLEAN DEFAULT false,
  is_distributor BOOLEAN DEFAULT false,
  parent_organization_id BIGINT REFERENCES organizations(id),
  segment_id UUID REFERENCES segments(id),

  -- Contact information
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,

  -- Business details
  priority VARCHAR(1) CHECK (priority IN ('A','B','C','D')) DEFAULT 'C',
  annual_revenue NUMERIC(15,2),
  employee_count INTEGER,
  founded_year INTEGER,
  description TEXT,
  tax_identifier TEXT,

  -- Metadata
  logo_url TEXT,
  linkedin_url TEXT,
  context_links JSONB,  -- Array of related URLs
  notes TEXT,

  -- Audit trail
  sales_id BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,

  -- Full-text search
  search_tsv TSVECTOR,

  -- Import tracking
  import_session_id UUID
);
```

Organizations support hierarchical relationships via `parent_organization_id` and categorization through the `organization_type` ENUM (customer, principal, distributor, prospect, partner, unknown). The `segment_id` field links to industry/market segments for reporting and filtering.

**Key Indexes:**
- Full-text search: `CREATE INDEX idx_organizations_search ON organizations USING GIN(search_tsv)`
- Soft delete filter: `CREATE INDEX idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL`
- Parent lookup: `CREATE INDEX idx_organizations_parent ON organizations(parent_organization_id)`

#### 3. **contacts** - Individual People
```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,

  -- JSONB arrays for flexible multi-value fields
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,

  -- Organization relationship (simplified from many-to-many)
  organization_id BIGINT REFERENCES organizations(id),

  -- Job information
  title TEXT,
  department TEXT,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Personal details
  birthday DATE,
  gender TEXT,

  -- Social profiles
  linkedin_url TEXT,
  twitter_handle TEXT,

  -- Activity tracking
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- Categorization
  tags BIGINT[] DEFAULT '{}',  -- References tags.id array
  notes TEXT,

  -- Audit trail
  sales_id BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,

  -- Full-text search
  search_tsv TSVECTOR
);
```

The `organization_id` field represents the **primary organization** for a contact, simplifying what was previously a many-to-many relationship through the deprecated `contact_organizations` table. Email and phone are stored as JSONB arrays following the pattern:

```json
[
  {"email": "john@example.com", "type": "Work"},
  {"email": "john.personal@gmail.com", "type": "Home"}
]
```

This JSONB pattern allows unlimited email/phone entries with typed categorization while remaining indexable and queryable.

#### 4. **opportunities** - Sales Pipeline
```sql
CREATE TABLE opportunities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,

  -- Pipeline state
  stage opportunity_stage DEFAULT 'new_lead',
  status opportunity_status DEFAULT 'active',
  priority priority_level DEFAULT 'medium',

  -- Timeline
  estimated_close_date DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  actual_close_date DATE,

  -- Multi-stakeholder support
  customer_organization_id BIGINT REFERENCES organizations(id),
  principal_organization_id BIGINT REFERENCES organizations(id),
  distributor_organization_id BIGINT REFERENCES organizations(id),

  -- Contacts (array for backward compatibility)
  contact_ids BIGINT[] DEFAULT '{}',

  -- Ownership
  opportunity_owner_id BIGINT REFERENCES sales(id),
  account_manager_id BIGINT REFERENCES sales(id),

  -- Deal details
  founding_interaction_id BIGINT REFERENCES activities(id),
  lead_source TEXT CHECK (lead_source IN (
    'referral', 'trade_show', 'website', 'cold_call',
    'email_campaign', 'social_media', 'partner', 'existing_customer'
  )),
  competition TEXT,
  decision_criteria TEXT,

  -- Next actions
  next_action TEXT,
  next_action_date DATE,

  -- Manual overrides
  stage_manual BOOLEAN DEFAULT false,
  status_manual BOOLEAN DEFAULT false,

  -- Categorization
  tags TEXT[] DEFAULT '{}',

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,

  -- Full-text search
  search_tsv TSVECTOR,

  -- Ordering for kanban view
  index INTEGER
);
```

Opportunities support **multi-stakeholder relationships** through denormalized organization references (customer, principal, distributor), enabling fast queries for "all opportunities involving Principal X" without joins. The `account_manager_id` ensures proper account ownership constraints via a unique index:

```sql
CREATE UNIQUE INDEX idx_opportunities_customer_account_manager
  ON opportunities(customer_organization_id, account_manager_id)
  WHERE deleted_at IS NULL;
```

This prevents multiple sales reps from "owning" the same customer organization.

#### 5. **products** - Product Catalog
```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  principal_id BIGINT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL,

  -- Categorization
  category product_category NOT NULL,

  -- Pricing (simplified - no complex pricing models)
  list_price NUMERIC(12,2),
  currency_code TEXT DEFAULT 'USD' CHECK (currency_code ~ '^[A-Z]{3}$'),
  unit_of_measure TEXT DEFAULT 'each',

  -- Status
  status product_status DEFAULT 'active',

  -- Food-specific attributes
  certifications TEXT[],  -- e.g., ['Organic', 'Non-GMO', 'Kosher']
  allergens TEXT[],
  ingredients TEXT,
  nutritional_info JSONB,

  -- Marketing
  marketing_description TEXT,
  manufacturer_part_number TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,

  -- Full-text search
  search_tsv TSVECTOR
);
```

Products underwent a **major simplification** in migration `20251028040008_remove_product_pricing_and_uom.sql`, removing complex pricing models, inventory tracking, and unit of measure conversions. The architecture now focuses on **product associations** rather than pricing calculations, aligning with the principal-centric CRM design.

#### 6. **tasks** - Personal To-Do Items
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  type task_type DEFAULT 'None',

  -- Scheduling
  due_date DATE,
  reminder_date DATE,

  -- Completion tracking
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority priority_level DEFAULT 'medium',

  -- Context links
  contact_id BIGINT REFERENCES contacts(id),
  opportunity_id BIGINT REFERENCES opportunities(id),

  -- Ownership (personal tasks)
  sales_id BIGINT REFERENCES sales(id),

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id)
);
```

Tasks are **personal** to each sales rep, unlike shared contacts/organizations/opportunities. This is enforced through RLS policies that filter by `sales_id = get_current_sales_id()`.

#### 7. **activities** - Interactions and Engagements
```sql
CREATE TABLE activities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  activity_type activity_type NOT NULL,  -- 'engagement' or 'interaction'
  type interaction_type NOT NULL,  -- call, email, meeting, demo, etc.

  -- Core details
  subject TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,

  -- Context
  contact_id BIGINT REFERENCES contacts(id),
  organization_id BIGINT REFERENCES organizations(id),
  opportunity_id BIGINT REFERENCES opportunities(id),

  -- Outcome
  outcome TEXT,
  sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Metadata
  location TEXT,
  attendees TEXT[],
  attachments TEXT[],
  tags TEXT[],

  -- Audit trail
  created_by BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT check_has_contact_or_org
    CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL),
  CONSTRAINT check_interaction_has_opportunity
    CHECK ((activity_type = 'interaction' AND opportunity_id IS NOT NULL)
           OR activity_type = 'engagement')
);
```

Activities differentiate between **engagements** (general contact/organization interactions) and **interactions** (opportunity-specific touchpoints). The constraints ensure proper context: interactions must have an opportunity, while both types must have either a contact or organization.

#### 8. **audit_trail** - Field-Level Change Tracking
```sql
CREATE TABLE audit_trail (
  audit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT REFERENCES sales(id),
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

Implemented in migration `20251103232837_create_audit_trail_system.sql`, this table provides **tamper-proof field-level change history** for organizations, contacts, and opportunities. The `audit_changes()` trigger function automatically logs all field modifications:

```sql
CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes();
```

**Optimized indexes** support common queries:
- `idx_audit_trail_table_record ON audit_trail(table_name, record_id, changed_at DESC)` - "Show all changes to opportunity #123"
- `idx_audit_trail_changed_by ON audit_trail(changed_by, changed_at DESC)` - "Show all changes by Sarah"

### Junction Tables

#### opportunity_contacts
```sql
CREATE TABLE opportunity_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(50),  -- 'decision_maker', 'influencer', 'champion', etc.
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);
```

This junction table implements the **industry-standard many-to-many pattern** for opportunity-contact relationships (used by Salesforce, HubSpot, Pipedrive). Migration `20251028213020_create_opportunity_contacts_junction_table.sql` migrated existing data from the `opportunities.contact_ids` array while maintaining the array for backward compatibility during frontend migration.

#### opportunity_participants
```sql
CREATE TABLE opportunity_participants (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id),
  organization_id BIGINT NOT NULL REFERENCES organizations(id),
  role VARCHAR(20) CHECK (role IN ('customer', 'principal', 'distributor', 'partner', 'competitor')),
  is_primary BOOLEAN DEFAULT false,
  commission_rate NUMERIC(5,4) CHECK (commission_rate BETWEEN 0 AND 1),
  territory TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
  deleted_at TIMESTAMPTZ
);
```

Supports **multi-party opportunities** with role-based participation and commission tracking. Validation ensures at least one customer participant per opportunity via the `create_opportunity_with_participants()` RPC function.

#### opportunity_products
```sql
CREATE TABLE opportunity_products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

Links products to opportunities for tracking product associations without pricing details (pricing removed in migration `20251029051621_update_sync_rpc_remove_pricing.sql`).

### Supporting Tables

- **tags**: Reusable labels with color and usage tracking
- **segments**: Industry/market categories for organizations (UUID-based)
- **contactNotes** / **opportunityNotes**: Timestamped notes with user-specified dates
- **contact_preferred_principals**: Tracks contact preferences for principal organizations with advocacy strength (0-100 scale)

## ENUM Types and Controlled Vocabularies

The database defines nine ENUM types for type-safe, validated dropdown values:

### activity_type
```sql
CREATE TYPE activity_type AS ENUM ('engagement', 'interaction');
```
Differentiates general engagements from opportunity-specific interactions.

### interaction_type
```sql
CREATE TYPE interaction_type AS ENUM (
  'call', 'email', 'meeting', 'demo', 'proposal', 'follow_up',
  'trade_show', 'site_visit', 'contract_review', 'check_in', 'social'
);
```
Standard CRM interaction categories.

### opportunity_stage
```sql
CREATE TYPE opportunity_stage AS ENUM (
  'new_lead', 'initial_outreach', 'sample_visit_offered',
  'awaiting_response', 'feedback_logged', 'demo_scheduled',
  'closed_won', 'closed_lost'
);
```
Pipeline stages for opportunity progression.

### opportunity_status
```sql
CREATE TYPE opportunity_status AS ENUM (
  'active', 'on_hold', 'nurturing', 'stalled', 'expired'
);
```
Operational status independent of pipeline stage.

### organization_type
```sql
CREATE TYPE organization_type AS ENUM (
  'customer', 'principal', 'distributor', 'prospect', 'partner', 'unknown'
);
```
Organization categorization for filtering and reporting.

### priority_level
```sql
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
```
Used by tasks and opportunities.

### product_status
```sql
CREATE TYPE product_status AS ENUM (
  'active', 'discontinued', 'seasonal', 'coming_soon', 'limited_availability'
);
```
Product lifecycle status.

### task_type
```sql
CREATE TYPE task_type AS ENUM (
  'Call', 'Email', 'Meeting', 'Follow-up', 'Proposal',
  'Discovery', 'Administrative', 'None'
);
```
Task categorization for activity planning.

### contact_role
```sql
CREATE TYPE contact_role AS ENUM (
  'decision_maker', 'influencer', 'buyer', 'end_user',
  'gatekeeper', 'champion', 'technical', 'executive'
);
```
Contact's role in purchasing decisions.

## JSONB Array Patterns

Email, phone, and other multi-value fields use a **three-layer pattern**:

### 1. Database Schema
```sql
email JSONB DEFAULT '[]'::jsonb,
phone JSONB DEFAULT '[]'::jsonb,
attachments TEXT[],  -- Simple text array for file paths
```

### 2. Zod Validation (UI Layer)
```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneAndTypeSchema).default([]),
});
```

### 3. Form Input
```tsx
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={types} />
  </SimpleFormIterator>
</ArrayInput>
```

**Key principle**: Default values come from Zod schemas via `zodSchema.partial().parse({})`, not from form components. This ensures **single source of truth** for data structure.

## Relationships and Foreign Keys

### Cascading Deletes
Foreign keys use `ON DELETE CASCADE` for dependent records:
- Deleting an organization cascades to `opportunity_participants`, `opportunity_products`
- Deleting an opportunity cascades to `opportunity_contacts`, `opportunity_products`, `activities`
- Deleting a contact cascades to `contact_organizations`, `contact_preferred_principals`

### Soft Deletes
Most tables use `deleted_at TIMESTAMPTZ` for **soft deletion**:
```sql
-- Filter out deleted records in queries
WHERE deleted_at IS NULL

-- Soft delete operation
UPDATE opportunities SET deleted_at = NOW() WHERE id = 123;
```

This preserves referential integrity while allowing "undo" functionality and historical reporting.

### Audit Trail References
Audit fields link to the `sales` table:
```sql
created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL,
updated_by BIGINT REFERENCES sales(id) ON DELETE SET NULL
```

Using `ON DELETE SET NULL` prevents cascading deletes when a user is removed, preserving the audit trail.

## Security Architecture: Two-Layer Model

The database implements **defense in depth** through GRANT permissions and Row Level Security.

### Layer 1: GRANT Permissions (Table Access)
```sql
-- Grant table-level access
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Grant for all tables (batch operation)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

**Critical rule**: Without GRANT, RLS policies alone will return "permission denied" errors. This is a common mistake caught in migration `20251029070224_grant_authenticated_permissions.sql`.

### Layer 2: Row Level Security (Data Isolation)
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Shared access pattern (contacts, organizations, opportunities)
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- All team members can view all contacts

-- Personal access pattern (tasks)
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (sales_id = get_current_sales_id());  -- Only see own tasks
```

### Security Patterns

#### Shared Resources (Collaborative)
Contacts, organizations, opportunities, and products use **shared access**:
```sql
USING (true)  -- All authenticated users can access all records
WITH CHECK (true)  -- All authenticated users can create/modify records
```

This supports **small team collaboration** where everyone works on the same customer base.

#### Personal Resources (Individual)
Tasks use **personal access**:
```sql
USING (sales_id = get_current_sales_id())
WITH CHECK (sales_id = get_current_sales_id())
```

Each sales rep only sees their own tasks, providing personal workspace privacy.

#### Complex Access (Opportunity-Based)
Junction tables like `opportunity_contacts` inherit access from parent opportunities:
```sql
CREATE POLICY "Users can view opportunity_contacts through opportunities"
  ON opportunity_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );
```

### Helper Function: get_current_sales_id()
```sql
CREATE OR REPLACE FUNCTION public.get_current_sales_id()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$$;
```

This function simplifies RLS policies by converting `auth.uid()` (UUID) to `sales.id` (bigint), making policies more readable and efficient. Introduced in migration `20251018204500_add_helper_function_and_audit_trail.sql`.

### Security Invoker for Views
Views use `security_invoker` mode to **respect RLS policies**:
```sql
CREATE OR REPLACE VIEW contacts_summary
WITH (security_invoker = true)  -- CRITICAL: Enforces RLS
AS
SELECT c.*, o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id
WHERE c.deleted_at IS NULL;
```

Using `security_definer` (the default) would **bypass RLS**, creating a security vulnerability. This was fixed in migration `20251020002305_fix_contacts_summary_security_invoker.sql`.

## Migration Strategy

### Version Control Approach
All schema changes are tracked in `supabase/migrations/` with timestamped filenames:
```
20251018152315_cloud_schema_fresh.sql          # Base schema
20251018203500_update_rls_for_shared_team_access.sql
20251028040008_remove_product_pricing_and_uom.sql
20251103232837_create_audit_trail_system.sql
```

Migrations are **immutable** - once deployed to production, they are never modified. New changes require new migration files.

### Migration Workflow

#### Local Development
```bash
# 1. Start Supabase
npm run db:local:start

# 2. Create migration
npx supabase migration new add_feature_name

# 3. Edit migration file
code supabase/migrations/*_add_feature_name.sql

# 4. Test locally
npm run db:local:reset  # Drops DB, runs all migrations + seed

# 5. Verify in browser
npm run dev
```

#### Production Deployment
```bash
# 1. Push to cloud (requires confirmation)
npm run db:cloud:push

# Shows pending migrations, generates diff, requires "APPLY MIGRATIONS" typed confirmation
```

### Migration Checklist
Every table migration **MUST include**:
- ✅ `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
- ✅ RLS policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Indexes for foreign keys and query filters
- ✅ Timestamps: `created_at`, `updated_at`
- ✅ Soft delete: `deleted_at` column (if applicable)
- ✅ Audit fields: `created_by`, `updated_by`
- ✅ Table and column comments
- ✅ GRANT permissions: `GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated`

### Key Migrations and Evolution

#### 20251018152315_cloud_schema_fresh.sql (109KB)
The foundational migration establishing all core tables, ENUM types, functions, triggers, and indexes. This represents the consolidated schema after initial development.

#### 20251018203500_update_rls_for_shared_team_access.sql
**Architectural shift**: Changed RLS policies from user-isolated (`sales_id = auth.uid()`) to team-shared (`USING (true)`) for contacts, organizations, opportunities, and products. Tasks remained personal. This supports the small team collaboration model.

#### 20251018204500_add_helper_function_and_audit_trail.sql
Introduced `get_current_sales_id()` helper function and `updated_by` columns across all shared tables. Added `set_updated_by()` trigger function for automatic audit tracking.

#### 20251028040008_remove_product_pricing_and_uom.sql
**Major simplification**: Removed complex pricing models, inventory tracking, and unit of measure conversions. Products became association-only entities, aligning with the principal-centric design philosophy.

#### 20251028213020_create_opportunity_contacts_junction_table.sql
Migrated from array-based `opportunities.contact_ids` to proper junction table for many-to-many relationships. Preserved array for backward compatibility during frontend migration.

#### 20251029022924_add_opportunity_optimistic_locking.sql
Implemented **optimistic locking** via the `check_opportunity_concurrent_update()` trigger, detecting concurrent edits within 1-second windows and logging to database notices. Integrates with React Admin's `previousData.updated_at` version checking.

#### 20251103232837_create_audit_trail_system.sql
Created comprehensive field-level change tracking with the `audit_trail` table and `audit_changes()` trigger function. Provides tamper-proof history for compliance and debugging.

#### 20251101231344_optimize_activity_log_rpc.sql
Performance optimization consolidating 5 separate queries into a single `get_activity_log()` RPC function using UNION ALL. Reduced network round-trips from 5 to 1 for activity timeline display.

## Views and Summary Tables

### contacts_summary
```sql
CREATE OR REPLACE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT c.*, o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;
```

Denormalized view joining contacts with their primary organization name for efficient list rendering.

### opportunities_summary
```sql
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
  o.*,
  cust_org.name AS customer_organization_name,
  prin_org.name AS principal_organization_name,
  dist_org.name AS distributor_organization_name
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;
```

Provides pre-joined organization names for opportunity listings, avoiding N+1 query problems.

### organizations_summary
A complex view aggregating:
- Organization details
- Count of opportunities (`nb_opportunities`)
- Contact counts
- Activity metrics

Used for dashboard reporting and organization list views.

### distinct_product_categories
```sql
CREATE OR REPLACE VIEW distinct_product_categories AS
SELECT DISTINCT category
FROM products
WHERE deleted_at IS NULL
  AND category IS NOT NULL
ORDER BY category;
```

Generates dynamic dropdown options from actual data (migration `20251030025007_create_distinct_product_categories_view.sql`).

## RPC Functions and Stored Procedures

### get_activity_log(organization_id, sales_id, limit)
```sql
CREATE OR REPLACE FUNCTION get_activity_log(
  p_organization_id BIGINT DEFAULT NULL,
  p_sales_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 250
) RETURNS JSON
```

Consolidates activity timeline from 5 sources:
1. Organization created events
2. Contact created events
3. Contact notes
4. Opportunities created
5. Opportunity notes

Returns JSON array sorted by date DESC, optimized for React Admin timeline components.

### sync_opportunity_with_products(opportunity_data, products_to_create, products_to_update, product_ids_to_delete)
```sql
CREATE OR REPLACE FUNCTION sync_opportunity_with_products(
  opportunity_data JSONB,
  products_to_create JSONB,
  products_to_update JSONB,
  product_ids_to_delete INTEGER[]
) RETURNS JSONB
```

Atomic operation for updating opportunities and their product associations in a single transaction. Includes validation:
- Backend JSONB parsing checks (migration `20251030131117_fix_rpc_array_parsing.sql`)
- Response format validation (migration `20251030201606_fix_sync_rpc_response_format.sql`)

### create_opportunity_with_participants(opportunity_data, participants)
```sql
CREATE OR REPLACE FUNCTION create_opportunity_with_participants(
  p_opportunity_data JSONB,
  p_participants JSONB[]
) RETURNS BIGINT
```

Creates opportunity with multi-party participants, enforcing:
- At least one customer participant
- Valid participant roles
- Proper commission rate ranges (0-1)

### log_engagement / log_interaction
```sql
CREATE OR REPLACE FUNCTION log_engagement(...) RETURNS BIGINT
CREATE OR REPLACE FUNCTION log_interaction(...) RETURNS BIGINT
```

Simplified activity logging:
- `log_engagement`: General contact/organization interactions
- `log_interaction`: Opportunity-specific touchpoints with sentiment tracking

Auto-populates organization_id from contact relationships when not provided.

### get_contact_organizations / get_organization_contacts
Helper functions for bidirectional organization-contact relationship queries, returning structured result sets with role and decision-maker flags.

## Triggers and Automation

### Audit Trail Triggers
```sql
CREATE TRIGGER set_updated_by_contacts
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();
```

Automatically sets `updated_by` to `get_current_sales_id()` on every update for contacts, organizations, opportunities, notes, and products.

### Search Triggers
```sql
CREATE TRIGGER trigger_update_contacts_search_tsv
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_tsv();
```

Maintains full-text search vectors automatically:
```sql
CREATE OR REPLACE FUNCTION update_search_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.first_name, '') || ' ' ||
    coalesce(NEW.last_name, '') || ' ' ||
    coalesce(NEW.email::text, '') || ' ' ||
    coalesce(NEW.phone::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Validation Triggers

#### validate_activity_consistency
```sql
CREATE TRIGGER trigger_validate_activity_consistency
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION validate_activity_consistency();
```

Enforces:
- Activities must have contact OR organization
- Interactions must have opportunity_id
- Engagements cannot have opportunity_id

#### validate_opportunity_participants
```sql
CREATE TRIGGER trigger_validate_opportunity_participants
  BEFORE INSERT OR UPDATE ON opportunity_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_opportunity_participants();
```

Ensures:
- Valid participant roles
- Commission rates within 0-1 range
- No duplicate organization-role combinations per opportunity

#### check_opportunity_concurrent_update
```sql
CREATE TRIGGER check_concurrent_opportunity_update
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION check_opportunity_concurrent_update();
```

Detects concurrent updates (within 1 second) and logs to database notices for monitoring. Integrates with React Admin's optimistic locking via `previousData.updated_at` comparison.

### Auth Triggers (auth schema)
```sql
-- In auth.users table (manual addition to migrations)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_update_user();
```

**Important**: Auth schema triggers are **NOT captured** by `supabase db diff`. They must be manually added to migration files (migration `20251018211500_restore_auth_triggers_and_backfill.sql`).

## Data Patterns

### Soft Delete Pattern
```sql
-- Column definition
deleted_at TIMESTAMPTZ

-- Soft delete operation
UPDATE contacts SET deleted_at = NOW() WHERE id = 123;

-- Query pattern (filter out deleted)
SELECT * FROM contacts WHERE deleted_at IS NULL;

-- Index for performance
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;
```

Partial indexes using `WHERE deleted_at IS NULL` keep index size small and queries fast.

### Audit Trail Pattern
```sql
-- Automatic tracking
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
created_by BIGINT DEFAULT get_current_sales_id() REFERENCES sales(id),
updated_by BIGINT REFERENCES sales(id),

-- Trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Who, what, when** tracking on every record:
- **Who**: `created_by`, `updated_by` link to sales.id
- **What**: Field-level changes in `audit_trail` table
- **When**: `created_at`, `updated_at`, `changed_at` timestamps

### Optimistic Locking Pattern
```sql
-- Detection via updated_at comparison
IF OLD.updated_at > (NOW() - INTERVAL '1 second') THEN
  RAISE NOTICE 'Concurrent update detected for opportunity %', NEW.id;
END IF;

-- Always refresh version
NEW.updated_at := NOW();
```

React Admin checks:
```typescript
if (previousData.updated_at !== currentData.updated_at) {
  // Show conflict dialog
}
```

### Search Pattern
```sql
-- Column definition
search_tsv TSVECTOR

-- Index for fast search
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_tsv);

-- Query with ranking
SELECT *, ts_rank(search_tsv, websearch_to_tsquery('english', 'john smith')) AS rank
FROM contacts
WHERE search_tsv @@ websearch_to_tsquery('english', 'john smith')
ORDER BY rank DESC;
```

Supports multi-word queries, partial matching, and relevance ranking through PostgreSQL's full-text search.

### JSONB Query Patterns
```sql
-- Array contains check
SELECT * FROM contacts WHERE email @> '[{"type": "Work"}]';

-- Extract values
SELECT email->0->>'email' AS primary_email FROM contacts;

-- Array length
SELECT * FROM contacts WHERE jsonb_array_length(email) > 1;

-- Update nested value
UPDATE contacts
SET email = jsonb_set(email, '{0,type}', '"Home"')
WHERE id = 123;
```

### Sequence Management
After bulk inserts (seed data), sequences must be reset:
```sql
-- Reset all sequences to max ID + 1
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));
SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
```

This prevents "duplicate key value violates unique constraint" errors after seeding.

## Performance Considerations

### Indexes
The schema includes **strategic indexes** for:
- Foreign keys: `idx_contacts_organization_id`, `idx_opportunities_customer_id`
- Soft deletes: `WHERE deleted_at IS NULL` partial indexes
- Full-text search: GIN indexes on `search_tsv` columns
- Composite lookups: `idx_opportunity_contacts_opportunity_id`, `idx_opportunities_customer_account_manager`
- Audit queries: `idx_audit_trail_table_record`, `idx_audit_trail_changed_by`

### Query Optimization
- **Views denormalize joins**: `contacts_summary`, `opportunities_summary` avoid repeated joins
- **RPC consolidation**: `get_activity_log()` reduces 5 queries to 1
- **Indexed foreign keys**: All foreign key columns have indexes
- **SECURITY INVOKER views**: Allows index usage while respecting RLS

### Connection Pooling
Supabase provides built-in connection pooling via Supavisor, supporting:
- Transaction mode for interactive queries
- Session mode for migrations and long-running operations
- Statement mode for serverless environments

### Future Optimizations
Migration `20251103232837_create_audit_trail_system.sql` notes:
> "Future optimization: Table partitioning by changed_at (monthly/quarterly) when audit_trail grows beyond 1M rows"

Partitioning the `audit_trail` table by date ranges will maintain query performance as historical data accumulates.

## Seed Data Strategy

**Single source of truth**: `supabase/seed.sql` (576KB, ~1800 organizations, ~2000 contacts)

### Seed File Structure
```sql
BEGIN;  -- Atomic transaction

-- 1. Test user (admin@test.com / password123)
INSERT INTO auth.users (...) VALUES (...);

-- 2. Segments (28 industry categories)
INSERT INTO segments (id, name) VALUES
  ('f05b4ec6-3e1e-5483-9abc-ca7938d56acb', 'Bar/Lounge'),
  ('189fa12f-28bb-53fd-a185-60df9b6778f9', 'Breakfast/Brunch'),
  ...;

-- 3. Organizations (1809 deduplicated)
INSERT INTO organizations (...) VALUES (...);

-- 4. Contacts (2013)
INSERT INTO contacts (...) VALUES (...);

-- 5. Reset sequences
SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));

COMMIT;
```

### Key Principles
- **Deterministic UUIDs**: Segments use UUID v5 (namespace + name) for reproducibility
- **Name-based deduplication**: Organizations deduplicated by case-insensitive name
- **JSONB formatting**: Email/phone arrays use industry-standard format
- **Transaction wrapper**: All-or-nothing insertion prevents partial data
- **Sequence reset**: Prevents ID conflicts after bulk insert

### Running Seed Data
```bash
# Automatic (resets DB + applies migrations + seed)
npm run db:local:reset

# Manual
psql <connection> -f supabase/seed.sql
```

**⚠️ CRITICAL WARNING**: `npx supabase db reset --linked` would **DELETE ALL PRODUCTION DATA**. The `--linked` flag must NEVER be used with production cloud links.

## Production Safety

### Cloud Deployment Checklist
1. ✅ Test migration locally: `npm run db:local:reset`
2. ✅ Review SQL for DROP statements
3. ✅ Commit to git: `git add . && git commit -m "Add migration"`
4. ✅ Verify cloud credentials: `.env.cloud` configured
5. ✅ Deploy: `npm run db:cloud:push`
6. ✅ Type confirmation: `APPLY MIGRATIONS`
7. ✅ Verify in dashboard: Check table structure and data

### Backup Strategy
Supabase provides:
- **Automatic daily backups** (7-day retention on free tier, configurable on paid)
- **Point-in-time recovery** (paid tiers)
- **Manual backups** via dashboard or pg_dump

### Rollback Procedures
For failed migrations:
1. Identify the problematic migration file
2. Create a new migration with rollback SQL
3. Or manually execute rollback via Supabase dashboard SQL editor
4. **Never** edit deployed migration files

### Monitoring
- **Database logs**: Available in Supabase dashboard
- **Query performance**: pg_stat_statements extension enabled
- **Concurrent update notices**: Logged via optimistic locking trigger
- **RLS policy violations**: Appear in logs as "permission denied"

## Conclusion

The Atomic CRM database architecture represents a mature, production-ready PostgreSQL schema built on industry-standard patterns:

- **Security**: Two-layer GRANT + RLS model with shared and personal access patterns
- **Integrity**: Soft deletes, foreign key constraints, check constraints, and validation triggers
- **Auditability**: Field-level change tracking and automatic timestamp management
- **Performance**: Strategic indexing, denormalized views, and optimized RPC functions
- **Maintainability**: 57 migrations tracking every schema evolution with clear documentation
- **Simplicity**: Deliberate removal of over-engineering (pricing models, inventory tracking) in favor of core CRM functionality

The migration from complex pricing systems to association-only products, and from user-isolated to team-shared RLS policies, demonstrates the evolution toward a **principal-centric, collaboration-first CRM** optimized for small teams managing relationships rather than transactions.
