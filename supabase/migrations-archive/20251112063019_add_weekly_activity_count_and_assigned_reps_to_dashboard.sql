-- Add weekly_activity_count and assigned_reps to dashboard_principal_summary view
-- Enhances dashboard with accurate activity metrics and rep assignments

DROP VIEW IF EXISTS dashboard_principal_summary;

CREATE VIEW dashboard_principal_summary AS
WITH principal_opportunities AS (
  SELECT
    o.principal_organization_id,
    o.id AS opportunity_id,
    o.stage,
    o.estimated_close_date,
    o.account_manager_id,
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 86400 AS days_in_stage
  FROM opportunities o
  WHERE o.status = 'active'
    AND o.principal_organization_id IS NOT NULL
),
principal_activities AS (
  -- Count activities in past 7 days per principal
  SELECT
    po.principal_organization_id,
    COUNT(a.id) AS weekly_activity_count
  FROM principal_opportunities po
  LEFT JOIN activities a ON a.opportunity_id = po.opportunity_id
    AND a.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY po.principal_organization_id
),
principal_reps AS (
  -- Aggregate distinct account managers per principal
  SELECT
    po.principal_organization_id,
    ARRAY_AGG(DISTINCT (s.first_name || ' ' || s.last_name) ORDER BY (s.first_name || ' ' || s.last_name)) AS assigned_reps
  FROM principal_opportunities po
  INNER JOIN sales s ON s.id = po.account_manager_id
  GROUP BY po.principal_organization_id
),
principal_aggregates AS (
  SELECT
    po.principal_organization_id,
    COUNT(DISTINCT po.opportunity_id) AS opportunity_count,
    MAX(po.days_in_stage) AS max_days_in_stage,
    BOOL_OR(po.days_in_stage > 14) AS is_stuck,
    MAX(a.created_at) AS last_activity_date,
    (SELECT a2.type
     FROM activities a2
     INNER JOIN principal_opportunities po2
       ON a2.opportunity_id = po2.opportunity_id
       AND po2.principal_organization_id = po.principal_organization_id
     ORDER BY a2.created_at DESC
     LIMIT 1) AS last_activity_type,
    EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at))) / 86400 AS days_since_last_activity
  FROM principal_opportunities po
  LEFT JOIN activities a ON a.opportunity_id = po.opportunity_id
  GROUP BY po.principal_organization_id
)
SELECT
  org.id,
  org.name AS principal_name,
  pa.opportunity_count,
  COALESCE(pact.weekly_activity_count, 0) AS weekly_activity_count,
  COALESCE(prep.assigned_reps, ARRAY[]::text[]) AS assigned_reps,
  pa.last_activity_date,
  pa.last_activity_type,
  pa.days_since_last_activity,
  CASE
    WHEN pa.days_since_last_activity IS NULL THEN 'urgent'
    WHEN pa.days_since_last_activity > 7 THEN 'urgent'
    WHEN pa.days_since_last_activity > 3 THEN 'warning'
    ELSE 'good'
  END AS status_indicator,
  pa.max_days_in_stage,
  pa.is_stuck,
  NULL AS next_action,
  -- Priority score: lower is higher priority
  -- Factors: days since last activity (weight: 2x), stuck status (weight: 50), opportunity count (negative weight)
  (COALESCE(pa.days_since_last_activity, 30) * 2) +
  (CASE WHEN pa.is_stuck THEN 50 ELSE 0 END) -
  (pa.opportunity_count * 0.5) AS priority_score
FROM organizations org
INNER JOIN principal_aggregates pa ON pa.principal_organization_id = org.id
LEFT JOIN principal_activities pact ON pact.principal_organization_id = org.id
LEFT JOIN principal_reps prep ON prep.principal_organization_id = org.id
WHERE org.organization_type = 'principal'
ORDER BY priority_score ASC;

-- Grant permissions
GRANT SELECT ON dashboard_principal_summary TO authenticated;

-- Add helpful comment
COMMENT ON VIEW dashboard_principal_summary IS
'Dashboard view showing principal organizations with opportunity counts, activity metrics, and assigned reps.
Includes weekly_activity_count (activities in past 7 days) and assigned_reps (array of account manager names).
Priority score calculated from days since last activity, stuck status, and opportunity count.';
