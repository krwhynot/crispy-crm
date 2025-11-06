/**
 * Create dashboard_principal_summary View
 *
 * This view provides aggregated principal data for the principal-centric dashboard.
 * Groups active opportunities by principal organization and calculates key metrics:
 * - Opportunity count per principal
 * - Days since last activity (for status indicator)
 * - Next incomplete task
 * - Days stuck in current stage (for stuck indicator)
 *
 * PRD Reference: docs/prd/14-dashboard.md
 * Dashboard Requirements:
 * - Filter by account_manager_id (current user)
 * - Show only active opportunities (status = 'active', deleted_at IS NULL)
 * - Calculate status: Good (<= 7 days) | Warning (7-14 days) | Urgent (14+ days)
 * - Calculate stuck: Warning X days if opportunity in same stage 30+ days
 */

CREATE OR REPLACE VIEW dashboard_principal_summary
WITH (security_invoker = on)
AS
WITH principal_opportunities AS (
  -- Get all active opportunities grouped by principal
  SELECT
    o.principal_organization_id,
    o.account_manager_id,
    o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.stage,
    o.stage_changed_at,
    EXTRACT(DAY FROM (NOW() - o.stage_changed_at)) AS days_in_current_stage,

    -- Get last activity date for this opportunity
    (
      SELECT MAX(a.activity_date)
      FROM activities a
      WHERE a.opportunity_id = o.id
        AND a.deleted_at IS NULL
    ) AS last_activity_date,

    -- Get most recent activity type for this opportunity
    (
      SELECT a.type
      FROM activities a
      WHERE a.opportunity_id = o.id
        AND a.deleted_at IS NULL
      ORDER BY a.activity_date DESC
      LIMIT 1
    ) AS last_activity_type,

    -- Get next incomplete task for this opportunity
    (
      SELECT t.title
      FROM tasks t
      WHERE t.opportunity_id = o.id
        AND t.completed = FALSE
      ORDER BY
        COALESCE(t.due_date, '9999-12-31'::date) ASC,
        t.priority DESC,
        t.created_at ASC
      LIMIT 1
    ) AS next_task_title,

    -- Get next task due date
    (
      SELECT t.due_date
      FROM tasks t
      WHERE t.opportunity_id = o.id
        AND t.completed = FALSE
      ORDER BY
        COALESCE(t.due_date, '9999-12-31'::date) ASC,
        t.priority DESC,
        t.created_at ASC
      LIMIT 1
    ) AS next_task_due_date

  FROM opportunities o
  WHERE o.status = 'active'
    AND o.deleted_at IS NULL
    AND o.principal_organization_id IS NOT NULL
),

principal_aggregates AS (
  -- Aggregate metrics per principal
  SELECT
    po.principal_organization_id,
    po.account_manager_id,
    COUNT(po.opportunity_id) AS opportunity_count,

    -- Get most recent activity across all opportunities for this principal
    MAX(po.last_activity_date) AS most_recent_activity_date,

    -- Get the activity type from the most recent activity
    (
      SELECT po2.last_activity_type
      FROM principal_opportunities po2
      WHERE po2.principal_organization_id = po.principal_organization_id
        AND po2.account_manager_id = po.account_manager_id
        AND po2.last_activity_date = MAX(po.last_activity_date)
      LIMIT 1
    ) AS most_recent_activity_type,

    -- Calculate days since last activity (for status indicator)
    CASE
      WHEN MAX(po.last_activity_date) IS NOT NULL THEN
        EXTRACT(DAY FROM (NOW() - MAX(po.last_activity_date)))::INTEGER
      ELSE
        NULL
    END AS days_since_last_activity,

    -- Get the opportunity that's been stuck longest
    MAX(po.days_in_current_stage) AS max_days_in_stage,

    -- Get next task from any opportunity for this principal (highest priority)
    (
      SELECT po2.next_task_title
      FROM principal_opportunities po2
      WHERE po2.principal_organization_id = po.principal_organization_id
        AND po2.account_manager_id = po.account_manager_id
        AND po2.next_task_title IS NOT NULL
      ORDER BY
        COALESCE(po2.next_task_due_date, '9999-12-31'::date) ASC
      LIMIT 1
    ) AS next_action

  FROM principal_opportunities po
  GROUP BY po.principal_organization_id, po.account_manager_id
)

-- Final view with principal names and calculated indicators
SELECT
  pa.principal_organization_id AS id,
  po.name AS principal_name,
  pa.account_manager_id,
  pa.opportunity_count,
  pa.most_recent_activity_date AS last_activity_date,
  pa.most_recent_activity_type AS last_activity_type,
  pa.days_since_last_activity,

  -- Status indicator: Good (<= 7) | Warning (7-14) | Urgent (14+)
  CASE
    WHEN pa.days_since_last_activity IS NULL THEN 'urgent'
    WHEN pa.days_since_last_activity <= 7 THEN 'good'
    WHEN pa.days_since_last_activity <= 14 THEN 'warning'
    ELSE 'urgent'
  END AS status_indicator,

  pa.max_days_in_stage,

  -- Stuck indicator: TRUE if any opportunity stuck 30+ days
  CASE
    WHEN pa.max_days_in_stage >= 30 THEN TRUE
    ELSE FALSE
  END AS is_stuck,

  pa.next_action,

  -- For sorting: priority score (higher = more urgent)
  CASE
    WHEN pa.days_since_last_activity IS NULL THEN 300
    WHEN pa.days_since_last_activity > 14 THEN 200 + pa.days_since_last_activity
    WHEN pa.days_since_last_activity > 7 THEN 100 + pa.days_since_last_activity
    ELSE pa.days_since_last_activity
  END AS priority_score

FROM principal_aggregates pa
LEFT JOIN organizations po ON pa.principal_organization_id = po.id;

-- Add comment for documentation
COMMENT ON VIEW dashboard_principal_summary IS 'Aggregated principal metrics for the principal-centric dashboard. Pre-calculates status indicators, stuck flags, and next actions for each principal. Filters by account_manager_id and shows only active opportunities.';

-- Grant permissions
GRANT SELECT ON dashboard_principal_summary TO authenticated, anon;
