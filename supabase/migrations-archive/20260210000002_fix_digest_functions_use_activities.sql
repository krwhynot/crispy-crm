-- ============================================================================
-- Migration: Fix Digest Functions to Query Activities Table (STI Pattern)
-- ============================================================================
--
-- Purpose: Update all digest-related functions that query the deprecated `tasks`
-- table to instead query `activities WHERE activity_type = 'task'`.
--
-- Background:
-- The codebase migrated from a separate `tasks` table to Single Table Inheritance
-- (STI) where tasks are stored in the `activities` table with activity_type = 'task'.
-- See: 20260121000001_add_task_columns_to_activities.sql
--
-- Column Mappings (tasks -> activities):
--   t.title       -> a.subject
--   t.description -> a.description
--   t.due_date    -> a.due_date
--   t.completed   -> a.completed
--   t.sales_id    -> a.sales_id (assignee)
--   t.contact_id  -> a.contact_id
--   t.opportunity_id -> a.opportunity_id
--   t.organization_id -> a.organization_id
--   t.priority    -> a.priority
--   t.type        -> a.type::text (interaction_type enum cast to text)
--   t.overdue_notified_at -> a.overdue_notified_at
--
-- Functions Fixed:
--   1. check_overdue_tasks
--   2. generate_daily_digest
--   3. get_user_digest_summary
--   4. get_overdue_tasks_for_user
--   5. get_tasks_due_today_for_user
--   6. get_duplicate_details
--
-- Note: generate_daily_digest_v2 calls get_user_digest_summary, so it is
-- automatically fixed when get_user_digest_summary is updated.
-- ============================================================================

-- ============================================================================
-- 1. check_overdue_tasks - Creates notifications for overdue tasks
-- ============================================================================
-- Changes:
-- - FROM tasks t -> FROM activities a WHERE a.activity_type = 'task'
-- - t.title -> a.subject
-- - t.due_date -> a.due_date
-- - t.sales_id -> a.sales_id
-- - UPDATE tasks -> UPDATE activities
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_overdue_tasks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  task_record RECORD;
  notification_count INT := 0;
  days_overdue INT;
  today_date DATE := CURRENT_DATE;
