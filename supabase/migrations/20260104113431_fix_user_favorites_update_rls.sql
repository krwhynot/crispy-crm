-- =====================================================================
-- Migration: Fix user_favorites UPDATE RLS policy
-- Purpose: Align UPDATE policy with SELECT policy for soft-delete pattern
-- Issue: UPDATE was allowing modification of already-deleted records
-- =====================================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "update_own" ON user_favorites;

-- Recreate with explicit deleted_at handling
-- Allow updating only ACTIVE records (deleted_at IS NULL)
-- This matches the SELECT policy and prevents updating soft-deleted records
CREATE POLICY "update_own" ON user_favorites
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Add comment explaining the policy
COMMENT ON POLICY "update_own" ON user_favorites IS
  'Users can only update their own ACTIVE favorites (deleted_at IS NULL). Consistent with soft-delete pattern.';
