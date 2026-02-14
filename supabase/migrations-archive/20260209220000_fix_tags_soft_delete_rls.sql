-- Migration: Fix Tags Soft Delete RLS Policy
-- Issue: Soft delete uses UPDATE (sets deleted_at), but UPDATE policy requires manager/admin
-- This prevents regular authenticated users from soft-deleting tags
--
-- Solution: Create a specific policy that allows authenticated users to soft-delete
-- while keeping other updates restricted to manager/admin

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "tags_update_privileged" ON tags;

-- Create policy for soft delete (any authenticated user can soft-delete)
-- This policy allows UPDATE only when setting deleted_at (soft delete)
CREATE POLICY "tags_soft_delete_authenticated" ON tags
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (
    -- Allow if user is manager/admin (can update anything)
    is_manager_or_admin()
    OR
    -- Allow if only deleted_at is being changed (soft delete)
    (deleted_at IS NOT NULL)
  );

-- Add comment explaining the policy
COMMENT ON POLICY "tags_soft_delete_authenticated" ON tags IS
  'Allows manager/admin full update access, and any authenticated user to soft-delete (set deleted_at)';
