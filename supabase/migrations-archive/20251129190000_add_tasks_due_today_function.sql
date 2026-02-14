-- =====================================================
-- Tasks Due Today Query Function
-- =====================================================
--
-- Purpose: Add function to retrieve tasks due today for a specific user
--
-- This complements the existing digest functions:
--   - get_overdue_tasks_for_user (tasks past due date)
--   - get_stale_deals_for_user (deals exceeding stage thresholds)
--   - get_user_digest_summary (combined counts and details)
--
-- The summary function already counts tasks_due_today, but the email
-- generator needs the actual task list with details.
--
-- =====================================================

-- =====================================================
-- Type: Today Task Record (for list view)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'today_task_record') THEN
    CREATE TYPE today_task_record AS (
      id BIGINT,
      title TEXT,
      description TEXT,
      priority TEXT,
      type TEXT,
      contact_id BIGINT,
      contact_name TEXT,
      opportunity_id BIGINT,
      opportunity_name TEXT,
      organization_id BIGINT,
      organization_name TEXT
    );
  END IF;
END $$;

-- =====================================================
-- Function: Get Tasks Due Today for User
-- =====================================================
-- Returns incomplete tasks where due_date = today
-- Ordered by priority (high to low), then by creation time
-- =====================================================

CREATE OR REPLACE FUNCTION get_tasks_due_today_for_user(p_sales_id BIGINT)
RETURNS SETOF today_task_record
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.title,
    t.description,
    t.priority::TEXT,
    t.type::TEXT,
    t.contact_id,
    c.name AS contact_name,
    t.opportunity_id,
    o.name AS opportunity_name,
    t.organization_id,
    org.name AS organization_name
  FROM tasks t
  LEFT JOIN contacts c ON t.contact_id = c.id AND c.deleted_at IS NULL
  LEFT JOIN opportunities o ON t.opportunity_id = o.id AND o.deleted_at IS NULL
  LEFT JOIN organizations org ON t.organization_id = org.id AND org.deleted_at IS NULL
  WHERE t.sales_id = p_sales_id
    AND t.completed = false
    AND t.deleted_at IS NULL
    AND t.due_date = CURRENT_DATE
  ORDER BY
    CASE t.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    t.created_at ASC;
$$;

COMMENT ON FUNCTION get_tasks_due_today_for_user(BIGINT) IS
'Returns tasks due today for a specific sales user. Tasks are considered due today when due_date = CURRENT_DATE and not completed. Results include related contact, opportunity, and organization info. Ordered by priority (critical first) then creation time.';

-- =====================================================
-- Update: Modify user_digest_summary type to include tasks_due_today_list
-- =====================================================
-- Note: PostgreSQL doesn't allow ALTER TYPE to add columns to composite types,
-- so we need to drop and recreate the type (and dependent function)
-- =====================================================

-- Drop dependent function first
DROP FUNCTION IF EXISTS get_user_digest_summary(BIGINT);

-- Drop and recreate the type with the new field
DROP TYPE IF EXISTS user_digest_summary CASCADE;

CREATE TYPE user_digest_summary AS (
  sales_id BIGINT,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  tasks_due_today INT,
  tasks_overdue INT,
  stale_deals INT,
  opportunities_updated_24h INT,
  activities_logged_24h INT,
  overdue_tasks JSON,
  stale_deals_list JSON,
  tasks_due_today_list JSON  -- NEW: List of tasks due today
);

-- =====================================================
-- Recreate: Get Complete Digest Summary for User
-- =====================================================
-- Now includes tasks_due_today_list in addition to counts
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_digest_summary(p_sales_id BIGINT)
RETURNS user_digest_summary
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result user_digest_summary;
  today_date DATE := CURRENT_DATE;
  yesterday_start TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ;
  today_start TIMESTAMPTZ := CURRENT_DATE::TIMESTAMPTZ;
BEGIN
  -- Get user info
  SELECT s.id, s.user_id, s.first_name, s.last_name, s.email
  INTO result.sales_id, result.user_id, result.first_name, result.last_name, result.email
  FROM sales s
  WHERE s.id = p_sales_id AND s.disabled = false;

  -- If user not found or disabled, return NULL
  IF result.sales_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count tasks due today
  SELECT COUNT(*)::INT INTO result.tasks_due_today
  FROM tasks
  WHERE sales_id = p_sales_id
    AND due_date = today_date
    AND completed = false
    AND deleted_at IS NULL;

  -- Count overdue tasks
  SELECT COUNT(*)::INT INTO result.tasks_overdue
  FROM tasks
  WHERE sales_id = p_sales_id
    AND due_date < today_date
    AND completed = false
    AND deleted_at IS NULL;

  -- Count stale deals (using per-stage thresholds)
  SELECT COUNT(*)::INT INTO result.stale_deals
  FROM get_stale_deals_for_user(p_sales_id);

  -- Count opportunities updated in last 24h
  SELECT COUNT(*)::INT INTO result.opportunities_updated_24h
  FROM opportunities
  WHERE opportunity_owner_id = p_sales_id
    AND updated_at >= yesterday_start
    AND updated_at < today_start
    AND deleted_at IS NULL;

  -- Count activities logged in last 24h
  SELECT COUNT(*)::INT INTO result.activities_logged_24h
  FROM activities
  WHERE created_by = p_sales_id
    AND activity_date >= yesterday_start
    AND activity_date < today_start
    AND deleted_at IS NULL;

  -- Get overdue tasks as JSON array (limited to top 10)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result.overdue_tasks
  FROM (
    SELECT * FROM get_overdue_tasks_for_user(p_sales_id) LIMIT 10
  ) t;

  -- Get stale deals as JSON array (limited to top 10)
  SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) INTO result.stale_deals_list
  FROM (
    SELECT * FROM get_stale_deals_for_user(p_sales_id) LIMIT 10
  ) d;

  -- NEW: Get tasks due today as JSON array (limited to top 10)
  SELECT COALESCE(json_agg(row_to_json(td)), '[]'::json) INTO result.tasks_due_today_list
  FROM (
    SELECT * FROM get_tasks_due_today_for_user(p_sales_id) LIMIT 10
  ) td;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_user_digest_summary(BIGINT) IS
