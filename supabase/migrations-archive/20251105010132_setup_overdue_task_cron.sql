-- =====================================================
-- Setup Overdue Task Notification System
-- Epic 3: In-App Notifications (P4-E3-S1-T2)
-- =====================================================
--
-- Purpose: Create PostgreSQL function to check for overdue tasks and create notifications
-- Features: Queries overdue tasks, creates notifications, prevents duplicates
--
-- Scheduling: See docs/supabase/overdue-tasks-cron.md for pg_cron setup instructions
-- Note: pg_cron setup is manual in Supabase Cloud dashboard (cannot be done via migration)
--
-- =====================================================

-- Create function to check overdue tasks and create notifications
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  notification_count INT := 0;
  days_overdue INT;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Log function execution
  RAISE NOTICE 'Starting overdue tasks check at %', NOW();

  -- Loop through overdue tasks that haven't been notified
  FOR task_record IN
    SELECT t.id, t.title, t.due_date, t.sales_id, s.user_id
    FROM tasks t
    INNER JOIN sales s ON t.sales_id = s.id
    WHERE t.due_date < today_date
      AND t.completed = false
      AND t.overdue_notified_at IS NULL
      AND t.sales_id IS NOT NULL
  LOOP
    -- Calculate days overdue
    days_overdue := today_date - task_record.due_date;

    -- Create notification
    INSERT INTO notifications (user_id, type, message, entity_type, entity_id)
    VALUES (
      task_record.user_id,
      'task_overdue',
      'Task "' || task_record.title || '" is ' || days_overdue || ' day' ||
        CASE WHEN days_overdue = 1 THEN '' ELSE 's' END || ' overdue',
      'task',
      task_record.id
    );

    -- Mark task as notified
    UPDATE tasks
    SET overdue_notified_at = NOW()
    WHERE id = task_record.id;

    notification_count := notification_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % overdue task notifications', notification_count;

  -- Return summary
  RETURN json_build_object(
    'success', true,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION check_overdue_tasks() IS 'Checks for overdue tasks and creates notifications. Designed to be called daily by pg_cron or Edge Function.';

-- Grant execution to service_role (for Edge Functions to call)
GRANT EXECUTE ON FUNCTION check_overdue_tasks() TO service_role;

-- =====================================================
-- pg_cron Setup Instructions
-- =====================================================
--
-- To enable daily execution at 9 AM, run the following in Supabase SQL Editor:
--
-- 1. Enable pg_cron extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule daily execution at 9 AM:
--    SELECT cron.schedule(
--      'check-overdue-tasks-daily',
--      '0 9 * * *',  -- Run at 9:00 AM every day
--      $$ SELECT check_overdue_tasks(); $$
--    );
--
-- 3. Verify schedule:
--    SELECT * FROM cron.job;
--
-- 4. To manually trigger (for testing):
--    SELECT check_overdue_tasks();
--
-- Note: pg_cron uses server time (UTC in Supabase Cloud).
-- To schedule for 9 AM in a different timezone, adjust the cron expression.
--
-- =====================================================
-- End of Migration
-- =====================================================
