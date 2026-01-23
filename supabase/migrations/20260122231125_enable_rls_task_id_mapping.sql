-- ============================================================
-- Enable RLS on task_id_mapping table
-- ============================================================
-- This table is a system migration table (old task IDs → new activity IDs)
-- with no user_id column. It's read-only for authenticated users.
--
-- Security model:
-- - Authenticated users: SELECT only (for ID lookups during transition)
-- - Service role: Full access (bypasses RLS by default)
-- - No INSERT/UPDATE/DELETE for authenticated users
--
-- Rollback: ALTER TABLE task_id_mapping DISABLE ROW LEVEL SECURITY;
--           DROP POLICY IF EXISTS task_id_mapping_select_policy ON task_id_mapping;
-- ============================================================

-- Step 1: Enable RLS
ALTER TABLE public.task_id_mapping ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow authenticated users to read mappings (for old→new ID lookups)
-- Note: No user_id column exists, so we allow all authenticated reads.
-- This is appropriate because the data is non-sensitive migration metadata.
CREATE POLICY "task_id_mapping_select_policy"
ON public.task_id_mapping
FOR SELECT
TO authenticated
USING (true);

-- Step 3: No write policies for authenticated users
-- Service role bypasses RLS and handles all writes (migrations only)
-- This is more secure than explicit WITH CHECK policies

-- ============================================================
-- Verification query (run after applying):
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'task_id_mapping';
-- Expected: rowsecurity = true
-- ============================================================
