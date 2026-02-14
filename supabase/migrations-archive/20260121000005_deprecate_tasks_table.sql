/**
 * Phase 7: Deprecate Tasks Table
 *
 * This migration renames the old tasks table to tasks_deprecated and adds
 * documentation to indicate it should be removed after the transition period.
 *
 * IMPORTANT: Keep this table until 2026-03-21 (60 days) for rollback capability.
 *
 * Rollback Process:
 * 1. Rename tasks_deprecated back to tasks
 * 2. Drop task-specific columns from activities
 * 3. Restore original entity_timeline view (with UNION ALL)
 * 4. Git revert handler changes
 */

BEGIN;

-- ============================================================================
-- STEP 1: Rename tasks table to tasks_deprecated
-- ============================================================================
-- Prefix with underscore to move it to bottom of table list in tools

ALTER TABLE IF EXISTS tasks RENAME TO tasks_deprecated;

COMMENT ON TABLE tasks_deprecated IS
  'DEPRECATED (2026-01-21): Migrated to activities table (activity_type=task).
   DO NOT USE for new development.
   KEEP until 2026-03-21 for rollback capability.
   See migration 20260121000002_migrate_tasks_to_activities.sql for details.';

-- ============================================================================
-- STEP 2: Rename related sequences and indexes for clarity
-- ============================================================================

ALTER SEQUENCE IF EXISTS tasks_id_seq RENAME TO tasks_deprecated_id_seq;

-- Note: Indexes retain their original names for FK compatibility
-- They reference the renamed table automatically

-- ============================================================================
-- STEP 3: Disable RLS on deprecated table (optional optimization)
-- ============================================================================
-- Since this table is deprecated, we can simplify security

-- Keep RLS enabled but simplify policies for any legacy queries
DROP POLICY IF EXISTS "tasks_select_all_authenticated" ON tasks_deprecated;
DROP POLICY IF EXISTS "tasks_update_own_or_manager" ON tasks_deprecated;

-- Simple read-only access for any authenticated user
CREATE POLICY "deprecated_read_only" ON tasks_deprecated
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "deprecated_read_only" ON tasks_deprecated IS
  'DEPRECATED TABLE: Read-only access for migration verification and audits.
   All CRUD operations should use activities table instead.';

-- ============================================================================
-- STEP 4: Drop write policies to prevent accidental writes
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_insert_tasks" ON tasks_deprecated;
DROP POLICY IF EXISTS "authenticated_delete_tasks" ON tasks_deprecated;

-- Add a restrictive INSERT policy (fails all inserts)
CREATE POLICY "deprecated_no_insert" ON tasks_deprecated
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Add a restrictive UPDATE policy (fails all updates)
CREATE POLICY "deprecated_no_update" ON tasks_deprecated
  FOR UPDATE
  TO authenticated
  USING (false);

COMMENT ON POLICY "deprecated_no_insert" ON tasks_deprecated IS
  'DEPRECATED TABLE: Inserts blocked. Use activities table with activity_type=task.';

COMMENT ON POLICY "deprecated_no_update" ON tasks_deprecated IS
  'DEPRECATED TABLE: Updates blocked. Use activities table with activity_type=task.';

-- ============================================================================
-- STEP 5: Create reminder function for cleanup
-- ============================================================================
-- This function logs a notice when the deprecated table is accessed

CREATE OR REPLACE FUNCTION deprecated_tasks_access_notice()
RETURNS trigger AS $$
BEGIN
  RAISE NOTICE 'DEPRECATED: tasks_deprecated table accessed. Use activities table with activity_type=task instead.';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We don't attach the trigger to avoid breaking any remaining code
-- It's here for optional debugging during transition

-- ============================================================================
-- STEP 6: Document removal date
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== DEPRECATION NOTICE ===';
  RAISE NOTICE 'tasks table renamed to tasks_deprecated';
  RAISE NOTICE 'All task operations should now use activities table';
  RAISE NOTICE 'Scheduled for removal: 2026-03-21';
  RAISE NOTICE '===========================';
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
--
-- -- Check table was renamed:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'tasks%';
--
-- -- Check policies are correct:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks_deprecated';
--
-- -- Verify data still accessible for audits:
-- SELECT COUNT(*) FROM tasks_deprecated WHERE deleted_at IS NULL;
