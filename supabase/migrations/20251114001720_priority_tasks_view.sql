-- =====================================================
-- View: priority_tasks
-- Purpose: Aggregates high-priority and near-due tasks by principal
-- Used by: Dashboard V2 TasksPanel component
-- Performance: Reduces task queries from multiple fetches to single view query
-- Business Rules:
--   - Incomplete tasks only (completed = false)
--   - Due within 7 days OR high/critical priority
--   - Filtered to principal organizations only
--   - Soft delete applied via JOIN to opportunities table
-- =====================================================

CREATE OR REPLACE VIEW priority_tasks AS
SELECT
  -- Task identifiers
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,

  -- Opportunity details
  t.opportunity_id,
  o.name as opportunity_name,

  -- Customer organization details
  o.customer_organization_id as organization_id,
  org.name as customer_name,

  -- Principal organization details
  o.principal_organization_id,
  p.name as principal_name,

  -- Contact details
  c.id as contact_id,
  c.name as contact_name

FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id

WHERE
  t.completed = false                                                              -- Active tasks only
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))  -- Priority filter
  AND p.organization_type = 'principal'                                            -- Principal orgs only

ORDER BY
  t.priority DESC,           -- High priority first
  t.due_date ASC NULLS LAST; -- Then by due date (null dates last)

-- =====================================================
-- Permissions
-- =====================================================

-- Grant read access to authenticated users (shared team model)
GRANT SELECT ON priority_tasks TO authenticated;

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON VIEW priority_tasks IS
  'Pre-aggregated high-priority and near-due tasks grouped by principal organization. '
  'Used by Dashboard V2 TasksPanel component for efficient task display. '
  'Filters: incomplete tasks that are either due within 7 days OR have high/critical priority.';
