-- Migration: Remove deprecated organization boolean flags
-- Phase 1: Clean up legacy columns replaced by organization_type enum
-- Created: 2025-10-18
--
-- Context: is_principal and is_distributor were replaced by the organization_type enum
-- which provides better type safety and eliminates redundant boolean flags.

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS organizations_summary;

-- Step 2: Remove deprecated boolean flags from organizations table
ALTER TABLE organizations
  DROP COLUMN IF EXISTS is_principal,
  DROP COLUMN IF EXISTS is_distributor;

-- Step 3: Recreate the view without the deprecated columns
CREATE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.segment_id,
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
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
) AND opp.deleted_at IS NULL
LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Set proper ownership and permissions (per zen feedback)
ALTER VIEW organizations_summary OWNER TO postgres;
GRANT SELECT ON organizations_summary TO authenticated;
GRANT SELECT ON organizations_summary TO service_role;
GRANT SELECT ON organizations_summary TO anon;

-- Add comment documenting the view
COMMENT ON VIEW organizations_summary IS 'Denormalized view of organizations with counts and searchable fields.';
