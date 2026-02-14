-- ============================================================================
-- Migration: Fix segments table RLS policies
-- Date: 2026-01-26
-- Reference: DATABASE_LAYER.md - Access Control Patterns
-- Priority: P0 (Security - USING(true) allows all authenticated users)
-- ============================================================================
--
-- SECURITY ISSUE FIXED:
-- Current policies use USING(true) allowing ANY authenticated user to:
--   - SELECT all segments (no ownership check)
--   - INSERT/UPDATE/DELETE segments (no admin check)
--
-- FIX: Restrict to authenticated-only SELECT, admin-only modifications
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP EXISTING PERMISSIVE POLICIES
-- ============================================================================
-- NOTE: INSERT/UPDATE policies already fixed in 20260109000004_harden_rls_ownership_policies.sql
-- However, DELETE policy reverted to permissive in a later migration - fix it here

DROP POLICY IF EXISTS "Allow authenticated read access" ON segments;
DROP POLICY IF EXISTS "Allow authenticated users to create" ON segments;
DROP POLICY IF EXISTS "select_segments" ON segments;
DROP POLICY IF EXISTS "delete_segments" ON segments;
DROP POLICY IF EXISTS "segments_delete_admin" ON segments;

-- ============================================================================
-- CREATE PROPER RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Authenticated users can view segments (reference data)
-- ----------------------------------------------------------------------------
-- Segments are configuration/reference data that all users need to see
-- for filtering and organization purposes
-- Replaces permissive USING(true) with explicit auth check

CREATE POLICY "select_segments"
  ON segments
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "select_segments" ON segments IS
  'SELECT requires soft-delete filter AND authenticated user (reference data) - replaces USING(true)';

-- ----------------------------------------------------------------------------
-- DELETE: Admin-only segment deletion
-- ----------------------------------------------------------------------------
-- Recreate the admin-only DELETE policy (was reverted to permissive by a later migration)

CREATE POLICY "segments_delete_admin"
  ON segments
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND private.is_admin_or_manager()
  );

COMMENT ON POLICY "segments_delete_admin" ON segments IS
  'DELETE requires soft-delete filter AND admin/manager privilege';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify security
-- ============================================================================

-- 1. Verify exactly 4 policies exist (1 SELECT + 3 CRUD admin, no service_role needed)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'segments'
    AND schemaname = 'public';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 RLS policies on segments, found %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: segments has % policies', policy_count;
END $$;

-- 2. Verify all policies have proper names and admin restrictions
-- Expected output:
--   segments_delete_admin | DELETE
--   segments_insert_privileged | INSERT
--   select_segments | SELECT
--   segments_update_privileged | UPDATE
--
-- Run manually:
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'segments'
--   AND schemaname = 'public'
-- ORDER BY cmd, policyname;

-- 3. Verify SELECT policy uses auth.uid() check (not USING(true))
-- Run manually:
-- SELECT policyname, qual::text
-- FROM pg_policies
-- WHERE tablename = 'segments'
--   AND schemaname = 'public'
--   AND cmd = 'SELECT';
-- Expected: Should contain "auth.uid() IS NOT NULL" NOT "deleted_at IS NULL" alone

-- 4. Verify INSERT/UPDATE/DELETE policies require admin (from previous migration)
-- Run manually:
-- SELECT policyname, qual::text, with_check::text
-- FROM pg_policies
-- WHERE tablename = 'segments'
--   AND schemaname = 'public'
--   AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
-- Expected: Should contain "is_admin()" or "is_manager_or_admin()" NOT "true"
