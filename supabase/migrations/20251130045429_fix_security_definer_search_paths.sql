-- Migration: Fix SECURITY DEFINER functions missing search_path
-- Purpose: Remediate 28 functions flagged by Supabase security linter
-- Risk: Functions without search_path are vulnerable to schema injection attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================================
-- TRIGGER FUNCTIONS (simple, no parameters)
-- ============================================================================

-- 1. cascade_activity_contact_from_opportunity
CREATE OR REPLACE FUNCTION public.cascade_activity_contact_from_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_primary_contact_id BIGINT;
BEGIN
    IF NEW.opportunity_id IS NOT NULL AND NEW.contact_id IS NULL THEN
        SELECT oc.contact_id INTO v_primary_contact_id
        FROM opportunity_contacts oc
        WHERE oc.opportunity_id = NEW.opportunity_id
          AND oc.is_primary = true
        LIMIT 1;

        IF v_primary_contact_id IS NOT NULL THEN
            NEW.contact_id := v_primary_contact_id;
            RAISE NOTICE 'Cascaded contact_id % from opportunity % primary contact',
                         v_primary_contact_id, NEW.opportunity_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. cleanup_old_notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;
  RETURN NEW;
END;
$function$;

-- 3. check_organization_cycle
CREATE OR REPLACE FUNCTION public.check_organization_cycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent';
  END IF;

  IF NEW.parent_organization_id IS NOT NULL THEN
    IF EXISTS (
      WITH RECURSIVE hierarchy AS (
        SELECT id, parent_organization_id
        FROM organizations
        WHERE id = NEW.parent_organization_id

        UNION ALL

        SELECT o.id, o.parent_organization_id
        FROM organizations o
        JOIN hierarchy h ON o.parent_organization_id = h.id
      )
      SELECT 1 FROM hierarchy WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected: Organization % would create a cycle', NEW.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. prevent_organization_cycle
CREATE OR REPLACE FUNCTION public.prevent_organization_cycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_parent_id BIGINT;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  IF NEW.parent_organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent (ID: %)', NEW.id;
  END IF;

  v_current_parent_id := NEW.parent_organization_id;

  WHILE v_current_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_current_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Cycle detected: Organization % would create a circular parent relationship', NEW.id;
    END IF;

    SELECT parent_organization_id
    INTO v_current_parent_id
    FROM organizations
    WHERE id = v_current_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Maximum hierarchy depth exceeded (% levels). Possible cycle.', v_max_depth;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. prevent_parent_org_deletion
CREATE OR REPLACE FUNCTION public.prevent_parent_org_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations
    WHERE parent_organization_id = OLD.id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization with child branches. Remove branches first.';
  END IF;
  RETURN OLD;
END;
$function$;

-- 6. prevent_parent_organization_deletion
CREATE OR REPLACE FUNCTION public.prevent_parent_organization_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organizations
    WHERE parent_organization_id = OLD.id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization % because it has active branches', OLD.name;
  END IF;
  RETURN OLD;
END;
$function$;

-- 7. set_founding_interaction
CREATE OR REPLACE FUNCTION public.set_founding_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;
    RETURN NEW;
END;
$function$;

-- 8. sync_is_admin_from_role
CREATE OR REPLACE FUNCTION public.sync_is_admin_from_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$function$;

-- 9. update_opportunity_products_updated_at
CREATE OR REPLACE FUNCTION public.update_opportunity_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10. update_opportunity_stage_changed_at
CREATE OR REPLACE FUNCTION public.update_opportunity_stage_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 11. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 12. validate_activity_consistency
CREATE OR REPLACE FUNCTION public.validate_activity_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_contact_org_id BIGINT;
    v_opp_customer_id BIGINT;
BEGIN
    IF NEW.contact_id IS NOT NULL AND NEW.opportunity_id IS NOT NULL THEN
        SELECT organization_id INTO v_contact_org_id
        FROM contacts
        WHERE id = NEW.contact_id;

        SELECT customer_organization_id INTO v_opp_customer_id
        FROM opportunities
        WHERE id = NEW.opportunity_id;

        IF v_contact_org_id IS NOT NULL AND v_opp_customer_id IS NOT NULL THEN
            IF v_contact_org_id != v_opp_customer_id THEN
                RAISE EXCEPTION 'Contact % does not belong to opportunity customer organization %',
                    NEW.contact_id, v_opp_customer_id
                    USING HINT = 'The contact must work for the customer organization associated with this opportunity';
            END IF;
        END IF;

        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- ============================================================================
-- CRON/BACKGROUND FUNCTIONS
-- ============================================================================

-- 13. check_overdue_tasks
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
    SELECT t.id, t.title, t.due_date, t.sales_id, s.user_id
    FROM tasks t
    INNER JOIN sales s ON t.sales_id = s.id
    WHERE t.due_date < today_date
      AND t.completed = false
      AND t.overdue_notified_at IS NULL
      AND t.sales_id IS NOT NULL
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

    UPDATE tasks
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

-- 14. generate_daily_digest
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

    SELECT COUNT(*) INTO tasks_due_today
    FROM tasks
    WHERE sales_id = user_record.id
      AND due_date = today_date
      AND completed = false;

    SELECT COUNT(*) INTO tasks_overdue
    FROM tasks
    WHERE sales_id = user_record.id
      AND due_date < today_date
      AND completed = false;

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

-- 15. generate_daily_digest_v2
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
-- DIGEST OPT-OUT FUNCTIONS
-- ============================================================================

-- 16. generate_digest_opt_out_token
CREATE OR REPLACE FUNCTION public.generate_digest_opt_out_token(p_sales_id bigint)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  token_data TEXT;
  signature TEXT;
  expires_at BIGINT;
BEGIN
  expires_at := EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 days'))::BIGINT;
  token_data := p_sales_id || ':' || expires_at;
  signature := encode(
    hmac(token_data::bytea,
         COALESCE(current_setting('app.jwt_secret', true), 'digest-opt-out-secret-key')::bytea,
         'sha256'),
    'hex'
  );
  RETURN encode(convert_to(token_data || ':' || signature, 'UTF8'), 'base64');
END;
$function$;

-- 17. process_digest_opt_out
CREATE OR REPLACE FUNCTION public.process_digest_opt_out(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  decoded_token TEXT;
  token_parts TEXT[];
  p_sales_id BIGINT;
  expires_at BIGINT;
  provided_signature TEXT;
  expected_signature TEXT;
  token_data TEXT;
  user_email TEXT;
BEGIN
  BEGIN
    decoded_token := convert_from(decode(p_token, 'base64'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token format');
  END;

  token_parts := string_to_array(decoded_token, ':');

  IF array_length(token_parts, 1) != 3 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token structure');
  END IF;

  p_sales_id := token_parts[1]::BIGINT;
  expires_at := token_parts[2]::BIGINT;
  provided_signature := token_parts[3];

  IF expires_at < EXTRACT(EPOCH FROM NOW()) THEN
    RETURN json_build_object('success', false, 'error', 'Token has expired');
  END IF;

  token_data := p_sales_id || ':' || expires_at;
  expected_signature := encode(
    hmac(token_data::bytea,
         COALESCE(current_setting('app.jwt_secret', true), 'digest-opt-out-secret-key')::bytea,
         'sha256'),
    'hex'
  );

  IF provided_signature != expected_signature THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token signature');
  END IF;

  UPDATE sales
  SET digest_opt_in = false, updated_at = NOW()
  WHERE id = p_sales_id
  RETURNING email INTO user_email;

  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully unsubscribed from daily digests',
    'email', user_email
  );
END;
$function$;

-- 18. get_digest_preference
CREATE OR REPLACE FUNCTION public.get_digest_preference()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id UUID;
  opt_in_value BOOLEAN;
  user_email TEXT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT digest_opt_in, email
  INTO opt_in_value, user_email
  FROM sales
  WHERE user_id = current_user_id;

  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'digest_opt_in', opt_in_value,
    'email', user_email
  );
END;
$function$;

-- 19. update_digest_preference
CREATE OR REPLACE FUNCTION public.update_digest_preference(p_opt_in boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id UUID;
  updated_email TEXT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE sales
  SET digest_opt_in = p_opt_in, updated_at = NOW()
  WHERE user_id = current_user_id
  RETURNING email INTO updated_email;

  IF updated_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'digest_opt_in', p_opt_in,
    'message', CASE WHEN p_opt_in
      THEN 'Successfully subscribed to daily digests'
      ELSE 'Successfully unsubscribed from daily digests'
    END
  );
END;
$function$;

-- 20. get_user_digest_summary
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

  SELECT COUNT(*)::INT INTO result.tasks_due_today
  FROM tasks
  WHERE sales_id = p_sales_id
    AND due_date = today_date
    AND completed = false
    AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO result.tasks_overdue
  FROM tasks
  WHERE sales_id = p_sales_id
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
-- QUERY FUNCTIONS (used by digest and API)
-- ============================================================================

-- 21. get_overdue_tasks_for_user
CREATE OR REPLACE FUNCTION public.get_overdue_tasks_for_user(p_sales_id bigint)
RETURNS SETOF overdue_task_record
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 22. get_stale_deals_for_user
CREATE OR REPLACE FUNCTION public.get_stale_deals_for_user(p_sales_id bigint)
RETURNS SETOF stale_deal_record
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  WITH stage_thresholds AS (
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
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
$function$;

-- 23. get_tasks_due_today_for_user
CREATE OR REPLACE FUNCTION public.get_tasks_due_today_for_user(p_sales_id bigint)
RETURNS SETOF today_task_record
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- ============================================================================
-- AUTHORIZATION FUNCTIONS
-- ============================================================================

-- 24. check_authorization
CREATE OR REPLACE FUNCTION public.check_authorization(_distributor_id bigint, _principal_id bigint DEFAULT NULL::bigint, _product_id bigint DEFAULT NULL::bigint)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_principal_id BIGINT;
    v_product_name TEXT;
    v_result JSONB;
    v_auth_record RECORD;
BEGIN
    IF _principal_id IS NOT NULL THEN
        v_principal_id := _principal_id;
    ELSIF _product_id IS NOT NULL THEN
        SELECT principal_id, name
        INTO v_principal_id, v_product_name
        FROM products
        WHERE id = _product_id AND deleted_at IS NULL;

        IF v_principal_id IS NULL THEN
            RETURN jsonb_build_object(
                'authorized', false,
                'error', 'Product not found or has no principal',
                'product_id', _product_id,
                'distributor_id', _distributor_id
            );
        END IF;
    ELSE
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'Either principal_id or product_id must be provided',
            'distributor_id', _distributor_id
        );
    END IF;

    SELECT
        authorization_id,
        distributor_name,
        principal_name,
        is_authorized,
        is_currently_valid,
        authorization_date,
        expiration_date,
        territory_restrictions,
        notes
    INTO v_auth_record
    FROM authorization_status
    WHERE distributor_id = _distributor_id
      AND principal_id = v_principal_id;

    IF v_auth_record IS NULL THEN
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', 'no_authorization_record',
            'distributor_id', _distributor_id,
            'principal_id', v_principal_id
        );
    ELSIF NOT v_auth_record.is_currently_valid THEN
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', CASE
                WHEN NOT v_auth_record.is_authorized THEN 'authorization_revoked'
                WHEN v_auth_record.expiration_date < CURRENT_DATE THEN 'authorization_expired'
                ELSE 'authorization_invalid'
            END,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'expiration_date', v_auth_record.expiration_date
        );
    ELSE
        v_result := jsonb_build_object(
            'authorized', true,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'authorization_date', v_auth_record.authorization_date,
            'expiration_date', v_auth_record.expiration_date,
            'territory_restrictions', v_auth_record.territory_restrictions,
            'notes', v_auth_record.notes
        );
    END IF;

    IF _product_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'product_id', _product_id,
            'product_name', v_product_name,
            'resolved_via', 'product_lookup'
        );
    END IF;

    RETURN v_result;
