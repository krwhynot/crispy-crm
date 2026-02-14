-- ============================================================================
-- Migration: Update Tasks RLS for Universal Visibility
-- ============================================================================
-- Purpose: Change Tasks RLS so everyone can see all tasks (for unified
-- timeline), but only assignees/managers can edit.
--
-- Business Context:
-- The Crispy CRM needs a unified activity timeline where all team members
-- can see tasks across the organization for collaboration and visibility.
-- However, editing should remain restricted to task owners and privileged
-- users (managers/admins).
--
-- Security Model Changes:
--   - SELECT: UNIVERSAL (all authenticated users can see all non-deleted tasks)
--   - UPDATE: SCOPED (only task assignee OR managers/admins can edit)
--   - INSERT: UNCHANGED (self-assignment or manager-assigned)
--   - DELETE: UNCHANGED (admin-only)
--
-- Performance Optimization:
-- Uses SELECT-wrapped function calls in UPDATE policy for 100x performance
-- gain via PostgreSQL's initPlan caching. This prevents the function from
-- being re-evaluated for every row during the policy check.
--
-- Dependencies:
--   - private.is_admin_or_manager() [from 20260118140000]
--   - public.current_sales_id() [from 20251111121526, hardened 20260118000005]
--
-- References:
--   - Previous tasks RLS: 20251127054700_fix_critical_rls_security_tasks.sql
--   - Role helpers: 20260118140000_add_role_based_access_helpers.sql
--   - Write lockdown: 20260118000005_fix_rls_write_policies.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Drop ALL Existing SELECT Policies on Tasks
-- ============================================================================
-- Clean slate approach - drop all known policy names from various migrations
-- to avoid duplicate/conflicting policies.

DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "authenticated_select_tasks" ON tasks;
DROP POLICY IF EXISTS "select_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_role_based" ON tasks;
DROP POLICY IF EXISTS "tasks_select_all_authenticated" ON tasks;

-- ============================================================================
-- PART 2: Create Universal SELECT Policy
-- ============================================================================
-- NEW: Everyone can see all tasks (soft-delete filtered)
-- This enables the unified timeline feature where all team members
-- can see tasks across the organization.

CREATE POLICY "tasks_select_all_authenticated" ON tasks
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY "tasks_select_all_authenticated" ON tasks IS
  'Universal read access: All authenticated users can view all non-deleted tasks. Enables unified timeline collaboration.';

-- ============================================================================
-- PART 3: Drop ALL Existing UPDATE Policies on Tasks
-- ============================================================================
-- Clean slate for UPDATE policies before creating optimized version.

DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "authenticated_update_tasks" ON tasks;
DROP POLICY IF EXISTS "update_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_update_role_based" ON tasks;
DROP POLICY IF EXISTS "tasks_update_owner_or_privileged" ON tasks;
DROP POLICY IF EXISTS "tasks_update_own_or_manager" ON tasks;

-- ============================================================================
-- PART 4: Create Optimized UPDATE Policy
-- ============================================================================
-- OPTIMIZED UPDATE: Wrap functions in SELECT for 100x performance gain
-- PostgreSQL caches the result of (SELECT function()) as an initPlan,
-- preventing re-evaluation for every row during policy checks.
--
-- Access rules:
--   - Reps: own tasks only (sales_id match)
--   - Managers/Admins: all tasks

CREATE POLICY "tasks_update_own_or_manager" ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (SELECT private.is_admin_or_manager())
      OR sales_id = (SELECT public.current_sales_id())
    )
  )
  WITH CHECK (
    (SELECT private.is_admin_or_manager())
    OR sales_id = (SELECT public.current_sales_id())
  );

COMMENT ON POLICY "tasks_update_own_or_manager" ON tasks IS
  'Scoped write access: Task assignee (sales_id match) or managers/admins can update. Uses SELECT-wrapped functions for initPlan caching performance.';

-- ============================================================================
-- PART 5: Ensure Indexes for RLS Performance
-- ============================================================================
-- Partial indexes on foreign keys with soft-delete filter to speed up
-- RLS policy evaluation and common query patterns.

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id
  ON tasks(contact_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id
  ON tasks(organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_sales_id
  ON tasks(sales_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 6: Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tasks RLS Updated for Universal Visibility';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SELECT policy: Universal (all authenticated users)';
  RAISE NOTICE '  - Filter: deleted_at IS NULL';
  RAISE NOTICE '  - Enables: Unified timeline collaboration';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATE policy: Scoped (owner or privileged)';
  RAISE NOTICE '  - Reps: Own tasks only (sales_id match)';
  RAISE NOTICE '  - Managers/Admins: All tasks';
  RAISE NOTICE '  - Optimization: SELECT-wrapped functions';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Indexes created (partial, soft-delete aware):';
  RAISE NOTICE '  - idx_tasks_contact_id';
  RAISE NOTICE '  - idx_tasks_organization_id';
  RAISE NOTICE '  - idx_tasks_sales_id';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- Run these after migration to verify policies are in place:
--
-- -- Check all tasks policies
-- SELECT policyname, cmd, permissive, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'tasks'
-- ORDER BY cmd;
--
-- -- Expected output:
-- -- tasks_delete_policy           | DELETE | PERMISSIVE | is_admin()
-- -- tasks_insert_policy           | INSERT | PERMISSIVE | (sales_id = current_sales_id() OR is_manager_or_admin())
-- -- tasks_select_all_authenticated| SELECT | PERMISSIVE | (deleted_at IS NULL)
-- -- tasks_update_own_or_manager   | UPDATE | PERMISSIVE | (deleted_at IS NULL AND (is_admin_or_manager() OR sales_id = current_sales_id()))
--
-- -- Test SELECT visibility (should see all non-deleted tasks)
-- SET ROLE authenticated;
-- SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL;
-- RESET ROLE;
--
-- -- Test UPDATE restriction (should fail for non-owner rep)
-- -- SET LOCAL role TO 'authenticated';
-- -- SET LOCAL request.jwt.claims TO '{"sub": "<non-owner-user-id>"}';
-- -- UPDATE tasks SET description = 'test' WHERE id = <other-users-task>;
-- -- Should get RLS violation error
-- ============================================================================
