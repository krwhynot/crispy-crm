/**
 * Phase 3: Create Compatibility Views
 *
 * This migration creates views that maintain backwards compatibility with
 * existing code while transitioning to the unified activities table.
 *
 * Views Created:
 * 1. tasks_v - Drop-in replacement for tasks table (read-only)
 * 2. entity_timeline - Simplified unified timeline (no more UNION ALL)
 *
 * Benefits:
 * - Existing task queries continue to work
 * - Timeline queries become simpler and faster
 * - Gradual migration path for UI components
 */

BEGIN;

-- ============================================================================
-- STEP 1: Create tasks_v compatibility view
-- ============================================================================
-- This view provides a tasks-like interface to the activities table.
-- Used for backwards compatibility during migration.
--
-- IMPORTANT: Uses security_invoker=true so RLS policies on activities
-- are applied when accessing through this view.

CREATE OR REPLACE VIEW tasks_v
WITH (security_invoker = true) AS
SELECT
  id,
  subject AS title,              -- activities.subject → tasks.title
  description,
  type::text AS type,            -- interaction_type → text (task_type was also text-like)
  due_date,
  reminder_date,
  completed,
  completed_at,
  priority,
  contact_id,
  organization_id,
  opportunity_id,
  sales_id,
  snooze_until,
  overdue_notified_at,
  created_by,
  created_at,
  updated_at,
  deleted_at
FROM activities
WHERE activity_type = 'task' AND deleted_at IS NULL;

COMMENT ON VIEW tasks_v IS
  'Compatibility view: Presents activities (type=task) as tasks table. Use for gradual migration. Read-only; writes go through activities.';

GRANT SELECT ON tasks_v TO authenticated;

-- ============================================================================
-- STEP 2: Create tasks_summary view (with joined names)
-- ============================================================================
-- Extended view with related entity names for list displays

CREATE OR REPLACE VIEW tasks_summary
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.subject AS title,
  a.description,
  a.type::text AS type,
  a.due_date,
  a.reminder_date,
  a.completed,
  a.completed_at,
  a.priority,
  a.contact_id,
  a.organization_id,
  a.opportunity_id,
  a.sales_id,
  a.snooze_until,
  a.overdue_notified_at,
  a.created_by,
  a.created_at,
  a.updated_at,

  -- Joined names for display
  COALESCE(c.first_name || ' ' || c.last_name, c.first_name, c.last_name) AS contact_name,
  org.name AS organization_name,
  opp.name AS opportunity_name,
  COALESCE(s.first_name || ' ' || s.last_name, s.first_name, s.email) AS assignee_name,
  s.email AS assignee_email,
  COALESCE(creator.first_name || ' ' || creator.last_name, creator.first_name, creator.email) AS creator_name

FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN organizations org ON a.organization_id = org.id
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id
LEFT JOIN sales s ON a.sales_id = s.id
LEFT JOIN sales creator ON a.created_by = creator.id
WHERE a.activity_type = 'task' AND a.deleted_at IS NULL;

COMMENT ON VIEW tasks_summary IS
  'Tasks with joined entity names for list/detail displays. Filters to activity_type=task only.';

GRANT SELECT ON tasks_summary TO authenticated;

-- ============================================================================
-- STEP 3: Update entity_timeline view
-- ============================================================================
-- SIMPLIFIED: Now pulls from a single table instead of UNION ALL
-- This is significantly faster and easier to maintain.

DROP VIEW IF EXISTS entity_timeline;

CREATE OR REPLACE VIEW entity_timeline
WITH (security_invoker = true) AS
SELECT
  id,
  CASE
    WHEN activity_type = 'task' THEN 'task'
    ELSE 'activity'
  END AS entry_type,
  type::text AS subtype,
  subject AS title,
  description,
  CASE
    WHEN activity_type = 'task' THEN due_date::timestamptz
    ELSE activity_date
  END AS entry_date,
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  sales_id,
  created_at,
  -- Task-specific fields (NULL for non-task entries)
  completed,
  completed_at,
  priority
