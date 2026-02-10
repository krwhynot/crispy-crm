# Phase 1 Report: Discovery & Inventory

**Date:** 2026-02-09
**Auditor:** Claude Code (Opus 4.6, Docker local + Supabase MCP cloud)
**Mode:** PLAN MODE (Read-Only - no migrations applied, no data modified)
**Overall Confidence:** [Confidence: 92%] - Both environments fully accessible, all SQL queries returned results

---

## 1) Environment Coverage

| Property | Cloud | Local |
|---|---|---|
| **Access Method** | Supabase MCP (`mcp__supabase__execute_sql`) | Docker exec (`supabase_db_crispy-crm` + psql) |
| **Project ID** | `aaqnanddcqvfiwhshndl` | N/A (local Docker) |
| **Database Version** | PostgreSQL 17.6.1.005 | PostgreSQL 17 (via Supabase CLI 2.72.7) |
| **Status** | ACTIVE_HEALTHY | Running (7 of 14 services stopped) |
| **Region** | us-east-2 | localhost:54322 |
| **Migration Count** | 354 | 354 |
| **Latest Migration** | `20260210000004` (`verify_team`) | `20260210000004` (`verify_team`) |

**Analysis:** Both environments have identical migration counts and latest migration versions. This is significant - it means the 4 pending migration files in the repo (`20260210000001` through `20260210000004`) have already been applied to BOTH environments. The git status shows these as untracked (`??`) which suggests they were applied via `supabase db push` or MCP but haven't been committed to version control yet. [Confidence: 88%]

**Stopped Local Services:** `inbucket`, `storage`, `imgproxy`, `edge_runtime`, `analytics`, `vector`, `pooler` - these are non-critical for schema inspection but mean Edge Functions cannot be tested locally.

---

## 2) Object Inventory Tables

### 2a) Tables (26 tables - identical count in both environments)

| Table | Cloud Rows | Local Rows | Notes |
|---|---|---|---|
| `activities` | 71 | 503 | **STI table** - stores both activities AND tasks |
| `audit_trail` | 194,446 | 77,052 | Cloud has 2.5x more audit entries |
| `contact_notes` | 0 | 0 | Zero in both |
| `contacts` | 1,664 | 2,007 | Local has seeded data |
| `dashboard_snapshots` | 0 | 0 | Cron runs but no data captured |
| `distributor_principal_authorizations` | 4 | 0 | Cloud has real data |
| `interaction_participants` | 0 | 0 | Zero in both |
| `migration_history` | 0 | 0 | Zero in both |
| `notifications` | 0 | 0 | Zero in both - digests may be firing but getting cleaned up |
| `opportunities` | 14 | 372 | Local has seeded data |
| `opportunity_contacts` | 0 | 369 | **Cloud empty, local populated** |
| `opportunity_notes` | 0 | 0 | Zero in both |
| `opportunity_participants` | 0 | 0 | Zero in both |
| `opportunity_products` | 1 | 0 | Minimal usage |
| `organization_distributors` | 673 | 673 | Identical count |
| `organization_notes` | 0 | 0 | Zero in both |
| `organizations` | 2,093 | 2,369 | Local has more (seeded) |
| `product_distributor_authorizations` | 0 | 0 | Zero in both |
| `product_distributors` | 0 | 0 | Zero in both |
| `product_features` | 0 | 0 | Zero in both |
| `products` | 14 | 0 | Cloud has real products |
| `sales` | 8 | 4 | Cloud has more users |
| `segments` | 40 | 40 | Identical |
| `tags` | 0 | 0 | Zero in both |
| `tutorial_progress` | 0 | 0 | Zero in both |
| `user_favorites` | 11 | 0 | Cloud has real favorites |

**Key Observations:**

1. **`tasks_deprecated` does NOT exist in either environment.** [Confidence: 100%] The drop migration (`20260210000004`) has already been applied. This is clean.

2. **`task_id_mapping` and `test_user_metadata` also gone.** Cleanup was thorough.

3. **14 of 26 tables have 0 rows in cloud.** This is a beta system with sparse feature adoption. The 0-row tables fall into categories:
   - **Notes tables (3):** `contact_notes`, `opportunity_notes`, `organization_notes` - users haven't adopted notes yet
   - **Junction tables (3):** `opportunity_contacts`, `opportunity_participants`, `interaction_participants` - sparse relationship data
   - **Product tables (3):** `product_distributor_authorizations`, `product_distributors`, `product_features` - product module unused
   - **Feature tables (3):** `tags`, `tutorial_progress`, `dashboard_snapshots` - features not yet adopted
   - **Infrastructure (2):** `migration_history`, `notifications`

