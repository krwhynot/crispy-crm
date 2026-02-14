-- Migration: Fix Tasks SELECT Policy
-- Date: 2025-11-17
-- Purpose: Fix SELECT policy for tasks table that was using non-existent created_by column
--
-- Problem: Migration 20251116124147 created a SELECT policy that references created_by column,
-- but tasks table uses sales_id instead. This causes the policy to always fail, preventing
-- rows from being read after UPDATE operations.
--
-- Solution: Recreate SELECT policy using the correct sales_id column that actually exists
-- in the tasks table.

-- ============================================================================
-- DROP EXISTING POLICY
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
DROP POLICY IF EXISTS select_tasks ON tasks;

-- ============================================================================
-- CREATE SELECT POLICY
-- ============================================================================
-- Allow users to select their own tasks or if they're a manager/admin

CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the policy was created:
--
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'tasks' AND cmd = 'SELECT';
--
-- Expected result:
-- policyname                  | cmd    | qual
-- ---------------------------+--------+------------------------------------------------
-- authenticated_select_tasks  | SELECT | (is_manager_or_admin() OR (sales_id = ...))
