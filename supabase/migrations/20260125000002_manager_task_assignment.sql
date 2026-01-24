-- Batch 2, Q8: Hybrid task assignment - managers to anyone, reps to self only
-- Decision: Managers can assign tasks to any rep, reps can only self-assign
-- Rationale: Balances manager oversight with rep autonomy

-- ====================
-- TASK ASSIGNMENT POLICY
-- ====================

-- Drop existing insert policy
DROP POLICY IF EXISTS insert_tasks ON tasks;

-- Recreate with hybrid assignment logic
CREATE POLICY insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Managers/admins can assign to anyone
    public.is_manager_or_admin()
    OR
    -- Reps can only assign to themselves
    sales_id = public.current_sales_id()
  );

COMMENT ON POLICY insert_tasks ON tasks IS
'Batch 2 Q8: Hybrid task assignment.
- Managers/Admins: Can assign tasks to any rep (team delegation)
- Reps: Can only self-assign tasks (prevents unauthorized assignment)';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration implements role-based task assignment:
-- 1. Managers/Admins - can create tasks for any user (team management)
-- 2. Reps - can only create tasks assigned to themselves (self-management)
--
-- Affected table: tasks (activities table with STI pattern)
--
-- Security note: This RESTRICTS rep task creation to self-only while allowing
--                manager delegation. Previous policy may have been more permissive.
-- Rollback: If needed, remove role check and allow all authenticated users to
--           create tasks with any sales_id