END;
$function$;

-- 25. check_authorization_batch
CREATE OR REPLACE FUNCTION public.check_authorization_batch(_distributor_id bigint, _product_ids bigint[] DEFAULT NULL::bigint[], _principal_ids bigint[] DEFAULT NULL::bigint[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_results JSONB := '[]'::jsonb;
    v_id BIGINT;
    v_check_result JSONB;
BEGIN
    IF _product_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _product_ids
        LOOP
            v_check_result := check_authorization(_distributor_id, NULL, v_id);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    IF _principal_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _principal_ids
        LOOP
            v_check_result := check_authorization(_distributor_id, v_id, NULL);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'distributor_id', _distributor_id,
        'total_checked', jsonb_array_length(v_results),
        'all_authorized', (
            SELECT bool_and((item->>'authorized')::boolean)
            FROM jsonb_array_elements(v_results) AS item
        ),
        'results', v_results
    );
END;
$function$;

-- ============================================================================
-- MISC FUNCTIONS
-- ============================================================================

-- 26. get_duplicate_details
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
      (SELECT COUNT(*) FROM tasks t WHERE t.contact_id = c.id),
      0
    ) as task_count
  FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = ANY(p_contact_ids)
  ORDER BY c.created_at ASC;
END;
$function$;

-- 27. get_activity_log
CREATE OR REPLACE FUNCTION public.get_activity_log(p_organization_id bigint DEFAULT NULL::bigint, p_sales_id bigint DEFAULT NULL::bigint, p_limit integer DEFAULT 250)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    WITH activity_events AS (
      SELECT
        CONCAT('organization.', o.id, '.created') AS id,
        'Organization created' AS type,
        o.id AS organization_id,
        NULL::BIGINT AS contact_id,
        NULL::BIGINT AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        o.sales_id,
        o.created_at AS date,
        jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'created_at', o.created_at,
          'sales_id', o.sales_id
        ) AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM organizations o
      WHERE o.deleted_at IS NULL
        AND (p_organization_id IS NULL OR o.id = p_organization_id)
        AND (p_sales_id IS NULL OR o.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('contact.', c.id, '.created') AS id,
        'Contact created' AS type,
        c.organization_id,
        c.id AS contact_id,
        NULL::BIGINT AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        c.sales_id,
        c.first_seen AS date,
        NULL::JSONB AS organization,
        jsonb_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'organization_id', c.organization_id,
          'first_seen', c.first_seen,
          'sales_id', c.sales_id
        ) AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM contacts c
      WHERE (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR c.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('contactNote.', cn.id, '.created') AS id,
        'Contact note created' AS type,
        c.organization_id,
        cn.contact_id,
        NULL::BIGINT AS opportunity_id,
        cn.id AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        cn.sales_id,
        cn.date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        jsonb_build_object(
          'id', cn.id,
          'contact_id', cn.contact_id,
          'text', cn.text,
          'date', cn.date,
          'sales_id', cn.sales_id
        ) AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM "contactNotes" cn
      LEFT JOIN contacts c ON c.id = cn.contact_id
      WHERE (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR cn.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('opportunity.', opp.id, '.created') AS id,
        'Opportunity created' AS type,
        opp.customer_organization_id AS organization_id,
        NULL::BIGINT AS contact_id,
        opp.id AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        opp.opportunity_owner_id AS sales_id,
        opp.created_at AS date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        jsonb_build_object(
          'id', opp.id,
          'name', opp.name,
          'customer_organization_id', opp.customer_organization_id,
          'principal_organization_id', opp.principal_organization_id,
          'distributor_organization_id', opp.distributor_organization_id,
          'created_at', opp.created_at,
          'sales_id', opp.opportunity_owner_id
        ) AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM opportunities opp
      WHERE (
          p_organization_id IS NULL OR
          opp.customer_organization_id = p_organization_id OR
          opp.principal_organization_id = p_organization_id OR
          opp.distributor_organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR opp.opportunity_owner_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('opportunityNote.', opn.id, '.created') AS id,
        'Opportunity note created' AS type,
        opp.customer_organization_id AS organization_id,
        NULL::BIGINT AS contact_id,
        opn.opportunity_id,
        NULL::BIGINT AS contact_note_id,
        opn.id AS opportunity_note_id,
        opn.sales_id,
        opn.date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        jsonb_build_object(
          'id', opn.id,
          'opportunity_id', opn.opportunity_id,
          'text', opn.text,
          'date', opn.date,
          'sales_id', opn.sales_id
        ) AS opportunity_note
      FROM "opportunityNotes" opn
      LEFT JOIN opportunities opp ON opp.id = opn.opportunity_id
      WHERE (
          p_organization_id IS NULL OR
          opp.customer_organization_id = p_organization_id OR
          opp.principal_organization_id = p_organization_id OR
          opp.distributor_organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR opn.sales_id = p_sales_id)
    )
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'organization_id', organization_id,
        'sales_id', sales_id,
        'date', date,
        'organization', organization,
        'contact', contact,
        'opportunity', opportunity,
        'contactNote', contact_note,
        'opportunityNote', opportunity_note
      )
      ORDER BY date DESC
    )
    FROM (
      SELECT *
      FROM activity_events
      ORDER BY date DESC NULLS LAST
      LIMIT p_limit
    ) sorted_events
  );
