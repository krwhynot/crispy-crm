-- ============================================================================
-- ENHANCEMENT: Additional RLS Security and Performance Indexes
-- ============================================================================
-- Builds on migration 20251127054700_fix_critical_rls_security_tasks.sql
--
-- Additional Improvements:
-- 1. Protect activities DELETE with ownership/admin check
-- 2. Add deleted_at column to tasks for soft-delete support
-- 3. Add compound indexes for common query patterns
-- ============================================================================

-- ============================================================================
-- STEP 1: Add soft-delete to tasks (consistency with other tables)
-- ============================================================================

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN tasks.deleted_at IS
    'Soft-delete timestamp. NULL = active record. Per Engineering Constitution soft-delete pattern.';

-- Index for filtering active records
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at
    ON tasks(deleted_at)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Compound index for common query pattern (my active incomplete tasks)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_sales_id_active_incomplete
    ON tasks(sales_id)
    WHERE deleted_at IS NULL AND completed = false;

-- ============================================================================
-- STEP 3: FIX ACTIVITIES DELETE - Protect Audit Trail
-- ============================================================================
-- Activities are team-shared for visibility, but DELETE should be restricted
-- to prevent accidental/malicious destruction of audit trail

DROP POLICY IF EXISTS authenticated_delete_activities ON activities;

-- DELETE: Only activity creator OR admin can delete
-- This protects the audit trail while allowing cleanup by responsible parties
CREATE POLICY activities_delete_policy ON activities
    FOR DELETE
    TO authenticated
    USING (
        -- Creator can delete their own activities
        created_by = public.current_sales_id()
        OR
        -- Admins can delete any activity
        public.is_admin()
    );

COMMENT ON POLICY activities_delete_policy ON activities IS
    'Protects audit trail: Only creator or admin can delete activities.';

-- ============================================================================
-- STEP 4: Add index on activities.created_by for DELETE RLS performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_created_by
    ON activities(created_by)
    WHERE created_by IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
--
-- -- Check activities DELETE policy
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'activities' AND cmd = 'DELETE';
--
-- -- Check tasks has deleted_at
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'tasks' AND column_name = 'deleted_at';
--
-- -- Check indexes exist
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('tasks', 'activities')
-- AND indexname LIKE 'idx_%';
-- ============================================================================
