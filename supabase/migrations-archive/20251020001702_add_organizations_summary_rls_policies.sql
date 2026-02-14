-- Fix organizations_summary view to respect RLS policies
-- Views in PostgreSQL don't have their own RLS policies, but can use security_invoker
-- to execute with the calling user's permissions, which respects the underlying table's RLS

-- Drop the existing view
DROP VIEW IF EXISTS organizations_summary;

-- Recreate the view with security_invoker = true
-- This makes the view execute queries with the permissions of the user calling it,
-- which means the organizations table's RLS policies will be enforced
CREATE VIEW organizations_summary
WITH (security_invoker = true)
AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.segment_id,
    o.annual_revenue,
    o.employee_count,
    o.phone,
    o.website,
    o.postal_code,
    o.city,
    o.state,
    o.description,
    o.created_at,
    COUNT(DISTINCT opp.id) AS nb_opportunities,
    COUNT(DISTINCT c.id) AS nb_contacts,
    MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    (opp.customer_organization_id = o.id OR
     opp.principal_organization_id = o.id OR
     opp.distributor_organization_id = o.id)
    AND opp.deleted_at IS NULL
)
LEFT JOIN contacts c ON (
    c.organization_id = o.id
    AND c.deleted_at IS NULL
)
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON organizations_summary TO authenticated;

COMMENT ON VIEW organizations_summary IS
    'Aggregated view of organizations with counts. Uses security_invoker to enforce RLS from underlying organizations table.';