4. **`dashboard_snapshots` has 0 rows despite cron running daily.** This is suspicious - the `invoke_snapshot_capture_function` cron succeeds but the target Edge Function (`capture-dashboard-snapshots`) doesn't exist. The cron reports "1 row" (the function executes) but the HTTP call to the Edge Function likely fails silently because `pg_net` is fire-and-forget.

### 2b) Views

| View | Cloud | Local | Notes |
|---|---|---|---|
| `activities_summary` | Yes | Yes | |
| `activities_with_task_details` | Yes | Yes | |
| `authorization_status` | Yes | Yes | |
| `campaign_choices` | Yes | Yes | |
| `contactNotes` | Yes | Yes | Legacy camelCase naming |
| `contact_duplicates` | Yes | **No** | **CLOUD-ONLY** |
| `contacts_summary` | Yes | Yes | |
| `contacts_with_account_manager` | Yes | Yes | |
| `dashboard_pipeline_summary` | Yes | Yes | |
| `dashboard_principal_summary` | Yes | Yes | |
| `distinct_opportunities_campaigns` | Yes | Yes | |
| `distinct_product_categories` | Yes | Yes | |
| `duplicate_stats` | Yes | **No** | **CLOUD-ONLY** |
| `entity_timeline` | Yes | Yes | |
| `opportunities_summary` | Yes | Yes | |
| `opportunityNotes` | Yes | Yes | Legacy camelCase naming |
| `opportunity_stage_changes` | **No** | Yes | **LOCAL-ONLY** |
| `organizationNotes` | Yes | Yes | Legacy camelCase naming |
| `organization_primary_distributor` | Yes | Yes | |
| `organizations_summary` | Yes | Yes | |
| `organizations_with_account_manager` | Yes | Yes | |
| `principal_opportunities` | Yes | Yes | |
| `principal_pipeline_summary` | Yes | Yes | |
| `priority_tasks` | Yes | Yes | |
| `product_distributors_summary` | Yes | Yes | |
| `products_summary` | Yes | Yes | |
| `tasks_summary` | Yes | Yes | |
| `tasks_v` | Yes | Yes | |

**Cloud: 27 views | Local: 26 views**

**View Drift Analysis:**

- **`contact_duplicates` and `duplicate_stats` (cloud-only):** These were likely created via a migration that local has but the views were dropped/recreated at some point. Since migration counts match, these may have been created through a direct cloud SQL execution or an edge function setup. [Confidence: 65%] To Increase: Check if any migration creates these views and verify the view definitions.

- **`opportunity_stage_changes` (local-only):** Exists locally but not on cloud. This could be a view that was created locally for development/testing and never pushed, or it was dropped on cloud by a migration that somehow didn't affect local. [Confidence: 60%] To Increase: Search migration files for `opportunity_stage_changes` creation/drop.

- **No materialized views** found in either environment. All views are standard SQL views with `security_invoker = true`.

### 2c) Functions

**Cloud: 96 functions | Local: 117 functions (including 2 overloaded `sync_opportunity_with_products`)**

Key differences (functions present in one environment but not the other):

| Function | Cloud | Local | Classification |
|---|---|---|---|
| `archive_contact_with_relations` | Yes | **No** | SUSPICIOUS |
| `archive_organization_with_relations` | Yes | **No** | SUSPICIOUS |
| `unarchive_contact_with_relations` | Yes | **No** | SUSPICIOUS |
| `unarchive_organization_with_relations` | Yes | **No** | SUSPICIOUS |
| `get_playbook_category_ids` | Yes | **No** | SUSPICIOUS |
| `get_campaign_report_stats` | **No** | Yes | EXPECTED (local dev) |
| `get_contact_organizations` | **No** | Yes | EXPECTED (local dev) |
| `get_opportunities_by_principal_report` | **No** | Yes | EXPECTED (local dev) |
| `audit_critical_field_changes` | **No** | Yes | SUSPICIOUS |
| `audit_dashboard_snapshots` | **No** | Yes | EXPECTED |
| `audit_tutorial_progress` | **No** | Yes | EXPECTED |
| `audit_user_favorites` | Cloud trigger refs it | Yes | SUSPICIOUS - cloud trigger references nonexistent function |
| `cascade_soft_delete_to_notes` | **No** | Yes | DANGEROUS |
| `check_organization_delete_allowed` | **No** | Yes | DANGEROUS |
| `protect_audit_fields` | **No** | Yes | DANGEROUS |
| `set_updated_at` | **No** | Yes | EXPECTED |
| `sync_contact_organizations` | **No** | Yes | SUSPICIOUS |
| `update_user_favorites_updated_at` | **No** | Yes | EXPECTED |
| `set_primary_organization` | **No** | Yes | EXPECTED (local dev) |

