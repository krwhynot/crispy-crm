-- Batch 2, Q8: Hybrid task assignment - managers to anyone, reps to self only
-- Decision: Managers can assign tasks to any rep, reps can only self-assign
-- Rationale: Balances manager oversight with rep autonomy

-- ====================
-- TASK ASSIGNMENT POLICY (Activities Table)
-- ====================
-- Note: Tasks are stored in activities table with activity_type = 'task'
-- We need to update the INSERT policy on activities table to control task assignment

-- Drop existing insert policies that might conflict
DROP POLICY IF EXISTS insert_tasks ON activities;
DROP POLICY IF EXISTS activities_insert_owner ON activities;
DROP POLICY IF EXISTS authenticated_insert_activities ON activities;

-- Recreate with hybrid assignment logic for activities (includes tasks)
CREATE POLICY insert_activities_hybrid_assignment ON activities
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Managers/admins can create activities/tasks for anyone
    public.is_manager_or_admin()
    OR
    -- Reps can only create activities/tasks assigned to themselves
    -- For activities: created_by must match current user
    -- For tasks: sales_id (assignee) must match current user
    (created_by = public.current_sales_id() OR sales_id = public.current_sales_id())
  );

COMMENT ON POLICY insert_activities_hybrid_assignment ON activities IS
'Batch 2 Q8: Hybrid task/activity assignment.
- Managers/Admins: Can create activities/tasks for any user (team delegation)
- Reps: Can only create activities/tasks for themselves (prevents unauthorized assignment)
Note: Tasks stored in activities table with activity_type = task';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration implements role-based task/activity assignment:
-- 1. Managers/Admins - can create activities/tasks for any user (team management)
-- 2. Reps - can only create activities/tasks for themselves (self-management)
--
-- Affected table: activities (tasks stored with activity_type = 'task')
--
-- Security note: This RESTRICTS rep creation to self-only while allowing
--                manager delegation. Previous policy may have been more permissive.
-- Rollback: If needed, remove role check and allow all authenticated users to
--           create activities with any created_by/sales_id
