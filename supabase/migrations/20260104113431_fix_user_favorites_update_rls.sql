-- =====================================================================
-- Migration: Fix user_favorites RLS policies for soft-delete pattern
--
-- Issue: Setting deleted_at caused "new row violates row-level security"
--
-- Root Cause: PostgreSQL blocks UPDATE when the result would become
-- invisible to the SELECT policy. The SELECT policy had `deleted_at IS NULL`
-- which made soft-deleted rows disappear - PostgreSQL prevented this as a
-- security measure against users "hiding" rows from themselves.
--
-- Fix: Remove `deleted_at IS NULL` from SELECT policy. The application
-- already filters by deleted_at in queries (useFavorites.ts line 39:
-- filter: { deleted_at: null }), so database-level filtering is redundant.
-- =====================================================================

-- Fix SELECT policy: Remove deleted_at filter
-- This allows users to see their soft-deleted records if needed, and more
-- importantly, allows UPDATE to set deleted_at without violating visibility
DROP POLICY IF EXISTS "select_own" ON user_favorites;

CREATE POLICY "select_own" ON user_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY "select_own" ON user_favorites IS
  'Users can see all their favorites (active and soft-deleted). App filters deleted_at in queries.';

-- UPDATE policy stays the same: Only update active records
-- (This was already correct - the issue was the SELECT policy)
DROP POLICY IF EXISTS "update_own" ON user_favorites;

CREATE POLICY "update_own" ON user_favorites
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "update_own" ON user_favorites IS
  'Users can only update their own ACTIVE favorites. Soft-deleted records are immutable.';