**CRITICAL FINDING:** Several functions referenced by LOCAL triggers do not exist on cloud:
- `protect_audit_fields` - called by triggers on `activities`, `contacts`, `opportunities`, `organizations`, `products` (LOCAL ONLY)
- `cascade_soft_delete_to_notes` - called by triggers on `contacts`, `opportunities`, `organizations` (LOCAL ONLY)
- `check_organization_delete_allowed` - called by trigger on `organizations` (LOCAL ONLY)
- `audit_critical_field_changes` - called by triggers on `contacts`, `opportunities`, `organizations`, `sales` (LOCAL ONLY)

These functions and their triggers exist in local because the pending migrations have been applied. They represent the "ahead of cloud" state. [Confidence: 85%]

### 2d) Triggers

**Cloud: 52 triggers | Local: 85 triggers**

The 33-trigger gap is primarily due to local having more comprehensive audit, soft-delete cascade, and protection triggers. Notable local-only triggers:

| Trigger | Table | Function | Classification |
|---|---|---|---|
| `protect_activities_audit` | activities | `protect_audit_fields` | LOCAL-ONLY (enhanced audit protection) |
| `protect_contacts_audit` | contacts | `protect_audit_fields` | LOCAL-ONLY |
| `protect_opportunities_audit` | opportunities | `protect_audit_fields` | LOCAL-ONLY |
| `protect_organizations_audit` | organizations | `protect_audit_fields` | LOCAL-ONLY |
| `protect_products_audit` | products | `protect_audit_fields` | LOCAL-ONLY |
| `cascade_notes_on_contact_delete` | contacts | `cascade_soft_delete_to_notes` | LOCAL-ONLY |
| `cascade_notes_on_opportunity_delete` | opportunities | `cascade_soft_delete_to_notes` | LOCAL-ONLY |
| `cascade_notes_on_organization_delete` | organizations | `cascade_soft_delete_to_notes` | LOCAL-ONLY |
| `audit_critical_contacts` | contacts | `audit_critical_field_changes` | LOCAL-ONLY |
| `audit_critical_opportunities` | opportunities | `audit_critical_field_changes` | LOCAL-ONLY |
| `audit_critical_organizations` | organizations | `audit_critical_field_changes` | LOCAL-ONLY |
| `audit_critical_sales` | sales | `audit_critical_field_changes` | LOCAL-ONLY |
| `prevent_org_delete_with_active_opps` | organizations | `check_organization_delete_allowed` | LOCAL-ONLY |
| `update_*_updated_at` | (many tables) | `update_updated_at_column` | LOCAL-ONLY (13+ tables) |

**Analysis:** The local environment is significantly ahead of cloud in data-integrity triggers. The `updated_at` auto-management triggers exist on nearly every table locally but are missing from cloud. The `protect_audit_fields` trigger prevents manual overwrite of `created_at`/`updated_at` - this is a safety feature missing from production. [Confidence: 90%]

### 2e) RLS Policies

**Cloud: 91 policies | Local: 98 policies**

Both environments cover all 26 tables with RLS enabled. The local environment has 7 additional policies, primarily duplicate delete policies on notes tables and contacts. Notable:

- **Cloud** has `activities_service_role` (ALL with `USING(true)`) - appropriate for service_role
- **Cloud** has `tags_delete_privileged` and `tags_service_role` in addition to `delete_tags_admin` - possibly redundant
- **Local** has additional `contacts_delete_owner_or_privileged` and `delete_contacts` - duplicate delete policies
- **Local** has additional notes delete policies (`delete_contact_notes`, `delete_opportunity_notes`, `delete_organization_notes`)
- **Local** has `select_organization_distributors_visible` - extra visibility policy

**Observation:** Some tables have DUPLICATE delete policies (both cloud and local). For example, `contact_notes` on cloud has `delete_contact_notes_privileged_only` and on local additionally `contact_notes_delete_owner_or_privileged` AND `delete_contact_notes`. Multiple permissive policies on the same operation are OR'd together (Postgres PERMISSIVE policy semantics), so the most permissive one wins. This could be an unintended privilege escalation. [Confidence: 75%]

### 2f) pg_cron Jobs

