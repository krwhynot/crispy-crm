-- Migration: Drop deprecated tasks table and related artifacts
-- Purpose: Final cleanup after migrating all dependencies to activities table
-- Prerequisites:
--   - 20260210000001_fix_exec_sql_security.sql (exec_sql security fixes)
--   - 20260210000002_fix_digest_functions_use_activities.sql (digest functions use activities)
--   - 20260210000003_fix_views_use_activities.sql (views use activities)
--
-- Original deprecation: 2026-01-21 (migration 20260121000005_deprecate_tasks_table.sql)
-- Rollback deadline: 2026-03-21 (we are within the window)
--
-- IMPORTANT: Using plain DROP (RESTRICT is default) - will fail if any dependencies remain

-- ============================================================================
-- PRE-FLIGHT CHECK: Verify no external views reference tasks_deprecated
-- ============================================================================
-- Note: FK from tutorial_progress.created_task_id is expected and will be dropped in Step 1
DO $$
DECLARE
  view_count integer;
BEGIN
  -- Check for views that reference tasks_deprecated in their definition
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition ILIKE '%tasks_deprecated%';

  IF view_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop tasks_deprecated: % view(s) still reference it. Run: SELECT viewname FROM pg_views WHERE definition ILIKE ''%%tasks_deprecated%%'';', view_count;
  END IF;

  RAISE NOTICE 'Pre-flight check passed: No views reference tasks_deprecated';
END $$;

-- ============================================================================
-- STEP 1: Drop foreign key constraints from other tables
-- ============================================================================
-- tutorial_progress.created_task_id references tasks_deprecated
-- This FK has 0 records using it (verified during audit)
ALTER TABLE IF EXISTS tutorial_progress
  DROP CONSTRAINT IF EXISTS tutorial_progress_created_task_id_fkey;

-- Also drop the column since it's no longer needed
ALTER TABLE IF EXISTS tutorial_progress
  DROP COLUMN IF EXISTS created_task_id;

-- ============================================================================
-- STEP 2: Drop the deprecated tasks access notice function
-- ============================================================================
DROP FUNCTION IF EXISTS deprecated_tasks_access_notice();

-- ============================================================================
-- STEP 3: Drop the task ID mapping table (used for migration rollback)
-- ============================================================================
-- This table mapped old task IDs to new activity IDs during migration
DROP TABLE IF EXISTS task_id_mapping;

-- ============================================================================
-- STEP 4: Drop the deprecated tasks table
-- ============================================================================
-- Pre-flight check already verified no external views/FKs reference this table
-- Using CASCADE to clean up internal dependencies (indexes, policies, triggers)
-- that belong to the table itself
DROP TABLE IF EXISTS tasks_deprecated CASCADE;

-- ============================================================================
-- STEP 5: Drop test_user_metadata table (0 rows, no code references)
-- ============================================================================
DROP TABLE IF EXISTS test_user_metadata;

-- ============================================================================
-- STEP 6: Clean up orphaned indexes (if any remain)
-- ============================================================================
-- These indexes were on the tasks table and may have been renamed
DROP INDEX IF EXISTS idx_tasks_contact_id;
DROP INDEX IF EXISTS idx_tasks_opportunity_id;
DROP INDEX IF EXISTS idx_tasks_organization_id;
DROP INDEX IF EXISTS idx_tasks_sales_id;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS tasks_deprecated_id_seq;

-- ============================================================================
-- STEP 7: Clean up orphaned sequences
-- ============================================================================
DROP SEQUENCE IF EXISTS tasks_deprecated_id_seq;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  -- Verify tables are gone
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasks_deprecated') THEN
    RAISE EXCEPTION 'tasks_deprecated table still exists!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'task_id_mapping') THEN
    RAISE EXCEPTION 'task_id_mapping table still exists!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'test_user_metadata') THEN
    RAISE EXCEPTION 'test_user_metadata table still exists!';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CLEANUP COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Dropped: tasks_deprecated, task_id_mapping, test_user_metadata';
  RAISE NOTICE 'Dropped: deprecated_tasks_access_notice()';
  RAISE NOTICE 'Task data now lives in: activities (activity_type=task)';
  RAISE NOTICE '===========================================';
END $$;
