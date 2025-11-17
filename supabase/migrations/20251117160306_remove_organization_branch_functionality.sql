-- Remove organization branch/hierarchy functionality
-- This migration removes parent_organization_id and all related branch features

BEGIN;

-- 1. Drop ALL triggers that might reference parent_organization_id
DROP TRIGGER IF EXISTS prevent_organization_cycles ON organizations;
DROP TRIGGER IF EXISTS check_organization_cycle ON organizations;
DROP TRIGGER IF EXISTS prevent_parent_deletion ON organizations;

-- 2. Drop the associated functions
DROP FUNCTION IF EXISTS check_organization_hierarchy_cycle();
DROP FUNCTION IF EXISTS check_organization_cycle();
DROP FUNCTION IF EXISTS prevent_parent_organization_deletion();

-- 3. Drop any diagnostic/temporary views
DROP VIEW IF EXISTS organization_hierarchy_phase1_cleanup;

-- 4. Update organizations_summary view to remove branch fields
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
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

-- Grant permissions on the updated view
GRANT SELECT ON organizations_summary TO authenticated;

-- 5. Update organizations_with_account_manager view if it exists
DROP VIEW IF EXISTS organizations_with_account_manager;

CREATE VIEW organizations_with_account_manager AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  -- parent_organization_id removed
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

-- 6. Drop the foreign key constraint on parent_organization_id
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_parent_organization_id_fkey;

-- 7. Drop the parent_organization_id column
ALTER TABLE organizations
  DROP COLUMN IF EXISTS parent_organization_id;

-- 8. Add comment about removal
COMMENT ON TABLE organizations IS 'Organizations table - branch hierarchy functionality removed 2025-11-17';
COMMENT ON VIEW organizations_summary IS 'Organization summary view - branch metrics removed 2025-11-17';

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
    RAISE EXCEPTION 'FAILED: parent_organization_id column still exists';
  ELSE
    RAISE NOTICE 'SUCCESS: parent_organization_id column removed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name IN ('parent_organization_id', 'parent_organization_name', 'child_branch_count')
  ) THEN
    RAISE EXCEPTION 'FAILED: Branch fields still exist in organizations_summary';
  ELSE
    RAISE NOTICE 'SUCCESS: Branch fields removed from organizations_summary';
  END IF;
END $$;

COMMIT;