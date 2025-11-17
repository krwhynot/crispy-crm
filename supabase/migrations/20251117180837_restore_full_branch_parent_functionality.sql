-- Restore Full Branch and Parent Organization Functionality
-- This migration restores the complete hierarchy system with both parent relationships
-- and branch counting/management features

-- Drop and recreate the organizations_summary view with branch counting fields
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name AS parent_organization_name,
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

  -- Branch counting fields
  (SELECT COUNT(*)
   FROM organizations children
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL) AS child_branch_count,

  -- Total contacts across all branches
  (SELECT COUNT(DISTINCT c.id)
   FROM organizations children
   LEFT JOIN contacts c ON c.organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND c.deleted_at IS NULL) AS total_contacts_across_branches,

  -- Total opportunities across all branches
  (SELECT COUNT(DISTINCT opp.id)
   FROM organizations children
   LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND opp.deleted_at IS NULL) AS total_opportunities_across_branches,

  -- Direct relationships (not branch aggregates)
  (SELECT COUNT(*)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS nb_opportunities,

  (SELECT COUNT(*)
   FROM contacts
   WHERE contacts.organization_id = o.id
   AND contacts.deleted_at IS NULL) AS nb_contacts,

  (SELECT MAX(opportunities.updated_at)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS last_opportunity_activity

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

-- Grant permissions on the view
GRANT SELECT ON organizations_summary TO authenticated;
GRANT SELECT ON organizations_summary TO anon;

-- Add cycle prevention function
CREATE OR REPLACE FUNCTION check_organization_cycle()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for self-reference
  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent';
  END IF;

  -- Check for circular reference
  IF NEW.parent_organization_id IS NOT NULL THEN
    -- Check if the new parent is a descendant of this organization
    IF EXISTS (
      WITH RECURSIVE hierarchy AS (
        SELECT id, parent_organization_id
        FROM organizations
        WHERE id = NEW.parent_organization_id

        UNION ALL

        SELECT o.id, o.parent_organization_id
        FROM organizations o
        JOIN hierarchy h ON o.parent_organization_id = h.id
      )
      SELECT 1 FROM hierarchy WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected: Organization % would create a cycle', NEW.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent cycles
DROP TRIGGER IF EXISTS check_organization_cycle ON organizations;
CREATE TRIGGER check_organization_cycle
  BEFORE INSERT OR UPDATE OF parent_organization_id ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION check_organization_cycle();

-- Add function to prevent deletion of organizations with branches
CREATE OR REPLACE FUNCTION prevent_parent_organization_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organizations
    WHERE parent_organization_id = OLD.id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization % because it has active branches', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent parent deletion
DROP TRIGGER IF EXISTS prevent_parent_deletion ON organizations;
CREATE TRIGGER prevent_parent_deletion
  BEFORE DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_parent_organization_deletion();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Full branch and parent functionality restored';
  RAISE NOTICE '  - child_branch_count field: ADDED';
  RAISE NOTICE '  - total_contacts_across_branches field: ADDED';
  RAISE NOTICE '  - total_opportunities_across_branches field: ADDED';
  RAISE NOTICE '  - Cycle prevention: ENABLED';
  RAISE NOTICE '  - Parent deletion protection: ENABLED';
END $$;