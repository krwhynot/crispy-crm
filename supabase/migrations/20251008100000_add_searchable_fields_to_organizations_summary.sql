-- Migration: Add searchable text fields to organizations_summary view
-- Date: 2025-10-08
-- Description: Include phone, website, postal_code, city, state, and description in the view to enable full-text search

-- Drop the existing view
DROP VIEW IF EXISTS organizations_summary;

-- Recreate the view with searchable fields included
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
    opp.customer_organization_id = o.id OR
    opp.principal_organization_id = o.id OR
    opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Grant permissions
GRANT SELECT ON organizations_summary TO authenticated;
GRANT SELECT ON organizations_summary TO anon;

-- Add comment
COMMENT ON VIEW organizations_summary IS 'Denormalized view of organizations with counts and searchable fields. Includes phone, website, address fields for full-text search support.';
