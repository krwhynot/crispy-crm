-- ============================================================================
-- D2: Add completed_tasks_30d and total_tasks_30d to principal_pipeline_summary
--
-- The dashboard's PrincipalPipelineTable component expects these columns
-- for the "Tasks" column showing completion progress per principal.
-- Tasks live in the activities table (activity_type = 'task').
--
-- Uses correlated subqueries consistent with next_action_summary/sales_id pattern.
-- ============================================================================

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
        LIMIT 1) AS sales_id,
    -- D2: Task metrics for principal pipeline table
    (SELECT count(*)
        FROM activities t
        JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
        WHERE t_opp.principal_organization_id = o.id
          AND t.activity_type = 'task'
          AND t.completed = true
          AND t.completed_at >= (CURRENT_DATE - '30 days'::interval)
          AND t.deleted_at IS NULL
          AND t_opp.deleted_at IS NULL) AS completed_tasks_30d,
    (SELECT count(*)
        FROM activities t
        JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
        WHERE t_opp.principal_organization_id = o.id
          AND t.activity_type = 'task'
          AND t.deleted_at IS NULL
          AND t_opp.deleted_at IS NULL
          AND (t.due_date >= (CURRENT_DATE - '30 days'::interval)
               OR t.created_at >= (CURRENT_DATE - '30 days'::interval))) AS total_tasks_30d
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'::organization_type AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.created_at, o.updated_at, o.deleted_at;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON principal_pipeline_summary TO authenticated;

COMMENT ON VIEW principal_pipeline_summary IS
    'Principal pipeline metrics: total pipeline count, weekly activity trends, momentum indicator, next action, task completion (30d). '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'D2: Added completed_tasks_30d and total_tasks_30d for PrincipalPipelineTable Tasks column.';
