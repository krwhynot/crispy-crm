# Database Schema

**Status:** Living Document | **Last Updated:** 2025-11-09
**Owner:** Architecture Team | **Scope:** All Data Operations

## Overview

This document defines the complete database schema for Atomic CRM. The system uses **PostgreSQL via Supabase** with Row Level Security (RLS) for multi-tenant data isolation and role-based access control.

**Core Principles:**
- **Single source of truth** - PostgreSQL is the only data store
- **Two-layer security** - GRANT permissions + RLS policies (never one without the other)
- **Soft deletes** - `deleted_at` timestamp (not hard deletes)
- **Audit trail** - `created_by`, `created_at`, `updated_at` on all tables
- **Fail fast** - No fallbacks or silent degradation (Engineering Constitution #1)

---

## Database Enums

### activity_type
```sql
CREATE TYPE activity_type AS ENUM ('engagement', 'interaction');
```

### contact_role
```sql
CREATE TYPE contact_role AS ENUM (
  'decision_maker', 'influencer', 'buyer', 'end_user',
  'gatekeeper', 'champion', 'technical', 'executive'
);
```

### interaction_type
```sql
CREATE TYPE interaction_type AS ENUM (
  'call', 'email', 'meeting', 'demo', 'proposal', 'follow_up',
  'trade_show', 'site_visit', 'contract_review', 'check_in', 'social'
);
```

### opportunity_stage
```sql
CREATE TYPE opportunity_stage AS ENUM (
  'new_lead', 'initial_outreach', 'sample_visit_offered', 'awaiting_response',
  'feedback_logged', 'demo_scheduled', 'closed_won', 'closed_lost'
);
```

### opportunity_status
```sql
CREATE TYPE opportunity_status AS ENUM (
  'active', 'on_hold', 'nurturing', 'stalled', 'expired'
);
```

### organization_type
```sql
CREATE TYPE organization_type AS ENUM (
  'customer', 'principal', 'distributor', 'prospect', 'partner', 'unknown'
);
```

### priority_level
```sql
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
```

### product_status
```sql
CREATE TYPE product_status AS ENUM (
  'active', 'discontinued', 'seasonal', 'coming_soon', 'limited_availability'
);
```

### task_type
```sql
CREATE TYPE task_type AS ENUM (
  'Call', 'Email', 'Meeting', 'Follow-up', 'Proposal',
  'Discovery', 'Administrative', 'None'
);
```

---

## Core Tables

### sales

**Purpose:** Sales representatives (CRM users). Auto-created from `auth.users` via trigger.

```sql
CREATE TABLE sales (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id           UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,  /* Nullable for legacy records */
  email             TEXT NOT NULL UNIQUE,
  first_name        TEXT,
  last_name         TEXT,
  name              TEXT,  /* Computed: first_name || ' ' || last_name */
  avatar_url        TEXT,
  role              user_role DEFAULT 'rep' NOT NULL,  /* admin, manager, rep */
  is_admin          BOOLEAN DEFAULT false NOT NULL,  /* Deprecated: Use role enum instead */
  administrator     BOOLEAN GENERATED ALWAYS AS (role = 'admin') STORED,  /* Computed from role */
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at        TIMESTAMPTZ  /* Soft delete */
);
```

**Key Features:**
- **Optional** one-to-one with `auth.users` via `user_id` (nullable for legacy records)
- `role` enum controls permissions (admin/manager/rep) - **PRIMARY FIELD**
- `is_admin` boolean **DEPRECATED** - kept for backward compatibility, synced via trigger
- `administrator` computed column - generated from `role = 'admin'`
- Automatically created/updated via `handle_new_user()` and `handle_update_user()` triggers

**Role System Migration (2025-11-16):**
- **Old:** `is_admin` boolean (true/false)
- **New:** `role` enum ('admin', 'manager', 'rep')
- **Migration:** `20251116210019_fix_sales_schema_consistency.sql`
- **Trigger:** `keep_is_admin_synced` maintains backward compatibility

**Nullable user_id Implications:**

⚠️ **Legacy Sales Records Without user_id:**
- **Authentication:** Cannot use auth.uid() for lookups (affects RLS policies)
- **Dashboard Filters:** "Assignee: Me" filter won't work for legacy reps
- **Login:** Cannot log in to the CRM (no auth.users record)
- **Use Case:** Historical records from data imports or manual creation

**Affected Features:**
- ❌ Dashboard filter "Assignee: Me" (requires user_id → auth.uid() lookup)
- ❌ RLS policies using `auth.uid()` comparisons (legacy records bypass these checks)
- ❌ Login functionality (no auth.users record = cannot authenticate)
- ✅ Reporting (aggregations by sales_id work regardless)
- ✅ Assignment (can assign opportunities/contacts to legacy sales records)

**Recommended Actions:**
1. **Data Audit:** Identify sales records with `user_id IS NULL`
2. **Migration Options:**
   - Create auth.users accounts for active legacy sales reps
   - Mark inactive legacy reps with `deleted_at` timestamp
   - Document as "historical records only" (no login access)
3. **Future Enforcement:** Consider making `user_id` NOT NULL after legacy cleanup

**Indexes:**
- `user_id` (unique, partial: WHERE user_id IS NOT NULL)
- `email` (unique)

---

### organizations

**Purpose:** Companies, principals, distributors, customers, prospects.

```sql
CREATE TABLE organizations (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name              TEXT NOT NULL,
  type              organization_type NOT NULL,
  website           TEXT,
  description       TEXT,
  logo_url          TEXT,
  industry          TEXT,
  headquarters_location TEXT,
  employee_count    INTEGER,
  revenue           NUMERIC(15,2),
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by        BIGINT REFERENCES sales(id),
  deleted_at        TIMESTAMPTZ,  /* Soft delete */
  search_tsv        TSVECTOR  /* Full-text search index */
);
```

**Organization Types:**
- `customer` - Buying companies
- `principal` - Brand/manufacturer represented
- `distributor` - Distribution partners
- `prospect` - Potential customers
- `partner` - Other partnerships
- `unknown` - Unclassified

**Indexes:**
- `search_tsv` (GIN for full-text search)
- `type`
- `deleted_at` (for soft delete filtering)

**RLS Policies:**
- SELECT: Team-wide access (`USING (true)`)
- INSERT: Authenticated users
- UPDATE/DELETE: Admin-only

---

### contacts

**Purpose:** Individual people associated with organizations.

```sql
CREATE TABLE contacts (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name        TEXT,
  last_name         TEXT,
  name              TEXT,  /* Computed or explicit */
  title             TEXT,
  department        TEXT,
  email             JSONB DEFAULT '[]'::jsonb,  /* Array of {email, type} */
  phone             JSONB DEFAULT '[]'::jsonb,  /* Array of {number, type} */
  linkedin_url      TEXT,
  avatar            TEXT,
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  sales_id          BIGINT REFERENCES sales(id),  /* Account manager */
  organization_id   BIGINT REFERENCES organizations(id),  /* Primary org */
  nb_tasks          INTEGER DEFAULT 0,
  company_name      TEXT,  /* Denormalized from organization */
  first_seen        TIMESTAMPTZ,
  last_seen         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by        BIGINT REFERENCES sales(id),
  deleted_at        TIMESTAMPTZ,
  search_tsv        TSVECTOR
);
```

**JSONB Array Pattern (email/phone):**

Contacts use JSONB arrays for multi-value fields:

```jsonb
/* email field */
[
  {"email": "john@example.com", "type": "Work"},
  {"email": "john.personal@gmail.com", "type": "Home"}
]

/* phone field */
[
  {"number": "+1-555-1234", "type": "Work"},
  {"number": "+1-555-5678", "type": "Mobile"}
]
```

**Valid types:** `"Work"`, `"Home"`, `"Other"`

**Validation:** See `src/atomic-crm/validation/contacts.ts`

**RLS Policies:**
- SELECT: Team-wide access
- INSERT: Authenticated users
- UPDATE/DELETE: Admin-only

---

### contact_organizations

**Purpose:** Many-to-many relationship between contacts and organizations.

```sql
CREATE TABLE contact_organizations (
  id                      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contact_id              BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id         BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_primary              BOOLEAN DEFAULT false,  /* Primary org for contact */
  is_primary_decision_maker BOOLEAN DEFAULT false,
  role                    contact_role,
  purchase_influence      SMALLINT CHECK (purchase_influence BETWEEN 0 AND 100),
  created_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at              TIMESTAMPTZ,

  UNIQUE (contact_id, organization_id)
);
```

**Business Rules:**
- Contact can belong to multiple organizations
- One organization marked as `is_primary` per contact
- `purchase_influence` 0-100 scale for decision-making power

---

### opportunities

**Purpose:** Sales opportunities/deals in the pipeline.

```sql
CREATE TABLE opportunities (
  id                        BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name                      TEXT NOT NULL,
  description               TEXT,
  stage                     opportunity_stage DEFAULT 'new_lead',
  priority                  priority_level DEFAULT 'medium',
  lead_source               TEXT,
  estimated_close_date      DATE NOT NULL,
  stage_changed_at          TIMESTAMPTZ,  /* Last stage change */
  customer_organization_id  BIGINT NOT NULL REFERENCES organizations(id),
  principal_organization_id BIGINT NOT NULL REFERENCES organizations(id),
  distributor_organization_id BIGINT REFERENCES organizations(id),
  account_manager_id        BIGINT REFERENCES sales(id),
  campaign                  TEXT,  /* Marketing campaign */
  related_opportunity_id    BIGINT REFERENCES opportunities(id),
  notes                     TEXT,  /* General notes */
  tags                      TEXT[] DEFAULT '{}',
  next_action               TEXT,
  next_action_date          DATE,
  decision_criteria         TEXT,
  created_at                TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by                BIGINT REFERENCES sales(id),
  deleted_at                TIMESTAMPTZ,
  version                   INTEGER DEFAULT 1 NOT NULL,  /* Optimistic locking */

  CONSTRAINT require_customer CHECK (customer_organization_id IS NOT NULL)
);
```

**Key Features:**
- **Required fields:** `name`, `estimated_close_date`, `customer_organization_id`, `principal_organization_id`
- **Multi-participant:** Customer, principal, optional distributor
- **Optimistic locking:** `version` field prevents concurrent updates
- **Stage tracking:** `stage_changed_at` updated via trigger

**Foreign Key Constraints:**
- `customer_organization_id` → organizations (ON DELETE RESTRICT)
- `principal_organization_id` → organizations (ON DELETE RESTRICT)
- `distributor_organization_id` → organizations (ON DELETE SET NULL)

**RLS Policies:**
- SELECT: Team-wide access
- INSERT: Authenticated users
- UPDATE/DELETE: Admin-only

---

### opportunity_contacts

**Purpose:** Many-to-many junction table linking opportunities to contacts.

```sql
CREATE TABLE opportunity_contacts (
  opportunity_id  BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id      BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by      BIGINT REFERENCES sales(id),
  deleted_at      TIMESTAMPTZ,

  PRIMARY KEY (opportunity_id, contact_id)
);
```

**Business Rules:**
- At least one contact required per opportunity (enforced in validation)
- Contacts must belong to opportunity's customer organization

---

### activities

**Purpose:** Engagement log (calls, emails, meetings, etc.).

```sql
CREATE TABLE activities (
  id                  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  activity_type       activity_type NOT NULL,  /* engagement | interaction */
  type                interaction_type NOT NULL,
  subject             TEXT NOT NULL,
  description         TEXT,
  activity_date       TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_minutes    INTEGER,
  contact_id          BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id     BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id      BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
  follow_up_required  BOOLEAN DEFAULT false,
  follow_up_date      DATE,
  outcome             TEXT,
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by          BIGINT REFERENCES sales(id),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT require_entity CHECK (
    contact_id IS NOT NULL OR organization_id IS NOT NULL
  )
);
```

**Business Rules:**
- Must have either `contact_id` OR `organization_id` (check constraint)
- If `contact_id` provided without `organization_id`, auto-populate from contact's primary org

**Activity Types:**
- **engagement** - General customer interaction
- **interaction** - Specific tracked event (call, meeting, demo, etc.)

---

### tasks

**Purpose:** To-do items assigned to sales reps.

```sql
CREATE TABLE tasks (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title           TEXT NOT NULL,
  description     TEXT,
  type            task_type DEFAULT 'None',
  due_date        DATE NOT NULL,
  completed_at    TIMESTAMPTZ,
  sales_id        BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  contact_id      BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  opportunity_id  BIGINT REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by      BIGINT REFERENCES sales(id),
  deleted_at      TIMESTAMPTZ
);
```

**RLS Policies:**
- SELECT: User sees only their own tasks (`sales_id = current_sales_id`)
- INSERT: Authenticated users
- UPDATE: Task owner only
- DELETE: Admin-only

---

### products

**Purpose:** Product catalog (no pricing since 2025-10-29 migration).

```sql
CREATE TABLE products (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name            TEXT NOT NULL,
  sku             TEXT UNIQUE,
  description     TEXT,
  category        TEXT,  /* Changed from enum to TEXT 2025-10-28 */
  principal_id    BIGINT REFERENCES organizations(id),
  distributor     TEXT,  /* Distributor name */
  status          product_status DEFAULT 'active',
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by      BIGINT REFERENCES sales(id),
  deleted_at      TIMESTAMPTZ,
  search_tsv      TSVECTOR
);
```

**Breaking Change (2025-10-29):**
- **Pricing removed** - Products are now associations only
- No `list_price`, `cost`, or pricing tiers
- Migration: `20251028040008_remove_product_pricing_and_uom.sql`

---

### opportunity_products

**Purpose:** Products associated with opportunities (junction table).

```sql
CREATE TABLE opportunity_products (
  id                    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id        BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id            BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by            BIGINT REFERENCES sales(id),
  deleted_at            TIMESTAMPTZ,

  UNIQUE (opportunity_id, product_id)
);
```

---

### contactNotes

**Purpose:** Notes specific to contacts.

```sql
CREATE TABLE "contactNotes" (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contact_id  BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by  BIGINT REFERENCES sales(id),
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at  TIMESTAMPTZ
);
```

**RLS Policies:**
- SELECT: Team-wide access
- INSERT: Authenticated users
- UPDATE/DELETE: Admin-only

---

### opportunityNotes

**Purpose:** Notes specific to opportunities.

```sql
CREATE TABLE "opportunityNotes" (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id  BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by      BIGINT REFERENCES sales(id),
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at      TIMESTAMPTZ
);
```

---

### notifications

**Purpose:** System notifications for overdue tasks, etc.

```sql
CREATE TABLE notifications (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  /* 'task_overdue', etc. */
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link_url    TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at  TIMESTAMPTZ
);
```

**RLS Policies:**
- SELECT: User sees only their own (`user_id = auth.uid()`)
- INSERT: System-generated (cron jobs)
- UPDATE: User can mark as read

---

### tags

**Purpose:** Global tag management (autocomplete, case-insensitive lookup).

```sql
CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by  UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX tags_name_lower_idx ON tags (LOWER(name));
```

**Usage Pattern:**
- `get_or_create_tag(p_name TEXT)` function for upsert
- Case-insensitive lookup via `LOWER(name)` index

---

### segments

**Purpose:** Contact segmentation (marketing/sales grouping).

```sql
CREATE TABLE segments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by  UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX segments_name_lower_idx ON segments (LOWER(name));
```

---

## Views

### contacts_summary

**Purpose:** Enriched contact list with computed fields.

```sql
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
  c.*,
  o.name AS company_name,
  s.name AS sales_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
LEFT JOIN sales s ON c.sales_id = s.id
WHERE c.deleted_at IS NULL;
```

**Used by:** Contact List views, exports

---

### organizations_summary

**Purpose:** Enriched organization list.

```sql
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.*,
  COUNT(DISTINCT c.id) AS contact_count,
  COUNT(DISTINCT op.id) AS opportunity_count
FROM organizations o
LEFT JOIN contact_organizations co ON o.id = co.organization_id
LEFT JOIN contacts c ON co.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN opportunities op ON o.id = op.customer_organization_id AND op.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;
```

---

### opportunities_summary

**Purpose:** Enriched opportunity list with organization names.

```sql
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
  o.*,
  cust.name AS customer_name,
  prin.name AS principal_name,
  dist.name AS distributor_name,
  s.name AS account_manager_name
FROM opportunities o
LEFT JOIN organizations cust ON o.customer_organization_id = cust.id
LEFT JOIN organizations prin ON o.principal_organization_id = prin.id
LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id
LEFT JOIN sales s ON o.account_manager_id = s.id
WHERE o.deleted_at IS NULL;
```

---

### dashboard_principal_summary

**Purpose:** Principal-centric dashboard view grouping opportunities by principal.

```sql
CREATE OR REPLACE VIEW dashboard_principal_summary AS
SELECT
  prin.id AS principal_id,
  prin.name AS principal_name,
  COUNT(DISTINCT o.id) AS opportunity_count,
  COUNT(DISTINCT CASE WHEN o.stage NOT IN ('closed_won', 'closed_lost') THEN o.id END) AS active_opportunities,
  COUNT(DISTINCT CASE WHEN o.stage = 'closed_won' THEN o.id END) AS won_opportunities
FROM organizations prin
LEFT JOIN opportunities o ON prin.id = o.principal_organization_id AND o.deleted_at IS NULL
WHERE prin.type = 'principal' AND prin.deleted_at IS NULL
GROUP BY prin.id, prin.name;
```

---

## Security

### Two-Layer Security Model

**CRITICAL:** All tables require BOTH:

1. **GRANT** - PostgreSQL permissions
2. **RLS policies** - Row-level filtering

**Example Pattern:**

```sql
/* 1. GRANT permissions */
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

/* 2. RLS policies */
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  /* Team-wide read access */

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);  /* Any authenticated user can insert */

CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);  /* Admin-only */

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);  /* Admin-only */
```

### RLS Policy Patterns

**Shared Team Access (contacts, organizations, opportunities):**

```sql
USING (true)  /* All authenticated users can read */
```

**Personal Data (tasks):**

```sql
USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))
```

**Admin-Only (UPDATE/DELETE on shared tables):**

```sql
USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true)
```

### Reference Migration

See `20251108213039_fix_rls_policies_role_based_access.sql` for complete RLS implementation.

---

## Triggers & Functions

### Auth Sync Triggers

**handle_new_user()** - Auto-create `sales` record when user signs up:

```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**handle_update_user()** - Sync email changes:

```sql
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_update_user();
```

### Soft Delete Cascades

**cascade_soft_delete_opportunity_contacts()** - When opportunity soft-deleted, cascade to junction:

```sql
CREATE TRIGGER cascade_soft_delete_opportunity_contacts
AFTER UPDATE OF deleted_at ON opportunities
FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete_opportunity_contacts();
```

### Activity Log Auto-Population

**log_engagement()** - RPC function for logging activities with auto-populated organization:

```sql
SELECT log_engagement(
  p_type := 'call',
  p_subject := 'Follow-up call',
  p_contact_id := 123,
  p_activity_date := now()
);
```

---

## Migration Patterns

### Creating Migrations

```bash
npx supabase migration new <descriptive_name>
```

**Example names:**
- `add_opportunity_notes_field`
- `remove_product_pricing_and_uom`
- `fix_rls_policies_role_based_access`

### Soft Delete Pattern

**Add to existing table:**

```sql
ALTER TABLE my_table ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_my_table_deleted_at ON my_table (deleted_at);
```

**Update views:**

```sql
WHERE my_table.deleted_at IS NULL
```

### Two-Layer Security Setup

**New table checklist:**

```sql
/* 1. Create table */
CREATE TABLE my_table (...);

/* 2. Enable RLS */
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

/* 3. GRANT permissions */
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE my_table_id_seq TO authenticated;

/* 4. Create RLS policies */
CREATE POLICY select_my_table ON my_table FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_my_table ON my_table FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_my_table ON my_table FOR UPDATE TO authenticated USING (is_admin_check());
CREATE POLICY delete_my_table ON my_table FOR DELETE TO authenticated USING (is_admin_check());
```

---

## Indexes

### Full-Text Search

Tables with `search_tsv` TSVECTOR column:

- `contacts.search_tsv` - name, email, company
- `organizations.search_tsv` - name, description, industry
- `products.search_tsv` - name, sku, description

**Index type:** GIN

```sql
CREATE INDEX contacts_search_tsv_idx ON contacts USING GIN (search_tsv);
```

### Foreign Keys (Auto-Indexed)

All `REFERENCES` constraints automatically create indexes.

### Soft Delete Filtering

```sql
CREATE INDEX idx_contacts_deleted_at ON contacts (deleted_at);
CREATE INDEX idx_organizations_deleted_at ON organizations (deleted_at);
CREATE INDEX idx_opportunities_deleted_at ON opportunities (deleted_at);
```

**Usage:** Speeds up `WHERE deleted_at IS NULL` filters in views and queries.

---

## Related Documentation

- [CLAUDE.md - Database Workflows](../../CLAUDE.md#database-workflows) - Migration commands
- [Supabase Workflow](../supabase/WORKFLOW.md) - Local/cloud sync procedures
- [Engineering Constitution](../claude/engineering-constitution.md#2-single-source-of-truth) - Data layer principles
- [Business Rules](./business-rules.md) - Validation and constraints