END;
$function$;

-- 28. create_booth_visitor_opportunity
CREATE OR REPLACE FUNCTION public.create_booth_visitor_opportunity(_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _sales_id BIGINT;
  _principal_id BIGINT;
  _email_val TEXT;
  _phone_val TEXT;
  _email_jsonb JSONB;
  _phone_jsonb JSONB;
  _principal_name TEXT;
  _principal_type organization_type;
  _opp_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
  _org_name TEXT;
  _city TEXT;
  _state TEXT;
  _campaign TEXT;
  _quick_note TEXT;
BEGIN
  _sales_id := (SELECT id FROM sales WHERE user_id = auth.uid());

  IF _sales_id IS NULL THEN
    RAISE EXCEPTION 'Current user does not have a sales record. User ID: %', auth.uid();
  END IF;

  _first_name := _data->>'first_name';
  _last_name := _data->>'last_name';
  _org_name := _data->>'org_name';
  _city := _data->>'city';
  _state := _data->>'state';
  _campaign := _data->>'campaign';
  _quick_note := _data->>'quick_note';
  _email_val := _data->>'email';
  _phone_val := _data->>'phone';
  _principal_id := (_data->>'principal_id')::BIGINT;

  IF _first_name IS NULL OR _last_name IS NULL THEN
    RAISE EXCEPTION 'first_name and last_name are required';
  END IF;

  IF _org_name IS NULL THEN
    RAISE EXCEPTION 'org_name is required';
  END IF;

  IF _city IS NULL OR _state IS NULL THEN
    RAISE EXCEPTION 'city and state are required';
  END IF;

  IF _principal_id IS NULL THEN
    RAISE EXCEPTION 'principal_id is required';
  END IF;

  IF _campaign IS NULL THEN
    RAISE EXCEPTION 'campaign is required';
  END IF;

  IF (_email_val IS NULL OR _email_val = '') AND (_phone_val IS NULL OR _phone_val = '') THEN
    RAISE EXCEPTION 'At least one of email or phone is required';
  END IF;

  IF _email_val IS NOT NULL AND _email_val != '' THEN
    _email_jsonb := jsonb_build_array(jsonb_build_object('email', _email_val, 'type', 'Work'));
  ELSE
    _email_jsonb := '[]'::jsonb;
  END IF;

  IF _phone_val IS NOT NULL AND _phone_val != '' THEN
    _phone_jsonb := jsonb_build_array(jsonb_build_object('number', _phone_val, 'type', 'Work'));
  ELSE
    _phone_jsonb := '[]'::jsonb;
  END IF;

  INSERT INTO organizations (
    name, city, state, organization_type, sales_id, segment_id
  ) VALUES (
    _org_name,
    _city,
    _state,
    'customer',
    _sales_id,
    '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid
  ) RETURNING id INTO _org_id;

  INSERT INTO contacts (
    name, first_name, last_name, organization_id, sales_id,
    email, phone, first_seen, last_seen, tags
  ) VALUES (
    _first_name || ' ' || _last_name,
    _first_name,
    _last_name,
    _org_id,
    _sales_id,
    _email_jsonb,
    _phone_jsonb,
    NOW(), NOW(), '{}'::bigint[]
  ) RETURNING id INTO _contact_id;

  SELECT name, organization_type
  INTO _principal_name, _principal_type
  FROM organizations
  WHERE id = _principal_id;

  IF _principal_name IS NULL THEN
    RAISE EXCEPTION 'Principal organization with id % does not exist', _principal_id;
  END IF;

  IF _principal_type != 'principal' THEN
    RAISE EXCEPTION 'Organization % is not a principal', _principal_id;
  END IF;

  _opp_name := _campaign || ' - ' || _org_name || ' - ' || _principal_name;

  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, opportunity_owner_id
  ) VALUES (
    _opp_name,
    _org_id,
    _principal_id,
    ARRAY[_contact_id],
    _campaign,
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    NULLIF(_quick_note, ''),
    _sales_id
  ) RETURNING id INTO _opp_id;

  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id_reference)
    SELECT _opp_id, (jsonb_array_elements_text(_data->'product_ids'))::BIGINT;
  END IF;

  RETURN jsonb_build_object(
    'organization_id', _org_id,
    'contact_id', _contact_id,
    'opportunity_id', _opp_id,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create booth visitor: %', SQLERRM;
END;
$function$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
    ));

  IF missing_count > 0 THEN
    RAISE WARNING 'Still have % SECURITY DEFINER functions without search_path', missing_count;
  ELSE
    RAISE NOTICE 'All SECURITY DEFINER functions now have search_path set';
  END IF;
END $$;