'Returns complete digest summary for a sales user including task counts, stale deal counts, and detail lists (overdue tasks, stale deals, and tasks due today). Designed for daily digest notification and email generation.';

-- =====================================================
-- Update: Generate Daily Digest V2 to include tasks_due_today_list
-- =====================================================

CREATE OR REPLACE FUNCTION generate_daily_digest_v2()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  digest user_digest_summary;
  digest_count INT := 0;
  notification_count INT := 0;
  message_parts TEXT[];
  digest_message TEXT;
BEGIN
  RAISE NOTICE 'Starting daily digest v2 generation at %', NOW();

  -- Loop through active sales users who have opted in to digests
  FOR user_record IN
    SELECT id FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
      AND digest_opt_in = true  -- Respect user preference
  LOOP
    digest := get_user_digest_summary(user_record.id);

    -- Skip if user not found
    IF digest IS NULL THEN
      CONTINUE;
    END IF;

    digest_count := digest_count + 1;

    -- Only create notification if there's actionable content
    IF digest.tasks_due_today > 0 OR digest.tasks_overdue > 0 OR digest.stale_deals > 0 THEN
      message_parts := ARRAY[]::TEXT[];

      IF digest.tasks_due_today > 0 THEN
        message_parts := array_append(message_parts,
          digest.tasks_due_today || ' task' || CASE WHEN digest.tasks_due_today = 1 THEN '' ELSE 's' END || ' due today');
      END IF;

      IF digest.tasks_overdue > 0 THEN
        message_parts := array_append(message_parts,
          digest.tasks_overdue || ' overdue task' || CASE WHEN digest.tasks_overdue = 1 THEN '' ELSE 's' END);
      END IF;

      IF digest.stale_deals > 0 THEN
        message_parts := array_append(message_parts,
          digest.stale_deals || ' stale deal' || CASE WHEN digest.stale_deals = 1 THEN '' ELSE 's' END || ' needing attention');
      END IF;

      digest_message := 'Daily Digest: ' || array_to_string(message_parts, ', ');

      -- Create notification with enhanced metadata including tasks_due_today_list
      INSERT INTO notifications (user_id, type, message, entity_type, metadata)
      VALUES (
        digest.user_id,
        'daily_digest',
        digest_message,
        'digest',
        jsonb_build_object(
          'tasksDueToday', digest.tasks_due_today,
          'tasksOverdue', digest.tasks_overdue,
          'staleDeals', digest.stale_deals,
          'opportunitiesUpdated', digest.opportunities_updated_24h,
          'activitiesLogged', digest.activities_logged_24h,
          'overdueTasks', digest.overdue_tasks,
          'staleDealsList', digest.stale_deals_list,
          'tasksDueTodayList', digest.tasks_due_today_list,  -- NEW
          'digestDate', CURRENT_DATE,
          'version', 'v2.1'
        )
      );

      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % digests, created % notifications', digest_count, notification_count;

  RETURN json_build_object(
    'success', true,
    'digestsGenerated', digest_count,
    'notificationsCreated', notification_count,
    'executedAt', NOW(),
    'version', 'v2.1'
  );
END;
$$;

COMMENT ON FUNCTION generate_daily_digest_v2() IS
'Enhanced daily digest generator v2.1. Includes tasks_due_today_list in metadata for email generation. Respects digest_opt_in user preference. Uses per-stage stale thresholds from PRD Section 6.3.';

-- =====================================================
-- Grants
-- =====================================================

-- Grant to authenticated role for client-side queries
GRANT EXECUTE ON FUNCTION get_tasks_due_today_for_user(BIGINT) TO authenticated;

-- Grant to service_role for Edge Functions
GRANT EXECUTE ON FUNCTION get_tasks_due_today_for_user(BIGINT) TO service_role;

-- Re-grant for recreated functions
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_daily_digest_v2() TO service_role;

-- =====================================================
-- End of Migration
-- =====================================================
