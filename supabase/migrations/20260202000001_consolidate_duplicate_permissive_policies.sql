-- ============================================================================
-- Migration: Consolidate Duplicate Permissive Policies (SECURITY FIX)
-- ============================================================================
-- PostgreSQL OR's all permissive policies for the same role+command.
-- When a legacy policy has a weak USING clause (just `deleted_at IS NULL`),
-- it bypasses the stricter USING in the newer policy. This migration removes
-- the legacy duplicates and adjusts the kept policy where needed.
--
-- Pre-flight audit: ZERO restrictive policies exist in the public schema.
-- Dropping permissive duplicates cannot change AND/OR semantics.
--
-- Targets:
--   1. opportunities UPDATE: drop weak legacy (USING: deleted_at IS NULL only)
--   2. organizations UPDATE: drop weak legacy (USING: deleted_at IS NULL only)
--   3. organizations DELETE: drop legacy + ALTER kept to restore manager access
--   4. migration_history SELECT: drop redundant auth.role() check
-- ============================================================================

-- ============================================================================
-- 1. opportunities UPDATE: DROP weak legacy policy
-- ============================================================================
-- Kept: "opportunities_update_dual_ownership" (full role-based USING + WITH CHECK)
-- Dropped: "update_opportunities_dual_ownership" (USING: just deleted_at IS NULL)
--
-- The kept policy's can_access_by_role() is a superset of the dropped policy's
-- is_owner_or_privileged(). No access narrowing.
-- ============================================================================

DROP POLICY IF EXISTS "update_opportunities_dual_ownership" ON opportunities;

-- ============================================================================
-- 2. organizations UPDATE: DROP weak legacy policy
-- ============================================================================
-- Kept: "organizations_update_role_based" (full role-based USING + WITH CHECK)
-- Dropped: "organizations_update_owner_or_privileged" (USING: just deleted_at IS NULL)
--
-- Kept policy's can_access_by_role(sales_id, created_by) covers both
-- ownership paths from the dropped policy.
-- ============================================================================

DROP POLICY IF EXISTS "organizations_update_owner_or_privileged" ON organizations;

-- ============================================================================
-- 3. organizations DELETE: DROP all legacy + CREATE consolidated policy
-- ============================================================================
-- Legacy "delete_organizations":
--   USING (is_admin() OR is_manager_or_admin() OR created_by = current_sales_id())
--   Note: NO deleted_at IS NULL guard!
--
-- Legacy "organizations_delete_owner_or_admin":
--   USING (deleted_at IS NULL AND (created_by = current_sales_id() OR is_admin()))
--   Note: Missing manager access!
--
-- Fix: Drop BOTH legacy policies, then CREATE a single consolidated policy
-- with manager access and deleted_at IS NULL guard.
-- Uses schema-qualified function names for search_path safety.
--
-- Note: Uses DROP + CREATE (not ALTER) for cloud compatibility -- the kept
-- policy may not exist on remote due to schema drift from phantom migrations.
-- ============================================================================

DROP POLICY IF EXISTS "delete_organizations" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_owner_or_admin" ON organizations;

CREATE POLICY "organizations_delete_owner_or_admin" ON organizations
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (created_by = (SELECT public.current_sales_id()))
      OR (SELECT private.is_admin_or_manager())
    )
  );

-- ============================================================================
-- 4. migration_history SELECT: DROP redundant policy
-- ============================================================================
-- Kept: "authenticated_select_migration_history" (auth.uid() IS NOT NULL)
-- Dropped: "Enable read for authenticated users on migration_history"
--          (auth.role() = 'authenticated')
-- Functionally identical; keeping the uid-based check.
-- ============================================================================

DROP POLICY IF EXISTS "Enable read for authenticated users on migration_history" ON migration_history;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  -- Check no remaining duplicate permissive policies on target tables
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT tablename, cmd, count(*) as cnt
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND tablename IN ('opportunities', 'organizations', 'migration_history')
    GROUP BY tablename, cmd
    HAVING count(*) > 1
  ) dupes;

  IF dup_count = 0 THEN
    RAISE NOTICE 'Policy consolidation verified: no remaining duplicates on target tables.';
  ELSE
    RAISE WARNING '% duplicate policy group(s) still remain on target tables.', dup_count;
  END IF;
END $$;
