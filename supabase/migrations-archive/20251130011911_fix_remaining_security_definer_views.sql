-- ============================================================================
-- SECURITY REMEDIATION FOLLOW-UP: Fix Remaining SECURITY DEFINER Views
-- ============================================================================
-- Date: 2025-11-30
-- Purpose: Convert 3 remaining views to SECURITY INVOKER
--
-- These views were recreated in 20251129173209_remove_awaiting_response_enum_value.sql
-- without the security_invoker option, overriding our previous fixes.
-- ============================================================================

-- 1. dashboard_pipeline_summary
DROP VIEW IF EXISTS dashboard_pipeline_summary;
CREATE VIEW dashboard_pipeline_summary
WITH (security_invoker = on)
AS
SELECT account_manager_id,
    stage,
    count(*) AS count,
    count(
        CASE
            WHEN ((EXTRACT(epoch FROM (now() - created_at)) / (86400)::numeric) >= (30)::numeric) THEN 1
            ELSE NULL::integer
        END) AS stuck_count,
    ( SELECT count(*) AS count
           FROM opportunities
          WHERE ((opportunities.account_manager_id = o.account_manager_id) AND (opportunities.status = 'active'::opportunity_status))) AS total_active,
    ( SELECT count(*) AS count
           FROM opportunities
          WHERE ((opportunities.account_manager_id = o.account_manager_id) AND (opportunities.status = 'active'::opportunity_status) AND ((EXTRACT(epoch FROM (now() - opportunities.created_at)) / (86400)::numeric) >= (30)::numeric))) AS total_stuck
   FROM opportunities o
  WHERE (status = 'active'::opportunity_status)
  GROUP BY account_manager_id, stage;

COMMENT ON VIEW dashboard_pipeline_summary IS
  'Pipeline summary by account manager and stage. SECURITY: Uses SECURITY INVOKER.';

-- 2. dashboard_principal_summary
DROP VIEW IF EXISTS dashboard_principal_summary;
CREATE VIEW dashboard_principal_summary
WITH (security_invoker = on)
AS
WITH principal_opportunities AS (
         SELECT o.principal_organization_id,
            o.id AS opportunity_id,
            o.stage,
            o.estimated_close_date,
            o.account_manager_id,
            (EXTRACT(epoch FROM (now() - o.created_at)) / (86400)::numeric) AS days_in_stage
           FROM opportunities o
          WHERE ((o.status = 'active'::opportunity_status) AND (o.principal_organization_id IS NOT NULL))
        ), principal_activities AS (
         SELECT po.principal_organization_id,
            count(a.id) AS weekly_activity_count
           FROM (principal_opportunities po
             LEFT JOIN activities a ON (((a.opportunity_id = po.opportunity_id) AND (a.created_at >= (now() - '7 days'::interval)))))
          GROUP BY po.principal_organization_id
        ), principal_reps AS (
         SELECT po.principal_organization_id,
            array_agg(DISTINCT ((s.first_name || ' '::text) || s.last_name) ORDER BY ((s.first_name || ' '::text) || s.last_name)) AS assigned_reps
           FROM (principal_opportunities po
             JOIN sales s ON ((s.id = po.account_manager_id)))
          GROUP BY po.principal_organization_id
        ), principal_aggregates AS (
         SELECT po.principal_organization_id,
            count(DISTINCT po.opportunity_id) AS opportunity_count,
            max(po.days_in_stage) AS max_days_in_stage,
            bool_or((po.days_in_stage > (14)::numeric)) AS is_stuck,
            max(a.created_at) AS last_activity_date,
            ( SELECT a2.type
                   FROM (activities a2
                     JOIN principal_opportunities po2 ON (((a2.opportunity_id = po2.opportunity_id) AND (po2.principal_organization_id = po.principal_organization_id))))
                  ORDER BY a2.created_at DESC
                 LIMIT 1) AS last_activity_type,
            (EXTRACT(epoch FROM (now() - max(a.created_at))) / (86400)::numeric) AS days_since_last_activity
           FROM (principal_opportunities po
             LEFT JOIN activities a ON ((a.opportunity_id = po.opportunity_id)))
          GROUP BY po.principal_organization_id
        )
 SELECT org.id,
    org.name AS principal_name,
    pa.opportunity_count,
    COALESCE(pact.weekly_activity_count, (0)::bigint) AS weekly_activity_count,
    COALESCE(prep.assigned_reps, ARRAY[]::text[]) AS assigned_reps,
    pa.last_activity_date,
    pa.last_activity_type,
    pa.days_since_last_activity,
        CASE
            WHEN (pa.days_since_last_activity IS NULL) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (7)::numeric) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (3)::numeric) THEN 'warning'::text
            ELSE 'good'::text
        END AS status_indicator,
    pa.max_days_in_stage,
    pa.is_stuck,
    NULL::text AS next_action,
    (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5)) AS priority_score
   FROM (((organizations org
     JOIN principal_aggregates pa ON ((pa.principal_organization_id = org.id)))
     LEFT JOIN principal_activities pact ON ((pact.principal_organization_id = org.id)))
     LEFT JOIN principal_reps prep ON ((prep.principal_organization_id = org.id)))
  WHERE (org.organization_type = 'principal'::organization_type)
  ORDER BY (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5));

COMMENT ON VIEW dashboard_principal_summary IS
  'Principal dashboard summary with activity metrics. SECURITY: Uses SECURITY INVOKER.';

-- 3. opportunities_summary
DROP VIEW IF EXISTS opportunities_summary;
CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
    o.index,
    o.estimated_close_date,
    o.actual_close_date,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.founding_interaction_id,
    o.stage_manual,
    o.status_manual,
    o.next_action,
    o.next_action_date,
    o.competition,
    o.decision_criteria,
    o.contact_ids,
    o.opportunity_owner_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.search_tsv,
    o.tags,
    o.account_manager_id,
    o.lead_source,
    o.updated_by,
    o.campaign,
    o.related_opportunity_id,
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', op.id, 'product_id_reference', op.product_id_reference, 'product_name', op.product_name, 'product_category', op.product_category, 'principal_name', prod_org.name, 'notes', op.notes) ORDER BY op.created_at) AS jsonb_agg
           FROM ((opportunity_products op
             LEFT JOIN products p ON ((op.product_id_reference = p.id)))
             LEFT JOIN organizations prod_org ON ((p.principal_id = prod_org.id)))
          WHERE (op.opportunity_id = o.id)), '[]'::jsonb) AS products
   FROM (((opportunities o
     LEFT JOIN organizations cust_org ON ((o.customer_organization_id = cust_org.id)))
     LEFT JOIN organizations prin_org ON ((o.principal_organization_id = prin_org.id)))
     LEFT JOIN organizations dist_org ON ((o.distributor_organization_id = dist_org.id)));

COMMENT ON VIEW opportunities_summary IS
  'Opportunities with joined organization names and products. SECURITY: Uses SECURITY INVOKER.';

-- Grant permissions
GRANT SELECT ON dashboard_pipeline_summary TO authenticated;
GRANT SELECT ON dashboard_principal_summary TO authenticated;
GRANT SELECT ON opportunities_summary TO authenticated;

-- Verification
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND c.relname IN ('dashboard_pipeline_summary', 'dashboard_principal_summary', 'opportunities_summary')
    AND (c.reloptions::text LIKE '%security_invoker=on%'
         OR c.reloptions::text LIKE '%security_invoker=true%');

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECURITY INVOKER FIX COMPLETE';
  RAISE NOTICE 'Views fixed: % of 3', view_count;
  RAISE NOTICE '============================================';
END $$;
