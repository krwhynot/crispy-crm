-- =====================================================
-- Setup Daily Digest Notification System
-- =====================================================
--
-- Purpose: Create PostgreSQL function for daily digest and configure pg_cron
-- Features: Aggregates tasks, opportunities, and activities per user
--
-- Scheduling: pg_cron at 7 AM UTC daily (0 7 * * *)
-- Note: pg_cron setup is manual in Supabase Cloud dashboard (cannot be done via migration)
--
-- =====================================================

-- Create function to generate daily digests
CREATE OR REPLACE FUNCTION generate_daily_digest()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  digest_count INT := 0;
  notification_count INT := 0;
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  tasks_due_today INT;
  tasks_overdue INT;
  opportunities_updated INT;
  activities_yesterday INT;
  message_parts TEXT[];
  digest_message TEXT;
BEGIN
  -- Log function execution
  RAISE NOTICE 'Starting daily digest generation at %', NOW();

  -- Loop through active sales users
  FOR user_record IN
    SELECT id, user_id, first_name, last_name, email
    FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
  LOOP
    digest_count := digest_count + 1;

    -- Count tasks due today
    SELECT COUNT(*) INTO tasks_due_today
    FROM tasks
    WHERE sales_id = user_record.id
      AND due_date = today_date
      AND completed = false;

    -- Count overdue tasks
    SELECT COUNT(*) INTO tasks_overdue
    FROM tasks
    WHERE sales_id = user_record.id
      AND due_date < today_date
      AND completed = false;

    -- Count opportunities updated in last 24h
    SELECT COUNT(*) INTO opportunities_updated
    FROM opportunities
    WHERE sales_id = user_record.id
      AND updated_at >= yesterday_date
      AND updated_at < today_date;

    -- Count activities logged yesterday
    SELECT COUNT(*) INTO activities_yesterday
    FROM activities
    WHERE sales_id = user_record.id
      AND date >= yesterday_date
      AND date < today_date;

    -- Only create notification if there's something to report
    IF tasks_due_today > 0 OR tasks_overdue > 0 OR opportunities_updated > 0 THEN
      -- Build message parts
      message_parts := ARRAY[]::TEXT[];

      IF tasks_due_today > 0 THEN
        message_parts := array_append(message_parts,
          tasks_due_today || ' task' || CASE WHEN tasks_due_today = 1 THEN '' ELSE 's' END || ' due today');
      END IF;

      IF tasks_overdue > 0 THEN
        message_parts := array_append(message_parts,
          tasks_overdue || ' overdue task' || CASE WHEN tasks_overdue = 1 THEN '' ELSE 's' END);
      END IF;

      IF opportunities_updated > 0 THEN
        message_parts := array_append(message_parts,
          opportunities_updated || ' opportunity update' || CASE WHEN opportunities_updated = 1 THEN '' ELSE 's' END);
      END IF;

      digest_message := 'Daily Digest: ' || array_to_string(message_parts, ', ');

      -- Create notification with metadata
      INSERT INTO notifications (user_id, type, message, entity_type, metadata)
      VALUES (
        user_record.user_id,
        'daily_digest',
        digest_message,
        'digest',
        jsonb_build_object(
          'tasksDueToday', tasks_due_today,
          'tasksOverdue', tasks_overdue,
          'opportunitiesUpdated', opportunities_updated,
          'activitiesYesterday', activities_yesterday,
          'digestDate', today_date
        )
      );

      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % digests, created % notifications', digest_count, notification_count;

  -- Return summary
  RETURN json_build_object(
    'success', true,
    'digestsGenerated', digest_count,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION generate_daily_digest() IS 'Generates daily digest notifications for each sales user. Designed to be called daily by pg_cron at 7 AM UTC.';

-- Grant execution to service_role (for Edge Functions to call)
GRANT EXECUTE ON FUNCTION generate_daily_digest() TO service_role;

-- =====================================================
-- pg_cron Setup Instructions
-- =====================================================
--
-- To enable daily execution at 7 AM UTC, run the following in Supabase SQL Editor:
--
-- 1. Enable pg_cron extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule daily execution at 7 AM UTC:
--    SELECT cron.schedule(
--      'daily-digest-7am',
--      '0 7 * * *',  -- Run at 7:00 AM UTC every day
--      $$ SELECT generate_daily_digest(); $$
--    );
--
-- 3. Verify schedule:
--    SELECT * FROM cron.job WHERE jobname LIKE '%digest%';
--
-- 4. To manually trigger (for testing):
--    SELECT generate_daily_digest();
--
-- 5. To unschedule:
--    SELECT cron.unschedule('daily-digest-7am');
--
-- Timezone Conversion Examples:
-- - 7 AM UTC = 2 AM EST / 3 AM EDT
-- - 7 AM UTC = 11 PM PST (previous day) / 12 AM PDT
-- - To run at 7 AM local time, adjust cron expression accordingly
--
-- =====================================================
-- End of Migration
-- =====================================================
