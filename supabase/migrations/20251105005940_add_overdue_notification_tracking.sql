-- =====================================================
-- Add Overdue Notification Tracking to Tasks
-- Epic 3: In-App Notifications (P4-E3-S1-T2)
-- =====================================================
--
-- Purpose: Track when overdue task notifications are sent to prevent duplicates
-- Features: Timestamp column, index for efficient queries
--
-- =====================================================

-- Add overdue notification tracking column
ALTER TABLE tasks ADD COLUMN overdue_notified_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN tasks.overdue_notified_at IS 'Timestamp when overdue notification was sent for this task (prevents duplicate notifications)';

-- Create index for efficient queries of unnotified overdue tasks
-- This index will be used by the check_overdue_tasks Edge Function
CREATE INDEX idx_tasks_overdue_notification
  ON tasks(due_date, overdue_notified_at)
  WHERE completed = false AND due_date IS NOT NULL;

COMMENT ON INDEX idx_tasks_overdue_notification IS 'Index for finding tasks that need overdue notifications (not completed, has due_date, not yet notified)';

-- =====================================================
-- End of Migration
-- =====================================================