| Job ID | Schedule | Command | Cloud | Local |
|---|---|---|---|---|
| 2 (cloud) / 1 (local) | `0 7 * * *` (7 AM UTC daily) | `SELECT invoke_daily_digest_function()` | Active | Active |
| 3 (cloud) / 2 (local) | `0 23 * * *` (11 PM UTC daily) | `SELECT invoke_snapshot_capture_function()` | Active | Active |

**Cron Health (Cloud):** Both jobs showing `succeeded` status consistently for the last 10+ days (checked 20 most recent runs, all succeeded). However, "succeeded" only means the SQL function executed - not that the downstream Edge Function HTTP call succeeded.

### 2g) Indexes

**Cloud: ~160 indexes across all tables** (comprehensive coverage)

Notable observations:
- Good use of partial indexes with `WHERE deleted_at IS NULL` for soft-delete performance
- Trigram indexes (`gin_trgm_ops`) on names for fuzzy search
- Full-text search indexes (`search_tsv`) on contacts, organizations, opportunities, products
- Some potentially redundant indexes on `opportunities` table (e.g., `idx_opportunities_customer_org` and `idx_opportunities_customer_organization_id` both on `customer_organization_id`)
- `product_distributor_authorizations` has 2 `deleted_at` indexes that appear identical (`idx_product_distributor_auth_deleted_at` and `idx_product_distributor_authorizations_deleted_at`)

### 2h) Foreign Keys

**68 foreign key constraints** across both environments (identical). All properly linking:
- Activities -> contacts, organizations, opportunities, sales
- All notes tables -> parent entities, sales (created_by, updated_by)
- Opportunities -> organizations (customer, distributor, principal), sales, contacts, activities
- Organization hierarchy -> self-referential `parent_organization_id`
- Products -> organizations (via product_distributors), sales
- Tutorial_progress -> activities, contacts, opportunities, organizations, sales

No orphaned foreign keys referencing `tasks_deprecated` - the cleanup migration properly removed `tutorial_progress.created_task_id_fkey`. [Confidence: 100%]

### 2i) Private Schema Functions

Both environments have identical `private` schema functions:

| Function | Purpose |
|---|---|
| `can_access_by_role` | RLS helper for role-based access |
| `get_current_user_role` | RLS helper for current user role |
| `is_admin_or_manager` | RLS helper for privilege check |

---

## 3) Drift Matrix

| Object Category | Local State | Cloud State | Classification | Root Cause Hypothesis |
|---|---|---|---|---|
| **Tables** | 26 tables (25 with data) | 26 tables (12 with data) | EXPECTED | Cloud is production with less seed data; local is dev with seed scripts |
| **Views** | 26 views | 27 views | SUSPICIOUS | `contact_duplicates` and `duplicate_stats` cloud-only; `opportunity_stage_changes` local-only. May be migration ordering issue or manual cloud SQL |
| **Functions** | 117 functions | 96 functions | DANGEROUS | Local has ~21 more functions for audit protection, cascade deletes, and soft-delete safety. These are missing from production = security gap |
| **Triggers** | 85 triggers | 52 triggers | DANGEROUS | Local has 33 more triggers (audit protection, updated_at management, cascade deletes). Cloud lacks critical data integrity triggers |
| **RLS Policies** | 98 policies | 91 policies | SUSPICIOUS | Local has 7 additional policies, some appear to be duplicate DELETE policies that may widen access |
| **Indexes** | ~160 | ~160 | EXPECTED | Both environments appear to have same index set (pending exact diff) |
| **Foreign Keys** | 68 constraints | 68 constraints | EXPECTED | Identical FK structure |
| **Cron Jobs** | 2 jobs | 2 jobs | EXPECTED | Same jobs, same schedules |
| **Edge Functions** | N/A (runtime stopped) | 7 deployed | N/A | Local edge runtime not running |
| **Migrations** | 354 | 354 | EXPECTED | Identical migration state |
| **Private Functions** | 3 functions | 3 functions | EXPECTED | Identical |

### Drift Root Cause Analysis

The primary drift pattern is: **Local is ahead of cloud in data-integrity infrastructure.** The 4 pending migrations (`20260210000001-4`) have been applied to both environments (as evidenced by the migration count), but earlier migrations that added audit protection triggers, `updated_at` management, and cascade soft-delete triggers appear to have been applied locally via `supabase db reset` (which replays ALL migrations sequentially) but potentially failed or were skipped on cloud when pushed via `supabase db push` (which applies only new migrations).

