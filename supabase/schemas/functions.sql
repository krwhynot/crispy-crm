-- ==========================================================================
-- Crispy CRM — Key Functions (Reference Snapshot)
-- Last synced: 2026-03-04 | Migrations: 20260214003329..20260303120000
-- WARNING: Read-only reference. Do NOT execute directly. Use migrations.
--
-- Only documents externally-callable RPCs and critical trigger functions.
-- Internal trigger functions (audit, updated_at, search_tsv) omitted.
-- ==========================================================================

-- =========================================================================
-- SECTION 1: Auth / User Lifecycle
-- =========================================================================

-- --------------------------------------------------------------------------
-- handle_new_user() — Final: migration 20260303100000
-- Trigger: AFTER INSERT OR UPDATE ON auth.users
-- INSERT: email-based restore (1 match=restore, 2+=exception, 0=fresh insert)
-- UPDATE: upsert/sync email
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO '' AS $$
DECLARE
  restored_id bigint;
  candidate_count int;
  parsed_role public.user_role;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    BEGIN parsed_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    EXCEPTION WHEN OTHERS THEN parsed_role := 'rep'; END;
    INSERT INTO public.sales (user_id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name',''),
            COALESCE(NEW.raw_user_meta_data->>'last_name',''), COALESCE(parsed_role,'rep'), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    RETURN NEW;
  END IF;

  BEGIN parsed_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN parsed_role := 'rep'; END;

  SELECT count(*) INTO candidate_count FROM public.sales
  WHERE lower(email) = lower(NEW.email) AND deleted_at IS NOT NULL AND user_id IS NULL;

  IF candidate_count = 1 THEN
    UPDATE public.sales SET user_id = NEW.id, email = NEW.email,
      first_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name',''), first_name),
      last_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name',''), last_name),
      deleted_at = NULL, updated_at = NOW()
    WHERE lower(email) = lower(NEW.email) AND deleted_at IS NOT NULL AND user_id IS NULL
    RETURNING id INTO restored_id;
  ELSIF candidate_count > 1 THEN
    RAISE EXCEPTION 'Cannot auto-restore: % soft-deleted sales rows match email %. Use admin_resolve_duplicate_sales().',
      candidate_count, NEW.email;
  END IF;

  IF restored_id IS NULL THEN
    INSERT INTO public.sales (user_id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name',''),
            COALESCE(NEW.raw_user_meta_data->>'last_name',''), COALESCE(parsed_role,'rep'), NEW.created_at, NOW())
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- handle_auth_user_deletion() — Added: migration 20260303100000
-- Trigger: BEFORE DELETE ON auth.users
-- Soft-deletes the sales row before FK SET NULL clears user_id
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.sales SET deleted_at = NOW(), updated_at = NOW()
  WHERE user_id = OLD.id AND deleted_at IS NULL;
  RETURN OLD;
END;
$$;

-- --------------------------------------------------------------------------
-- admin_restore_sale() — Final: migration 20260303110000
-- SECURITY DEFINER, admin-only. Three paths: restore / update active / upsert.
-- ON CONFLICT handles TOCTOU race with handle_new_user() trigger.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_restore_sale(
  target_user_id uuid,
  new_email text DEFAULT NULL,
  new_first_name text DEFAULT NULL,
  new_last_name text DEFAULT NULL
) RETURNS public.sales
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  current_user_id UUID; current_user_role user_role; result_record sales;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001'; END IF;
  SELECT role INTO current_user_role FROM sales WHERE user_id = current_user_id AND deleted_at IS NULL;
  IF current_user_role IS NULL OR current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can restore sales records' USING ERRCODE = 'P0003'; END IF;

  -- Path 1: Restore soft-deleted
  UPDATE sales SET deleted_at = NULL, email = COALESCE(new_email, email),
    first_name = COALESCE(new_first_name, first_name), last_name = COALESCE(new_last_name, last_name), updated_at = NOW()
  WHERE user_id = target_user_id AND deleted_at IS NOT NULL RETURNING * INTO result_record;
  IF result_record IS NOT NULL THEN RETURN result_record; END IF;

  -- Path 2: Update active row
  SELECT * INTO result_record FROM sales WHERE user_id = target_user_id AND deleted_at IS NULL;
  IF result_record IS NOT NULL THEN
    UPDATE sales SET email = COALESCE(new_email, email), first_name = COALESCE(new_first_name, first_name),
      last_name = COALESCE(new_last_name, last_name), updated_at = NOW()
    WHERE user_id = target_user_id AND deleted_at IS NULL RETURNING * INTO result_record;
    RETURN result_record;
  END IF;

  -- Path 3: Upsert (race-safe)
  INSERT INTO sales (user_id, email, first_name, last_name, role, disabled, created_at, updated_at)
  VALUES (target_user_id, COALESCE(new_email,''), COALESCE(new_first_name,''), COALESCE(new_last_name,''),
          'rep', false, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET email = COALESCE(EXCLUDED.email, sales.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name,''), sales.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name,''), sales.last_name),
    deleted_at = NULL, updated_at = NOW()
  RETURNING * INTO result_record;
  RETURN result_record;
