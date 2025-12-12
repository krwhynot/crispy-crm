# RBAC Architecture Inventory - Part 2B: Migrations & Seed Data

> **Generated:** 2025-12-11
> **Session:** Part 2B of 3
> **Scope:** Migrations + Seed Data + State Comparison
> **Mode:** Deep ultrathink analysis

---

## Executive Summary

| Category | Count/Status |
|----------|--------------|
| Total Migrations | **182** |
| RBAC-Related Migrations | **35** (19.2%) |
| Migrations in Folder | **182** |
| Applied to LOCAL | **181** |
| Applied to CLOUD | **181** |
| Drift Detected | **YES - CRITICAL** |
| Seed Users Created | **1** (production) / **6** (archived) |
| Seed Data Issues | **0 critical** |

### Critical Findings

1. **ORPHANED CLOUD MIGRATION (20251212020132)** - Applied to cloud but file missing from repo
2. **LOCAL-CLOUD DIVERGENCE** - Cloud missing `20251211180000_fix_is_admin_null_auth.sql`
3. **UNCOMMITTED LOCAL MIGRATION** - `20251212031800` not yet applied anywhere
4. **RBAC Evolution Complete** - From `is_admin` boolean to `user_role` enum system
5. **Seed Data GoTrue-Compatible** - All token fields use empty strings (not NULL)

---

## Part 1: Migration File Inventory

### 1.1 All Migrations (Summary)

**Total: 182 migrations** in `/home/krwhynot/projects/crispy-crm/supabase/migrations/`

| Time Period | Migration Range | Count |
|-------------|-----------------|-------|
| Oct 2025 | 20251018 - 20251028 | ~20 |
| Nov 2025 | 20251029 - 20251130 | ~60 |
| Dec 2025 | 20251201 - 20251212 | ~102 |

### 1.2 RBAC-Related Migrations (35 Files)

| Migration | Purpose | Objects Modified |
|-----------|---------|------------------|
| `20251018152315_cloud_schema_fresh.sql` | Initial schema | `sales.is_admin`, initial RLS |
| `20251018203500_update_rls_for_shared_team_access.sql` | Team-wide RLS | RLS policies |
| `20251018204500_add_helper_function_and_audit_trail.sql` | Helper function | `get_current_sales_id()` |
| `20251108172640_document_rls_security_model.sql` | Documentation | Comments only |
| `20251108213039_fix_rls_policies_role_based_access.sql` | Admin-only CRUD | RLS policies |
| **`20251111121526_add_role_based_permissions.sql`** | **MAJOR: Role system** | `user_role` enum, `is_admin()`, `is_manager_or_admin()` |
| `20251116210019_fix_sales_schema_consistency.sql` | Computed column | `sales.administrator` |
| `20251129030715_add_is_manager_helper.sql` | More helpers | `is_manager()`, `is_rep()` |
| `20251203120000_fix_rls_auth_uid_select_wrapper.sql` | Performance | RLS optimization |
| `20251211080000_add_authorization_to_security_definer_functions.sql` | Defense-in-depth | `admin_update_sale()` |
| `20251211120000_fix_sales_rls_self_update.sql` | Self-profile fix | RLS policies |
| `20251211130000_harden_security_definer_functions.sql` | Self-access | Function authorization |
| `20251211140000_enforce_column_level_updates.sql` | Trigger security | `enforce_sales_column_restrictions()` |
| `20251211160000_fix_trigger_null_auth.sql` | NULL auth fix | Trigger logic |
| `20251211170000_allow_admin_full_edit.sql` | Admin bypass | Trigger update |
| **`20251211180000_fix_is_admin_null_auth.sql`** | **NULL auth.uid() fix** | `is_admin()` |
| **`20251212031800_add_deleted_at_to_admin_update_sale.sql`** | **Soft-delete support** | `admin_update_sale()` |

---

## Part 2: RBAC Migration Deep Dive

### Migration 1: `20251111121526_add_role_based_permissions.sql`

**Timestamp:** 2025-11-11 12:15:26 UTC

**Purpose:** Replace `is_admin` boolean with full `user_role` enum system

**Full Content (Key Sections):**

