-- Create view for priority tasks grouped by principal
-- Includes all incomplete tasks that are either:
-- - Due within 7 days, OR
-- - High/Critical priority
-- Filtered to principal organizations only

CREATE OR REPLACE VIEW priority_tasks AS
SELECT
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,
  t.opportunity_id,
  o.name as opportunity_name,
  o.customer_organization_id as organization_id,
  org.name as customer_name,
  o.principal_organization_id,
  p.name as principal_name,
  c.id as contact_id,
  c.name as contact_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
  AND p.organization_type = 'principal'
ORDER BY t.priority DESC, t.due_date ASC NULLS LAST;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON priority_tasks TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW priority_tasks IS 'Aggregates high-priority and near-due tasks grouped by principal organization for the Principal Dashboard';
