-- Fix organizations_summary view to include parent_organization_id and parent_organization_name
-- These fields were added in migration 20251110142654 but have been overwritten
-- This migration restores the correct view definition with parent fields

-- Must drop and recreate to change column order
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,  -- Added for hierarchy support
  parent.name as parent_organization_name,  -- Added for hierarchy support
  o.priority,
  o.segment_id,
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,

  -- Direct counts (existing logic)
  COUNT(DISTINCT opp.id) AS nb_opportunities,
  COUNT(DISTINCT c.id) AS nb_contacts,
  MAX(opp.updated_at) AS last_opportunity_activity

FROM organizations o
  LEFT JOIN organizations parent ON o.parent_organization_id = parent.id  -- Added for hierarchy
  LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, parent.name;  -- Added parent.name to GROUP BY

-- Grant permissions
GRANT SELECT ON organizations_summary TO authenticated;

-- Add comment
COMMENT ON VIEW organizations_summary IS 'Organization summary with parent hierarchy fields for displaying parent-child relationships in the UI';

-- Verify the fix worked
DO $$
DECLARE
  has_parent_id BOOLEAN := false;
  has_parent_name BOOLEAN := false;
BEGIN
  -- Check if parent_organization_id exists in the view
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name = 'parent_organization_id'
  ) INTO has_parent_id;

  -- Check if parent_organization_name exists in the view
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name = 'parent_organization_name'
  ) INTO has_parent_name;

  IF has_parent_id AND has_parent_name THEN
    RAISE NOTICE 'SUCCESS: Parent fields have been added to organizations_summary view';
    RAISE NOTICE '  - parent_organization_id: EXISTS';
    RAISE NOTICE '  - parent_organization_name: EXISTS';
  ELSE
    RAISE EXCEPTION 'FAILED: Parent fields were not added correctly';
  END IF;
END $$;