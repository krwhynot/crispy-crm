-- =====================================================
-- Notifications Table Migration
-- Epic 3: In-App Notifications (P4-E3-S1-T1)
-- =====================================================
--
-- Purpose: Create notifications system for in-app alerts
-- Features: User notifications, real-time updates, auto-cleanup
--
-- =====================================================

-- Create notifications table
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_overdue', 'task_assigned', 'mention', 'opportunity_won', 'opportunity_lost', 'system')),
  message TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('task', 'opportunity', 'contact', 'organization', 'product', NULL)),
  entity_id BIGINT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for in-app alerts';
COMMENT ON COLUMN notifications.type IS 'Notification type: task_overdue, task_assigned, mention, opportunity_won, opportunity_lost, system';
COMMENT ON COLUMN notifications.entity_type IS 'Related entity type (task, opportunity, contact, organization, product) or NULL for system notifications';
COMMENT ON COLUMN notifications.entity_id IS 'ID of related entity or NULL for system notifications';

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index on user_id for fast user lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Index on created_at for time-based queries and cleanup
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Composite index for filtering unread notifications per user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT only their own notifications
CREATE POLICY authenticated_select_own_notifications ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: System/service role can INSERT notifications for any user
-- (Edge Functions will use service role to create notifications)
CREATE POLICY service_insert_notifications ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Users can UPDATE only their own notifications (mark as read)
CREATE POLICY authenticated_update_own_notifications ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Only service role can DELETE (users cannot delete their own notifications)
-- Cleanup is handled by auto-delete trigger
CREATE POLICY service_delete_old_notifications ON notifications
  FOR DELETE
  TO service_role
  USING (true);

-- =====================================================
-- Auto-Delete Trigger for Old Notifications
-- =====================================================

-- Function to delete notifications older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Run cleanup on each insert (keeps table clean without requiring pg_cron)
-- This is lightweight as it only runs when new notifications are created
CREATE TRIGGER trigger_cleanup_old_notifications
  AFTER INSERT ON notifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_notifications();

COMMENT ON FUNCTION cleanup_old_notifications() IS 'Automatically deletes notifications older than 30 days';
COMMENT ON TRIGGER trigger_cleanup_old_notifications ON notifications IS 'Runs cleanup after each notification insert';

-- =====================================================
-- Permissions (Layer 1 of Two-Layer Security)
-- =====================================================

-- Grant SELECT, INSERT, UPDATE to authenticated users
-- (RLS policies will further restrict what each user can access)
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- Grant USAGE on the ID sequence
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;

-- Service role already has full access, no additional grants needed

-- =====================================================
-- End of Migration
-- =====================================================
