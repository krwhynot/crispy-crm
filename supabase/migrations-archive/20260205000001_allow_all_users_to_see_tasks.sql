/**
 * Allow All Authenticated Users to See Tasks in Timeline
 *
 * Changes RLS policy on activities table to allow all authenticated users
 * to see tasks (previously restricted to owner or admin/manager only).
 *
 * Previous behavior:
 * - Non-task activities: visible to all authenticated users
 * - Tasks: visible only to owner (sales_id) OR admin/manager
 *
 * New behavior:
 * - All activities AND tasks: visible to all authenticated users
 *
 * Rationale: Business requirement - all team members should see all tasks
 * in entity timelines for collaboration and visibility.
 *
 * Related: ISSUE-7 (Timeline RLS Investigation)
 */

BEGIN;

-- ============================================================================
-- STEP 1: Drop existing restrictive policy
-- ============================================================================
-- The current policy filters tasks by sales_id or admin/manager role

DROP POLICY IF EXISTS "activities_select_unified" ON activities;

-- ============================================================================
-- STEP 2: Create new permissive policy
-- ============================================================================
-- All authenticated users can see all activities and tasks
-- Only soft-delete filtering is applied

CREATE POLICY "activities_select_unified"
  ON activities FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY "activities_select_unified" ON activities IS
  'All authenticated users can see all activities and tasks. Soft-delete filtering applied.';

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run after migration to confirm:
-- SELECT policyname, qual::text FROM pg_policies WHERE tablename = 'activities' AND cmd = 'SELECT';
-- Expected: activities_select_unified with qual = (deleted_at IS NULL)