```sql
-- =====================================================================
-- PART 1: Create Role Enum Type
-- =====================================================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

-- =====================================================================
-- PART 2: Add Role Column to Sales Table
-- =====================================================================
ALTER TABLE sales ADD COLUMN role user_role DEFAULT 'rep';

-- Backfill from existing is_admin column
UPDATE sales SET role = CASE
  WHEN is_admin = true THEN 'admin'::user_role
  ELSE 'rep'::user_role
END;

ALTER TABLE sales ALTER COLUMN role SET NOT NULL;

-- =====================================================================
-- PART 3: Helper Functions for Role Checking
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================================
-- PART 10: Sync Trigger to Keep is_admin Compatible
-- =====================================================================
CREATE OR REPLACE FUNCTION sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role();
```

**Analysis:**

| Change Type | Object | Details |
|-------------|--------|---------|
| CREATE TYPE | `user_role` | enum: admin, manager, rep |
| ALTER TABLE | `sales` | Added `role` column (NOT NULL) |
| CREATE FUNCTION | `user_role()` | Returns current user's role |
| CREATE FUNCTION | `is_admin()` | Returns TRUE if role = 'admin' |
| CREATE FUNCTION | `is_manager_or_admin()` | Returns TRUE if role IN ('admin', 'manager') |
| CREATE FUNCTION | `current_sales_id()` | Returns current user's sales.id |
| CREATE TRIGGER | `keep_is_admin_synced` | Syncs is_admin from role |

---

### Migration 2: `20251211180000_fix_is_admin_null_auth.sql`

**Timestamp:** 2025-12-11 18:00:00 UTC

**Purpose:** Fix is_admin() to return TRUE when auth.uid() is NULL (service role/local dev)

**Full Content:**

```sql
-- Migration: Fix is_admin() to handle NULL auth.uid()
-- Purpose: When auth.uid() is NULL, return TRUE to allow admin operations
--
-- ROOT CAUSE: The original is_admin() function:
--   SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid()
-- Returns NO ROWS when auth.uid() is NULL, which evaluates to NULL,
-- and COALESCE(NULL, FALSE) = FALSE, blocking ALL admin operations.
--
-- FIX: When auth.uid() is NULL, return TRUE (grant admin access).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;
```

**Critical Change:** When `auth.uid()` is NULL (service role, local dev, Edge Functions), `is_admin()` now returns `TRUE` instead of `FALSE`.

---

### Migration 3: `20251212031800_add_deleted_at_to_admin_update_sale.sql`

**Timestamp:** 2025-12-12 03:18:00 UTC

**Purpose:** Add soft-delete support to admin_update_sale() function

**Full Content:**

```sql
-- Migration: Add new_deleted_at parameter to admin_update_sale
-- Purpose: Fix Edge Function 500 error when admin edits user profiles
-- Root Cause: Edge Function passes 5 parameters but function only accepted 4

CREATE OR REPLACE FUNCTION admin_update_sale(
  target_user_id UUID,
  new_role user_role DEFAULT NULL,
  new_disabled BOOLEAN DEFAULT NULL,
  new_avatar TEXT DEFAULT NULL,
  new_deleted_at TIMESTAMPTZ DEFAULT NULL  -- NEW PARAMETER
)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  updated_record sales;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- AUTHORIZATION CHECK 1: Only admins can change role, disabled, or delete
  IF (new_role IS NOT NULL OR new_disabled IS NOT NULL OR new_deleted_at IS NOT NULL)
     AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify role, disabled status, or delete users'
      USING ERRCODE = 'P0003';
  END IF;

  -- AUTHORIZATION CHECK 2: Non-admins can only update their own profile
  IF current_user_role != 'admin' AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile'
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    deleted_at = COALESCE(new_deleted_at, deleted_at),
    updated_at = NOW()
  WHERE user_id = target_user_id AND (deleted_at IS NULL OR new_deleted_at IS NOT NULL)
  RETURNING * INTO updated_record;

  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0004';
  END IF;

  RETURN updated_record;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT, TIMESTAMPTZ) TO authenticated;
```

---

## Part 3: Migration Timeline Visualization

