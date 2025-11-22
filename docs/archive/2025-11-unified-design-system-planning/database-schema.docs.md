# Database Schema Documentation for Design System

**Purpose:** Comprehensive reference for database schema, views, computed columns, and JSONB structures that affect UI rendering in the unified design system.

**Last Updated:** 2025-11-16

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [View Definitions](#view-definitions)
3. [JSONB Field Structures](#jsonb-field-structures)
4. [Computed Columns](#computed-columns)
5. [RLS Policies](#rls-policies)
6. [Enums and Types](#enums-and-types)
7. [Junction Tables](#junction-tables)

---

## Core Tables

### Contacts

**Table:** `contacts`  
**View:** `contacts_summary` (with organization name)

```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email JSONB DEFAULT '[]'::jsonb,              -- Array of {email, type}
  phone JSONB DEFAULT '[]'::jsonb,              -- Array of {number, type}
  title TEXT,
  department TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  birthday DATE,
  linkedin_url TEXT,
  twitter_handle TEXT,
  notes TEXT,
  sales_id BIGINT,
  organization_id BIGINT,                        -- Primary organization (FK)
  gender TEXT,
  tags BIGINT[] DEFAULT '{}',                    -- Array of tag IDs
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT,
  deleted_at TIMESTAMPTZ,                        -- Soft delete
  search_tsv TSVECTOR,                           -- Full-text search
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields for UI:**
- `email`, `phone` - JSONB arrays (see JSONB structures below)
- `organization_id` - Primary organization (single value, not many-to-many)
- `tags` - BIGINT array of tag IDs
- `deleted_at` - Soft delete filter (exclude in queries)

---

### Organizations

**Table:** `organizations`  
**View:** `organizations_summary` (with opportunity/contact counts)

```sql
CREATE TABLE organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  organization_type organization_type DEFAULT 'unknown',  -- Enum: customer, principal, distributor, prospect, partner
  is_principal BOOLEAN DEFAULT false,
  is_distributor BOOLEAN DEFAULT false,
  parent_organization_id BIGINT,                          -- Hierarchy support (2 levels max)
  priority VARCHAR(1) DEFAULT 'C',                        -- A/B/C/D rating
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  linkedin_url TEXT,
  annual_revenue NUMERIC(15,2),
  employee_count INTEGER,
  founded_year INTEGER,
  notes TEXT,
  sales_id BIGINT,
  segment_id UUID,                                        -- FK to segments table
  context_links JSONB,                                    -- Array of URLs/references
  description TEXT,
  tax_identifier TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT,
  deleted_at TIMESTAMPTZ,
  import_session_id UUID,
  search_tsv TSVECTOR
);
```

**Key Fields for UI:**
- `organization_type` - Enum affects parent eligibility and display
- `parent_organization_id` - Two-level hierarchy (no grandchildren)
- `priority` - A/B/C/D rating for badge display
- `context_links` - JSONB array of URLs

**Business Rules:**
- Only `distributor`, `customer`, `principal` can be parents
- Deletion protection trigger prevents removing parents with children
- Two-level maximum hierarchy depth enforced

---

### Opportunities

**Table:** `opportunities`  
**View:** `opportunities_summary` (with organization names and products array)

```sql
CREATE TABLE opportunities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  stage opportunity_stage DEFAULT 'new_lead',             -- Kanban board columns
  status opportunity_status DEFAULT 'active',
  priority priority_level DEFAULT 'medium',               -- low/medium/high/critical
  index INTEGER,                                          -- Kanban card order
  estimated_close_date DATE DEFAULT (CURRENT_DATE + '90 days'::interval),
  actual_close_date DATE,
  customer_organization_id BIGINT,                        -- Required participant
  principal_organization_id BIGINT,
  distributor_organization_id BIGINT,
  founding_interaction_id BIGINT,
  stage_manual BOOLEAN DEFAULT false,
  status_manual BOOLEAN DEFAULT false,
  next_action TEXT,
  next_action_date DATE,
  competition TEXT,
  decision_criteria TEXT,
  contact_ids BIGINT[] DEFAULT '{}',                      -- Array of contact IDs
  opportunity_owner_id BIGINT,                            -- Sales rep (FK to sales)
  account_manager_id BIGINT,                              -- Account manager (FK to sales)
  lead_source TEXT,                                       -- Enum: referral, trade_show, etc.
  tags TEXT[] DEFAULT '{}',                               -- String array of tags
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT,
  deleted_at TIMESTAMPTZ,
  search_tsv TSVECTOR
);
```

**Key Fields for UI:**
- `stage` - Kanban board column (new_lead → closed_won/lost)
- `priority` - Badge color (low=blue, medium=yellow, high=orange, critical=red)
- `contact_ids` - Array of contact IDs (multi-participant support)
- `customer_organization_id` - Required for business rule enforcement

**Related Views:**
- `opportunities_summary` - Adds `customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `products` JSONB array
- `principal_opportunities` - Dashboard V2 hierarchy view (principal → customer → opportunity)

---

### Tasks

**Table:** `tasks`  
**View:** `priority_tasks` (with principal/customer context)

```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  reminder_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority priority_level DEFAULT 'medium',               -- low/medium/high/critical
  type task_type DEFAULT 'None',                          -- Call, Email, Meeting, etc.
  contact_id BIGINT,
  opportunity_id BIGINT,
  sales_id BIGINT,                                        -- Task owner
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields for UI:**
- `priority` - Badge color (same as opportunities)
- `type` - Icon and badge (Call, Email, Meeting, Follow-up, etc.)
- `completed` - Strike-through styling, hide from active lists
- `due_date` - "Overdue" badge logic

**Related Views:**
- `priority_tasks` - Pre-filters incomplete tasks due within 7 days OR high/critical priority

---

### Sales (Users)

**Table:** `sales`  
**Computed Column:** `administrator` (from `role` enum)

```sql
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID,                                           -- FK to auth.users
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,                         -- DEPRECATED
  role user_role DEFAULT 'rep',                           -- admin/manager/rep (SINGLE SOURCE OF TRUTH)
  administrator BOOLEAN GENERATED ALWAYS AS (role = 'admin') STORED,  -- Computed for backward compat
  disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

**Key Fields for UI:**
- `role` - SINGLE SOURCE OF TRUTH (admin/manager/rep)
- `administrator` - Computed column for backward compatibility
- `disabled` - Gray out in lists, prevent login

**Migration Notes:**
- Migration `20251116210019_fix_sales_schema_consistency.sql` adds computed column
- Trigger ensures 1:1 mapping with `auth.users`
- Seed file creates admin@test.com with role='admin'

---

### Products

**Table:** `products`  
**View:** `products_summary` (with principal organization name)

```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  principal_id BIGINT NOT NULL,                           -- FK to organizations
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL,
  category product_category NOT NULL,                     -- Enum: beverages, dairy, etc.
  list_price NUMERIC(12,2),
  status product_status DEFAULT 'active',                 -- active/discontinued/seasonal
  certifications TEXT[],
  allergens TEXT[],
  ingredients TEXT,
  nutritional_info JSONB,
  marketing_description TEXT,
  currency_code TEXT DEFAULT 'USD',
  unit_of_measure TEXT DEFAULT 'each',
  manufacturer_part_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT,
  updated_by BIGINT,
  deleted_at TIMESTAMPTZ,
  search_tsv TSVECTOR
);
```

**Key Fields for UI:**
- `status` - Badge color (active=green, discontinued=gray, seasonal=blue)
- `category` - Enum for filtering/grouping
- `nutritional_info` - JSONB structured data

**Note:** Pricing features removed in migration `20251028040008_remove_product_pricing_and_uom.sql`

---

## View Definitions

### contacts_summary

**Purpose:** List view with denormalized organization name

```sql
CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
  c.*,
  o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;
```

**Usage:** Default list view for contacts module  
**Performance:** Eliminates N+1 organization name lookups

---

### organizations_summary

**Purpose:** List view with opportunity/contact counts

```sql
CREATE VIEW organizations_summary
WITH (security_invoker = true)
AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.priority,
  o.segment_id,
  o.annual_revenue,
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,
  COUNT(DISTINCT opp.id) AS nb_opportunities,
  COUNT(DISTINCT c.id) AS nb_contacts,
  MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
  (opp.customer_organization_id = o.id OR
   opp.principal_organization_id = o.id OR
   opp.distributor_organization_id = o.id)
  AND opp.deleted_at IS NULL
)
LEFT JOIN contacts c ON (
  c.organization_id = o.id
  AND c.deleted_at IS NULL
)
WHERE o.deleted_at IS NULL
GROUP BY o.id;
```

**Usage:** Default list view for organizations module  
**Performance:** Single query vs N queries for counts

---

### opportunities_summary

**Purpose:** List view with denormalized organization names and products array

```sql
CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT
  o.*,
  cust_org.name AS customer_organization_name,
  prin_org.name AS principal_organization_name,
  dist_org.name AS distributor_organization_name,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'product_id_reference', op.product_id_reference,
          'product_name', op.product_name,
          'product_category', op.product_category,
          'principal_name', prod_org.name,
          'notes', op.notes
        )
        ORDER BY op.created_at
      )
      FROM opportunity_products op
      LEFT JOIN products p ON op.product_id_reference = p.id
      LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
      WHERE op.opportunity_id = o.id
    ),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;
```

**Usage:** Kanban board, list views, detail pages  
**Performance:** Eliminates N+1 for organization names and products array

**Migration:** `20251104125744_update_opportunities_summary_with_principal_name.sql`

---

### principal_opportunities

**Purpose:** Dashboard V2 hierarchy view (Principal → Customer → Opportunity)

```sql
CREATE VIEW principal_opportunities AS
SELECT
  o.id,                                             -- React Admin required
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,
  o.customer_organization_id,
  org.name as customer_name,
  p.id as principal_id,
  p.name as principal_name,
  o.opportunity_owner_id as sales_id,              -- Assignee filter
  EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 as days_since_activity,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 7 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status
FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
WHERE
  o.deleted_at IS NULL
  AND o.stage != 'closed_lost'
  AND p.organization_type = 'principal'
ORDER BY p.name, o.stage;
```

**Usage:** Dashboard V2 OpportunitiesHierarchy component  
**Performance:** Pre-filters and pre-calculates health status (50ms vs 500ms client-side)

**Migration:** `20251116030314_add_sales_id_to_dashboard_views.sql`

---

### priority_tasks

**Purpose:** Dashboard V2 tasks panel (pre-filtered by priority/due date)

```sql
CREATE VIEW priority_tasks AS
SELECT
  t.id,                                             -- React Admin required
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,
  t.sales_id,                                       -- Assignee filter
  t.opportunity_id,
  o.name as opportunity_name,
  o.customer_organization_id as organization_id,
  org.name as customer_name,
  o.principal_organization_id,
  p.name as principal_name,
  c.id as contact_id,
  c.name as contact_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE
  t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
  AND p.organization_type = 'principal'
ORDER BY
  t.priority DESC,
  t.due_date ASC NULLS LAST;
```

**Usage:** Dashboard V2 TasksPanel component  
**Performance:** Pre-filters to high-priority tasks only

**Migration:** `20251116030314_add_sales_id_to_dashboard_views.sql`

---

### products_summary

**Purpose:** List view with denormalized principal organization name

```sql
CREATE VIEW products_summary
WITH (security_invoker = on)
AS
SELECT
  p.id,
  p.principal_id,
  p.name,
  p.description,
  p.sku,
  p.status,
  p.category,
  p.manufacturer_part_number,
  p.distributor_id,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by,
  p.deleted_at,
  po.name AS principal_name
FROM products p
LEFT JOIN organizations po ON p.principal_id = po.id;
```

**Usage:** Products list view  
**Performance:** Eliminates N+1 principal name lookups

**Migration:** `20251104044122_add_products_summary_view.sql`

---

### dashboard_principal_summary

**Purpose:** Dashboard V1 principal summary metrics (DEPRECATED by Dashboard V2)

```sql
CREATE VIEW dashboard_principal_summary AS
-- Complex aggregation query with CTEs
-- Calculates: opportunity_count, weekly_activity_count, assigned_reps, health status
-- Used by: Legacy dashboard (pre-Dashboard V2)
```

**Status:** DEPRECATED - Dashboard V2 uses `principal_opportunities` + `priority_tasks` instead

**Migration:** `20251112063019_add_weekly_activity_count_and_assigned_reps_to_dashboard.sql`

---

## JSONB Field Structures

### Contacts Email Array

**Field:** `contacts.email`  
**Type:** `JSONB DEFAULT '[]'::jsonb`

**Structure:**
```json
[
  { "email": "john@example.com", "type": "Work" },
  { "email": "john.personal@gmail.com", "type": "Home" }
]
```

**Zod Schema:**
```typescript
// src/atomic-crm/validation/contacts.ts
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

// In contactSchema:
email: z.array(emailAndTypeSchema).default([])
```

**UI Pattern:**
```tsx
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" type="email" />
    <SelectInput source="type" choices={[
      { id: "Work", name: "Work" },
      { id: "Home", name: "Home" },
      { id: "Other", name: "Other" }
    ]} />
  </SimpleFormIterator>
</ArrayInput>
```

---

### Contacts Phone Array

**Field:** `contacts.phone`  
**Type:** `JSONB DEFAULT '[]'::jsonb`

**Structure:**
```json
[
  { "number": "+1-555-123-4567", "type": "Work" },
  { "number": "+1-555-987-6543", "type": "Home" }
]
```

**Zod Schema:**
```typescript
export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// In contactSchema:
phone: z.array(phoneNumberAndTypeSchema).default([])
```

---

### Organizations Context Links

**Field:** `organizations.context_links`  
**Type:** `JSONB`

**Structure:**
```json
[
  { "url": "https://example.com/profile", "label": "Company Profile" },
  { "url": "https://linkedin.com/company/...", "label": "LinkedIn" }
]
```

**Comment:** "Array of related URLs or references stored as JSONB"

---

### Products Nutritional Info

**Field:** `products.nutritional_info`  
**Type:** `JSONB`

**Structure:** Flexible schema for nutritional data

```json
{
  "calories": 150,
  "servingSize": "100g",
  "fat": "5g",
  "protein": "20g",
  "carbs": "10g"
}
```

---

### Opportunities Products Array (View)

**Field:** `opportunities_summary.products`  
**Type:** `JSONB` (aggregated from `opportunity_products` junction table)

**Structure:**
```json
[
  {
    "id": 123,
    "product_id_reference": 456,
    "product_name": "Organic Maple Syrup",
    "product_category": "condiments",
    "principal_name": "Maplewood Farms",
    "notes": "Customer prefers 12oz bottles"
  }
]
```

**Usage:** ProductsTable component in opportunity detail views

**Migration:** `20251104125744_update_opportunities_summary_with_principal_name.sql`

---

## Computed Columns

### sales.administrator

**Type:** `BOOLEAN GENERATED ALWAYS AS (role = 'admin') STORED`

**Purpose:** Backward compatibility while migrating from `is_admin` to `role` enum

**Source of Truth:** `sales.role` enum ('admin', 'manager', 'rep')

**Migration:** `20251116210019_fix_sales_schema_consistency.sql`

**Usage:**
- Frontend still expects `administrator` boolean
- Database maps `role='admin'` → `administrator=true`
- **Migrate UI to use `role` directly** - computed column is transitional

**Verification:**
```sql
SELECT first_name, last_name, role, administrator 
FROM sales 
WHERE role = 'admin';
-- Expected: administrator = true for all admin role
```

---

## RLS Policies

### Security Model Overview

**Two-Layer Security:**
1. **GRANT** - Table-level access (PostgreSQL permissions)
2. **RLS Policies** - Row-level filtering (Supabase RLS)

**Critical:** Both layers required. RLS without GRANT = "permission denied" errors.

---

### Standard GRANT Pattern

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE table_name_id_seq TO authenticated;
```

**Applied to:** All core tables (contacts, organizations, opportunities, tasks, sales, products)

**Migration:** `20251018152315_cloud_schema_fresh.sql`

---

### RLS Policy Patterns

**Migration:** `20251108213039_fix_rls_policies_role_based_access.sql`

#### 1. Shared Resources (Team Collaboration)

**Applied to:** contacts, organizations, opportunities, products (SELECT, INSERT)

```sql
-- SELECT: Team-wide read access
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Team-wide create access
CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

---

#### 2. Admin-Only Modifications

**Applied to:** contacts, organizations, opportunities, products (UPDATE, DELETE)

```sql
-- UPDATE: Admin-only
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- DELETE: Admin-only
CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );
```

**Prevents:** Non-admin users from modifying/deleting shared data (OWASP A01:2021 - Broken Access Control)

---

#### 3. Personal Visibility (Tasks)

**Applied to:** tasks (all operations)

```sql
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (
    sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  );

-- Similar for INSERT, UPDATE, DELETE
```

**Behavior:** Users only see their own tasks

**Note:** Known limitation - `assignee='me'` filter in Dashboard V2 always filters to zero because `sales` table lacks `user_id` column mapping.

---

### View Security

**Pattern:** All views use `security_invoker = true`

```sql
CREATE VIEW view_name
WITH (security_invoker = true)
AS ...
```

**Effect:** View executes with calling user's permissions, enforcing RLS from underlying tables

**Applied to:** contacts_summary, organizations_summary, opportunities_summary, products_summary, principal_opportunities, priority_tasks

**Migration:** `20251020001702_add_organizations_summary_rls_policies.sql`

---

## Enums and Types

### opportunity_stage

**Values:** `new_lead`, `initial_outreach`, `sample_visit_offered`, `awaiting_response`, `feedback_logged`, `demo_scheduled`, `closed_won`, `closed_lost`

**Usage:** Kanban board columns, stage progression

**Migration:** `20251018152315_cloud_schema_fresh.sql`

---

### opportunity_status

**Values:** `active`, `on_hold`, `nurturing`, `stalled`, `expired`

**Usage:** Filter opportunities independently of stage

---

### organization_type

**Values:** `customer`, `principal`, `distributor`, `prospect`, `partner`, `unknown`

**Usage:** 
- Parent eligibility (only distributor/customer/principal can be parents)
- Principal filtering in dashboard views

**Migration:** `20251018152315_cloud_schema_fresh.sql`

---

### priority_level

**Values:** `low`, `medium`, `high`, `critical`

**Usage:** 
- Opportunities and tasks priority badges
- Color mapping: low=blue, medium=yellow, high=orange, critical=red

---

### task_type

**Values:** `Call`, `Email`, `Meeting`, `Follow-up`, `Proposal`, `Discovery`, `Administrative`, `None`

**Usage:** Task type badges and icons

---

### interaction_type

**Values:** `call`, `email`, `meeting`, `demo`, `proposal`, `follow_up`, `trade_show`, `site_visit`, `contract_review`, `check_in`, `social`, `note`

**Usage:** Activity logging, quick logger in Dashboard V2

**Migration:** `20251111183436_add_note_to_interaction_type_enum.sql` (added `note`)

---

### user_role

**Values:** `admin`, `manager`, `rep`

**Usage:** Role-based access control (RBAC)

**Permission Matrix:**
- **Admin:** Full CRUD on all resources
- **Manager:** View all + Edit all + No delete
- **Rep:** View all + Edit own only + No delete

**Migration:** `20251111121526_add_role_based_permissions.sql`

---

### product_status

**Values:** `active`, `discontinued`, `seasonal`, `coming_soon`, `limited_availability`

**Usage:** Product status badges

---

### product_category

**Values:** `beverages`, `dairy`, `frozen`, `fresh_produce`, `meat_poultry`, `seafood`, `dry_goods`, `snacks`, `condiments`, `baking_supplies`, `spices_seasonings`, `canned_goods`, `pasta_grains`, `oils_vinegars`, `sweeteners`, `cleaning_supplies`, `paper_products`, `equipment`, `other`

**Usage:** Product categorization, filtering

**Note:** Changed from enum to TEXT in migration `20251028044618_change_product_category_to_text.sql`

---

## Junction Tables

### opportunity_contacts

**Purpose:** Many-to-many relationship between opportunities and contacts

```sql
CREATE TABLE opportunity_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);
```

**Usage:** Multi-participant opportunities (multiple contacts per opportunity)

**Migration:** `20251028213020_create_opportunity_contacts_junction_table.sql`

---

### opportunity_products

**Purpose:** Many-to-many relationship between opportunities and products

```sql
CREATE TABLE opportunity_products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id_reference BIGINT REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Usage:** Product associations in opportunities (aggregated into `opportunities_summary.products` JSONB array)

**Migration:** `20251029051540_create_opportunity_products_table.sql`

---

## Key Migrations Reference

| Migration | Purpose |
|-----------|---------|
| `20251018152315_cloud_schema_fresh.sql` | Base schema with all tables, enums, functions |
| `20251020001702_add_organizations_summary_rls_policies.sql` | organizations_summary view with security_invoker |
| `20251020002305_fix_contacts_summary_security_invoker.sql` | contacts_summary view with security_invoker |
| `20251104044122_add_products_summary_view.sql` | products_summary view with principal_name |
| `20251104125744_update_opportunities_summary_with_principal_name.sql` | Add principal_name to products array |
| `20251108213039_fix_rls_policies_role_based_access.sql` | Admin-only UPDATE/DELETE for shared resources |
| `20251108213216_cleanup_duplicate_rls_policies.sql` | Remove permissive duplicates |
| `20251111121526_add_role_based_permissions.sql` | Add user_role enum and role column to sales |
| `20251113235406_principal_opportunities_view.sql` | Dashboard V2 principal opportunities view |
| `20251114001720_priority_tasks_view.sql` | Dashboard V2 priority tasks view |
| `20251116030314_add_sales_id_to_dashboard_views.sql` | Add sales_id for assignee filtering |
| `20251116210019_fix_sales_schema_consistency.sql` | Add administrator computed column |

---

## Design System Implications

### Badge Colors

**Priority Levels:**
- `low` → Blue (`--color-blue-500`)
- `medium` → Yellow (`--color-yellow-500`)
- `high` → Orange (`--color-orange-500`)
- `critical` → Red (`--color-red-500`)

**Status:**
- `active` → Green (`--color-green-500`)
- `on_hold` → Gray (`--color-gray-500`)
- `closed_won` → Success (`--color-success`)
- `closed_lost` → Muted (`--color-muted`)

**Health Status (Dashboard V2):**
- `active` → Green (< 7 days since activity)
- `cooling` → Yellow (7-14 days since activity)
- `at_risk` → Red (> 14 days since activity)

---

### Empty State Handling

**JSONB Arrays:** Always default to `'[]'::jsonb`, never NULL

```sql
email JSONB DEFAULT '[]'::jsonb
phone JSONB DEFAULT '[]'::jsonb
```

**UI Pattern:** Check array length before rendering

```tsx
{contact.email?.length > 0 ? (
  <EmailList emails={contact.email} />
) : (
  <EmptyState message="No email addresses" />
)}
```

---

### Soft Delete Pattern

**All Core Tables:** Use `deleted_at TIMESTAMPTZ` for soft deletes

**Query Pattern:**
```sql
WHERE deleted_at IS NULL
```

**Applied in:** All summary views, dashboard views, list queries

**Never show deleted records in UI** - filter at view/query level, not application level

---

## Performance Considerations

### View Query Times

| View | Query Time | Purpose |
|------|-----------|---------|
| `organizations_summary` | ~30ms | Pre-aggregate counts (vs N+1 queries) |
| `contacts_summary` | ~20ms | Single JOIN vs individual lookups |
| `principal_opportunities` | ~50ms | Replace 500ms client-side filtering |
| `priority_tasks` | ~40ms | Pre-filter high-priority tasks |

### Indexing Strategy

**Search Fields:** All tables have `search_tsv TSVECTOR` for full-text search

**Foreign Keys:** Indexed for JOIN performance
- `contacts.organization_id`
- `opportunities.customer_organization_id`
- `opportunities.principal_organization_id`
- `tasks.opportunity_id`
- `products.principal_id`

**Role-Based Queries:** `idx_sales_role ON sales(role)` for permission checks

---

## Testing Considerations

### Seed Data

**File:** `supabase/seed.sql`

**Test User:** admin@test.com / password123 (role='admin')

**Organizations:** 16 organizations (customers, principals, distributors)

**Data Generation:** 
- Sales records created via trigger (not manual INSERT)
- All foreign keys validated
- No orphaned records

**Migration:** `20251116210019_fix_sales_schema_consistency.sql` ensures 1:1 auth.users → sales mapping

---

### RLS Testing

**Login as non-admin:** Verify UPDATE/DELETE fails for shared resources

```sql
-- Should fail with permission denied
UPDATE contacts SET name = 'Test' WHERE id = 1;
DELETE FROM organizations WHERE id = 1;
```

**Login as admin:** Verify all operations succeed

**Tasks isolation:** Verify users only see their own tasks

---

## Migration Workflow

**Create:**
```bash
npx supabase migration new <name>
```

**Validate:**
```bash
npm run db:cloud:push:dry-run
```

**Deploy:**
```bash
npm run db:cloud:push  # or let CI/CD handle it
```

**Verify:**
```bash
npm run db:cloud:status
```

**Reference:** `docs/supabase/WORKFLOW.md`

---

## Known Issues

1. **Assignee Filter (Dashboard V2):** `assignee='me'` filter always returns zero results because `sales` table lacks `user_id` mapping for filtering. Requires migration to add `user_id` column with proper `auth.uid()` integration.

2. **is_admin Deprecation:** `sales.is_admin` column deprecated in favor of `role` enum. Frontend should migrate to using `role` directly. Computed `administrator` column is transitional.

3. **Product Category:** Changed from enum to TEXT in `20251028044618_change_product_category_to_text.sql`. UI should handle arbitrary string values gracefully.

---

**End of Database Schema Documentation**
