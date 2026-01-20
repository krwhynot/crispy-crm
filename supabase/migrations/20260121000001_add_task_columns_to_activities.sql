/**
 * Phase 1: Add Task Columns to Activities Table
 *
 * This migration adds task-specific columns to the activities table to support
 * the Single Table Inheritance (STI) pattern where tasks are stored alongside
 * activities in a unified table.
 *
 * STI Benefits:
 * - Unified timeline queries (no UNION ALL)
 * - Simpler data provider (one table, filtered views)
 * - Task completion naturally becomes a logged activity
 * - Industry-standard CRM pattern (Salesforce, HubSpot)
 *
 * Migration is NON-BREAKING: All new columns are nullable, allowing existing
 * activities code to continue working unchanged.
 */

-- NOTE: No BEGIN/COMMIT block - PostgreSQL requires enum additions to be
-- in separate transactions from statements that use the new values.

-- ============================================================================
-- STEP 1: Extend activity_type enum to include 'task'
-- ============================================================================
-- Adding 'task' to distinguish planned items from logged interactions

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'task';

-- ============================================================================
-- STEP 2: Extend interaction_type enum for task type mapping
-- ============================================================================
-- Add values needed for mapping task types that don't exist in interaction_type:
-- - 'administrative' for general task work (maps from 'Other' task type)
-- - 'other' as fallback (maps from task types without direct equivalent)

ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'administrative';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'other';

-- ============================================================================
-- STEP 3: Add task-specific columns to activities table
-- ============================================================================
-- These columns are nullable and only populated when activity_type = 'task'

-- Due date: The target completion date for the task
ALTER TABLE activities ADD COLUMN IF NOT EXISTS due_date date;
COMMENT ON COLUMN activities.due_date IS
  'Target completion date for tasks (NULL for non-task activities)';

-- Reminder date: Optional reminder before due date
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reminder_date date;
COMMENT ON COLUMN activities.reminder_date IS
  'Optional reminder date for tasks (NULL for non-task activities)';

-- Completed flag: Task completion status
ALTER TABLE activities ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
COMMENT ON COLUMN activities.completed IS
  'Task completion status (false for non-task activities)';

-- Completed timestamp: When the task was marked done
ALTER TABLE activities ADD COLUMN IF NOT EXISTS completed_at timestamptz;
COMMENT ON COLUMN activities.completed_at IS
  'Timestamp when task was completed (NULL for incomplete or non-task activities)';

-- Priority: Task urgency level
ALTER TABLE activities ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium';
COMMENT ON COLUMN activities.priority IS
  'Task priority level: low, medium, high, critical (medium for non-task activities)';

-- Sales assignee: The sales rep responsible for the task
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sales_id bigint REFERENCES sales(id);
COMMENT ON COLUMN activities.sales_id IS
  'Sales rep assigned to this task (NULL for non-task activities)';

-- Snooze until: Hide task from active views until this date
ALTER TABLE activities ADD COLUMN IF NOT EXISTS snooze_until timestamptz;
COMMENT ON COLUMN activities.snooze_until IS
  'Snooze timestamp - task hidden until this date passes (NULL = active)';

-- Overdue notification tracking: Prevents duplicate notifications
ALTER TABLE activities ADD COLUMN IF NOT EXISTS overdue_notified_at timestamptz;
COMMENT ON COLUMN activities.overdue_notified_at IS
  'When overdue notification was sent (prevents duplicate notifications)';

-- Related task ID: Self-reference for activities created as task follow-ups
-- This links a logged activity back to the task it was created from
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_task_id bigint;
COMMENT ON COLUMN activities.related_task_id IS
  'Links to the task (activity) that spawned this logged activity (for follow-up tracking)';

-- ============================================================================
-- STEP 4: Add performance indexes for task queries
-- ============================================================================

-- Index for task due date queries (task lists, overdue detection)
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date)
  WHERE activity_type = 'task' AND deleted_at IS NULL;

-- Index for task assignee queries (my tasks view)
CREATE INDEX IF NOT EXISTS idx_activities_sales_id ON activities(sales_id)
  WHERE activity_type = 'task' AND deleted_at IS NULL;

-- Composite index for completed/incomplete task filtering
CREATE INDEX IF NOT EXISTS idx_activities_task_completed ON activities(completed, due_date)
  WHERE activity_type = 'task' AND deleted_at IS NULL;

-- Index for snooze filtering (hide snoozed tasks)
CREATE INDEX IF NOT EXISTS idx_activities_snooze_until ON activities(snooze_until)
  WHERE activity_type = 'task' AND snooze_until IS NOT NULL AND deleted_at IS NULL;

-- Index for overdue notification queries (find unnotified overdue tasks)
CREATE INDEX IF NOT EXISTS idx_activities_overdue_notification ON activities(due_date, overdue_notified_at)
  WHERE activity_type = 'task' AND completed = false AND due_date IS NOT NULL AND deleted_at IS NULL;

-- Index for related_task_id lookups (finding activities spawned from tasks)
CREATE INDEX IF NOT EXISTS idx_activities_related_task_id ON activities(related_task_id)
  WHERE related_task_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- STEP 5: Add constraint for task-required fields
-- ============================================================================
-- Tasks MUST have a due_date and sales_id (assignee)
-- This ensures data integrity for the STI pattern

ALTER TABLE activities ADD CONSTRAINT check_task_required_fields
  CHECK (
    activity_type != 'task' OR
    (due_date IS NOT NULL AND sales_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT check_task_required_fields ON activities IS
  'Ensures tasks have required fields: due_date and sales_id (assignee)';

-- ============================================================================
-- STEP 6: Update check_interaction_has_opportunity constraint
-- ============================================================================
-- The existing constraint requires opportunity_id for interactions.
-- We need to update it to allow tasks (which may not have opportunity_id)

-- First, drop the old constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS check_interaction_has_opportunity;

-- Recreate with task exemption
ALTER TABLE activities ADD CONSTRAINT check_interaction_has_opportunity
  CHECK (
    activity_type = 'task'
    OR (activity_type = 'interaction' AND opportunity_id IS NOT NULL)
    OR activity_type = 'engagement'
  );

COMMENT ON CONSTRAINT check_interaction_has_opportunity ON activities IS
  'Interactions require opportunity_id. Tasks and engagements are exempt.';

-- ============================================================================
-- STEP 7: Update check_has_contact_or_org constraint for tasks
-- ============================================================================
-- Tasks can exist without contact/organization (pure opportunity tasks)
-- So we need to exempt tasks from this constraint

-- First, drop the old constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS check_has_contact_or_org;

-- Recreate with task exemption (tasks may only be linked to opportunity)
ALTER TABLE activities ADD CONSTRAINT check_has_contact_or_org
  CHECK (
    activity_type = 'task'
    OR contact_id IS NOT NULL
    OR organization_id IS NOT NULL
  );

COMMENT ON CONSTRAINT check_has_contact_or_org ON activities IS
  'Non-task activities require at least one of contact_id or organization_id. Tasks are exempt (may only have opportunity_id).';

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration)
-- ============================================================================
-- Uncomment and run to verify migration success:
--
-- -- Check new columns exist:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'activities'
--   AND column_name IN ('due_date', 'reminder_date', 'completed', 'completed_at',
--                       'priority', 'sales_id', 'snooze_until', 'overdue_notified_at', 'related_task_id');
--
-- -- Check enum values:
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'activity_type'::regtype
-- ORDER BY enumsortorder;
--
-- -- Check indexes:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'activities' AND indexname LIKE 'idx_activities_%';
--
-- -- Check constraints:
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'activities'::regclass AND contype = 'c';
