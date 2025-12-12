# Crispy CRM Database Schema

**Generated:** 2025-12-08 (via Supabase MCP)
**Last Security Audit:** 2025-12-12 (RLS & Authorization Deep Dive - PASSED)
**Database:** PostgreSQL 17 + Supabase
**Tables:** 24 | **Enums:** 14 | **Foreign Keys:** 69+

> **Security Note:** All tables have RLS enabled. All views use SECURITY INVOKER.
> All SECURITY DEFINER functions have search_path hardening. See audit report
> at `.claude/plans/wondrous-discovering-blanket.md` for full details.

---

## Table of Contents

1. [Tables Overview](#tables-overview)
2. [Key Tables (Detailed)](#key-tables-detailed)
3. [Enum Types](#enum-types)
4. [Foreign Key Map](#foreign-key-map)
5. [Indexes](#indexes)
6. [Current Row Counts](#current-row-counts)

---

## Tables Overview

| Table | Description | RLS |
|-------|-------------|-----|
| `activities` | Interaction logs (calls, emails, meetings) | Yes |
| `audit_trail` | Field-level change tracking for compliance | Yes |
| `contact_notes` | Notes attached to contacts | Yes |
| `contacts` | People associated with organizations | Yes |
| `distributor_principal_authorizations` | Which distributors carry which principals | Yes |
| `interaction_participants` | M:M contacts ↔ activities | Yes |
| `migration_history` | Database migration tracking | Yes |
| `notifications` | User notifications | Yes |
| `opportunities` | Sales pipeline deals | Yes |
| `opportunity_contacts` | M:M opportunities ↔ contacts | Yes |
| `opportunity_notes` | Notes attached to opportunities | Yes |
| `opportunity_participants` | M:M opportunities ↔ participants | Yes |
| `opportunity_products` | M:M opportunities ↔ products | Yes |
| `organization_distributors` | M:M organizations ↔ distributor relationships | Yes |
| `organization_notes` | Notes attached to organizations | Yes |
| `organizations` | Companies (customers, distributors, principals, prospects) | Yes |
| `product_distributor_authorizations` | Which distributors carry which products | Yes |
| `products` | Product catalog | Yes |
| `sales` | Sales team members (linked to Supabase auth) | Yes |
| `segments` | Industry segments / playbook categories | Yes |
| `tags` | Tagging system | Yes |
| `tasks` | To-do items and follow-ups | Yes |
| `test_user_metadata` | Test user data | Yes |
| `tutorial_progress` | Onboarding tutorial tracking | Yes |

---

## Key Tables (Detailed)

### organizations

The core entity representing companies in the CRM.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `name` | `text` | NO | - | Unique (case-insensitive, soft-delete aware) |
| `organization_type` | `organization_type` | YES | `'prospect'` | Enum: customer, prospect, principal, distributor |
| `priority` | `varchar` | YES | `'C'` | A, B, C, D priority |
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
| `description` | `text` | YES | - | Organization description |
| `tax_identifier` | `text` | YES | - | Tax ID (EIN, VAT, etc.) |
| `sales_id` | `bigint` | YES | - | FK → sales(id) |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id), auto-populated |
| `updated_by` | `bigint` | YES | - | FK → sales(id), auto-populated by trigger |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `import_session_id` | `uuid` | YES | - | Batch import tracking |
| `search_tsv` | `tsvector` | YES | - | Full-text search |
| `context_links` | `jsonb` | YES | - | Array of related URLs/references |
| `segment_id` | `uuid` | YES | - | FK → segments(id), operator segment |
| `playbook_category_id` | `uuid` | YES | - | FK → segments(id), playbook category |
| `cuisine` | `text` | YES | - | Restaurant cuisine type |
| `needs_review` | `text` | YES | - | Review flag with reason |
| `parent_organization_id` | `bigint` | YES | - | FK → organizations(id), self-reference for hierarchy |

**Key Constraints:**
- `organizations_name_unique_idx`: UNIQUE on `lower(name)` WHERE `deleted_at IS NULL`
- Soft deletes via `deleted_at` column

**Indexes:**
- `idx_organizations_playbook_category_id`: btree on `playbook_category_id` WHERE NOT NULL AND `deleted_at IS NULL`
- `idx_organizations_cuisine`: btree on `cuisine` WHERE NOT NULL AND `deleted_at IS NULL`
- `idx_organizations_needs_review`: btree on `needs_review` WHERE NOT NULL AND `deleted_at IS NULL`
- `idx_organizations_parent_organization_id`: btree on `parent_organization_id` WHERE NOT NULL

---

### segments

Industry segments and playbook categories for organization classification.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `name` | `text` | NO | - | |
| `segment_type` | `text` | YES | `'playbook'` | 'playbook' or 'operator' (CHECK constraint) |
| `parent_id` | `uuid` | YES | - | FK → segments(id), self-reference for hierarchy |
| `display_order` | `integer` | YES | `0` | Sort order in UI |
| `ui_group` | `text` | YES | - | Commercial or Institutional grouping |
| `created_at` | `timestamptz` | NO | `now()` | |
| `created_by` | `uuid` | YES | - | FK → auth.users(id) |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

**Key Constraints:**
- `segments_name_type_unique`: UNIQUE on `(name, segment_type)`
- `segments_name_type_case_insensitive_idx`: UNIQUE on `(lower(name), segment_type)`

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
| `status` | `text` | YES | `'cold'` | Contact engagement: cold, warm, hot, in-contract |
| `gender` | `text` | YES | - | |
| `tags` | `bigint[]` | YES | `'{}'` | Array of tag IDs |
| `organization_id` | `bigint` | NO | - | FK → organizations(id), **REQUIRED** |
| `sales_id` | `bigint` | YES | - | FK → sales(id), owner |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id), auto-populated |
| `updated_by` | `bigint` | YES | - | FK → sales(id), auto-populated by trigger |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `search_tsv` | `tsvector` | YES | - | Full-text search |
| `first_seen` | `timestamptz` | YES | `now()` | |
| `last_seen` | `timestamptz` | YES | `now()` | |

**Key Constraints:**
- `organization_id` is **NOT NULL** and references `organizations(id)` with `ON DELETE RESTRICT`
- Each contact MUST belong to exactly one organization

---

### opportunities

Sales pipeline deals.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `name` | `text` | NO | - | |
| `description` | `text` | YES | - | |
| `stage` | `opportunity_stage` | YES | `'new_lead'` | 7 pipeline stages |
| `status` | `opportunity_status` | YES | `'active'` | active, on_hold, nurturing, stalled, expired |
| `priority` | `priority_level` | YES | `'medium'` | low, medium, high, critical |
| `index` | `integer` | YES | - | |
| `estimated_close_date` | `date` | YES | `CURRENT_DATE + 90 days` | |
| `actual_close_date` | `date` | YES | - | |
| `stage_changed_at` | `timestamptz` | NO | `now()` | Auto-updated when stage changes |
| `customer_organization_id` | `bigint` | NO | - | FK → organizations(id), **REQUIRED** |
| `principal_organization_id` | `bigint` | YES | - | FK → organizations(id) |
| `distributor_organization_id` | `bigint` | YES | - | FK → organizations(id) |
| `opportunity_owner_id` | `bigint` | NO | - | FK → sales(id), **REQUIRED** |
| `account_manager_id` | `bigint` | YES | - | FK → sales(id) |
| `founding_interaction_id` | `bigint` | YES | - | FK → activities(id) |
| `related_opportunity_id` | `bigint` | YES | - | FK → opportunities(id), self-ref |
| `contact_ids` | `bigint[]` | YES | `'{}'` | DEPRECATED - use opportunity_contacts |
| `next_action` | `text` | YES | - | |
| `next_action_date` | `date` | YES | - | |
| `competition` | `text` | YES | - | |
| `decision_criteria` | `text` | YES | - | |
| `notes` | `text` | YES | - | Quick reference notes |
| `campaign` | `text` | YES | - | Marketing campaign name |
| `tags` | `text[]` | YES | `'{}'` | Categorization tags |
| `lead_source` | `text` | YES | - | CHECK: referral, trade_show, website, cold_call, etc. |
| `win_reason` | `win_reason` | YES | - | Required when closed_won |
| `loss_reason` | `loss_reason` | YES | - | Required when closed_lost |
| `close_reason_notes` | `text` | YES | - | Required when reason = 'other', max 500 chars |
| `stage_manual` | `boolean` | YES | `false` | |
| `status_manual` | `boolean` | YES | `false` | |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `created_by` | `bigint` | YES | - | FK → sales(id), auto-populated |
| `updated_by` | `bigint` | YES | - | FK → sales(id), auto-populated by trigger |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `search_tsv` | `tsvector` | YES | - | Full-text search |

---

### activities

Team activities and customer interactions.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `activity_type` | `activity_type` | NO | - | engagement or interaction |
| `type` | `interaction_type` | NO | - | call, email, meeting, demo, sample, etc. |
| `subject` | `text` | NO | - | |
| `description` | `text` | YES | - | |
| `activity_date` | `timestamptz` | YES | `now()` | |
| `duration_minutes` | `integer` | YES | - | |
| `outcome` | `text` | YES | - | |
| `sentiment` | `varchar` | YES | - | CHECK: positive, neutral, negative |
| `location` | `text` | YES | - | |
| `attendees` | `text[]` | YES | - | |
| `attachments` | `text[]` | YES | - | |
| `tags` | `text[]` | YES | - | |
| `follow_up_required` | `boolean` | YES | `false` | |
| `follow_up_date` | `date` | YES | - | |
| `follow_up_notes` | `text` | YES | - | |
| `sample_status` | `sample_status` | YES | - | For type=sample: sent, received, feedback_pending, feedback_received |
| `contact_id` | `bigint` | YES | - | FK → contacts(id), CASCADE |
| `organization_id` | `bigint` | YES | - | FK → organizations(id) |
| `opportunity_id` | `bigint` | YES | - | FK → opportunities(id) |
| `related_task_id` | `bigint` | YES | - | FK → tasks(id), links activity to completed task |
| `created_by` | `bigint` | YES | - | FK → sales(id) |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

---

### tasks

Personal task management.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `title` | `text` | NO | - | Brief task description |
| `description` | `text` | YES | - | Detailed description |
| `type` | `task_type` | YES | `'Call'` | Call, Email, Meeting, Follow-up, Demo, Proposal, Other |
| `priority` | `priority_level` | YES | `'medium'` | low, medium, high, critical |
| `due_date` | `date` | YES | - | |
| `reminder_date` | `date` | YES | - | |
| `snooze_until` | `timestamptz` | YES | - | Hidden from active views until this time |
| `completed` | `boolean` | YES | `false` | |
| `completed_at` | `timestamptz` | YES | - | |
| `overdue_notified_at` | `timestamptz` | YES | - | Prevents duplicate overdue notifications |
| `sales_id` | `bigint` | NO | - | FK → sales(id), **REQUIRED** task owner |
| `contact_id` | `bigint` | YES | - | FK → contacts(id), CASCADE |
| `organization_id` | `bigint` | YES | - | FK → organizations(id) |
| `opportunity_id` | `bigint` | YES | - | FK → opportunities(id) |
| `created_by` | `bigint` | YES | `get_current_sales_id()` | FK → sales(id), auto-populated |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

**RLS Policy:** Creator-only access (users see only their own tasks)

---

### sales

Sales team members linked to Supabase auth.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `user_id` | `uuid` | YES | - | FK → auth.users(id), UNIQUE |
| `first_name` | `text` | YES | - | |
| `last_name` | `text` | YES | - | |
| `email` | `text` | YES | - | |
| `phone` | `text` | YES | - | |
| `avatar_url` | `text` | YES | - | |
| `role` | `user_role` | NO | `'rep'` | admin, manager, rep |
| `administrator` | `boolean` | YES | - | GENERATED: `role = 'admin'` |
| `is_admin` | `boolean` | YES | `false` | **DEPRECATED**: Use role column |
| `disabled` | `boolean` | YES | `false` | Account disabled for offboarding |
| `digest_opt_in` | `boolean` | NO | `true` | Daily digest email preference |
| `timezone` | `text` | YES | `'America/Chicago'` | IANA format, CHECK constraint |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

---

### products

Product catalog for opportunities.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | auto-increment | PK |
| `name` | `text` | NO | - | |
| `category` | `text` | NO | - | CHECK: not empty |
| `description` | `text` | YES | - | |
| `sku` | `text` | YES | - | Stock Keeping Unit |
| `manufacturer_part_number` | `text` | YES | - | |
| `status` | `product_status` | YES | `'active'` | active, discontinued, seasonal, etc. |
| `principal_id` | `bigint` | NO | - | FK → organizations(id) |
| `distributor_id` | `integer` | YES | - | FK → organizations(id) |
| `created_by` | `bigint` | YES | - | FK → sales(id), auto-populated |
| `updated_by` | `bigint` | YES | - | FK → sales(id), auto-populated by trigger |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |
| `search_tsv` | `tsvector` | YES | - | Full-text search |

---

### organization_distributors

Junction table linking organizations to their distributor relationships.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | NO | IDENTITY ALWAYS | PK |
| `organization_id` | `bigint` | NO | - | FK → organizations(id), the customer/prospect |
| `distributor_id` | `bigint` | NO | - | FK → organizations(id), must be a distributor |
| `is_primary` | `boolean` | NO | `false` | Only ONE primary per organization |
| `notes` | `text` | YES | - | |
| `created_by` | `bigint` | YES | - | FK → sales(id) |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |
| `deleted_at` | `timestamptz` | YES | - | Soft delete marker |

**Key Constraints:**
- `uq_organization_distributor`: UNIQUE on `(organization_id, distributor_id)` - prevents duplicates
- `idx_organization_one_primary_distributor`: UNIQUE on `organization_id` WHERE `is_primary = true AND deleted_at IS NULL`
- `no_self_distribution`: CHECK constraint `organization_id <> distributor_id`
- Both FKs use `ON DELETE CASCADE`

---

## Enum Types

### organization_type
```sql
CREATE TYPE organization_type AS ENUM (
    'customer', 'prospect', 'principal', 'distributor'
);
```

### opportunity_stage
```sql
CREATE TYPE opportunity_stage AS ENUM (
    'new_lead', 'initial_outreach', 'sample_visit_offered',
    'feedback_logged', 'demo_scheduled', 'closed_won', 'closed_lost'
);
```

### opportunity_status
```sql
CREATE TYPE opportunity_status AS ENUM (
    'active', 'on_hold', 'nurturing', 'stalled', 'expired'
);
```

### activity_type
```sql
CREATE TYPE activity_type AS ENUM ('engagement', 'interaction');
```

### interaction_type
```sql
CREATE TYPE interaction_type AS ENUM (
    'call', 'email', 'meeting', 'demo', 'proposal', 'follow_up',
    'trade_show', 'site_visit', 'contract_review', 'check_in',
    'social', 'note', 'sample'
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
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
```

### user_role
```sql
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');
```

### contact_role
```sql
CREATE TYPE contact_role AS ENUM (
    'decision_maker', 'influencer', 'buyer', 'end_user',
    'gatekeeper', 'champion', 'technical', 'executive'
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
organizations.playbook_category_id → segments.id (NO ACTION)
organizations.parent_organization_id → organizations.id (NO ACTION, self-ref)
organizations.sales_id → sales.id (NO ACTION)
organizations.created_by → sales.id (NO ACTION)
organizations.updated_by → sales.id (SET NULL)

segments.parent_id → segments.id (NO ACTION, self-ref)
segments.created_by → auth.users.id (NO ACTION)

contacts.organization_id → organizations.id (RESTRICT) ⚠️ Blocks org deletion
contacts.sales_id → sales.id (NO ACTION)
contacts.created_by → sales.id (NO ACTION)
contacts.updated_by → sales.id (SET NULL)

organization_distributors.organization_id → organizations.id (CASCADE)
organization_distributors.distributor_id → organizations.id (CASCADE)
organization_distributors.created_by → sales.id (NO ACTION)

sales.user_id → auth.users.id (NO ACTION)
```

### Opportunity Relationships

```
opportunities.customer_organization_id → organizations.id (RESTRICT)
opportunities.principal_organization_id → organizations.id (SET NULL)
opportunities.distributor_organization_id → organizations.id (SET NULL)
opportunities.opportunity_owner_id → sales.id (SET NULL)
opportunities.account_manager_id → sales.id (SET NULL)
opportunities.founding_interaction_id → activities.id (SET NULL)
opportunities.related_opportunity_id → opportunities.id (NO ACTION, self-ref)
opportunities.created_by → sales.id (NO ACTION)
opportunities.updated_by → sales.id (SET NULL)
```

### Activity & Task Relationships

```
activities.contact_id → contacts.id (CASCADE)
activities.organization_id → organizations.id (SET NULL)
activities.opportunity_id → opportunities.id (SET NULL)
activities.related_task_id → tasks.id (SET NULL)
activities.created_by → sales.id (NO ACTION)

tasks.sales_id → sales.id (NO ACTION)
tasks.contact_id → contacts.id (CASCADE)
tasks.organization_id → organizations.id (SET NULL)
tasks.opportunity_id → opportunities.id (NO ACTION)
tasks.created_by → sales.id (NO ACTION)
```

### Junction Table Relationships

```
opportunity_contacts.opportunity_id → opportunities.id (CASCADE)
opportunity_contacts.contact_id → contacts.id (CASCADE)

opportunity_products.opportunity_id → opportunities.id (CASCADE)
opportunity_products.product_id_reference → products.id (CASCADE)

opportunity_participants.opportunity_id → opportunities.id (CASCADE)
opportunity_participants.created_by → sales.id (NO ACTION)

interaction_participants.activity_id → activities.id (CASCADE)
interaction_participants.contact_id → contacts.id (NO ACTION)
interaction_participants.created_by → sales.id (NO ACTION)

distributor_principal_authorizations.distributor_id → organizations.id (CASCADE)
distributor_principal_authorizations.principal_id → organizations.id (CASCADE)
distributor_principal_authorizations.created_by → sales.id (NO ACTION)

product_distributor_authorizations.product_id → products.id (CASCADE)
product_distributor_authorizations.distributor_id → organizations.id (CASCADE)
product_distributor_authorizations.created_by → sales.id (NO ACTION)
```

### Notes Tables

```
contact_notes.contact_id → contacts.id (CASCADE)
contact_notes.sales_id → sales.id (NO ACTION)
contact_notes.created_by → sales.id (NO ACTION)
contact_notes.updated_by → sales.id (SET NULL)

organization_notes.organization_id → organizations.id (CASCADE)
organization_notes.sales_id → sales.id (NO ACTION)
organization_notes.updated_by → sales.id (SET NULL)

opportunity_notes.opportunity_id → opportunities.id (CASCADE)
opportunity_notes.sales_id → sales.id (NO ACTION)
opportunity_notes.created_by → sales.id (NO ACTION)
opportunity_notes.updated_by → sales.id (SET NULL)
```

### Tutorial & Audit

```
tutorial_progress.sales_id → sales.id (NO ACTION)
tutorial_progress.created_organization_id → organizations.id (NO ACTION)
tutorial_progress.created_contact_id → contacts.id (NO ACTION)
tutorial_progress.created_opportunity_id → opportunities.id (NO ACTION)
tutorial_progress.created_activity_id → activities.id (NO ACTION)
tutorial_progress.created_task_id → tasks.id (NO ACTION)

audit_trail.changed_by → sales.id (NO ACTION)

notifications.user_id → auth.users.id (NO ACTION)

test_user_metadata.user_id → auth.users.id (NO ACTION)
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
| `idx_organizations_updated_by` | INDEX | `updated_by WHERE updated_by IS NOT NULL` |
| `idx_organizations_name` | INDEX | `name WHERE deleted_at IS NULL` |
| `idx_organizations_parent_organization_id` | INDEX | `parent_organization_id WHERE NOT NULL` |
| `idx_organizations_principal` | INDEX | `(id, name) WHERE organization_type = 'principal' AND deleted_at IS NULL` |
| `idx_organizations_search_tsv` | GIN | `search_tsv WHERE deleted_at IS NULL` |
| `idx_organizations_segment_id` | INDEX | `segment_id WHERE segment_id IS NOT NULL` |
| `idx_organizations_playbook_category_id` | INDEX | `playbook_category_id WHERE NOT NULL AND deleted_at IS NULL` |
| `idx_organizations_cuisine` | INDEX | `cuisine WHERE NOT NULL AND deleted_at IS NULL` |
| `idx_organizations_needs_review` | INDEX | `needs_review WHERE NOT NULL AND deleted_at IS NULL` |
| `idx_organizations_type_distributor` | INDEX | `organization_type WHERE = 'distributor'` |
| `idx_organizations_type_principal` | INDEX | `organization_type WHERE = 'principal'` |

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
| `idx_contacts_updated_by` | INDEX | `updated_by WHERE updated_by IS NOT NULL` |
| `idx_contacts_deleted_at` | INDEX | `deleted_at WHERE deleted_at IS NULL` |
| `idx_contacts_search_tsv` | GIN | `search_tsv` |

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

## Current Row Counts

As of 2025-12-08 (post cloud seed deployment):

| Table | Row Count |
|-------|-----------|
| `segments` | 9 |
| `sales` | 1 |
| `organizations` | 2,023 |
| `contacts` | 1,638 |
| `organization_distributors` | 673 |
| `audit_trail` | 44,306 |
| `opportunities` | 0 |
| `activities` | 0 |
| `tasks` | 0 |
| `products` | 0 |
| `contact_notes` | 0 |
| `organization_notes` | 0 |
| `opportunity_notes` | 0 |
| `notifications` | 0 |
| `tags` | 0 |

---

*Document generated via Supabase MCP schema introspection (2025-12-08)*
