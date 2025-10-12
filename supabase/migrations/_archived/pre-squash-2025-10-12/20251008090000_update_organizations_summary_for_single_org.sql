-- Migration: Update organizations_summary view to use direct organization_id relationship
-- Date: 2025-10-08
-- Description: Replace contact_organizations junction table with direct contacts.organization_id field

-- Drop the existing view
DROP VIEW IF EXISTS organizations_summary;

-- Recreate the view with updated contact count logic
CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.is_principal,
  o.is_distributor,
  o.priority,
  o.segment_id,
  o.annual_revenue,
  o.employee_count,
  o.created_at,
  COUNT(DISTINCT opp.id) AS nb_opportunities,
  COUNT(DISTINCT c.id) AS nb_contacts,
  MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
  LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id OR
    opp.principal_organization_id = o.id OR
    opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Add comment to document the change
COMMENT ON VIEW organizations_summary IS 'Denormalized view of organizations with counts. Uses direct contacts.organization_id relationship (not junction table).';
