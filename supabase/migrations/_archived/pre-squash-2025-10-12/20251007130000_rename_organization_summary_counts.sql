-- Migration: Rename count columns in organizations_summary to match UI naming convention
-- Date: 2025-10-07
-- Description: Aligns database view with React Admin convention (nb_* prefix)
-- Single Source of Truth principle - UI uses nb_contacts/nb_opportunities pattern

-- Drop the existing view
DROP VIEW IF EXISTS organizations_summary;

-- Recreate with renamed columns
CREATE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.segment,
    o.priority,
    o.industry_id,
    o.annual_revenue,
    o.employee_count,
    o.created_at,
    count(DISTINCT opp.id) AS nb_opportunities,  -- RENAMED from opportunities_count
    count(DISTINCT co.contact_id) AS nb_contacts,  -- RENAMED from contacts_count
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
