-- supabase/migrations/20251113235406_principal_opportunities_view.sql
CREATE OR REPLACE VIEW principal_opportunities AS
SELECT
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,
  o.organization_id,
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
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN organizations p ON o.principal_id = p.id
WHERE o.deleted_at IS NULL
  AND o.stage != 'Closed Lost'
  AND p.org_type = 'principal'
ORDER BY p.name, o.stage;

-- Grant access
GRANT SELECT ON principal_opportunities TO authenticated;
