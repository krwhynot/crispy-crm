-- Remove segment field from organizations table
-- Field was not actively used and adds unnecessary complexity

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS organizations_summary;

-- Step 2: Drop the segment column
ALTER TABLE organizations
DROP COLUMN IF EXISTS segment;

-- Step 3: Recreate the view without segment
CREATE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.priority,
    o.industry_id,
    o.annual_revenue,
    o.employee_count,
    o.created_at,
    count(DISTINCT opp.id) AS nb_opportunities,
    count(DISTINCT co.contact_id) AS nb_contacts,
    max(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
) AND opp.deleted_at IS NULL
LEFT JOIN contact_organizations co ON co.organization_id = o.id AND co.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

COMMENT ON VIEW organizations_summary IS
'Denormalized view of organizations with aggregated counts. Uses nb_* prefix to match React Admin UI convention.';
