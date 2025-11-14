-- Temporary SQL file to create missing views in Supabase Cloud

-- Create principal_opportunities view
CREATE OR REPLACE VIEW principal_opportunities AS
SELECT
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,
  o.customer_organization_id,
  org.name as customer_name,
  p.id as principal_id,
  p.name as principal_name,
  -- Calculate days since last activity
  EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 as days_since_activity,
  -- Status indicator based on activity recency
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 7 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status
FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
WHERE o.deleted_at IS NULL
  AND o.stage != 'closed_lost'
  AND p.organization_type = 'principal'
ORDER BY p.name, o.stage;

-- Grant access to authenticated users
GRANT SELECT ON principal_opportunities TO authenticated;

-- Create priority_tasks view
CREATE OR REPLACE VIEW priority_tasks AS
SELECT
  t.id as task_id,
  t.title,
  t.description,
  t.due_date,
  t.priority,
  t.type,
  t.completed,
  t.opportunity_id,
  o.name as opportunity_name,
  o.principal_organization_id,
  p.name as principal_name,
  s.first_name || ' ' || s.last_name as assignee_name,
  -- Priority score for sorting
  CASE t.priority
    WHEN 'critical' THEN 4
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    ELSE 1
  END as priority_score
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN sales s ON t.sales_id = s.id
WHERE t.deleted_at IS NULL
  AND t.completed = false
ORDER BY priority_score DESC, t.due_date ASC NULLS LAST;

-- Grant access to authenticated users
GRANT SELECT ON priority_tasks TO authenticated;
