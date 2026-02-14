/**
 * Phase 4: Update RLS Policies for Unified Activities Table
 *
 * This migration updates RLS policies on the activities table to handle
 * the new task entries (activity_type = 'task'). The key difference is:
 *
 * - Regular activities: Any authenticated user can update (team visibility)
 * - Task activities: Only assignee (sales_id) or manager/admin can update
 *
 * This maintains the existing security model for both entity types while
 * consolidating them into a single table.
 */

BEGIN;

-- ============================================================================
-- STEP 1: Update UPDATE policy for task-specific access control
-- ============================================================================
-- Current: All authenticated users can update any activity
-- New: Tasks require assignee (sales_id match) or manager/admin privileges
--      Regular activities remain open to all authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS authenticated_update_activities ON activities;
DROP POLICY IF EXISTS activities_update_policy ON activities;
DROP POLICY IF EXISTS activities_update_unified ON activities;

-- Create unified UPDATE policy
CREATE POLICY activities_update_unified ON activities
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Task activities: assignee or manager/admin only
      CASE WHEN activity_type = 'task' THEN
        (SELECT private.is_admin_or_manager())
        OR sales_id = (SELECT public.current_sales_id())
      -- Non-task activities: any authenticated user (current behavior)
      ELSE
        true
      END
    )
  )
  WITH CHECK (
    CASE WHEN activity_type = 'task' THEN
      (SELECT private.is_admin_or_manager())
      OR sales_id = (SELECT public.current_sales_id())
    ELSE
      true
    END
  );

COMMENT ON POLICY activities_update_unified ON activities IS
  'Unified update access:
   - Tasks: assignee (sales_id) or manager/admin
   - Activities: any authenticated user
   Uses SELECT-wrapped functions for initPlan caching performance.';

-- ============================================================================
-- STEP 2: Update DELETE policy to include task assignee permission
-- ============================================================================
-- Current: Only creator or admin can delete
-- New: For tasks, also allow assignee (sales_id) to delete

DROP POLICY IF EXISTS activities_delete_policy ON activities;
DROP POLICY IF EXISTS authenticated_delete_activities ON activities;
DROP POLICY IF EXISTS activities_delete_unified ON activities;

-- Create unified DELETE policy
CREATE POLICY activities_delete_unified ON activities
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin can delete anything
      (SELECT public.is_admin())
      -- Creator can delete their own activities
      OR created_by = (SELECT public.current_sales_id())
      -- Task assignee can delete their own tasks
      OR (activity_type = 'task' AND sales_id = (SELECT public.current_sales_id()))
    )
  );

COMMENT ON POLICY activities_delete_unified ON activities IS
  'Unified delete access:
   - Admin: all records
   - Creator: own records
   - Task assignee: own tasks only
   Uses SELECT-wrapped functions for initPlan caching performance.';

-- ============================================================================
-- STEP 3: Verify SELECT policy allows all authenticated users
-- ============================================================================
-- Existing behavior is correct - all authenticated users can see all activities
-- This includes tasks for team visibility

-- Drop and recreate to ensure correct state
DROP POLICY IF EXISTS authenticated_select_activities ON activities;
DROP POLICY IF EXISTS activities_select_all ON activities;

CREATE POLICY activities_select_all ON activities
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY activities_select_all ON activities IS
  'Universal read: All authenticated users can view all non-deleted activities and tasks.
   Soft-delete filter ensures deleted records are hidden.';

-- ============================================================================
-- STEP 4: Verify INSERT policy allows all authenticated users
-- ============================================================================
-- No change needed - current policy is correct

DROP POLICY IF EXISTS authenticated_insert_activities ON activities;
DROP POLICY IF EXISTS activities_insert_all ON activities;

CREATE POLICY activities_insert_all ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY activities_insert_all ON activities IS
  'All authenticated users can create activities and tasks.
   Created_by should be set by application code or trigger.';

-- ============================================================================
-- STEP 5: Add index for sales_id RLS performance
-- ============================================================================
-- Task UPDATE/DELETE policies check sales_id = current_sales_id()
-- Index ensures fast lookups during policy evaluation

CREATE INDEX IF NOT EXISTS idx_activities_sales_id_rls ON activities(sales_id)
  WHERE sales_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- STEP 6: Add trigger to auto-set created_by on insert
-- ============================================================================
-- Ensures created_by is always populated for audit trail

CREATE OR REPLACE FUNCTION public.set_activity_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_sales_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_set_activity_created_by ON activities;

CREATE TRIGGER trigger_set_activity_created_by
  BEFORE INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_activity_created_by();

COMMENT ON FUNCTION public.set_activity_created_by IS
  'Auto-populates created_by with current sales ID if not provided.';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
--
-- -- Check policies exist:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'activities'
-- ORDER BY policyname;
--
-- -- Test SELECT (should work for all authenticated):
-- -- All rows visible (assuming test user is authenticated)
-- SELECT COUNT(*) FROM activities WHERE deleted_at IS NULL;
--
-- -- Test UPDATE on task (should only work if user is assignee or manager):
-- -- This query should only succeed for task assignee or manager
-- UPDATE activities SET description = 'test'
-- WHERE id = (SELECT id FROM activities WHERE activity_type = 'task' LIMIT 1);
--
-- -- Test DELETE on task by assignee (should work):
-- -- First identify a task assigned to current user, then test soft-delete
-- SELECT id FROM activities
-- WHERE activity_type = 'task' AND sales_id = public.current_sales_id()
-- LIMIT 1;
