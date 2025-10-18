-- Remove unused organization fields that have no corresponding UI inputs
-- Following Engineering Constitution #5: UI as source of truth

-- Drop employee_count, annual_revenue, and founded_year columns from organizations table
-- These fields have no input forms in the UI and should not exist in the database

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS organizations_summary;

-- Step 2: Drop the columns
ALTER TABLE organizations
  DROP COLUMN IF EXISTS employee_count,
  DROP COLUMN IF EXISTS annual_revenue,
  DROP COLUMN IF EXISTS founded_year;

-- Step 3: Recreate the view without the dropped columns
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
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