FROM activities
WHERE deleted_at IS NULL
  -- Exclude snoozed tasks (they return when snooze period ends)
  AND (activity_type != 'task' OR snooze_until IS NULL OR snooze_until <= NOW());

COMMENT ON VIEW entity_timeline IS
  'Unified timeline from single activities table. entry_type: activity | task.
   Filter by contact_id, organization_id, or opportunity_id.
   Sort by entry_date DESC for chronological view.
   Snoozed tasks excluded until snooze period ends.';

GRANT SELECT ON entity_timeline TO authenticated;

-- ============================================================================
-- STEP 4: Create priority_tasks view for dashboard
-- ============================================================================
-- Shows urgent incomplete tasks sorted by priority and due date
-- DROP first because column names changed (task_id → id)

DROP VIEW IF EXISTS priority_tasks CASCADE;

CREATE OR REPLACE VIEW priority_tasks
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.subject AS title,
  a.description,
  a.type::text AS type,
  a.due_date,
  a.priority,
  a.sales_id,
  a.contact_id,
  a.organization_id,
  a.opportunity_id,
  a.created_at,

  -- Joined names
  COALESCE(c.first_name || ' ' || c.last_name, c.first_name) AS contact_name,
  org.name AS organization_name,
  opp.name AS opportunity_name,
  COALESCE(s.first_name || ' ' || s.last_name, s.email) AS assignee_name,

  -- Derived fields
  CASE
    WHEN a.due_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue,
  a.due_date - CURRENT_DATE AS days_until_due

FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN organizations org ON a.organization_id = org.id
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id
LEFT JOIN sales s ON a.sales_id = s.id
WHERE a.activity_type = 'task'
  AND a.deleted_at IS NULL
  AND COALESCE(a.completed, false) = false
  AND (a.snooze_until IS NULL OR a.snooze_until <= NOW())
ORDER BY
  CASE a.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END,
  a.due_date ASC NULLS LAST;

COMMENT ON VIEW priority_tasks IS
  'Incomplete tasks sorted by priority (critical→low) then due date. Excludes snoozed tasks.';

GRANT SELECT ON priority_tasks TO authenticated;

-- ============================================================================
-- STEP 5: Create activities_with_task_details view
-- ============================================================================
-- For API responses that need both activity and task fields

CREATE OR REPLACE VIEW activities_with_task_details
WITH (security_invoker = true) AS
SELECT
  a.*,
  -- Task indicator
  (a.activity_type = 'task') AS is_task,
  -- Computed task status
  CASE
    WHEN a.activity_type != 'task' THEN NULL
    WHEN a.completed THEN 'completed'
    WHEN a.due_date < CURRENT_DATE THEN 'overdue'
    WHEN a.snooze_until > NOW() THEN 'snoozed'
    ELSE 'active'
  END AS task_status
FROM activities a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW activities_with_task_details IS
  'Activities with computed task status. Use for API responses needing unified activity/task data.';

GRANT SELECT ON activities_with_task_details TO authenticated;

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
--
-- -- Check views exist:
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('tasks_v', 'tasks_summary', 'entity_timeline', 'priority_tasks', 'activities_with_task_details');
--
-- -- Verify tasks_v returns same count as migrated tasks:
-- SELECT
--   (SELECT COUNT(*) FROM tasks_v) AS tasks_v_count,
--   (SELECT COUNT(*) FROM activities WHERE activity_type = 'task' AND deleted_at IS NULL) AS activities_task_count;
--
-- -- Check entity_timeline entry types:
-- SELECT entry_type, COUNT(*)
-- FROM entity_timeline
-- GROUP BY entry_type;
--
-- -- Sample priority_tasks:
-- SELECT title, priority, due_date, is_overdue, days_until_due
-- FROM priority_tasks
-- LIMIT 10;
