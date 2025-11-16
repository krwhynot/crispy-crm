# RLS Policy Integration Test Findings

## Overview

Created comprehensive RLS (Row Level Security) policy integration tests for Atomic CRM per CLAUDE.md requirements (lines 104-109).

**Test File:** `tests/integration/rls-policies.test.ts`

## What's Tested

### 1. Admin-Only UPDATE/DELETE Policies
Tests that only admin users can UPDATE and DELETE shared resources:
- Contacts
- Organizations
- Opportunities

**Per CLAUDE.md Line 107-109:**
> Admin-only UPDATE/DELETE policies - Per CLAUDE.md line 107-109:
> - Admin users CAN update/delete contacts, organizations, opportunities
> - Non-admin users CANNOT update/delete these shared resources

### 2. Personal Task Filtering
Tests that users can only access their own tasks based on `created_by` field:
- Users can only SELECT their own tasks
- Users can only INSERT tasks for themselves
- Users can only UPDATE their own tasks
- Users can only DELETE their own tasks

**Per CLAUDE.md Line 106:**
> Personal task sales_id filtering - users can only see tasks where created_by matches their record

## Test Results & Findings

### IMPORTANT DISCOVERY: RLS Policy Mismatch

**The tests currently FAIL because the RLS policies do not match the documented requirements in CLAUDE.md.**

#### Root Cause

Migration `20251111121526_add_role_based_permissions.sql` (applied 2025-11-11) changed the RLS policies to allow ALL authenticated users to UPDATE shared resources:

```sql
-- Lines 168-171
CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true)    -- ❌ Allows everyone to update!
  WITH CHECK (true);
```

This OVERRIDES the earlier migration `20251108213039_fix_rls_policies_role_based_access.sql` which correctly implemented admin-only UPDATE:

```sql
-- Lines 21-28
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (
    -- ✅ Only admins can update contacts
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );
```

#### Current State (as of 2025-11-16)

Running `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename = 'contacts'` shows:

```
policyname                      | cmd    | qual
--------------------------------|--------|------------------------
update_contacts                 | UPDATE | true                    ❌ PERMISSIVE!
authenticated_update_contacts   | UPDATE | (is_admin = true)       ✅ RESTRICTIVE
```

**PostgreSQL RLS Behavior:** When multiple policies exist for the same operation, they are combined with OR logic. If ANY policy allows access, the operation succeeds. Therefore, `update_contacts` with `USING (true)` allows everyone to update, regardless of the `authenticated_update_contacts` policy.

### Impact

- **Contacts:** Non-admin users CAN update (should be admin-only)
- **Organizations:** Non-admin users CAN update (should be admin-only)
- **Opportunities:** Non-admin users CAN update (should be admin-only)
- **Tasks:** SELECT shows all tasks (should only show user's own tasks)

### Recommendations

1. **Drop the permissive policies** created in `20251111121526`:
   ```sql
   DROP POLICY IF EXISTS update_contacts ON contacts;
   DROP POLICY IF EXISTS update_organizations ON organizations;
   DROP POLICY IF EXISTS update_opportunities ON opportunities;
   DROP POLICY IF EXISTS select_tasks ON tasks;
   ```

2. **Keep only the restrictive policies** from `20251108213039`:
   ```sql
   -- These already exist and are correct:
   -- authenticated_update_contacts (admin-only)
   -- authenticated_update_organizations (admin-only)
   -- authenticated_update_opportunities (admin-only)
   ```

3. **Fix tasks SELECT policy** to use personal filtering:
   ```sql
   DROP POLICY IF EXISTS select_tasks ON tasks;
   CREATE POLICY authenticated_select_tasks ON tasks
     FOR SELECT TO authenticated
     USING (created_by IN (SELECT id FROM sales WHERE user_id = auth.uid()));
   ```

4. **Update CLAUDE.md** if the new behavior (everyone can update) is intentional.

## Test Setup

### Prerequisites

1. **Local Supabase:** Tests require local Supabase instance (not cloud)
   ```bash
   npx supabase start
   ```

2. **Environment:** Tests use `.env.test` with local credentials
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGci...  (local default)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  (local default)
   ```

3. **Admin User:** Tests expect `admin@test.com` user with `is_admin=true`
   - Email: admin@test.com
   - Password: password123
   - Role: admin
   - is_admin: true

4. **JWT Secret:** For local testing, the `jwt_secret` in `supabase/config.toml` must be commented out to use the default local secret. The cloud JWT secret causes signature validation errors.

### Running Tests

```bash
# Run RLS integration tests
npx vitest run --config vitest.integration.config.ts tests/integration/rls-policies.test.ts

# Run all integration tests
npx vitest run --config vitest.integration.config.ts tests/integration/
```

## Test Structure

- **19 tests total**
  - 15 tests for admin-only UPDATE/DELETE (5 tests × 3 resources)
  - 4 tests for personal task filtering

- **Test Users:**
  - Admin: admin@test.com (is_admin=true, role='admin')
  - Rep: rep@test.com (is_admin=false, role='rep') - dynamically created per test

- **Cleanup:** All test data (contacts, organizations, opportunities, tasks, test users) are cleaned up in `afterEach`

## Files Created

1. `tests/integration/rls-policies.test.ts` - Main test file (819 lines)
2. `.env.test` - Updated with SUPABASE_SERVICE_ROLE_KEY for user creation
3. This document

## Next Steps

1. **Decision Required:** Should RLS policies be admin-only UPDATE/DELETE (per CLAUDE.md) or permissive (per latest migration)?
2. **If admin-only is correct:** Create migration to drop permissive policies
3. **If permissive is correct:** Update CLAUDE.md documentation
4. **Re-run tests** after policy decision to verify compliance

## References

- CLAUDE.md lines 104-109 (RLS policy requirements)
- Migration 20251108213039_fix_rls_policies_role_based_access.sql (admin-only policies)
- Migration 20251111121526_add_role_based_permissions.sql (permissive policies)
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
