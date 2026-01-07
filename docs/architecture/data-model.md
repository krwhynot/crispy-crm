# Data Model Reference

> ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
> Generated: 2025-12-26 21:28:58
> Run `npx tsx scripts/generate-schema-docs.ts` to regenerate

## Quick Stats

- **Tables:** 26
- **Foreign Keys:** 72
- **Indexes:** 144

## Table of Contents

- [activities](#activities)
- [audit_trail](#audit_trail)
- [contact_notes](#contact_notes)
- [contacts](#contacts)
- [dashboard_snapshots](#dashboard_snapshots)
- [distributor_principal_authorizations](#distributor_principal_authorizations)
- [interaction_participants](#interaction_participants)
- [migration_history](#migration_history)
- [notifications](#notifications)
- [opportunities](#opportunities)
- [opportunity_contacts](#opportunity_contacts)
- [opportunity_notes](#opportunity_notes)
- [opportunity_participants](#opportunity_participants)
- [opportunity_products](#opportunity_products)
- [organization_distributors](#organization_distributors)
- [organization_notes](#organization_notes)
- [organizations](#organizations)
- [product_distributor_authorizations](#product_distributor_authorizations)
- [product_distributors](#product_distributors)
- [products](#products)
- [sales](#sales)
- [segments](#segments)
- [tags](#tags)
- [tasks](#tasks)
- [test_user_metadata](#test_user_metadata)
- [tutorial_progress](#tutorial_progress)

---

## Tables

### activities

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('activities_id_seq'::regclass) | - |
| activity_type | activity_type | ✗ | - | - |
| type | interaction_type | ✗ | - | - |
| subject | text | ✗ | - | - |
| description | text | ✓ | - | - |
| activity_date | timestamp with time zone | ✓ | now() | - |
| duration_minutes | integer | ✓ | - | - |
| contact_id | bigint | ✓ | - | - |
| organization_id | bigint | ✓ | - | - |
| opportunity_id | bigint | ✓ | - | - |
| follow_up_required | boolean | ✓ | false | - |
| follow_up_date | date | ✓ | - | - |
| follow_up_notes | text | ✓ | - | - |
| outcome | text | ✓ | - | - |
| sentiment | character varying(10) | ✓ | - | - |
| attachments | ARRAY | ✓ | - | - |
| location | text | ✓ | - | - |
| attendees | ARRAY | ✓ | - | - |
| tags | ARRAY | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record, NOT NULL = deleted record. Enables recovery from accidental deletes. |
| related_task_id | bigint | ✓ | - | Optional reference to the task that prompted this activity. Used by quick actions workflow to link activities created when completing tasks. |
| sample_status | sample_status | ✓ | - | Status of sample activities. Required when type=sample. Values: sent, received, feedback_pending, feedback_received |

**Relationships:**
- `contact_id` → `contacts.id`
- `created_by` → `sales.id`
- `opportunity_id` → `opportunities.id`
- `organization_id` → `organizations.id`
- `related_task_id` → `tasks.id`

**Indexes:**
- `activities_pkey` (id) [PRIMARY]
- `idx_activities_activity_date_active` (activity_date)
- `idx_activities_activity_date_not_deleted` (activity_date)
- `idx_activities_contact` (contact_id)
- `idx_activities_contact_id` (contact_id)
- `idx_activities_date` (activity_date)
- `idx_activities_opportunity` (opportunity_id)
- `idx_activities_type` (activity_type, type)

---

### audit_trail

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| audit_id | bigint | ✗ | - | - |
| table_name | text | ✗ | - | - |
| record_id | bigint | ✗ | - | - |
| field_name | text | ✗ | - | - |
| old_value | text | ✓ | - | - |
| new_value | text | ✓ | - | - |
| changed_by | bigint | ✓ | - | - |
| changed_at | timestamp with time zone | ✗ | now() | - |

**Relationships:**
- `changed_by` → `sales.id`

**Indexes:**
- `audit_trail_pkey` (audit_id) [PRIMARY]
- `idx_audit_trail_table_record` (table_name, record_id, changed_at)

---

### contact_notes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('"contactNotes_id_seq"'::regc... | - |
| contact_id | bigint | ✗ | - | - |
| text | text | ✗ | - | - |
| sales_id | bigint | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| date | timestamp with time zone | ✗ | now() | User-specified date/time for the note, separate from system-managed created_at |
| updated_by | bigint | ✓ | - | Sales rep who last updated this contact note. Auto-populated by trigger. |
| created_by | bigint | ✓ | get_current_sales_id() | Sales rep who created this note. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |
| attachments | jsonb | ✓ | '[]'::jsonb | JSONB array of attachment metadata: [{ src, title, type?, size? }] |

**Relationships:**
- `contact_id` → `contacts.id`
- `created_by` → `sales.id`
- `sales_id` → `sales.id`
- `updated_by` → `sales.id`

**Indexes:**
- `contact_notes_pkey` (id) [PRIMARY]
- `idx_contact_notes_contact_date` (contact_id, date)
- `idx_contact_notes_contact_id` (contact_id)
- `idx_contact_notes_created_at` (created_at)
- `idx_contact_notes_sales_id` (sales_id)
- `idx_contactnotes_deleted_at` (deleted_at)

---

### contacts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('contacts_id_seq'::regclass) | - |
| name | text | ✗ | - | - |
| first_name | text | ✓ | - | - |
| last_name | text | ✓ | - | - |
| email | jsonb | ✓ | '[]'::jsonb | - |
| phone | jsonb | ✓ | '[]'::jsonb | - |
| title | text | ✓ | - | - |
| department | text | ✓ | - | - |
| address | text | ✓ | - | - |
| city | text | ✓ | - | - |
| state | text | ✓ | - | - |
| postal_code | text | ✓ | - | - |
| country | text | ✓ | 'USA'::text | - |
| birthday | date | ✓ | - | - |
| linkedin_url | text | ✓ | - | - |
| twitter_handle | text | ✓ | - | - |
| notes | text | ✓ | - | - |
| sales_id | bigint | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | Sales rep who created this contact. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record, NOT NULL = deleted record. Enables recovery from accidental deletes. Filtered in application queries: WHERE deleted_at IS NULL |
| search_tsv | tsvector | ✓ | - | - |
| first_seen | timestamp with time zone | ✓ | now() | - |
| last_seen | timestamp with time zone | ✓ | now() | - |
| gender | text | ✓ | - | - |
| tags | ARRAY | ✓ | '{}'::bigint[] | - |
| organization_id | bigint | ✗ | - | Primary organization for this contact. Required - contacts cannot exist without an organization (enforced NOT NULL). |
| updated_by | bigint | ✓ | - | Sales rep who last updated this contact. Auto-populated by trigger. |
| status | text | ✓ | 'cold'::text | Contact engagement level: cold (dormant), warm (engaged), hot (ready), in-contract (closed) |
| district_code | text | ✓ | - | District: D1, D73, etc. |
| territory_name | text | ✓ | - | Territory: Western Suburbs |
| manager_id | bigint | ✓ | - | Self-referential FK for reporting hierarchy |

**Relationships:**
- `created_by` → `sales.id`
- `manager_id` → `contacts.id`
- `organization_id` → `organizations.id`
- `sales_id` → `sales.id`
- `updated_by` → `sales.id`

**Indexes:**
- `contacts_pkey` (id) [PRIMARY]
- `idx_contacts_created_by` (created_by)
- `idx_contacts_deleted_at` (deleted_at)
- `idx_contacts_district` (district_code)
- `idx_contacts_manager` (manager_id)
- `idx_contacts_organization_id` (organization_id)
- `idx_contacts_sales_id` (sales_id)
- `idx_contacts_search_tsv` (search_tsv)
- `idx_contacts_unique_org_name` (organization_id, name) [UNIQUE]
- `idx_contacts_updated_by` (updated_by)

---

### dashboard_snapshots

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('dashboard_snapshots_id_seq':... | - |
| snapshot_date | date | ✗ | - | Date of snapshot (stored as date, not timestamp, for easy weekly aggregation) |
| sales_id | bigint | ✗ | - | - |
| activities_count | integer | ✗ | 0 | Number of activities logged by user during the week ending on snapshot_date |
| tasks_completed_count | integer | ✗ | 0 | Number of tasks completed by user during the week ending on snapshot_date |
| deals_moved_count | integer | ✗ | 0 | Number of opportunities with stage changes during the week ending on snapshot_date |
| open_opportunities_count | integer | ✗ | 0 | Count of open opportunities owned by user at snapshot_date |
| total_opportunities_count | integer | ✗ | 0 | Total count of all opportunities (for KPI dashboard) at snapshot_date |
| overdue_tasks_count | integer | ✗ | 0 | Count of overdue tasks for user at snapshot_date |
| activities_this_week_count | integer | ✗ | 0 | Activities logged in the current week (rolling 7-day window) at snapshot_date |
| stale_deals_count | integer | ✗ | 0 | Count of stale deals based on stage-specific thresholds at snapshot_date |
| created_at | timestamp with time zone | ✗ | now() | - |

**Relationships:**
- `sales_id` → `sales.id`

**Indexes:**
- `dashboard_snapshots_pkey` (id) [PRIMARY]
- `idx_dashboard_snapshots_date` (snapshot_date)
- `idx_dashboard_snapshots_sales_date` (sales_id, snapshot_date)
- `unique_snapshot_per_user_per_date` (sales_id, snapshot_date) [UNIQUE]

---

### distributor_principal_authorizations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | - |
| distributor_id | bigint | ✗ | - | Reference to an organization with is_distributor = true |
| principal_id | bigint | ✗ | - | Reference to an organization with is_principal = true |
| is_authorized | boolean | ✗ | true | - |
| authorization_date | date | ✓ | CURRENT_DATE | - |
| expiration_date | date | ✓ | - | - |
| territory_restrictions | ARRAY | ✓ | - | Array of territory/region codes where authorization applies (NULL = all territories) |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| created_by | bigint | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | - |

**Relationships:**
- `created_by` → `sales.id`
- `distributor_id` → `organizations.id`
- `principal_id` → `organizations.id`

**Indexes:**
- `distributor_principal_authorizations_pkey` (id) [PRIMARY]
- `uq_distributor_principal_authorization` (distributor_id, principal_id) [UNIQUE]

---

### interaction_participants

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('interaction_participants_id_... | - |
| activity_id | bigint | ✗ | - | - |
| contact_id | bigint | ✓ | - | - |
| organization_id | bigint | ✓ | - | - |
| role | character varying(20) | ✓ | 'participant'::character varying | - |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |
| created_by | bigint | ✓ | - | Sales ID of user who added this participant. Used for ownership-based RLS. |

**Relationships:**
- `activity_id` → `activities.id`
- `contact_id` → `contacts.id`
- `created_by` → `sales.id`

**Indexes:**
- `idx_interaction_participants_activity` (activity_id)
- `idx_interaction_participants_contact` (contact_id)
- `idx_interaction_participants_deleted_at` (deleted_at)
- `idx_interaction_participants_organization` (organization_id)
- `interaction_participants_pkey` (id) [PRIMARY]

---

### migration_history

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('migration_history_id_seq'::r... | - |
| phase_number | text | ✗ | - | - |
| phase_name | text | ✗ | - | - |
| status | text | ✗ | 'pending'::text | - |
| started_at | timestamp with time zone | ✓ | - | - |
| completed_at | timestamp with time zone | ✓ | - | - |
| error_message | text | ✓ | - | - |
| rollback_sql | text | ✓ | - | - |
| rows_affected | bigint | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |

**Indexes:**
- `migration_history_pkey` (id) [PRIMARY]

---

### notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | - |
| user_id | uuid | ✗ | - | - |
| type | text | ✗ | - | Notification type: task_overdue, task_assigned, mention, opportunity_won, opportunity_lost, system |
| message | text | ✗ | - | - |
| entity_type | text | ✓ | - | Related entity type (task, opportunity, contact, organization, product) or NULL for system notifications |
| entity_id | bigint | ✓ | - | ID of related entity or NULL for system notifications |
| read | boolean | ✗ | false | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |

**Indexes:**
- `notifications_pkey` (id) [PRIMARY]

---

### opportunities

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('opportunities_id_seq'::regcl... | - |
| name | text | ✗ | - | - |
| description | text | ✓ | - | - |
| stage | opportunity_stage | ✓ | 'new_lead'::opportunity_stage | - |
| status | opportunity_status | ✓ | 'active'::opportunity_status | - |
| priority | priority_level | ✓ | 'medium'::priority_level | - |
| index | integer | ✓ | - | - |
| estimated_close_date | date | ✓ | (CURRENT_DATE + '90 days'::interval) | - |
| actual_close_date | date | ✓ | - | - |
| customer_organization_id | bigint | ✗ | - | Required: The customer organization for this opportunity. Every opportunity must have exactly one customer (Q12). |
| principal_organization_id | bigint | ✓ | - | - |
| distributor_organization_id | bigint | ✓ | - | - |
| founding_interaction_id | bigint | ✓ | - | - |
| stage_manual | boolean | ✓ | false | - |
| status_manual | boolean | ✓ | false | - |
| next_action | text | ✓ | - | - |
| next_action_date | date | ✓ | - | - |
| competition | text | ✓ | - | - |
| decision_criteria | text | ✓ | - | - |
| contact_ids | ARRAY | ✓ | '{}'::bigint[] | - |
| opportunity_owner_id | bigint | ✓ | - | Required: Sales rep who owns this deal. Cannot be NULL - every opportunity must have an owner. |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | Sales rep who created this opportunity. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record, NOT NULL = deleted record. Enables recovery from accidental deletes. |
| search_tsv | tsvector | ✓ | - | - |
| tags | ARRAY | ✓ | '{}'::text[] | Array of tags for categorizing opportunities (e.g., urgent, big-deal, repeat-customer) |
| account_manager_id | bigint | ✓ | - | Foreign key to sales.id (bigint), references the account manager for this opportunity |
| lead_source | text | ✓ | - | How this opportunity was generated |
| updated_by | bigint | ✓ | - | Sales rep who last updated this opportunity. Auto-populated by trigger. |
| campaign | text | ✓ | - | Campaign name for grouping related opportunities from same marketing event or sales initiative. Example: "Winter Fancy Food Show 2025" |
| related_opportunity_id | bigint | ✓ | - | Optional reference to parent opportunity for follow-up tracking. Example: Initial trade show contact -> Follow-up sampling visit |
| notes | text | ✓ | - | General notes about the opportunity. Separate from activity log for quick reference information. Example: "Customer requested sample products" |
| stage_changed_at | timestamp with time zone | ✗ | now() | Timestamp when the opportunity stage was last changed. Automatically updated by trigger when stage field changes. Used for identifying stuck opportunities (30+ days in same stage). |
| win_reason | win_reason | ✓ | - | Required when stage = closed_won. Per PRD Section 5.3, MVP #12. |
| loss_reason | loss_reason | ✓ | - | Required when stage = closed_lost. Per PRD Section 5.3, MVP #12. |
| close_reason_notes | text | ✓ | - | Required when win_reason or loss_reason = other. Max 500 chars. |
| version | integer | ✗ | 1 | Optimistic locking version - increments on each update. Used to detect concurrent edit conflicts and prevent silent data loss. |

**Relationships:**
- `account_manager_id` → `sales.id`
- `created_by` → `sales.id`
- `customer_organization_id` → `organizations.id`
- `distributor_organization_id` → `organizations.id`
- `founding_interaction_id` → `activities.id`
- `opportunity_owner_id` → `sales.id`
- `principal_organization_id` → `organizations.id`
- `related_opportunity_id` → `opportunities.id`
- `updated_by` → `sales.id`

**Indexes:**
- `idx_opportunities_account_manager` (account_manager_id)
- `idx_opportunities_closed_stage_reason` (stage, win_reason, loss_reason)
- `idx_opportunities_created_by` (created_by)
- `idx_opportunities_customer_org` (customer_organization_id)
- `idx_opportunities_customer_organization_id` (customer_organization_id)
- `idx_opportunities_deleted_at` (deleted_at)
- `idx_opportunities_distributor_organization_id` (distributor_organization_id)
- `idx_opportunities_estimated_close` (estimated_close_date)
- `idx_opportunities_founding_interaction_id` (founding_interaction_id)
- `idx_opportunities_id_version` (id, version)
- `idx_opportunities_owner_id` (opportunity_owner_id)
- `idx_opportunities_principal_created` (principal_organization_id, created_at)
- `idx_opportunities_principal_org` (principal_organization_id)
- `idx_opportunities_principal_org_id_restrict` (principal_organization_id)
- `idx_opportunities_principal_org_not_deleted` (principal_organization_id)
- `idx_opportunities_principal_organization_id` (principal_organization_id)
- `idx_opportunities_priority` (priority)
- `idx_opportunities_search_tsv` (search_tsv)
- `idx_opportunities_stage_active` (stage)
- `idx_opportunities_status` (status)
- `idx_opportunities_updated_at_active` (updated_at)
- `idx_opportunities_updated_by` (updated_by)
- `opportunities_pkey` (id) [PRIMARY]

---

### opportunity_contacts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | Primary key, auto-generated |
| opportunity_id | bigint | ✗ | - | Foreign key to opportunities table |
| contact_id | bigint | ✗ | - | Foreign key to contacts table |
| role | character varying(50) | ✓ | - | Role of the contact in the opportunity (e.g., decision maker, influencer, end-user) |
| is_primary | boolean | ✓ | false | Whether this is the primary contact for the opportunity |
| notes | text | ✓ | - | Additional notes about this contact relationship in the context of the opportunity |
| created_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp - added per audit finding 2025-11-29 |

**Relationships:**
- `contact_id` → `contacts.id`
- `opportunity_id` → `opportunities.id`

**Indexes:**
- `idx_opportunity_contacts_contact_id` (contact_id)
- `idx_opportunity_contacts_deleted_at` (deleted_at)
- `idx_opportunity_contacts_opportunity_id` (opportunity_id)
- `opportunity_contacts_pkey` (id) [PRIMARY]
- `unique_opportunity_contact` (opportunity_id, contact_id) [UNIQUE]

---

### opportunity_notes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('"opportunityNotes_id_seq"'::... | - |
| opportunity_id | bigint | ✗ | - | - |
| text | text | ✗ | - | - |
| sales_id | bigint | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| date | timestamp with time zone | ✗ | now() | User-specified date/time for the note, separate from system-managed created_at |
| updated_by | bigint | ✓ | - | Sales rep who last updated this opportunity note. Auto-populated by trigger. |
| created_by | bigint | ✓ | get_current_sales_id() | Sales rep who created this note. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | - |
| attachments | jsonb | ✓ | '[]'::jsonb | JSONB array of attachment metadata: [{ src, title, type?, size? }] |

**Relationships:**
- `created_by` → `sales.id`
- `opportunity_id` → `opportunities.id`
- `sales_id` → `sales.id`
- `updated_by` → `sales.id`

**Indexes:**
- `idx_opportunity_notes_created_at` (created_at)
- `idx_opportunity_notes_opportunity_date` (opportunity_id, date)
- `idx_opportunity_notes_opportunity_id` (opportunity_id)
- `idx_opportunity_notes_sales_id` (sales_id)
- `opportunity_notes_pkey` (id) [PRIMARY]

---

### opportunity_participants

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('opportunity_participants_id_... | - |
| opportunity_id | bigint | ✗ | - | - |
| organization_id | bigint | ✗ | - | - |
| role | character varying(20) | ✗ | - | - |
| is_primary | boolean | ✓ | false | - |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | - |

**Relationships:**
- `created_by` → `sales.id`
- `opportunity_id` → `opportunities.id`

**Indexes:**
- `idx_opportunity_participants_opp_id` (opportunity_id)
- `idx_opportunity_participants_role` (role)
- `opportunity_participants_pkey` (id) [PRIMARY]

---

### opportunity_products

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('opportunity_products_id_seq'... | - |
| opportunity_id | bigint | ✗ | - | - |
| product_id_reference | bigint | ✗ | - | - |
| product_name | text | ✓ | - | - |
| product_category | text | ✓ | - | - |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |

**Relationships:**
- `opportunity_id` → `opportunities.id`
- `product_id_reference` → `products.id`

**Indexes:**
- `idx_opportunity_products_deleted_at` (deleted_at)
- `idx_opportunity_products_opportunity_id` (opportunity_id)
- `opportunity_products_opportunity_id_product_id_reference_key` (opportunity_id, product_id_reference) [UNIQUE]
- `opportunity_products_pkey` (id) [PRIMARY]

---

### organization_distributors

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | - |
| organization_id | bigint | ✗ | - | Reference to the customer/prospect organization that buys from the distributor |
| distributor_id | bigint | ✗ | - | Reference to an organization with organization_type = distributor |
| is_primary | boolean | ✗ | false | Designates the primary/default distributor for this organization. Only one can be true per organization. |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| created_by | bigint | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | - |

**Relationships:**
- `created_by` → `sales.id`
- `distributor_id` → `organizations.id`
- `organization_id` → `organizations.id`

**Indexes:**
- `idx_org_distributors_dist_id` (distributor_id)
- `idx_org_distributors_org_id` (organization_id)
- `idx_org_distributors_primary` (organization_id, distributor_id)
- `idx_organization_one_primary_distributor` (organization_id) [UNIQUE]
- `organization_distributors_pkey` (id) [PRIMARY]
- `uq_organization_distributor` (organization_id, distributor_id) [UNIQUE]

---

### organization_notes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('"organizationNotes_id_seq"':... | - |
| organization_id | bigint | ✗ | - | - |
| text | text | ✗ | - | - |
| attachments | jsonb | ✓ | '[]'::jsonb | JSONB array of attachment metadata: [{ url, filename, size, type }] |
| sales_id | bigint | ✓ | - | - |
| date | timestamp with time zone | ✗ | now() | User-specified date/time for the note event, separate from system-managed created_at |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp - NULL means active, non-NULL means deleted |
| updated_by | bigint | ✓ | - | Sales rep who last modified this note |

**Relationships:**
- `organization_id` → `organizations.id`
- `sales_id` → `sales.id`
- `updated_by` → `sales.id`

**Indexes:**
- `idx_organization_notes_org_date` (organization_id, date)
- `idx_organization_notes_organization_id` (organization_id)
- `organization_notes_pkey` (id) [PRIMARY]

---

### organizations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('organizations_id_seq'::regcl... | - |
| name | text | ✗ | - | Organization name. Duplicates allowed with warning dialog on create. Case-insensitive matching for duplicate detection. |
| priority | character varying(1) | ✓ | 'C'::character varying | - |
| website | text | ✓ | - | - |
| address | text | ✓ | - | - |
| city | text | ✓ | - | - |
| state | text | ✓ | - | - |
| postal_code | text | ✓ | - | - |
| phone | text | ✓ | - | - |
| email | text | ✓ | - | - |
| logo_url | text | ✓ | - | - |
| linkedin_url | text | ✓ | - | - |
| employee_count | integer | ✓ | - | - |
| founded_year | integer | ✓ | - | - |
| notes | text | ✓ | - | - |
| sales_id | bigint | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | Sales rep who created this organization. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record, NOT NULL = deleted record. Enables recovery from accidental deletes. |
| import_session_id | uuid | ✓ | - | - |
| search_tsv | tsvector | ✓ | - | - |
| context_links | jsonb | ✓ | - | Array of related URLs or references stored as JSONB |
| description | text | ✓ | - | Organization description or notes |
| tax_identifier | text | ✓ | - | Tax identification number (EIN, VAT, etc.) |
| segment_id | uuid | ✓ | - | Optional foreign key to segments table. NULL indicates segment is not specified. UI defaults to "Unknown" segment for better UX. |
| updated_by | bigint | ✓ | - | Sales rep who last updated this organization. Auto-populated by trigger. |
| parent_organization_id | bigint | ✓ | - | Reference to parent organization for hierarchical relationships |
| playbook_category_id | uuid | ✓ | - | Reference to playbook category segment for this organization |
| cuisine | text | ✓ | - | Cuisine type for restaurant/operator organizations |
| needs_review | text | ✓ | - | Flag indicating organization needs manual review, with reason |
| organization_type | organization_type | ✓ | 'prospect'::organization_type | - |
| org_scope | text | ✓ | - | Geographic scope: national, regional, or local |
| is_operating_entity | boolean | ✓ | true | TRUE = transact here, FALSE = brand/grouping only |
| status | text | ✗ | 'active'::text | Active/inactive state |
| status_reason | text | ✓ | - | Why this status |
| billing_street | text | ✓ | - | - |
| billing_city | text | ✓ | - | - |
| billing_state | text | ✓ | - | - |
| billing_postal_code | text | ✓ | - | - |
| billing_country | text | ✓ | 'US'::text | - |
| shipping_street | text | ✓ | - | - |
| shipping_city | text | ✓ | - | - |
| shipping_state | text | ✓ | - | - |
| shipping_postal_code | text | ✓ | - | - |
| shipping_country | text | ✓ | 'US'::text | - |
| payment_terms | text | ✓ | - | Standard payment terms for this organization |
| credit_limit | numeric(12) | ✓ | - | Credit limit in USD |
| territory | text | ✓ | - | Sales territory assignment |

**Relationships:**
- `created_by` → `sales.id`
- `parent_organization_id` → `organizations.id`
- `playbook_category_id` → `segments.id`
- `sales_id` → `sales.id`
- `segment_id` → `segments.id`
- `updated_by` → `sales.id`

**Indexes:**
- `idx_companies_priority` (priority)
- `idx_companies_sales_id` (sales_id)
- `idx_organizations_created_by` (created_by)
- `idx_organizations_cuisine` (cuisine)
- `idx_organizations_name` (name)
- `idx_organizations_needs_review` (needs_review)
- `idx_organizations_parent_organization_id` (parent_organization_id)
- `idx_organizations_playbook_category_id` (playbook_category_id)
- `idx_organizations_search_tsv` (search_tsv)
- `idx_organizations_segment_id` (segment_id)
- `idx_organizations_updated_by` (updated_by)
- `idx_orgs_operating` (is_operating_entity)
- `idx_orgs_org_scope` (org_scope)
- `idx_orgs_organization_type` (organization_type)
- `idx_orgs_parent_organization_id` (parent_organization_id)
- `idx_orgs_status` (status, status_reason)
- `idx_orgs_territory` (territory)
- `organizations_pkey` (id) [PRIMARY]

---

### product_distributor_authorizations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | - |
| product_id | bigint | ✗ | - | Reference to the product being authorized/restricted |
| distributor_id | bigint | ✗ | - | Reference to an organization with is_distributor = true |
| is_authorized | boolean | ✗ | true | true = product explicitly authorized, false = product explicitly NOT authorized (overrides org-level) |
| authorization_date | date | ✓ | CURRENT_DATE | - |
| expiration_date | date | ✓ | - | - |
| special_pricing | jsonb | ✓ | - | JSONB for product-specific pricing (unit_price, discount_percent, min_quantity, etc.) |
| territory_restrictions | ARRAY | ✓ | - | Array of territory/region codes where authorization applies (NULL = inherits from org-level or all) |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| created_by | bigint | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. When set, record is hidden from normal queries. Added 2025-12-12 per RLS security audit. |

**Relationships:**
- `created_by` → `sales.id`
- `distributor_id` → `organizations.id`
- `product_id` → `products.id`

**Indexes:**
- `idx_product_distributor_auth_active` (product_id, distributor_id)
- `idx_product_distributor_auth_deleted_at` (deleted_at)
- `product_distributor_authorizations_pkey` (id) [PRIMARY]
- `uq_product_distributor_authorization` (product_id, distributor_id) [UNIQUE]

---

### product_distributors

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| product_id | bigint | ✗ | - | - |
| distributor_id | bigint | ✗ | - | - |
| vendor_item_number | text | ✓ | - | Distributor code: USF#, Sysco#, GFS# |
| status | text | ✗ | 'pending'::text | - |
| valid_from | timestamp with time zone | ✗ | now() | - |
| valid_to | timestamp with time zone | ✓ | - | - |
| notes | text | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp. NULL = active record. Set to NOW() to archive. |
| created_by | bigint | ✓ | - | ID of the sales user who created this record. For audit trail. |

**Relationships:**
- `distributor_id` → `organizations.id`
- `product_id` → `products.id`

**Indexes:**
- `idx_product_dist_active` (distributor_id, status)
- `idx_product_dist_distributor` (distributor_id)
- `idx_product_dist_product` (product_id)
- `idx_product_dist_status` (status)
- `idx_product_dist_vendor_item` (vendor_item_number)
- `idx_product_distributors_deleted_at` (deleted_at)
- `idx_product_distributors_distributor_id` (distributor_id)
- `idx_product_distributors_product_id` (product_id)
- `product_distributors_pkey` (product_id, distributor_id) [PRIMARY]

---

### products

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('products_id_seq'::regclass) | - |
| principal_id | bigint | ✗ | - | - |
| name | text | ✗ | - | - |
| description | text | ✓ | - | - |
| status | product_status | ✓ | 'active'::product_status | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| created_by | bigint | ✓ | - | Sales rep who created this product. Auto-populated on INSERT. |
| updated_by | bigint | ✓ | - | Sales rep who last updated this product. Auto-populated by trigger. |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record, NOT NULL = deleted record. Enables recovery from accidental deletes. |
| search_tsv | tsvector | ✓ | - | - |
| manufacturer_part_number | text | ✓ | - | - |
| category | text | ✗ | - | - |

**Relationships:**
- `created_by` → `sales.id`
- `updated_by` → `sales.id`

**Indexes:**
- `idx_products_search_tsv` (search_tsv)
- `idx_products_status` (status)
- `products_pkey` (id) [PRIMARY]

---

### sales

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('sales_id_seq'::regclass) | - |
| user_id | uuid | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| first_name | text | ✓ | - | - |
| last_name | text | ✓ | - | - |
| email | text | ✓ | - | - |
| phone | text | ✓ | - | - |
| avatar_url | text | ✓ | - | - |
| is_admin | boolean | ✓ | false | DEPRECATED: Use role column instead. Kept for backward compatibility during transition. |
| deleted_at | timestamp with time zone | ✓ | - | - |
| disabled | boolean | ✓ | false | Account disabled flag for offboarding. Disabled users cannot authenticate even if auth.users record exists. Set to true when employee leaves company. |
| role | user_role | ✗ | 'rep'::user_role | - |
| administrator | boolean | ✓ | - | Computed column for backward compatibility. Maps from role enum. Frontend should migrate to using role directly. |
| timezone | text | ✓ | 'America/Chicago'::text | User timezone for display. Uses IANA timezone format (e.g., America/Chicago). Default is America/Chicago (Central Time). |
| digest_opt_in | boolean | ✗ | true | User preference for receiving daily digest emails. Defaults to true. |

**Indexes:**
- `idx_sales_disabled` (disabled)
- `idx_sales_user_id` (user_id)
- `sales_pkey` (id) [PRIMARY]
- `sales_user_id_key` (user_id) [UNIQUE]

---

### segments

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | - |
| name | text | ✗ | - | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| created_by | uuid | ✓ | - | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |
| segment_type | text | ✓ | 'playbook'::text | - |
| parent_id | uuid | ✓ | - | - |
| display_order | integer | ✓ | 0 | - |
| ui_group | text | ✓ | - | UI grouping for operator segments: Commercial or Institutional |

**Relationships:**
- `parent_id` → `segments.id`

**Indexes:**
- `idx_segments_parent` (parent_id)
- `idx_segments_type` (segment_type)
- `industries_pkey` (id) [PRIMARY]
- `segments_name_type_case_insensitive_idx` (segment_type) [UNIQUE]
- `segments_name_type_unique` (name, segment_type) [UNIQUE]

---

### tags

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('tags_id_seq'::regclass) | - |
| name | text | ✗ | - | - |
| color | text | ✓ | 'blue-500'::text | - |
| description | text | ✓ | - | - |
| usage_count | integer | ✓ | 0 | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | Soft delete timestamp (Constitution: soft-deletes rule) |

**Indexes:**
- `idx_tags_deleted_at` (deleted_at)
- `tags_name_key` (name) [UNIQUE]
- `tags_pkey` (id) [PRIMARY]

---

### tasks

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | nextval('tasks_id_seq'::regclass) | - |
| title | text | ✗ | - | Brief title describing the task |
| description | text | ✓ | - | Optional detailed description of the task |
| due_date | date | ✓ | - | - |
| reminder_date | date | ✓ | - | - |
| completed | boolean | ✓ | false | - |
| completed_at | timestamp with time zone | ✓ | - | - |
| priority | priority_level | ✓ | 'medium'::priority_level | - |
| contact_id | bigint | ✓ | - | - |
| opportunity_id | bigint | ✓ | - | - |
| sales_id | bigint | ✗ | - | Required: Sales rep assigned to this task. Cannot be NULL - every task must have an owner. |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| type | task_type | ✓ | 'Call'::task_type | Category of task activity (Call, Email, Meeting, etc.) |
| created_by | bigint | ✓ | get_current_sales_id() | Sales rep who created this task. Auto-populated on INSERT. |
| deleted_at | timestamp with time zone | ✓ | - | Soft-delete timestamp. NULL = active record. Per Engineering Constitution soft-delete pattern. |
| overdue_notified_at | timestamp with time zone | ✓ | - | Timestamp when overdue notification was sent for this task (prevents duplicate notifications) |
| organization_id | bigint | ✓ | - | Optional FK to organizations. Task can be linked to organization directly, or inherit org from contact/opportunity. |
| snooze_until | timestamp with time zone | ✓ | - | Timestamp until which this task is snoozed (hidden from active task views). NULL means task is active. |

**Relationships:**
- `contact_id` → `contacts.id`
- `created_by` → `sales.id`
- `opportunity_id` → `opportunities.id`
- `organization_id` → `organizations.id`
- `sales_id` → `sales.id`

**Indexes:**
- `idx_tasks_contact_id` (contact_id)
- `idx_tasks_opportunity_id` (opportunity_id)
- `idx_tasks_sales_due_date_incomplete` (sales_id, due_date)
- `idx_tasks_sales_id_not_completed` (sales_id)
- `idx_tasks_snooze_until` (snooze_until)
- `tasks_pkey` (id) [PRIMARY]

---

### test_user_metadata

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | - |
| user_id | uuid | ✓ | - | - |
| role | text | ✗ | - | - |
| created_by | text | ✓ | 'automated_script'::text | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| last_sync_at | timestamp with time zone | ✓ | - | - |
| test_data_counts | jsonb | ✓ | '{"notes": 0, "tasks": 0, "contacts":... | - |

**Indexes:**
- `test_user_metadata_pkey` (id) [PRIMARY]
- `unique_user_id` (user_id) [UNIQUE]

---

### tutorial_progress

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | ✗ | - | - |
| sales_id | bigint | ✗ | - | - |
| organization_completed | boolean | ✗ | false | - |
| contact_completed | boolean | ✗ | false | - |
| opportunity_completed | boolean | ✗ | false | - |
| activity_completed | boolean | ✗ | false | - |
| task_completed | boolean | ✗ | false | - |
| created_organization_id | bigint | ✓ | - | - |
| created_contact_id | bigint | ✓ | - | - |
| created_opportunity_id | bigint | ✓ | - | - |
| created_activity_id | bigint | ✓ | - | - |
| created_task_id | bigint | ✓ | - | - |
| dismissed | boolean | ✗ | false | - |
| dismissed_at | timestamp with time zone | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |

**Relationships:**
- `created_activity_id` → `activities.id`
- `created_contact_id` → `contacts.id`
- `created_opportunity_id` → `opportunities.id`
- `created_organization_id` → `organizations.id`
- `created_task_id` → `tasks.id`
- `sales_id` → `sales.id`

**Indexes:**
- `tutorial_progress_pkey` (id) [PRIMARY]
- `unique_sales_tutorial` (sales_id) [UNIQUE]

---

## Regeneration

To regenerate this documentation:

```bash
# With local Supabase running
npm run docs:schema

# Or directly
npx tsx scripts/generate-schema-docs.ts
```

Make sure either:
1. Local Supabase is running (`npm run db:local:start`)
2. `DATABASE_URL` is set in your `.env` file
3. `VITE_SUPABASE_URL` and `SUPABASE_DB_PASSWORD` are set for cloud connection