**Hypothesis:** When `supabase db push` encounters a `CREATE OR REPLACE FUNCTION` that references a type or dependency not yet available at push time, it may succeed in recording the migration but the function body might not have been created properly. Alternatively, some migrations may have been applied to cloud before all prerequisite functions were defined. [Confidence: 70%] To Increase: Compare actual cloud function timestamps with migration timestamps.

The cloud having `archive_contact_with_relations` and `archive_organization_with_relations` (which local lacks) suggests these were created directly on cloud, possibly through the Supabase Dashboard or a manual SQL execution, bypassing the migration system. [Confidence: 65%]

---

## 4) Data Structure Confirmation

### 4a) Where are tasks stored?

**Answer:** Tasks are stored in the `activities` table using a Single Table Inheritance (STI) pattern. [Confidence: 100%]

**Evidence:**
- **Table:** `activities`
- **Discriminator column:** `activity_type` (USER-DEFINED enum type `activity_type`)
- **Task filter:** `WHERE activity_type = 'task'`
- **Key task-specific columns:** `due_date`, `reminder_date`, `completed`, `completed_at`, `priority`, `snooze_until`, `overdue_notified_at`
- **Key activity-specific columns:** `activity_date`, `duration_minutes`, `sentiment`, `sample_status`
- **Shared columns:** `subject`, `description`, `contact_id`, `organization_id`, `opportunity_id`, `sales_id`, `created_by`

The `tasks_v` view provides a backward-compatible task-only interface:
```sql
SELECT id, subject AS title, description, type::text AS type, due_date, reminder_date,
       completed, completed_at, priority, contact_id, organization_id, opportunity_id,
       sales_id, snooze_until, overdue_notified_at, created_by, created_at, updated_at, deleted_at
FROM activities
WHERE activity_type = 'task' AND deleted_at IS NULL;
```

### 4b) Does tasks_deprecated still exist?

**Answer:** NO - in neither environment. [Confidence: 100%]

**Evidence:**
- Cloud: `SELECT table_name FROM information_schema.tables WHERE table_name IN ('tasks_deprecated', 'task_id_mapping', 'test_user_metadata')` returned **empty result**.
- Local: Same query returned **empty result**.
- Migration `20260210000004_drop_deprecated_tasks_artifacts.sql` dropped `tasks_deprecated`, `task_id_mapping`, and `test_user_metadata` with verification checks.
- Migration has been applied (migration 354 of 354 in both environments).

### 4c) What is entity_timeline?

**Answer:** `entity_timeline` is a SQL **view** (not a table, not materialized) that provides a unified timeline of activities and tasks. [Confidence: 100%]

**Source query (identical in both environments):**
```sql
SELECT id,
  CASE WHEN activity_type = 'task' THEN 'task' ELSE 'activity' END AS entry_type,
  type::text AS subtype,
  subject AS title,
  description,
  CASE WHEN activity_type = 'task' THEN due_date::timestamptz ELSE activity_date END AS entry_date,
  contact_id, organization_id, opportunity_id, created_by, sales_id, created_at,
  completed, completed_at, priority
FROM activities
WHERE deleted_at IS NULL
  AND (activity_type <> 'task' OR snooze_until IS NULL OR snooze_until <= now());
```

**Tables feeding it:** Only `activities` (single source due to STI consolidation).

**Key behaviors:**
- Filters out deleted records (`deleted_at IS NULL`)
- Filters out snoozed tasks (only shows tasks where `snooze_until` is NULL or past)
- Normalizes the date field: tasks use `due_date`, activities use `activity_date`
- Uses `subject` as `title` (column was renamed during STI migration)

### 4d) What is the role of exec_sql?

**Answer:** `exec_sql` is a SECURITY DEFINER function that executes arbitrary SQL and returns results as JSONB. It is restricted to `service_role` only. [Confidence: 100%]

**Function signature:** `exec_sql(sql_query text) RETURNS jsonb`

**Security model:**
1. Checks JWT claim for `service_role` via `COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'role', '')`
2. Uses COALESCE to prevent NULL bypass (NULL != 'service_role' returns NULL/falsy)
3. `SET search_path = public` to prevent schema injection
4. `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO service_role` only
5. SECURITY DEFINER means it runs as the function owner (postgres)

