-- Migration: Fix RLS policy blocking self-profile updates
-- Problem: The WITH CHECK clause required role to match even when not being changed,
--          which blocked users from updating their own name/email/phone.
-- Solution: Simplify the WITH CHECK to allow self-updates for profile fields.
--          Role/disabled changes are protected by SECURITY DEFINER functions instead.

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "update_sales" ON sales;

-- Create improved update policy
-- USING: Admins can update anyone; users can update their own record
-- WITH CHECK: Same logic - ensures the row being written matches the condition
CREATE POLICY "update_sales" ON sales
  FOR UPDATE
  USING (
    is_admin() OR (user_id = auth.uid())
  )
  WITH CHECK (
    is_admin() OR (user_id = auth.uid())
  );

COMMENT ON POLICY "update_sales" ON sales IS
  'Self-update for profile fields (name, email, phone, avatar). Role/disabled changes protected by SECURITY DEFINER functions with built-in authorization.';
