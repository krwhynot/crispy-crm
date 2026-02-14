-- Migration: Add missing standard columns to principal_pipeline_summary
-- Purpose: Satisfy summary view consistency requirements (id, created_at, updated_at, deleted_at)
-- The view already has `id` but was missing created_at, updated_at, deleted_at.
-- Since this is an aggregated view with WHERE o.deleted_at IS NULL,
-- deleted_at will always be NULL. created_at/updated_at come from the organization row.

DROP VIEW IF EXISTS principal_pipeline_summary;

CREATE VIEW principal_pipeline_summary
WITH (security_invoker = true)
AS
SELECT o.id,
    o.id AS principal_id,
    o.name AS principal_name,
    o.created_at,
    o.updated_at,
    o.deleted_at,
    count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) AS total_pipeline,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_this_week,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_last_week,
    CASE
        WHEN count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) > 0 AND count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) = 0 THEN 'stale'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) > count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'increasing'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) < count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'decreasing'::text
        ELSE 'steady'::text
    END AS momentum,
    (SELECT task.subject
        FROM activities task
        JOIN opportunities sub_opp ON task.opportunity_id = sub_opp.id
        WHERE sub_opp.principal_organization_id = o.id
          AND task.activity_type = 'task'
          AND task.completed = false
          AND task.deleted_at IS NULL
          AND sub_opp.deleted_at IS NULL
        ORDER BY task.due_date NULLS LAST
        LIMIT 1) AS next_action_summary,
    (SELECT opportunities.account_manager_id
        FROM opportunities
        WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL AND opportunities.account_manager_id IS NOT NULL
        ORDER BY opportunities.created_at DESC
        LIMIT 1) AS sales_id
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'::organization_type AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.created_at, o.updated_at, o.deleted_at;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON principal_pipeline_summary TO authenticated;

COMMENT ON VIEW principal_pipeline_summary IS
    'Principal pipeline metrics: total pipeline count, weekly activity trends, momentum indicator, next action. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes created_at, updated_at, deleted_at from organizations for summary view consistency. '
    'Fixed in 20260210000003: next_action_summary queries activities table (activity_type=task). '
    'Fixed in 20260210000005: added missing standard columns.';
