-- Fix notifications cleanup to use soft delete instead of hard delete
-- Engineering Constitution: soft-deletes rule - "Use deleted_at timestamp, never hard delete"
-- Audit finding: cleanup_old_notifications() function performs hard DELETE

-- Replace function to use soft delete
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- SOFT DELETE notifications older than 30 days (Constitution fix)
  -- OLD: DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
  -- NEW: Use soft delete with deleted_at timestamp
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;  -- Only soft-delete if not already deleted

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger remains the same (already exists from previous migration)
-- CREATE TRIGGER trigger_cleanup_old_notifications
--   AFTER INSERT ON notifications
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION cleanup_old_notifications();