```
RBAC Evolution Timeline
========================

Oct 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251018152315_cloud_schema_fresh.sql
  │  └── Initial: sales.is_admin BOOLEAN DEFAULT false
  │
  ├─ 20251018204500_add_helper_function_and_audit_trail.sql
  │  └── get_current_sales_id() helper
  │
Nov 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251108213039_fix_rls_policies_role_based_access.sql
  │  └── Admin-only UPDATE/DELETE policies
  │
  ├─ 20251111121526_add_role_based_permissions.sql ★ MAJOR
  │  ├── Created user_role enum (admin, manager, rep)
  │  ├── Added sales.role column (NOT NULL)
  │  ├── Created is_admin(), is_manager_or_admin()
  │  └── Created sync trigger (role → is_admin)
  │
  ├─ 20251116210019_fix_sales_schema_consistency.sql
  │  └── Computed: sales.administrator GENERATED AS (role = 'admin')
  │
  ├─ 20251129030715_add_is_manager_helper.sql
  │  └── Added is_manager(), is_rep() helpers
  │
Dec 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251211080000_add_authorization_to_security_definer_functions.sql
  │  └── Hardened admin_update_sale() with auth checks
  │
  ├─ 20251211140000_enforce_column_level_updates.sql
  │  └── Trigger: enforce_sales_column_restrictions()
  │
  ├─ 20251211170000_allow_admin_full_edit.sql
  │  └── Admin bypass for all fields
  │
  ├─ 20251211180000_fix_is_admin_null_auth.sql ★ SECURITY FIX
  │  └── is_admin() returns TRUE when auth.uid() is NULL
  │
  └─ 20251212031800_add_deleted_at_to_admin_update_sale.sql ★ LATEST
     └── 5-param admin_update_sale() with soft-delete
```

---

## Part 4: Seed Data Analysis

### 4.1 Seed Files Found

| File | Size | Purpose | Users Created |
|------|------|---------|---------------|
| `supabase/seed.sql` | 709KB | **PRODUCTION** - Real org data | 1 (admin) |
| `supabase/seed-e2e.sql` | 14KB | E2E test data | 0 (reuses admin) |
| `supabase/seed-sample-opportunity.sql` | 12KB | Sample opportunity | 0 (reuses admin) |
| `supabase/seed.sql.archived.2025-11-28` | N/A | **ARCHIVED** - Full test data | 6 (all roles) |

**Modular Seed Parts** (`supabase/seed-parts/`):
- `01-header-auth-users.sql` - Auth setup (6 users)
- `02-sales.sql` - Sales records
- `03-segments.sql` - Playbook categories
- `04-principals.sql` - Principal organizations
- `05-distributors.sql` - Distributor organizations
- `06-customers.sql` - Customer organizations
- `08-contacts.sql` - Contact records
- `11-opportunities.sql` - Opportunity data
- `12-activities.sql` - Activity records

### 4.2 Current Production Seed (`seed.sql`)

**Generation Info:**
- Generated: 2025-12-08T04:51:28.379Z
- Organizations: 2,023 (real MasterFoods data)
- Contacts: 1,776
- Single admin user: `admin@test.com`

**auth.users INSERT Pattern:**

```sql
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token, is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated', 'authenticated', 'admin@test.com',
  crypt('password123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(), NOW(),
  '', '', '', '', '', '', '', '',  -- ALL EMPTY STRINGS (not NULL)
  false, false
) ON CONFLICT (id) DO UPDATE SET ...
```

### 4.3 Users Created by Seed

**Current Production:**

| Email | Role | User ID |
|-------|------|---------|
| admin@test.com | admin | d3129876-b1fe-40eb-9980-64f5f73c64d6 |

**Archived Seed (6 users):**

| Email | Role | User ID |
|-------|------|---------|
| admin@test.com | admin | a0000000-0000-0000-0000-000000000001 |
| brent@mfbroker.com | admin | b0000000-0000-0000-0000-000000000001 |
| michelle@mfbroker.com | manager | c0000000-0000-0000-0000-000000000001 |
| gary@mfbroker.com | rep | d0000000-0000-0000-0000-000000000001 |
| dale@mfbroker.com | rep | e0000000-0000-0000-0000-000000000001 |
| sue@mfbroker.com | rep | f0000000-0000-0000-0000-000000000001 |

### 4.4 Seed Data Issues

**Status: NO CRITICAL ISSUES FOUND**

| Check | Status |
|-------|--------|
| Token columns (confirmation_token, etc.) | Empty strings (`''`) - NOT NULL |
| GoTrue compatibility (is_sso_user, is_anonymous) | Included |
| Explicit sales INSERT | Yes (bypasses trigger on upsert) |
| Verification check | Fail-fast if sales empty |
| Idempotent pattern | ON CONFLICT DO UPDATE |

---

## Part 5: Migration State Comparison

### 5.1 CLI Status

**Local Migration List:**
```
  Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
  [180 migrations in sync...]
  20251211180000 |                | 2025-12-11 18:00:00   ← LOCAL ONLY
                 | 20251212020132 | 2025-12-12 02:01:32   ← CLOUD ONLY (ORPHANED!)
  20251212031800 |                | 2025-12-12 03:18:00   ← NOT APPLIED
```

