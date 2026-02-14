/**
 * Update dashboard_principal_summary View - Add Full Task Object
 *
 * Purpose: Add `next_action_task` field containing the complete task object as JSONB.
 * This enables the quick actions modal to access all task properties without additional queries.
 *
 * Changes:
 * - Add `next_action_task` JSONB column containing the full task object
 * - Keep existing `next_action` string for backward compatibility
 * - Add indexes for performance optimization
 *
 * Feature: Dashboard Quick Actions
 * Design Doc: docs/archive/plans/2025-11-10-dashboard-quick-actions-design.md
 */

-- Drop existing view
DROP VIEW IF EXISTS dashboard_principal_summary;

-- Recreate view with full task object
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
    ) AS next_task_due_date,

    -- NEW: Get full task object as JSONB
    (
      SELECT row_to_json(t.*)::jsonb
      FROM tasks t
      WHERE t.opportunity_id = o.id
        AND t.completed = FALSE
      ORDER BY
        COALESCE(t.due_date, '9999-12-31'::date) ASC,
        t.priority DESC,
        t.created_at ASC
      LIMIT 1
    ) AS next_task_object

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

    -- Get next task title (backward compatibility)
    (
      SELECT po2.next_task_title
      FROM principal_opportunities po2
      WHERE po2.principal_organization_id = po.principal_organization_id
        AND po2.account_manager_id = po.account_manager_id
        AND po2.next_task_title IS NOT NULL
      ORDER BY
        COALESCE(po2.next_task_due_date, '9999-12-31'::date) ASC
      LIMIT 1
    ) AS next_action,

    -- NEW: Get full task object (for quick actions modal)
    (
      SELECT po2.next_task_object
      FROM principal_opportunities po2
      WHERE po2.principal_organization_id = po.principal_organization_id
        AND po2.account_manager_id = po.account_manager_id
        AND po2.next_task_object IS NOT NULL
      ORDER BY
        COALESCE(po2.next_task_due_date, '9999-12-31'::date) ASC
      LIMIT 1
    ) AS next_action_task

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
  pa.next_action_task,  -- NEW: Full task object as JSONB

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
COMMENT ON VIEW dashboard_principal_summary IS 'Aggregated principal metrics for the principal-centric dashboard. Pre-calculates status indicators, stuck flags, next actions, and full task objects. Filters by account_manager_id and shows only active opportunities. The next_action_task field contains the complete task object as JSONB for quick actions functionality.';

-- Grant permissions
GRANT SELECT ON dashboard_principal_summary TO authenticated, anon;

-- Add related_task_id column to activities table (for linking activities to completed tasks)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS related_task_id BIGINT
  REFERENCES tasks(id) ON DELETE SET NULL;

COMMENT ON COLUMN activities.related_task_id IS 'Optional reference to the task that prompted this activity. Used by quick actions workflow to link activities created when completing tasks.';

-- Add indexes for performance optimization
-- Index for activities lookup (opportunity_id + created_at for DESC sort)
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id_activity_date
  ON activities(opportunity_id, activity_date DESC)
  WHERE deleted_at IS NULL;

-- Index for tasks lookup (opportunity_id + completed + due_date for sorting)
CREATE INDEX IF NOT EXISTS idx_tasks_opportunity_completed_due_date
  ON tasks(opportunity_id, completed, due_date ASC NULLS LAST, priority DESC)
  WHERE completed = FALSE;

-- Index for activities related to tasks (for linking activity to task after completion)
CREATE INDEX IF NOT EXISTS idx_activities_related_task_id
  ON activities(related_task_id)
  WHERE deleted_at IS NULL;