**Who calls it:**
- **Scripts** (7 files): `run-import.mjs`, `seed-dashboard-data.js`, `archive/create-test-users.mjs`, `archive/apply-rls-fix.js`, `archive/apply-migration.mjs`, `archive/debug-task-rls.mjs`, `archive/execute-import.js`
- **App code**: Zero references in `src/` directory [Confidence: 100%]
- **Migrations** (3 files): `20260209000001_add_exec_sql_function.sql` (creation), `20260210000001_fix_exec_sql_security.sql` (security hardening), `20260210000004_drop_deprecated_tasks_artifacts.sql` (references in comments only)

**Risk assessment:** `exec_sql` allows arbitrary SQL execution. While properly restricted to `service_role`, it's essentially a SQL injection surface if the service key is compromised. The scripts that call it pass user-constructed SQL strings. The security hardening migration (`20260210000001`) added `SET search_path` and COALESCE null-bypass protection, which was correct.

### 4e) Are there orphaned junction tables with 0 rows?

**Answer:** Yes, several 0-row tables exist in cloud, but most are NOT orphaned - they're legitimate but unused feature tables. [Confidence: 85%]

**Cloud 0-row tables (14 total):**

| Table | Orphaned? | Reasoning |
|---|---|---|
| `contact_notes` | No | Feature exists, users haven't adopted it |
| `dashboard_snapshots` | **Suspicious** | Cron runs daily but Edge Function doesn't exist - no data ever captured |
| `interaction_participants` | No | Junction for activities and contacts, feature exists |
| `migration_history` | **Suspicious** | App-level migration tracking table with 0 rows |
| `notifications` | No | Cleanup trigger deletes old notifications; could be working as designed |
| `opportunity_contacts` | No (data discrepancy) | **Cloud=0, Local=369** - cloud beta users haven't linked contacts to opportunities |
| `opportunity_notes` | No | Feature exists, unused |
| `opportunity_participants` | No | Feature exists, unused |
| `organization_notes` | No | Feature exists, unused |
| `product_distributor_authorizations` | No | Feature exists, unused |
| `product_distributors` | No | Feature exists, unused |
| `product_features` | No | Feature exists, unused |
| `tags` | No | Feature exists, recently implemented |
| `tutorial_progress` | No | Tutorial feature exists, unused |

**Genuinely suspicious:** `dashboard_snapshots` (expected to have data from nightly cron) and `migration_history` (purpose unclear if always empty).

---

## 5) Edge Function & Cron Health

### 5a) Deployed Edge Functions

| Slug | Status | JWT Required | Last Updated | Notes |
|---|---|---|---|---|
| `updatePassword` | ACTIVE | Yes | 2025-12-10 | Password management |
| `users` | ACTIVE | **No** | 2026-01-18 | User management (no JWT = public) |
| `daily-digest` | ACTIVE | Yes | 2025-12-08 | Daily digest email notifications |
| `check-overdue-tasks` | ACTIVE | Yes | 2025-12-08 | Overdue task notification checks |
| `digest-opt-out` | ACTIVE | Yes | 2025-12-08 | Digest opt-out handling |
| `health-check` | ACTIVE | **No** | 2026-01-18 | Health check endpoint |
| `admin-reset-password` | ACTIVE | Yes | 2026-01-19 | Admin password reset |

**Total:** 7 Edge Functions deployed.

### 5b) Cron -> Edge Function Chain Analysis

| Cron Job | SQL Function Called | Edge Function Invoked | Edge Function Exists? | Status |
|---|---|---|---|---|
| Daily Digest (7 AM UTC) | `invoke_daily_digest_function()` | `daily-digest` | **YES** | HEALTHY |
| Snapshot Capture (11 PM UTC) | `invoke_snapshot_capture_function()` | `capture-dashboard-snapshots` | **NO** | **BROKEN** |

**CRITICAL FINDING: Phantom Cron Job**

The `invoke_snapshot_capture_function()` builds the URL: `{project_url}/functions/v1/capture-dashboard-snapshots`

But `capture-dashboard-snapshots` **does not exist** in the deployed Edge Functions list. The function uses `pg_net.http_post()` which is fire-and-forget (async HTTP), so:

1. The cron job runs at 11 PM UTC daily
2. The SQL function executes successfully (returns "1 row")
3. The HTTP POST goes to a non-existent Edge Function endpoint
4. The request silently fails (404 from Supabase Edge runtime)
5. `dashboard_snapshots` table stays at 0 rows

This has been running daily for at least 10+ days with no data being captured. [Confidence: 95%]

**Evidence:**
- `cron.job_run_details` shows all recent runs as `succeeded` with `return_message: "1 row"`
- The function retrieves `project_url` and `service_role_key` from Vault (both exist or function would log a WARNING)
- The Edge Function slug `capture-dashboard-snapshots` is NOT in the `list_edge_functions` response
- `dashboard_snapshots` table has 0 rows

