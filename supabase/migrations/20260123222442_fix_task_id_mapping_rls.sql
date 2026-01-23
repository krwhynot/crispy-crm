-- ============================================================
-- SEC-1: Restrict task_id_mapping access to admin/service_role
-- ============================================================
-- This table is a system migration table (old task IDs -> new activity IDs).
-- It contains internal migration metadata that should NOT be accessible to
-- regular authenticated users.
--
-- Security model:
-- - Service role: Full access (bypasses RLS by default)
-- - Admin users: SELECT only (for debugging migration issues)
-- - Regular authenticated users: NO ACCESS
--
-- Previous policy "task_id_mapping_select_policy" used USING(true) which
-- allowed any authenticated user to read migration metadata. This is a
-- security vulnerability - migration internals should not be exposed.
--
-- Rollback:
--   DROP POLICY IF EXISTS "task_id_mapping_admin_select" ON task_id_mapping;
--   CREATE POLICY "task_id_mapping_select_policy" ON task_id_mapping
--     FOR SELECT TO authenticated USING (true);
-- ============================================================

BEGIN;

-- Step 1: Drop the permissive policy
DROP POLICY IF EXISTS "task_id_mapping_select_policy" ON task_id_mapping;

-- Step 2: Create admin-only SELECT policy
-- Uses private.is_admin_or_manager() for role check consistency with other policies
CREATE POLICY "task_id_mapping_admin_select"
ON task_id_mapping FOR SELECT
TO authenticated
USING (
    private.is_admin_or_manager()
);

COMMENT ON POLICY "task_id_mapping_admin_select" ON task_id_mapping IS
    'System migration table - SELECT restricted to admin/manager roles only (SEC-1)';

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================
--
-- 1. Verify the policy exists and is restrictive:
--    SELECT policyname, qual::text as using_clause
--    FROM pg_policies
--    WHERE tablename = 'task_id_mapping';
--    Expected: task_id_mapping_admin_select with private.is_admin_or_manager()
--
-- 2. Test as regular user (should fail):
--    SET ROLE authenticated;
--    SELECT * FROM task_id_mapping LIMIT 1;
--    Expected: 0 rows (unless user is admin/manager)
--
-- ============================================================