BEGIN
  RAISE NOTICE 'Starting overdue tasks check at %', NOW();

  FOR task_record IN
    SELECT a.id, a.subject AS title, a.due_date, a.sales_id, s.user_id
    FROM activities a
    INNER JOIN sales s ON a.sales_id = s.id
    WHERE a.activity_type = 'task'
      AND a.due_date < today_date
      AND a.completed = false
      AND a.overdue_notified_at IS NULL
      AND a.sales_id IS NOT NULL
      AND a.deleted_at IS NULL
  LOOP
    days_overdue := today_date - task_record.due_date;

    INSERT INTO notifications (user_id, type, message, entity_type, entity_id)
    VALUES (
      task_record.user_id,
      'task_overdue',
      'Task "' || task_record.title || '" is ' || days_overdue || ' day' ||
        CASE WHEN days_overdue = 1 THEN '' ELSE 's' END || ' overdue',
      'task',
      task_record.id
    );

    UPDATE activities
    SET overdue_notified_at = NOW()
    WHERE id = task_record.id;

    notification_count := notification_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % overdue task notifications', notification_count;

  RETURN json_build_object(
    'success', true,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$function$;

-- ============================================================================
-- 2. generate_daily_digest - Creates daily digest notifications
-- ============================================================================
-- Changes:
-- - FROM tasks -> FROM activities WHERE activity_type = 'task'
-- - t.due_date -> a.due_date
-- - t.sales_id -> a.sales_id
-- - t.completed -> a.completed
-- - Added deleted_at IS NULL filter
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_daily_digest()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  RAISE NOTICE 'Starting daily digest generation at %', NOW();

  FOR user_record IN
    SELECT id, user_id, first_name, last_name, email
    FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
  LOOP
    digest_count := digest_count + 1;

    -- Count tasks due today (from activities table)
    SELECT COUNT(*) INTO tasks_due_today
    FROM activities
    WHERE activity_type = 'task'
      AND sales_id = user_record.id
      AND due_date = today_date
      AND completed = false
      AND deleted_at IS NULL;

    -- Count overdue tasks (from activities table)
    SELECT COUNT(*) INTO tasks_overdue
    FROM activities
    WHERE activity_type = 'task'
      AND sales_id = user_record.id
      AND due_date < today_date
      AND completed = false
      AND deleted_at IS NULL;

    SELECT COUNT(*) INTO opportunities_updated
    FROM opportunities
    WHERE opportunity_owner_id = user_record.id
      AND updated_at >= yesterday_date
      AND updated_at < today_date;

    SELECT COUNT(*) INTO activities_yesterday
    FROM activities
    WHERE created_by = user_record.id
      AND activity_date >= yesterday_date
      AND activity_date < today_date;

    IF tasks_due_today > 0 OR tasks_overdue > 0 OR opportunities_updated > 0 THEN
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

  RETURN json_build_object(
    'success', true,
    'digestsGenerated', digest_count,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$function$;

-- ============================================================================
-- 3. get_overdue_tasks_for_user - Returns overdue tasks for digest
-- ============================================================================
-- Changes:
-- - FROM tasks t -> FROM activities a WHERE a.activity_type = 'task'
-- - t.title -> a.subject AS title (aliased to match return type)
-- - t.type::TEXT -> a.type::TEXT
-- - All other column mappings as per STI pattern
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_overdue_tasks_for_user(p_sales_id bigint)
RETURNS SETOF overdue_task_record
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    a.id,
    a.subject AS title,
    a.description,
    a.due_date,
    (CURRENT_DATE - a.due_date)::INT AS days_overdue,
    a.priority::TEXT,
    a.type::TEXT,
    a.contact_id,
    c.name AS contact_name,
    a.opportunity_id,
    o.name AS opportunity_name,
    a.organization_id,
    org.name AS organization_name
  FROM activities a
  LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
  LEFT JOIN opportunities o ON a.opportunity_id = o.id AND o.deleted_at IS NULL
  LEFT JOIN organizations org ON a.organization_id = org.id AND org.deleted_at IS NULL
  WHERE a.activity_type = 'task'
    AND a.sales_id = p_sales_id
    AND a.completed = false
    AND a.deleted_at IS NULL
    AND a.due_date < CURRENT_DATE
  ORDER BY days_overdue DESC, a.priority DESC NULLS LAST;
$function$;

-- ============================================================================
-- 4. get_tasks_due_today_for_user - Returns tasks due today for digest
-- ============================================================================
-- Changes:
-- - FROM tasks t -> FROM activities a WHERE a.activity_type = 'task'
-- - t.title -> a.subject AS title
-- - t.type::TEXT -> a.type::TEXT
-- - All other column mappings as per STI pattern
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tasks_due_today_for_user(p_sales_id bigint)
RETURNS SETOF today_task_record
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    a.id,
    a.subject AS title,
    a.description,
    a.priority::TEXT,
    a.type::TEXT,
    a.contact_id,
    c.name AS contact_name,
    a.opportunity_id,
    o.name AS opportunity_name,
    a.organization_id,
    org.name AS organization_name
  FROM activities a
  LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
  LEFT JOIN opportunities o ON a.opportunity_id = o.id AND o.deleted_at IS NULL
  LEFT JOIN organizations org ON a.organization_id = org.id AND org.deleted_at IS NULL
  WHERE a.activity_type = 'task'
    AND a.sales_id = p_sales_id
    AND a.completed = false
    AND a.deleted_at IS NULL
    AND a.due_date = CURRENT_DATE
  ORDER BY
    CASE a.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    a.created_at ASC;
$function$;

-- ============================================================================
-- 5. get_user_digest_summary - Returns complete digest summary
-- ============================================================================
-- Changes:
-- - FROM tasks -> FROM activities WHERE activity_type = 'task'
-- - All task count queries now filter by activity_type = 'task'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_digest_summary(p_sales_id bigint)
RETURNS user_digest_summary
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result user_digest_summary;
  today_date DATE := CURRENT_DATE;
  yesterday_start TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ;
  today_start TIMESTAMPTZ := CURRENT_DATE::TIMESTAMPTZ;
BEGIN
  SELECT s.id, s.user_id, s.first_name, s.last_name, s.email
  INTO result.sales_id, result.user_id, result.first_name, result.last_name, result.email
  FROM sales s
  WHERE s.id = p_sales_id AND s.disabled = false;

  IF result.sales_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count tasks due today (from activities table)
  SELECT COUNT(*)::INT INTO result.tasks_due_today
  FROM activities
  WHERE activity_type = 'task'
    AND sales_id = p_sales_id
    AND due_date = today_date
    AND completed = false
    AND deleted_at IS NULL;

  -- Count overdue tasks (from activities table)
  SELECT COUNT(*)::INT INTO result.tasks_overdue
  FROM activities
  WHERE activity_type = 'task'
    AND sales_id = p_sales_id
    AND due_date < today_date
    AND completed = false
    AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO result.stale_deals
  FROM get_stale_deals_for_user(p_sales_id);

  SELECT COUNT(*)::INT INTO result.opportunities_updated_24h
  FROM opportunities
  WHERE opportunity_owner_id = p_sales_id
    AND updated_at >= yesterday_start
    AND updated_at < today_start
    AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO result.activities_logged_24h
  FROM activities
  WHERE created_by = p_sales_id
    AND activity_date >= yesterday_start
    AND activity_date < today_start
    AND deleted_at IS NULL;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result.overdue_tasks
  FROM (
    SELECT * FROM get_overdue_tasks_for_user(p_sales_id) LIMIT 10
  ) t;

  SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) INTO result.stale_deals_list
  FROM (
    SELECT * FROM get_stale_deals_for_user(p_sales_id) LIMIT 10
  ) d;

  SELECT COALESCE(json_agg(row_to_json(td)), '[]'::json) INTO result.tasks_due_today_list
  FROM (
    SELECT * FROM get_tasks_due_today_for_user(p_sales_id) LIMIT 10
  ) td;

  RETURN result;
END;
$function$;

-- ============================================================================
-- 6. generate_daily_digest_v2 - Uses get_user_digest_summary (no changes needed)
-- ============================================================================
-- This function calls get_user_digest_summary which we updated above.
-- Recreating it to ensure it uses the updated version and maintains
-- SECURITY DEFINER + search_path settings.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_daily_digest_v2()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_record RECORD;
  digest user_digest_summary;
  digest_count INT := 0;
  notification_count INT := 0;
  message_parts TEXT[];
  digest_message TEXT;
BEGIN
  RAISE NOTICE 'Starting daily digest v2 generation at %', NOW();

  FOR user_record IN
    SELECT id FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
      AND digest_opt_in = true
  LOOP
    digest := get_user_digest_summary(user_record.id);

    IF digest IS NULL THEN
      CONTINUE;
    END IF;

    digest_count := digest_count + 1;

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
          'tasksDueTodayList', digest.tasks_due_today_list,
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
$function$;

-- ============================================================================
-- 7. get_duplicate_details - Contact duplicate detection with task count
-- ============================================================================
-- Changes:
-- - FROM tasks t -> FROM activities a WHERE a.activity_type = 'task'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_duplicate_details(p_contact_ids bigint[])
RETURNS TABLE(id bigint, first_name text, last_name text, email jsonb, phone jsonb, organization_id bigint, organization_name text, created_at timestamp with time zone, interaction_count bigint, task_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.organization_id,
    o.name as organization_name,
    c.created_at,
    (SELECT COUNT(*) FROM "contactNotes" cn WHERE cn.contact_id = c.id) as interaction_count,
    COALESCE(
      (SELECT COUNT(*) FROM activities a
       WHERE a.contact_id = c.id
         AND a.activity_type = 'task'
         AND a.deleted_at IS NULL),
      0
    ) as task_count
  FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = ANY(p_contact_ids)
  ORDER BY c.created_at ASC;
END;
$function$;

-- ============================================================================
-- Verification
-- ============================================================================
-- Run after migration to verify functions are using activities table:
--
-- -- Check function definitions contain 'activity_type'
-- SELECT
--   proname,
--   prosrc LIKE '%activity_type%' as uses_activities
-- FROM pg_proc
-- WHERE proname IN (
--   'check_overdue_tasks',
--   'generate_daily_digest',
--   'generate_daily_digest_v2',
--   'get_user_digest_summary',
--   'get_overdue_tasks_for_user',
--   'get_tasks_due_today_for_user',
--   'get_duplicate_details'
-- )
-- AND pronamespace = 'public'::regnamespace;
--
-- -- All should return true for uses_activities
-- ============================================================================

-- Ensure grants remain in place
GRANT EXECUTE ON FUNCTION get_overdue_tasks_for_user(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stale_deals_for_user(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tasks_due_today_for_user(BIGINT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_overdue_tasks_for_user(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_stale_deals_for_user(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_digest_summary(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_tasks_due_today_for_user(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_daily_digest() TO service_role;
GRANT EXECUTE ON FUNCTION generate_daily_digest_v2() TO service_role;
GRANT EXECUTE ON FUNCTION check_overdue_tasks() TO service_role;

-- ============================================================================
-- End of Migration
-- ============================================================================
