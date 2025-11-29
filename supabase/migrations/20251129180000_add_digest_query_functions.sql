-- =====================================================
-- Digest Query Functions for Overdue Tasks and Stale Deals
-- =====================================================
--
-- Purpose: Provide efficient per-user queries for daily digest notifications
--
-- Features:
--   1. get_overdue_tasks_for_user - Returns tasks past due date
--   2. get_stale_deals_for_user - Uses per-stage thresholds from PRD Section 6.3
--   3. get_user_digest_summary - Combined summary for notifications
--
-- Per-Stage Stale Thresholds (PRD Section 6.3):
--   - new_lead: 7 days
--   - initial_outreach: 14 days
--   - sample_visit_offered: 14 days
--   - feedback_logged: 21 days
--   - demo_scheduled: 14 days
--   - closed_won/closed_lost: N/A (excluded from staleness)
--
-- =====================================================

-- =====================================================
-- Type: Overdue Task Record
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'overdue_task_record') THEN
    CREATE TYPE overdue_task_record AS (
      id BIGINT,
      title TEXT,
      description TEXT,
      due_date DATE,
      days_overdue INT,
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
-- Type: Stale Deal Record
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stale_deal_record') THEN
    CREATE TYPE stale_deal_record AS (
      id BIGINT,
      name TEXT,
      stage TEXT,
      stage_threshold_days INT,
      days_since_activity INT,
      days_over_threshold INT,
      last_activity_date TIMESTAMPTZ,
      customer_name TEXT,
      principal_name TEXT,
      priority TEXT,
      estimated_close_date DATE
    );
  END IF;
END $$;

-- =====================================================
-- Type: User Digest Summary
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_digest_summary') THEN
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
      stale_deals_list JSON
    );
  END IF;
END $$;

-- =====================================================
-- Function: Get Overdue Tasks for User
-- =====================================================
-- Returns incomplete tasks where due_date < today
-- Ordered by days overdue (most urgent first)
-- =====================================================

CREATE OR REPLACE FUNCTION get_overdue_tasks_for_user(p_sales_id BIGINT)
RETURNS SETOF overdue_task_record
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.title,
    t.description,
    t.due_date,
    (CURRENT_DATE - t.due_date)::INT AS days_overdue,
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
    AND t.due_date < CURRENT_DATE
  ORDER BY days_overdue DESC, t.priority DESC NULLS LAST;
$$;

COMMENT ON FUNCTION get_overdue_tasks_for_user(BIGINT) IS
'Returns overdue tasks for a specific sales user. Tasks are considered overdue when due_date < today and not completed. Results include related contact, opportunity, and organization info.';

-- =====================================================
-- Function: Get Stale Deals for User (Per-Stage Thresholds)
-- =====================================================
-- Uses PRD Section 6.3 thresholds:
--   new_lead: 7 days, initial_outreach: 14 days,
--   sample_visit_offered: 14 days, feedback_logged: 21 days,
--   demo_scheduled: 14 days
--
-- Staleness based on MAX(activity_date) from activities table
-- Falls back to opportunity.created_at if no activities exist
-- =====================================================

CREATE OR REPLACE FUNCTION get_stale_deals_for_user(p_sales_id BIGINT)
RETURNS SETOF stale_deal_record
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH stage_thresholds AS (
    -- Per-stage stale thresholds from PRD Section 6.3
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    -- Get last activity date for each opportunity
    SELECT
      o.id AS opportunity_id,
      o.name,
      o.stage::TEXT,
      o.priority::TEXT,
      o.estimated_close_date,
      o.customer_organization_id,
      o.principal_organization_id,
      o.created_at,
      COALESCE(
        MAX(a.activity_date),
        o.created_at
      ) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id AND a.deleted_at IS NULL
    WHERE o.opportunity_owner_id = p_sales_id
      AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won', 'closed_lost')
    GROUP BY o.id, o.name, o.stage, o.priority, o.estimated_close_date,
             o.customer_organization_id, o.principal_organization_id, o.created_at
  )
  SELECT
    oa.opportunity_id AS id,
    oa.name,
    oa.stage,
    st.threshold_days AS stage_threshold_days,
    EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT AS days_since_activity,
    (EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT - st.threshold_days) AS days_over_threshold,
    oa.last_activity_date,
    cust.name AS customer_name,
    prin.name AS principal_name,
    oa.priority,
    oa.estimated_close_date
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  LEFT JOIN organizations prin ON oa.principal_organization_id = prin.id
  WHERE EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days
  ORDER BY days_over_threshold DESC, oa.priority DESC NULLS LAST;
$$;

COMMENT ON FUNCTION get_stale_deals_for_user(BIGINT) IS
'Returns stale deals for a specific sales user using per-stage thresholds from PRD Section 6.3. Staleness is calculated from the most recent activity_date in the activities table. Deals in closed stages are excluded.';

-- =====================================================
-- Function: Get Complete Digest Summary for User
-- =====================================================
-- Returns aggregated summary with both counts and detail lists
-- Designed for daily digest notification generation
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

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_user_digest_summary(BIGINT) IS
'Returns complete digest summary for a sales user including task counts, stale deal counts, and detail lists. Designed for daily digest notification generation.';

-- =====================================================
-- Function: Generate Daily Digests for All Users (Enhanced)
-- =====================================================
-- Replaces the simple version with per-stage staleness logic
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

  -- Loop through active sales users
  FOR user_record IN
    SELECT id FROM sales WHERE disabled = false AND user_id IS NOT NULL
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

      -- Create notification with enhanced metadata
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
          'digestDate', CURRENT_DATE,
          'version', 'v2'
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
    'version', 'v2'
  );
END;
$$;

COMMENT ON FUNCTION generate_daily_digest_v2() IS
'Enhanced daily digest generator using per-stage stale thresholds from PRD Section 6.3. Includes stale deal counts and detailed lists in notification metadata.';

-- =====================================================
-- Grants
-- =====================================================

-- Grant to authenticated role for client-side queries
GRANT EXECUTE ON FUNCTION get_overdue_tasks_for_user(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stale_deals_for_user(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO authenticated;

-- Grant to service_role for Edge Functions
GRANT EXECUTE ON FUNCTION get_overdue_tasks_for_user(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_stale_deals_for_user(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_daily_digest_v2() TO service_role;

-- =====================================================
-- End of Migration
-- =====================================================