### 5.2 Applied Migrations Matrix

| Migration | In Folder | Applied LOCAL | Applied CLOUD | Status |
|-----------|-----------|---------------|---------------|--------|
| All prior to 20251211180000 | ✅ | ✅ | ✅ | **SYNCED** |
| 20251211180000 | ✅ | ✅ | ❌ | **CLOUD MISSING** |
| 20251212020132 | ❌ | ❌ | ✅ | **ORPHANED** |
| 20251212031800 | ✅ | ❌ | ❌ | **NOT APPLIED** |

### 5.3 Drift Analysis

#### CRITICAL: Orphaned Cloud Migration

| Issue | Details |
|-------|---------|
| Migration | `20251212020132` |
| In folder | ❌ **NO** |
| Applied locally | ❌ **NO** |
| Applied to cloud | ✅ **YES** |
| Impact | Unknown schema changes in production not tracked in git |

**Possible Causes:**
1. Manual SQL executed directly on cloud DB
2. Migration file deleted after push
3. Different branch pushed to cloud

#### Cloud Missing Security Fix

| Issue | Details |
|-------|---------|
| Migration | `20251211180000_fix_is_admin_null_auth.sql` |
| Impact | Cloud `is_admin()` returns FALSE for service role operations |
| Security | Admin operations may fail unexpectedly in cloud |

### 5.4 Drift Resolution Commands

```bash
# Step 1: Investigate orphaned migration
npx supabase db execute "SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version = '20251212020132';"

# Step 2: If safe to remove, mark as reverted
npx supabase migration repair --status reverted 20251212020132

# Step 3: Apply missing migrations to cloud
npx supabase db push

# Step 4: Apply pending local migration
npx supabase migration up --local

# Step 5: Verify all in sync
npx supabase migration list
```

---

## Part 6: Migration Dependency Graph

```
Migration Dependencies
======================

20251018152315_cloud_schema_fresh.sql
    │
    └── Creates: sales.is_admin BOOLEAN
        │
        ▼
20251111121526_add_role_based_permissions.sql ★
    │
    ├── Creates: user_role ENUM
    ├── Adds: sales.role column
    ├── Creates: is_admin() (v1)
    ├── Creates: is_manager_or_admin()
    ├── Creates: current_sales_id()
    ├── Creates: sync_is_admin_from_role trigger
    │
    └──► 20251129030715_add_is_manager_helper.sql
              │
              ├── Creates: is_manager()
              └── Creates: is_rep()
                   │
                   ▼
        20251211180000_fix_is_admin_null_auth.sql ★
              │
              └── Modifies: is_admin() (NULL handling)
                   │
                   ▼
        20251212031800_add_deleted_at_to_admin_update_sale.sql ★
              │
              └── Modifies: admin_update_sale() (5 params)
```

---

## Part 7: Issues Found

### Issue 1: Orphaned Cloud Migration

| Attribute | Value |
|-----------|-------|
| Type | Migration State |
| Severity | **CRITICAL** |
| Location | Cloud database |

**Description:**
Migration `20251212020132` exists in cloud but has no corresponding file in the repository. This breaks the principle of migrations as source of truth.

**Impact on Admin Edit Bug:**
Unknown schema changes may affect RBAC behavior in production.

**Fix:**
```bash
# Investigate what it contains
npx supabase db execute "SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20251212020132';"

# Then either recover the file or revert
npx supabase migration repair --status reverted 20251212020132
```

---

### Issue 2: Cloud Missing `is_admin()` NULL Fix

| Attribute | Value |
|-----------|-------|
| Type | Migration State |
| Severity | **HIGH** |
| Location | `20251211180000_fix_is_admin_null_auth.sql` |

**Description:**
Cloud database is missing the fix that makes `is_admin()` return TRUE when `auth.uid()` is NULL.

**Impact on Admin Edit Bug:**
Service role operations (Edge Functions) may fail admin permission checks in cloud.

**Fix:**
```bash
npx supabase db push  # Will push 20251211180000
```

---

### Issue 3: Uncommitted Local Migration

| Attribute | Value |
|-----------|-------|
| Type | Migration State |
| Severity | **MEDIUM** |
| Location | `20251212031800_add_deleted_at_to_admin_update_sale.sql` |

**Description:**
Latest migration exists in folder but not applied to local or cloud.

**Fix:**
```bash
npx supabase migration up --local
npx supabase db push
```

---

## Part 8: Recommendations

### 8.1 Immediate Actions

