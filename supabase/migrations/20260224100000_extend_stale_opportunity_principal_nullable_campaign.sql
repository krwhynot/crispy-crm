-- Migration: Extend stale_opportunity_record with principal_organization_id
-- and make p_campaign nullable in get_stale_opportunities RPC.
--
-- Additive only: ALTER TYPE ADD ATTRIBUTE appends; CREATE OR REPLACE
-- FUNCTION preserves all existing behavior.

-- 1. Add principal_organization_id attribute to the composite type.
--    Appended as the last attribute; existing callers that don't select
--    it are unaffected.
ALTER TYPE "public"."stale_opportunity_record"
  ADD ATTRIBUTE "principal_organization_id" bigint;

-- 2. Redefine the function with:
--    - p_campaign now DEFAULT NULL (was required)
--    - principal_organization_id carried through the CTE to the result
--    - WHERE clause guards p_campaign with IS NULL check
CREATE OR REPLACE FUNCTION "public"."get_stale_opportunities"(
  "p_campaign" "text" DEFAULT NULL::"text",
  "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone,
  "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone,
  "p_sales_rep_id" bigint DEFAULT NULL::bigint
) RETURNS SETOF "public"."stale_opportunity_record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH stage_thresholds AS (
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    SELECT
      o.id AS opportunity_id,
      o.name,
      o.stage::TEXT,
      o.customer_organization_id,
      o.principal_organization_id,
      o.created_at,
      COALESCE(
        MAX(a.activity_date),
        o.created_at
      ) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id
      AND a.deleted_at IS NULL
      AND (p_start_date IS NULL OR a.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR a.activity_date <= p_end_date)
      AND (p_sales_rep_id IS NULL OR a.created_by = p_sales_rep_id)
    WHERE (p_campaign IS NULL OR o.campaign = p_campaign)
      AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won', 'closed_lost')
      AND (p_sales_rep_id IS NULL OR o.opportunity_owner_id = p_sales_rep_id)
    GROUP BY o.id, o.name, o.stage, o.customer_organization_id, o.principal_organization_id, o.created_at
  )
  SELECT
    oa.opportunity_id AS id,
    oa.name,
    oa.stage,
    cust.name AS customer_organization_name,
    oa.last_activity_date,
    EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT AS days_inactive,
    st.threshold_days AS stage_threshold,
    (EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days) AS is_stale,
    oa.principal_organization_id
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  WHERE EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days
  ORDER BY days_inactive DESC;
$$;
