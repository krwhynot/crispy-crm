-- =====================================================
-- Migration: Add sales_id to Dashboard Views
-- Purpose: Enable assignee filter in Dashboard V2
-- Issue: OpportunitiesHierarchy and TasksPanel need to filter by sales rep
-- Solution: Expose o.sales_id and t.sales_id in views
-- Date: 2025-11-16
-- Tracking: docs/archive/plans/2025-01-15-assignee-filter-migration-tracker.md
-- =====================================================

-- =====================================================
-- View: principal_opportunities (updated)
-- Changes: Added o.sales_id for assignee filtering
-- Note: Must DROP and recreate to add column
-- =====================================================

DROP VIEW IF EXISTS principal_opportunities;

CREATE VIEW principal_opportunities AS
SELECT
  -- React Admin required field
  o.id,

  -- Opportunity identifiers
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,

  -- Customer organization details
  o.customer_organization_id,
  org.name as customer_name,

  -- Principal organization details
  p.id as principal_id,
  p.name as principal_name,

  -- Sales rep assignment (NEW - for assignee filter)
  o.opportunity_owner_id as sales_id,

  -- Activity metrics
  EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 as days_since_activity,

  -- Health status indicator (calculated field)
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 7 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status

FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id

WHERE
  o.deleted_at IS NULL                    -- Soft delete filter (applied in query, not policy)
  AND o.stage != 'closed_lost'            -- Exclude lost opportunities
  AND p.organization_type = 'principal'   -- Only principal organizations

ORDER BY p.name, o.stage;

-- =====================================================
-- View: priority_tasks (updated)
-- Changes: Added t.sales_id for assignee filtering
-- Note: Must DROP and recreate to add column
-- =====================================================

DROP VIEW IF EXISTS priority_tasks;

CREATE VIEW priority_tasks AS
SELECT
  -- React Admin required field
  t.id,

  -- Task identifiers
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,

  -- Sales rep assignment (NEW - for assignee filter)
  t.sales_id,

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

-- Re-grant access after view recreation
GRANT SELECT ON principal_opportunities TO authenticated;
GRANT SELECT ON priority_tasks TO authenticated;

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON VIEW principal_opportunities IS
  'Pre-aggregated opportunities by principal organization with health status indicators. '
  'Replaces client-side filtering in Dashboard V2 OpportunitiesHierarchy component. '
  'Performance: ~50ms query time vs 500ms for full dataset fetch + client processing. '
  'Note: Exposes both id (React Admin) and opportunity_id (semantic) columns. '
  'NEW: Includes sales_id for assignee filtering.';

COMMENT ON VIEW priority_tasks IS
  'Pre-aggregated high-priority and near-due tasks grouped by principal organization. '
  'Used by Dashboard V2 TasksPanel component for efficient task display. '
  'Filters: incomplete tasks that are either due within 7 days OR have high/critical priority. '
  'Note: Exposes both id (React Admin) and task_id (semantic) columns. '
  'NEW: Includes sales_id for assignee filtering.';