1. **Investigate orphaned migration 20251212020132**
   - Query cloud to see what it contains
   - Either recover the file or revert the migration

2. **Push missing migrations to cloud**
   - `20251211180000_fix_is_admin_null_auth.sql`
   - `20251212031800_add_deleted_at_to_admin_update_sale.sql`

3. **Apply local pending migration**
   - `npx supabase migration up --local`

### 8.2 Sync Environments

```bash
# 1. Fix orphaned migration
npx supabase migration repair --status reverted 20251212020132

# 2. Push all pending to cloud
npx supabase db push

# 3. Apply to local
npx supabase migration up --local

# 4. Verify sync
npx supabase migration list
# All columns should match
```

### 8.3 Prevent Future Drift

- [ ] Never execute SQL directly on cloud - always use migrations
- [ ] Never delete migration files after they've been applied
- [ ] Add `npx supabase migration list` to CI/CD pre-push hook
- [ ] Commit migrations before pushing to cloud
- [ ] Review `migration list` output before deployments

---

## Appendix A: All RBAC Migration Filenames (35 Files)

```
20251018152315_cloud_schema_fresh.sql
20251018203500_update_rls_for_shared_team_access.sql
20251018204500_add_helper_function_and_audit_trail.sql
20251018210000_add_created_by_audit_field.sql
20251020001702_add_organizations_summary_rls_policies.sql
20251029024045_fix_rls_policies_company_isolation.sql
20251029070224_grant_authenticated_permissions.sql
20251108172640_document_rls_security_model.sql
20251108213039_fix_rls_policies_role_based_access.sql
20251108213216_cleanup_duplicate_rls_policies.sql
20251111121526_add_role_based_permissions.sql
20251114060720_fix_view_permissions.sql
20251116124147_fix_permissive_rls_policies.sql
20251116210019_fix_sales_schema_consistency.sql
20251117010529_add_missing_tasks_update_policy.sql
20251117011028_fix_tasks_select_policy.sql
20251123190738_restore_activities_rls_policies.sql
20251126041953_fix_opportunities_update_policy.sql
20251127054700_fix_critical_rls_security_tasks.sql
20251127055705_enhance_rls_security_activities_and_indexes.sql
20251129030715_add_is_manager_helper.sql
20251129120417_fix_public_role_rls_policies.sql
20251129170506_harden_participant_tables_rls_security.sql
20251129180728_add_soft_delete_rls_filtering.sql
20251129181451_add_missing_update_policies.sql
20251130010932_security_invoker_and_search_path_remediation.sql
20251130011911_fix_remaining_security_definer_views.sql
20251130045429_fix_security_definer_search_paths.sql
20251203120000_fix_rls_auth_uid_select_wrapper.sql
20251203120100_fix_rls_security_gaps.sql
20251211080000_add_authorization_to_security_definer_functions.sql
20251211120000_fix_sales_rls_self_update.sql
20251211130000_harden_security_definer_functions.sql
20251211140000_enforce_column_level_updates.sql
20251211160000_fix_trigger_null_auth.sql
20251211170000_allow_admin_full_edit.sql
20251211180000_fix_is_admin_null_auth.sql
20251212031800_add_deleted_at_to_admin_update_sale.sql
```

---

## Appendix B: Current RBAC State Summary

### Helper Functions

| Function | Returns | Special Behavior |
|----------|---------|------------------|
| `user_role()` | `user_role` | Current user's role enum |
| `is_admin()` | `BOOLEAN` | TRUE when auth.uid() is NULL |
| `is_manager()` | `BOOLEAN` | TRUE if role = 'manager' |
| `is_rep()` | `BOOLEAN` | TRUE if role = 'rep' |
| `is_manager_or_admin()` | `BOOLEAN` | TRUE if role IN ('admin', 'manager') |
| `current_sales_id()` | `BIGINT` | Current user's sales.id |

### Sales Table Columns (RBAC-Related)

| Column | Type | Status |
|--------|------|--------|
| `role` | `user_role` | **PRIMARY** - NOT NULL |
| `is_admin` | `BOOLEAN` | **DEPRECATED** - Synced via trigger |
| `administrator` | `BOOLEAN` | **COMPUTED** - GENERATED AS (role = 'admin') |

### Triggers on Sales

| Trigger | Function | Purpose |
|---------|----------|---------|
| `keep_is_admin_synced` | `sync_is_admin_from_role()` | Backward compatibility |
| `enforce_sales_column_restrictions_trigger` | `enforce_sales_column_restrictions()` | Column-level security |

---

**End of Part 2B Inventory**
