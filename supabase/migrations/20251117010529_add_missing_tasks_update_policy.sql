-- Migration: Add Missing Tasks UPDATE Policy
-- Date: 2025-11-17
-- Purpose: Restore UPDATE policy for tasks table that was accidentally omitted in migration 20251116124147
--
-- Problem: Migration 20251116124147 dropped the permissive update_tasks policy
-- but only recreated SELECT policy, leaving no UPDATE policy for tasks.
-- This causes 406 errors when trying to update tasks via React Admin.
--
-- Solution: Restore UPDATE policy that allows users to update:
-- 1. Their own tasks (sales_id matches current_sales_id)
-- 2. Managers/admins can update any task

-- ============================================================================
-- DROP EXISTING POLICY (if any)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
DROP POLICY IF EXISTS update_tasks ON tasks;

-- ============================================================================
-- CREATE UPDATE POLICY
-- ============================================================================
-- Allow users to update their own tasks or if they're a manager/admin

CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the policy was created:
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'tasks' AND cmd = 'UPDATE';
--
-- Expected result:
-- policyname                  | cmd    | qual                                           | with_check
-- ---------------------------+--------+------------------------------------------------+------------------------------------------------
-- authenticated_update_tasks  | UPDATE | (is_manager_or_admin() OR (sales_id = ...))   | (is_manager_or_admin() OR (sales_id = ...))
