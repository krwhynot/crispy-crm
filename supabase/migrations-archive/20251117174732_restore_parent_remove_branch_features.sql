-- Restore parent_organization_id but remove branch counting features
-- This migration:
-- 1. Re-adds parent_organization_id column for parent relationships
-- 2. Removes branch counting and branch-specific features
-- 3. Keeps parent relationships without the branch management complexity

BEGIN;

-- 1. Re-add parent_organization_id column if it doesn't exist
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS parent_organization_id BIGINT REFERENCES organizations(id);

-- 2. Re-create foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organizations_parent_organization_id_fkey'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_parent_organization_id_fkey
    FOREIGN KEY (parent_organization_id)
    REFERENCES organizations(id);
  END IF;
END $$;

-- 3. Update organizations_summary view to include parent info but NOT branch counts
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,  -- Include parent reference
  parent.name as parent_organization_name,  -- Include parent name for display
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
  -- NO child_branch_count - we don't want branch counting features
  COUNT(DISTINCT opp.id) AS nb_opportunities,
  COUNT(DISTINCT c.id) AS nb_contacts,
  MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
  LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
  LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, parent.name;

-- Grant permissions on the updated view
GRANT SELECT ON organizations_summary TO authenticated;

-- 4. Update organizations_with_account_manager view to include parent but not branches
DROP VIEW IF EXISTS organizations_with_account_manager;

CREATE VIEW organizations_with_account_manager AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,  -- Keep parent reference
  o.priority,
  o.website,
  o.address,
  o.city,
  o.state,
  o.postal_code,
  o.phone,
  o.email,
  o.logo_url,
  o.linkedin_url,
  o.employee_count,
  o.founded_year,
  o.notes,
  o.sales_id,
  o.created_at,
  o.updated_at,
  o.created_by,
  o.deleted_at,
  o.import_session_id,
  o.search_tsv,
  o.context_links,
  o.description,
  o.tax_identifier,
  o.segment_id,
  o.updated_by,
  COALESCE(s.first_name || COALESCE(' ' || s.last_name, ''), 'Unassigned') AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM organizations o
  LEFT JOIN sales s ON o.sales_id = s.id;

-- 5. Add simple cycle prevention (without branch features)
CREATE OR REPLACE FUNCTION check_organization_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_organization_id IS NOT NULL THEN
    -- Prevent self-reference
    IF NEW.id = NEW.parent_organization_id THEN
      RAISE EXCEPTION 'Organization cannot be its own parent';
    END IF;

    -- Prevent circular reference (parent's parent is this org)
    IF EXISTS (
      SELECT 1 FROM organizations
      WHERE id = NEW.parent_organization_id
      AND parent_organization_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected: parent organization already references this organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cycle prevention
DROP TRIGGER IF EXISTS check_organization_cycle ON organizations;
CREATE TRIGGER check_organization_cycle
  BEFORE INSERT OR UPDATE OF parent_organization_id ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION check_organization_cycle();

-- Add comment
COMMENT ON COLUMN organizations.parent_organization_id IS 'Reference to parent organization for hierarchical relationships';
COMMENT ON VIEW organizations_summary IS 'Organization summary with parent relationship (branch counting removed)';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'parent_organization_id'
  ) THEN
    RAISE NOTICE 'SUCCESS: parent_organization_id column restored';
  ELSE
    RAISE EXCEPTION 'FAILED: parent_organization_id column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name = 'child_branch_count'
  ) THEN
    RAISE NOTICE 'SUCCESS: child_branch_count removed from view';
  ELSE
    RAISE EXCEPTION 'FAILED: child_branch_count still exists in view';
  END IF;
END $$;

COMMIT;