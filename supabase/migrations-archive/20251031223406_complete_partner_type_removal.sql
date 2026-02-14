-- Complete removal of 'partner' from organization_type enum
-- This completes the work started in 20251019000000_remove_partner_organization_type.sql
-- That migration cleaned up data and constraints but didn't remove the enum value itself

-- Verify no organizations are using 'partner' type (should be 0 after previous migration)
DO $$
DECLARE
  partner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO partner_count
  FROM organizations
  WHERE organization_type = 'partner';

  IF partner_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove partner type: % organizations still use it', partner_count;
  END IF;
END $$;

-- Step 1: Create new enum type without 'partner'
CREATE TYPE organization_type_new AS ENUM (
  'customer',
  'principal',
  'distributor',
  'prospect',
  'unknown'
);

-- Step 2: Drop dependent views (will be recreated after type change)
DROP VIEW IF EXISTS organizations_summary;
DROP VIEW IF EXISTS organizations_with_account_manager;

-- Step 3: Drop indexes that reference the organization_type enum
DROP INDEX IF EXISTS idx_companies_organization_type;
DROP INDEX IF EXISTS idx_organizations_type_distributor;
DROP INDEX IF EXISTS idx_organizations_type_principal;

-- Step 4: Drop default constraint (it references the old enum)
ALTER TABLE organizations
  ALTER COLUMN organization_type DROP DEFAULT;

-- Step 5: Migrate organizations table to use new type
ALTER TABLE organizations
  ALTER COLUMN organization_type TYPE organization_type_new
  USING organization_type::text::organization_type_new;

-- Step 6: Restore default constraint with new enum
ALTER TABLE organizations
  ALTER COLUMN organization_type SET DEFAULT 'unknown'::organization_type_new;

-- Step 7: Drop old enum type and rename new one
DROP TYPE organization_type;
ALTER TYPE organization_type_new RENAME TO organization_type;

-- Step 8: Update default to use final type name
ALTER TABLE organizations
  ALTER COLUMN organization_type SET DEFAULT 'unknown'::organization_type;

-- Step 9: Recreate indexes on organization_type
CREATE INDEX idx_companies_organization_type
  ON organizations USING btree (organization_type);

CREATE INDEX idx_organizations_type_distributor
  ON organizations USING btree (organization_type)
  WHERE organization_type = 'distributor';

CREATE INDEX idx_organizations_type_principal
  ON organizations USING btree (organization_type)
  WHERE organization_type = 'principal';

-- Step 10: Recreate organizations_summary view with updated type
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
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
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Step 11: Recreate organizations_with_account_manager view with updated type
CREATE OR REPLACE VIEW organizations_with_account_manager AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
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
  o.annual_revenue,
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

-- Verification query (run after migration to confirm)
-- SELECT enumlabel FROM pg_enum
-- JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
-- WHERE typname = 'organization_type'
-- ORDER BY enumsortorder;
-- Expected: customer, principal, distributor, prospect, unknown (5 values only)
