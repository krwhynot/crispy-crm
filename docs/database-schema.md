# Crispy CRM Database Schema

**Generated:** 2025-12-07 (Updated after migration `20251207214606_add_import_support_columns.sql`)
**Database:** PostgreSQL 17 + Supabase
**Tables:** 24 | **Enums:** 14 | **Foreign Keys:** 69

---

## Table of Contents

1. [Tables Overview](#tables-overview)
2. [Key Tables (Detailed)](#key-tables-detailed)
3. [Enum Types](#enum-types)
4. [Foreign Key Map](#foreign-key-map)
5. [Indexes](#indexes)
6. [Schema Gaps for Import](#schema-gaps-for-import)

---

## Tables Overview

| Table | Description |
|-------|-------------|
| `activities` | Interaction logs (calls, emails, meetings) |
| `audit_trail` | Change tracking for compliance |
| `contact_notes` | Notes attached to contacts |
| `contacts` | People associated with organizations |
| `distributor_principal_authorizations` | Which distributors carry which principals |
| `interaction_participants` | M:M contacts ↔ activities |
| `migration_history` | Database migration tracking |
| `notifications` | User notifications |
| `opportunities` | Sales pipeline deals |
| `opportunity_contacts` | M:M opportunities ↔ contacts |
| `opportunity_notes` | Notes attached to opportunities |
| `opportunity_participants` | M:M opportunities ↔ participants |
| `opportunity_products` | M:M opportunities ↔ products |
| `organization_distributors` | M:M organizations ↔ distributor relationships |
| `organization_notes` | Notes attached to organizations |
| `organizations` | Companies (customers, distributors, principals, prospects) |
| `product_distributor_authorizations` | Which distributors carry which products |
| `products` | Product catalog |
| `sales` | Sales team members (linked to Supabase auth) |
| `segments` | Industry segments / playbook categories |
| `tags` | Tagging system |
| `tasks` | To-do items and follow-ups |
| `test_user_metadata` | Test user data |
| `tutorial_progress` | Onboarding tutorial tracking |

---

## Key Tables (Detailed)

### organizations

The core entity representing companies in the CRM.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `name` | `text` | NO | - | Unique (case-insensitive, soft-delete aware) |
| `organization_type` | `organization_type` | YES | `'unknown'` | Enum: customer, principal, distributor, prospect, unknown |
| `priority` | `varchar` | YES | `'C'` | A, B, C priority |
| `website` | `text` | YES | - | |
| `address` | `text` | YES | - | |
| `city` | `text` | YES | - | |
| `state` | `text` | YES | - | |
| `postal_code` | `text` | YES | - | |
| `phone` | `text` | YES | - | |
| `email` | `text` | YES | - | |
| `logo_url` | `text` | YES | - | |
| `linkedin_url` | `text` | YES | - | |
| `employee_count` | `integer` | YES | - | |
| `founded_year` | `integer` | YES | - | |
| `notes` | `text` | YES | - | |
| `sales_id` | `bigint` | YES | - | FK → sales(id) |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id) |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `import_session_id` | `uuid` | YES | - | Batch import tracking |
| `search_tsv` | `tsvector` | YES | - | Full-text search |
| `context_links` | `jsonb` | YES | - | External resource links |
| `description` | `text` | YES | - | |
| `tax_identifier` | `text` | YES | - | |
| `segment_id` | `uuid` | YES | - | FK → segments(id), operator segment |
| `playbook_category_id` | `uuid` | YES | - | FK → segments(id), playbook category ✨ **NEW** |
| `cuisine` | `text` | YES | - | Restaurant cuisine type ✨ **NEW** |
| `needs_review` | `text` | YES | - | Review flag with reason ✨ **NEW** |
| `updated_by` | `bigint` | YES | - | FK → sales(id) |
| `parent_organization_id` | `bigint` | YES | - | FK → organizations(id), self-reference |

**Key Constraints:**
- `organizations_name_unique_idx`: UNIQUE on `lower(name)` WHERE `deleted_at IS NULL`
- Soft deletes via `deleted_at` column

**Indexes (NEW):**
- `idx_organizations_playbook_category_id`: btree on `playbook_category_id` WHERE NOT NULL AND `deleted_at IS NULL`
- `idx_organizations_cuisine`: btree on `cuisine` WHERE NOT NULL AND `deleted_at IS NULL`
- `idx_organizations_needs_review`: btree on `needs_review` WHERE NOT NULL AND `deleted_at IS NULL`

---

### segments

Industry segments and playbook categories for organization classification.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `name` | `text` | NO | - | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `created_by` | `uuid` | YES | - | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `segment_type` | `text` | YES | `'playbook'` | 'playbook' or 'operator' |
| `parent_id` | `uuid` | YES | - | FK → segments(id), self-reference for hierarchy |
| `display_order` | `integer` | YES | `0` | Sort order in UI |
| `ui_group` | `text` | YES | - | Commercial or Institutional grouping ✨ **NEW** |

**Key Constraints:**
- `segments_name_type_unique`: UNIQUE on `(name, segment_type)`
- `segments_name_type_case_insensitive_idx`: UNIQUE on `(lower(name), segment_type)`

**✅ All import columns now present** (migration `20251207214606`)

---

### contacts

People associated with organizations.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `name` | `text` | NO | - | Full name |
| `first_name` | `text` | YES | - | |
| `last_name` | `text` | YES | - | |
| `email` | `jsonb` | YES | `'[]'` | Array of email objects |
| `phone` | `jsonb` | YES | `'[]'` | Array of phone objects |
| `title` | `text` | YES | - | Job title |
| `department` | `text` | YES | - | |
| `address` | `text` | YES | - | |
| `city` | `text` | YES | - | |
| `state` | `text` | YES | - | |
| `postal_code` | `text` | YES | - | |
| `country` | `text` | YES | `'USA'` | |
| `birthday` | `date` | YES | - | |
| `linkedin_url` | `text` | YES | - | |
| `twitter_handle` | `text` | YES | - | |
| `notes` | `text` | YES | - | |
| `sales_id` | `bigint` | YES | - | FK → sales(id), owner |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id) |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `search_tsv` | `tsvector` | YES | - | Full-text search |
| `first_seen` | `timestamptz` | YES | `now()` | |
| `last_seen` | `timestamptz` | YES | `now()` | |
| `gender` | `text` | YES | - | |
| `tags` | `bigint[]` | YES | `'{}'` | Array of tag IDs |
| `organization_id` | `bigint` | NO | - | FK → organizations(id) **REQUIRED** |
| `updated_by` | `bigint` | YES | - | FK → sales(id) |
| `status` | `text` | YES | `'cold'` | Contact status |

**Key Constraints:**
- `organization_id` is **NOT NULL** and references `organizations(id)` with `ON DELETE RESTRICT`
- Each contact MUST belong to exactly one organization

---

### organization_distributors

Junction table linking organizations to their distributor relationships.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | - | PK |
| `organization_id` | `bigint` | NO | - | FK → organizations(id), the customer/prospect |
| `distributor_id` | `bigint` | NO | - | FK → organizations(id), must be a distributor |
| `is_primary` | `boolean` | NO | `false` | Only ONE primary per organization |
| `notes` | `text` | YES | - | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id) |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

**Key Constraints:**
- `uq_organization_distributor`: UNIQUE on `(organization_id, distributor_id)` - prevents duplicates
- `idx_organization_one_primary_distributor`: UNIQUE on `(organization_id)` WHERE `is_primary = true AND deleted_at IS NULL` - enforces ONE primary distributor per org
- `no_self_distribution`: CHECK constraint `organization_id <> distributor_id` - prevents self-referencing
- Both FKs use `ON DELETE CASCADE`

**✅ This table exists and matches import requirements!**

---

## Enum Types

### organization_type
```sql
CREATE TYPE organization_type AS ENUM (
    'customer',
    'principal',
    'distributor',
    'prospect',
    'unknown'
);
```

### opportunity_stage
```sql
CREATE TYPE opportunity_stage AS ENUM (
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'feedback_logged',
    'demo_scheduled',
    'closed_won',
    'closed_lost'
);
```

### opportunity_status
```sql
CREATE TYPE opportunity_status AS ENUM (
    'active',
    'on_hold',
    'nurturing',
    'stalled',
    'expired'
);
```

### activity_type
```sql
CREATE TYPE activity_type AS ENUM (
    'engagement',
    'interaction'
);
```

### interaction_type
```sql
CREATE TYPE interaction_type AS ENUM (
    'call', 'email', 'meeting', 'demo', 'proposal',
    'follow_up', 'trade_show', 'site_visit', 'contract_review',
    'check_in', 'social', 'note', 'sample'
);
```

### task_type
```sql
CREATE TYPE task_type AS ENUM (
    'Call', 'Email', 'Meeting', 'Follow-up', 'Demo', 'Proposal', 'Other'
);
```

### priority_level
```sql
CREATE TYPE priority_level AS ENUM (
    'low', 'medium', 'high', 'critical'
);
```

### user_role
```sql
CREATE TYPE user_role AS ENUM (
    'admin', 'manager', 'rep'
);
```

### contact_role
```sql
CREATE TYPE contact_role AS ENUM (
    'decision_maker', 'influencer', 'buyer', 'end_user',
    'gatekeeper', 'champion', 'technical', 'executive'
);
```

### product_category
```sql
CREATE TYPE product_category AS ENUM (
    'beverages', 'dairy', 'frozen', 'fresh_produce', 'meat_poultry',
    'seafood', 'dry_goods', 'snacks', 'condiments', 'baking_supplies',
    'spices_seasonings', 'canned_goods', 'pasta_grains', 'oils_vinegars',
    'sweeteners', 'cleaning_supplies', 'paper_products', 'equipment', 'other'
);
```

### product_status
```sql
CREATE TYPE product_status AS ENUM (
    'active', 'discontinued', 'seasonal', 'coming_soon', 'limited_availability'
);
```

### sample_status
```sql
CREATE TYPE sample_status AS ENUM (
    'sent', 'received', 'feedback_pending', 'feedback_received'
);
```

### loss_reason
```sql
CREATE TYPE loss_reason AS ENUM (
    'price_too_high', 'no_authorization', 'competitor_relationship',
    'product_fit', 'timing', 'no_response', 'other'
);
```

### win_reason
```sql
CREATE TYPE win_reason AS ENUM (
    'relationship', 'product_quality', 'price_competitive', 'timing', 'other'
);
```

---

## Foreign Key Map

### Core Entity Relationships

```
organizations.segment_id → segments.id (NO ACTION)
organizations.parent_organization_id → organizations.id (NO ACTION, self-ref)
organizations.sales_id → sales.id (NO ACTION)
organizations.created_by → sales.id (NO ACTION)
organizations.updated_by → sales.id (SET NULL)

segments.parent_id → segments.id (NO ACTION, self-ref)

contacts.organization_id → organizations.id (RESTRICT) ⚠️ Blocks org deletion
contacts.sales_id → sales.id (NO ACTION)
contacts.created_by → sales.id (NO ACTION)
contacts.updated_by → sales.id (SET NULL)

organization_distributors.organization_id → organizations.id (CASCADE)
organization_distributors.distributor_id → organizations.id (CASCADE)
organization_distributors.created_by → sales.id (NO ACTION)
```

### Opportunity Relationships

```
opportunities.customer_organization_id → organizations.id (RESTRICT)
opportunities.principal_organization_id → organizations.id (SET NULL)
opportunities.distributor_organization_id → organizations.id (SET NULL)
opportunities.account_manager_id → sales.id (SET NULL)
opportunities.opportunity_owner_id → sales.id (SET NULL)
opportunities.founding_interaction_id → activities.id (SET NULL)
opportunities.related_opportunity_id → opportunities.id (NO ACTION, self-ref)
```

### Activity & Task Relationships

```
activities.contact_id → contacts.id (CASCADE)
activities.organization_id → organizations.id (SET NULL)
activities.opportunity_id → opportunities.id (SET NULL)
activities.related_task_id → tasks.id (SET NULL)

tasks.sales_id → sales.id (NO ACTION)
tasks.contact_id → contacts.id (CASCADE)
tasks.organization_id → organizations.id (SET NULL)
tasks.opportunity_id → opportunities.id (NO ACTION)
```

### Junction Table Relationships

```
opportunity_contacts.opportunity_id → opportunities.id (CASCADE)
opportunity_contacts.contact_id → contacts.id (CASCADE)

opportunity_products.opportunity_id → opportunities.id (CASCADE)
opportunity_products.product_id_reference → products.id (CASCADE)

distributor_principal_authorizations.distributor_id → organizations.id (CASCADE)
distributor_principal_authorizations.principal_id → organizations.id (CASCADE)

product_distributor_authorizations.product_id → products.id (CASCADE)
product_distributor_authorizations.distributor_id → organizations.id (CASCADE)
```

---

## Indexes

### organizations

| Index | Type | Definition |
|-------|------|------------|
| `organizations_pkey` | PK | `USING btree (id)` |
| `organizations_name_unique_idx` | UNIQUE | `lower(name) WHERE deleted_at IS NULL` |
| `idx_companies_organization_type` | INDEX | `organization_type` |
| `idx_companies_priority` | INDEX | `priority` |
| `idx_companies_sales_id` | INDEX | `sales_id` |
| `idx_organizations_created_by` | INDEX | `created_by WHERE created_by IS NOT NULL` |
| `idx_organizations_name` | INDEX | `name WHERE deleted_at IS NULL` |
| `idx_organizations_parent_organization_id` | INDEX | `parent_organization_id WHERE NOT NULL` |
| `idx_organizations_principal` | INDEX | `(id, name) WHERE organization_type = 'principal' AND deleted_at IS NULL` |
| `idx_organizations_search_tsv` | GIN | `search_tsv WHERE deleted_at IS NULL` |
| `idx_organizations_segment_id` | INDEX | `segment_id WHERE segment_id IS NOT NULL` |
| `idx_organizations_type_distributor` | INDEX | `organization_type WHERE = 'distributor'` |
| `idx_organizations_type_principal` | INDEX | `organization_type WHERE = 'principal'` |
| `idx_organizations_updated_by` | INDEX | `updated_by WHERE updated_by IS NOT NULL` |

### segments

| Index | Type | Definition |
|-------|------|------------|
| `industries_pkey` | PK | `USING btree (id)` |
| `segments_name_type_unique` | UNIQUE | `(name, segment_type)` |
| `segments_name_type_case_insensitive_idx` | UNIQUE | `(lower(name), segment_type)` |
| `idx_segments_parent` | INDEX | `parent_id WHERE parent_id IS NOT NULL` |
| `idx_segments_type` | INDEX | `segment_type` |

### contacts

| Index | Type | Definition |
|-------|------|------------|
| `contacts_pkey` | PK | `USING btree (id)` |
| `idx_contacts_organization_id` | INDEX | `organization_id WHERE deleted_at IS NULL` |
| `idx_contacts_sales_id` | INDEX | `sales_id` |
| `idx_contacts_created_by` | INDEX | `created_by WHERE created_by IS NOT NULL` |
| `idx_contacts_deleted_at` | INDEX | `deleted_at WHERE deleted_at IS NULL` |
| `idx_contacts_search_tsv` | GIN | `search_tsv` |
| `idx_contacts_updated_by` | INDEX | `updated_by WHERE updated_by IS NOT NULL` |

### organization_distributors

| Index | Type | Definition |
|-------|------|------------|
| `organization_distributors_pkey` | PK | `USING btree (id)` |
| `uq_organization_distributor` | UNIQUE | `(organization_id, distributor_id)` |
| `idx_organization_one_primary_distributor` | UNIQUE | `organization_id WHERE is_primary = true AND deleted_at IS NULL` |
| `idx_org_distributors_org_id` | INDEX | `organization_id WHERE deleted_at IS NULL` |
| `idx_org_distributors_dist_id` | INDEX | `distributor_id WHERE deleted_at IS NULL` |
| `idx_org_distributors_primary` | INDEX | `(organization_id, distributor_id) WHERE deleted_at IS NULL AND is_primary = true` |

---

## Schema Gaps for Import

### ✅ ALL COLUMNS PRESENT (Migration Applied: `20251207214606`)

| Table/Column | Status | Notes |
|--------------|--------|-------|
| `organization_distributors` table | ✅ EXISTS | All expected columns present |
| `organization_distributors.is_primary` | ✅ EXISTS | Boolean, NOT NULL, DEFAULT false |
| `organization_distributors` unique constraint | ✅ EXISTS | `uq_organization_distributor` on (org_id, dist_id) |
| `organization_distributors` one-primary index | ✅ EXISTS | Partial unique index enforcing one primary |
| `segments.segment_type` | ✅ EXISTS | text, DEFAULT 'playbook' |
| `segments.parent_id` | ✅ EXISTS | uuid FK, self-referencing |
| `segments.display_order` | ✅ EXISTS | integer, DEFAULT 0 |
| `segments.ui_group` | ✅ **ADDED** | text, for Commercial/Institutional grouping |
| `contacts.organization_id` | ✅ EXISTS | bigint FK → organizations(id), **NOT NULL** |
| `organizations.segment_id` | ✅ EXISTS | uuid FK → segments(id) |
| `organizations.playbook_category_id` | ✅ **ADDED** | uuid FK → segments(id), with partial index |
| `organizations.cuisine` | ✅ **ADDED** | text, with partial index |
| `organizations.needs_review` | ✅ **ADDED** | text, with partial index |

### Migration Applied

**File:** `supabase/migrations/20251207214606_add_import_support_columns.sql`

**Changes:**
1. Added `segments.ui_group` (text) - for Commercial/Institutional classification
2. Added `organizations.playbook_category_id` (uuid FK → segments) - playbook category reference
3. Added `organizations.cuisine` (text) - restaurant cuisine type
4. Added `organizations.needs_review` (text) - review flag with reason
5. Created 3 partial indexes for efficient filtering on new columns

---

## Import Checklist

### Pre-Import Verification

- [x] `organization_distributors` table exists
- [x] Unique constraint on (organization_id, distributor_id)
- [x] One-primary-per-org constraint exists
- [x] `contacts.organization_id` is NOT NULL with FK
- [x] `segments` supports hierarchy via `parent_id`
- [x] `segments.ui_group` column exists
- [x] `organizations.playbook_category_id` column exists with FK
- [x] `organizations.cuisine` column exists
- [x] `organizations.needs_review` column exists

### Import Order (Dependency-Safe)

1. **segments** (no dependencies)
2. **organizations** with `organization_type = 'distributor'` (needs segments)
3. **organizations** with other types (needs segments, distributors exist)
4. **organization_distributors** (needs both org types)
5. **contacts** (needs organizations)

---

*Document generated by Claude Code schema audit (updated after migration 20251207214606)*