END;
$$;

-- --------------------------------------------------------------------------
-- admin_resolve_duplicate_sales() — Added: migration 20260303100000
-- Tombstones non-kept duplicate soft-deleted sales rows
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_resolve_duplicate_sales(
  target_email text, keep_sales_id bigint
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE current_user_role user_role; valid_candidate boolean;
BEGIN
  SELECT role INTO current_user_role FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL;
  IF current_user_role IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Only admins can resolve duplicate sales rows'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.sales WHERE id = keep_sales_id AND lower(email) = lower(target_email)
    AND deleted_at IS NOT NULL AND user_id IS NULL) INTO valid_candidate;
  IF NOT valid_candidate THEN RAISE EXCEPTION 'sales_id % is not a valid soft-deleted candidate for email %', keep_sales_id, target_email; END IF;
  UPDATE public.sales SET email = '__retired__' || id || '__' || email, updated_at = NOW()
  WHERE lower(email) = lower(target_email) AND deleted_at IS NOT NULL AND user_id IS NULL AND id != keep_sales_id;
END;
$$;

-- =========================================================================
-- SECTION 2: Data RPCs
-- =========================================================================

-- --------------------------------------------------------------------------
-- get_stale_opportunities() — Final: migration 20260224100000
-- Returns stale deals (days_inactive > stage threshold), p_campaign now nullable
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_stale_opportunities(
  p_campaign text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_sales_rep_id bigint DEFAULT NULL
) RETURNS SETOF public.stale_opportunity_record
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH stage_thresholds AS (
    SELECT unnest(ARRAY['new_lead','initial_outreach','sample_visit_offered','feedback_logged','demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    SELECT o.id AS opportunity_id, o.name, o.stage::TEXT, o.customer_organization_id,
           o.principal_organization_id, o.created_at,
           COALESCE(MAX(a.activity_date), o.created_at) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id AND a.deleted_at IS NULL
      AND (p_start_date IS NULL OR a.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR a.activity_date <= p_end_date)
      AND (p_sales_rep_id IS NULL OR a.created_by = p_sales_rep_id)
    WHERE (p_campaign IS NULL OR o.campaign = p_campaign) AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won','closed_lost')
      AND (p_sales_rep_id IS NULL OR o.opportunity_owner_id = p_sales_rep_id)
    GROUP BY o.id, o.name, o.stage, o.customer_organization_id, o.principal_organization_id, o.created_at
  )
  SELECT oa.opportunity_id AS id, oa.name, oa.stage,
    cust.name AS customer_organization_name, oa.last_activity_date,
    EXTRACT(DAY FROM NOW() - oa.last_activity_date)::INT AS days_inactive,
    st.threshold_days AS stage_threshold,
    (EXTRACT(DAY FROM NOW() - oa.last_activity_date)::INT > st.threshold_days) AS is_stale,
    oa.principal_organization_id
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  WHERE EXTRACT(DAY FROM NOW() - oa.last_activity_date)::INT > st.threshold_days
  ORDER BY days_inactive DESC;
$$;

-- --------------------------------------------------------------------------
-- get_campaign_report_stats() — Added: migration 20260225100000
-- Returns JSONB: campaign_options, sales_rep_options, activity_type_counts
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_campaign_report_stats(
  p_campaign text DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'campaign_options', COALESCE((SELECT jsonb_agg(row_to_json(c) ORDER BY c.count DESC)
      FROM (SELECT campaign AS name, count(*)::int AS "count" FROM opportunities
        WHERE campaign IS NOT NULL AND deleted_at IS NULL GROUP BY campaign) c), '[]'::jsonb),
    'sales_rep_options', COALESCE((SELECT jsonb_agg(row_to_json(r) ORDER BY r.count DESC)
      FROM (SELECT s.id, (s.first_name || ' ' || s.last_name) AS name, count(a.id)::int AS "count"
        FROM sales s JOIN activities a ON a.created_by = s.id AND a.activity_type = 'activity'
          AND a.deleted_at IS NULL AND EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id
            AND o.deleted_at IS NULL AND (p_campaign IS NULL OR o.campaign = p_campaign))
        WHERE s.deleted_at IS NULL AND s.disabled = false GROUP BY s.id, s.first_name, s.last_name) r), '[]'::jsonb),
    'activity_type_counts', COALESCE((SELECT jsonb_object_agg(t.type, t.cnt) FROM (
      SELECT a.type::text, count(*)::int AS cnt FROM activities a WHERE a.activity_type = 'activity'
        AND a.deleted_at IS NULL AND EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id
          AND o.deleted_at IS NULL AND (p_campaign IS NULL OR o.campaign = p_campaign))
      GROUP BY a.type) t), '{}'::jsonb)
  );
