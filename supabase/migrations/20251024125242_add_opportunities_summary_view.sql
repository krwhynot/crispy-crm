-- Create opportunities_summary view for activity log
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
  o.*,
  cust_org.name as customer_organization_name,
  prin_org.name as principal_organization_name,
  dist_org.name as distributor_organization_name
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;

-- Grant permissions
GRANT SELECT ON opportunities_summary TO authenticated, anon;