### 5c) Daily Digest Chain Analysis

The daily digest chain is **functional** but has a dual-function setup:

1. Cron calls `invoke_daily_digest_function()` which POSTs to the `daily-digest` Edge Function
2. The Edge Function presumably calls back into the database to run `generate_daily_digest()` or `generate_daily_digest_v2()`
3. Both `generate_daily_digest` and `generate_daily_digest_v2` exist and correctly reference `activities` (not old `tasks` table) [Confidence: 100%]

**However:** `notifications` table has 0 rows in cloud. This could mean:
- The `cleanup_old_notifications` trigger deletes notifications after insert (it's AFTER INSERT - would clean old ones, not new ones)
- The digest function runs but finds no tasks due/overdue (possible with only 71 activities, few of which may be tasks)
- The Edge Function fails before calling the SQL function

[Confidence: 60%] To Increase: Check Edge Function logs via `mcp__supabase__get_logs`.

### 5d) `users` Edge Function Security Note

The `users` Edge Function has `verify_jwt: false`, meaning it's publicly accessible without authentication. This is flagged for review - user management endpoints should typically require authentication. [Confidence: 85%] However, the function body may implement its own authentication check.

### 5e) Digest Functions - STI Migration Status

**VERIFIED:** All 6 digest-related functions in BOTH environments correctly reference the `activities` table with `activity_type = 'task'` filter. None reference the old `tasks` or `tasks_deprecated` tables.

| Function | Cloud `references_activities` | Local `references_activities` |
|---|---|---|
| `check_overdue_tasks` | true | true |
| `generate_daily_digest` | true | true |
| `get_duplicate_details` | true | true |
| `get_overdue_tasks_for_user` | true | true |
| `get_tasks_due_today_for_user` | true | true |
| `get_user_digest_summary` | true | true |

---

## 6) Risk Register

### P0 - Critical

**(None identified)** - No immediately breaking issues that would cause data loss or complete feature failure for current users.

### P1 - High

| ID | Risk | Impact | Mechanism | Confidence |
|---|---|---|---|---|
| **P1-1** | **Cloud missing data-integrity triggers** | Soft-deleted parent records don't cascade to child notes; `updated_at` not auto-managed on cloud; audit fields can be manually overwritten | Local has `cascade_soft_delete_to_notes`, `protect_audit_fields`, `update_*_updated_at` triggers. Cloud lacks all of these. If a contact/org/opportunity is soft-deleted on cloud, child notes remain visible. If someone manually sets `created_at`, nothing prevents it. | [Confidence: 90%] |
| **P1-2** | **Phantom snapshot cron job** | Dashboard snapshot feature is completely non-functional; `dashboard_snapshots` table will never populate | `invoke_snapshot_capture_function()` calls `capture-dashboard-snapshots` Edge Function which doesn't exist. Silent failure via `pg_net` async HTTP. | [Confidence: 95%] |
| **P1-3** | **Duplicate RLS DELETE policies** | Some tables have overlapping DELETE policies with different permission levels, creating unintended access widening | Local `contact_notes` has 3 DELETE policies (`contact_notes_delete_owner_or_privileged`, `delete_contact_notes`, `delete_contact_notes_privileged_only`). Permissive policies are OR'd, so the least restrictive one wins. | [Confidence: 75%] |

### P2 - Medium

| ID | Risk | Impact | Mechanism | Confidence |
|---|---|---|---|---|
| **P2-1** | **`exec_sql` as attack surface** | If service key is compromised, `exec_sql` allows arbitrary SQL execution including data exfiltration and modification | Function accepts arbitrary SQL text. While restricted to `service_role`, the 7 scripts that call it construct SQL strings dynamically. | [Confidence: 80%] |
| **P2-2** | **`users` Edge Function without JWT** | Potential unauthorized access to user management operations | `verify_jwt: false` means any network request can reach this function. The function may have internal auth checks, but this can't be verified without reading its source. | [Confidence: 70%] To Increase: Read the Edge Function source code |
| **P2-3** | **Possibly duplicate indexes** | Wasted storage and slower writes | `idx_opportunities_customer_org` and `idx_opportunities_customer_organization_id` appear to index the same column. Similarly, `product_distributor_authorizations` has 2 similar `deleted_at` indexes. | [Confidence: 70%] |
| **P2-4** | **3 views with no cross-environment equivalent** | Testing gap - can't verify `contact_duplicates`, `duplicate_stats` locally; `opportunity_stage_changes` not on cloud | These views can't be tested in local development or aren't available in production | [Confidence: 85%] |

### P3 - Low

| ID | Risk | Impact | Mechanism | Confidence |
|---|---|---|---|---|
| **P3-1** | **Legacy camelCase view names** | Inconsistent naming convention | `contactNotes`, `opportunityNotes`, `organizationNotes` use camelCase while all other views use snake_case | [Confidence: 100%] |
| **P3-2** | **`migration_history` table always empty** | Unclear purpose; possibly abandoned feature | Table exists with RLS but no data in either environment | [Confidence: 75%] |
| **P3-3** | **Tags with 2 overlapping UPDATE + 2 overlapping DELETE policies** | Redundant policies increase maintenance burden | Cloud `tags` has `tags_soft_delete_authenticated` (UPDATE) + `update_tags_admin` (UPDATE). Separately, `delete_tags_admin` + `tags_delete_privileged`. Not a security risk but adds confusion. | [Confidence: 85%] |
| **P3-4** | **4 migration files not committed to git** | Version control out of sync with database state | Files exist in `supabase/migrations/` but show as untracked in git status | [Confidence: 100%] |

---

## 7) Unknowns

| # | Unknown | What Would Resolve It | Priority |
|---|---|---|---|
| 1 | Does the `daily-digest` Edge Function succeed when called? | Check Edge Function logs: `mcp__supabase__get_logs(service: 'edge-function')` | P2 |
| 2 | What does the `users` Edge Function do without JWT validation? | Read Edge Function source: `mcp__supabase__get_edge_function(function_slug: 'users')` | P2 |
| 3 | Why do `contact_duplicates` and `duplicate_stats` views only exist on cloud? | Search migration files for these view names to find creation migration | P3 |
| 4 | Why does `opportunity_stage_changes` view only exist locally? | Search migration files for this view name | P3 |
| 5 | What is the `capture-dashboard-snapshots` Edge Function supposed to do? Does source code exist? | Search `supabase/functions/` directory for the function | P1 |
| 6 | Why do 5 archive/unarchive functions exist on cloud but not local? | These may have been created via direct SQL on cloud | P2 |
| 7 | Are the cloud `contacts_summary` and `principal_pipeline_summary` views using activities or old tasks? | Run `pg_get_viewdef()` on cloud for these specific views | P1 |
| 8 | Why does `audit_user_favorites` trigger exist on cloud but the function doesn't? | Check if cloud trigger actually works or errors on execution | P2 |

---

## 8) Multiple-Choice Questions

**[Q1]** The cloud is missing ~33 data-integrity triggers that exist locally (cascade soft-delete to notes, protect audit fields, auto-manage updated_at). How should we address this in Phase 3?

A) Push all missing triggers to cloud via a single consolidated migration (Recommended) - Brings cloud to full parity with local; addresses P1-1 in one deployment; lower risk since triggers are additive
B) Push triggers incrementally by category (audit, cascade, updated_at) across 3 separate migrations - More granular rollback points but 3x the deployment coordination; takes longer to reach parity
C) Leave cloud triggers as-is and add the missing safety checks in the application layer instead - Avoids migration risk but violates DATABASE_LAYER.md principles and leaves the database unprotected from direct access

**[Q2]** The `capture-dashboard-snapshots` Edge Function doesn't exist but the cron job runs daily. What should we do?

A) Deploy the Edge Function from the codebase (if source exists) and verify the cron chain works end-to-end (Recommended) - Restores the intended feature; dashboard_snapshots will start populating; validates the full cron->function->table pipeline
B) Disable the cron job (`SELECT cron.unschedule(3)`) until the feature is ready - Stops the wasted daily execution but means the feature stays broken; requires remembering to re-enable later
C) Remove both the cron job and the `invoke_snapshot_capture_function` SQL function, treating dashboard snapshots as a deferred feature - Cleanest removal but loses the infrastructure; must rebuild when the feature is needed

**[Q3]** Four migration files are applied to both environments but not committed to git. How should we handle this?

A) Commit all 4 migrations to git immediately to keep version control in sync with database state (Recommended) - Prevents confusion; other developers will see the migrations; standard Supabase workflow requires migrations in VCS
B) Run `supabase db diff` to regenerate the migrations from current state, replacing the manual files - Ensures migration files match actual DB state exactly, but may produce different SQL than the carefully authored originals
C) Leave them uncommitted and track them in the audit documentation only - Risky: another developer running `supabase db reset` won't have these migrations; local reproducibility breaks
