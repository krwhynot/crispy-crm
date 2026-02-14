/**
 * Consolidate Activities RLS Policies
 *
 * Requirements:
 * - SELECT: All authenticated users can see everything
 * - INSERT: Reps create for self only, Admin/Manager can create for anyone
 * - UPDATE: Reps can only edit their own (created_by or sales_id), Admin/Manager can edit all
 * - DELETE: Reps can only delete their own (created_by or sales_id), Admin/Manager can delete all
 *
 * This migration removes overlapping policies and creates a clean, consolidated set.
 */

BEGIN;

-- ============================================================================
-- STEP 1: Drop all existing policies on activities
-- ============================================================================

DROP POLICY IF EXISTS "activities_select_unified" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_unified" ON activities;
DROP POLICY IF EXISTS "activities_update_owner_or_privileged" ON activities;
DROP POLICY IF EXISTS "activities_delete_unified" ON activities;
DROP POLICY IF EXISTS "delete_activities" ON activities;

-- ============================================================================
-- STEP 2: SELECT - All authenticated users can see everything
-- ============================================================================

CREATE POLICY "activities_select"
  ON activities FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY "activities_select" ON activities IS
  'All authenticated users can see all activities and tasks. Soft-delete filtered.';

-- ============================================================================
-- STEP 3: INSERT - Reps create for self, Admin/Manager for anyone
-- ============================================================================

CREATE POLICY "activities_insert"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin/Manager can create for anyone
    (SELECT private.is_admin_or_manager())
    -- Reps can only create where they are creator or assignee
    OR created_by = (SELECT current_sales_id())
    OR sales_id = (SELECT current_sales_id())
  );

COMMENT ON POLICY "activities_insert" ON activities IS
  'Admin/Manager can create for anyone. Reps can only create for themselves.';

-- ============================================================================
-- STEP 4: UPDATE - Reps can only edit their own, Admin/Manager can edit all
-- ============================================================================

CREATE POLICY "activities_update"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin/Manager can update anything
      (SELECT private.is_admin_or_manager())
      -- Reps can update if they created it OR are assigned to it
      OR created_by = (SELECT current_sales_id())
      OR sales_id = (SELECT current_sales_id())
    )
  )
  WITH CHECK (
    -- Same rules for the new values
    (SELECT private.is_admin_or_manager())
    OR created_by = (SELECT current_sales_id())
    OR sales_id = (SELECT current_sales_id())
  );

COMMENT ON POLICY "activities_update" ON activities IS
  'Admin/Manager can update all. Reps can only update their own (created_by or sales_id).';

-- ============================================================================
-- STEP 5: DELETE - Reps can only delete their own, Admin/Manager can delete all
-- ============================================================================

CREATE POLICY "activities_delete"
  ON activities FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin can delete anything
      (SELECT public.is_admin())
      -- Manager can delete anything
      OR (SELECT private.is_admin_or_manager())
      -- Reps can delete if they created it OR are assigned to it
      OR created_by = (SELECT current_sales_id())
      OR sales_id = (SELECT current_sales_id())
    )
  );

COMMENT ON POLICY "activities_delete" ON activities IS
  'Admin/Manager can delete all. Reps can only delete their own (created_by or sales_id).';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
--
-- -- List all policies on activities:
-- SELECT policyname, cmd, qual::text, with_check::text
-- FROM pg_policies WHERE tablename = 'activities' ORDER BY cmd;
--
-- -- Expected: 4 policies (select, insert, update, delete)