$$;

-- --------------------------------------------------------------------------
-- get_organization_descendants() — Final: migration 20260217192050
-- Recursive CTE, schema-qualified, empty search_path
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_organization_descendants(org_id bigint)
RETURNS bigint[] LANGUAGE sql STABLE SET search_path TO '' AS $$
  SELECT COALESCE(
    (SELECT array_agg(id) FROM (
      WITH RECURSIVE descendants AS (
        SELECT id, parent_organization_id FROM public.organizations
        WHERE parent_organization_id = org_id AND deleted_at IS NULL
        UNION ALL
        SELECT o.id, o.parent_organization_id FROM public.organizations o
        JOIN descendants d ON o.parent_organization_id = d.id WHERE o.deleted_at IS NULL
      ) SELECT id FROM descendants
    ) AS all_descendants),
    ARRAY[]::bigint[]
  );
$$;

-- =========================================================================
-- SECTION 3: Atomic Data Operations
-- =========================================================================

-- create_opportunity_with_participants(_data jsonb) — base migration
-- sync_opportunity_with_products(...) — base migration (optimistic lock)
-- complete_task_with_followup(p_task_id, p_activity_data, p_opportunity_stage) — base migration
-- log_activity_with_task(p_activity, p_task) — base migration

-- =========================================================================
-- SECTION 4: Archive / Restore RPCs
-- =========================================================================

-- archive_contact_with_relations(contact_id bigint) — base migration
-- archive_opportunity_with_relations(opp_id bigint) — base migration
-- archive_organization_with_relations(org_id bigint) — base migration
-- unarchive_contact_with_relations(contact_id bigint) — base migration
-- unarchive_opportunity_with_relations(opp_id bigint) — base migration
-- unarchive_organization_with_relations(org_id bigint) — base migration

-- =========================================================================
-- SECTION 5: Authorization Checking
-- =========================================================================

-- check_authorization(_distributor_id, _principal_id, _product_id) RETURNS jsonb — base migration
-- check_authorization_batch(_distributor_id, _product_ids[], _principal_ids[]) RETURNS jsonb — base migration

-- =========================================================================
-- SECTION 6: Private Schema (RLS helpers)
-- =========================================================================

-- private.can_access_by_role(record_sales_id, record_created_by) — ownership check
-- private.get_current_user_role() — cached role lookup
-- private.is_admin_or_manager() — role gate
