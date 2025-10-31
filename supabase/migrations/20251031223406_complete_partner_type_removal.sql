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

-- Step 2: Migrate organizations table to use new type
ALTER TABLE organizations
  ALTER COLUMN organization_type TYPE organization_type_new
  USING organization_type::text::organization_type_new;

-- Step 3: Drop old enum type and rename new one
DROP TYPE organization_type;
ALTER TYPE organization_type_new RENAME TO organization_type;

-- Verification query (run after migration to confirm)
-- SELECT enumlabel FROM pg_enum
-- JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
-- WHERE typname = 'organization_type'
-- ORDER BY enumsortorder;
-- Expected: customer, principal, distributor, prospect, unknown (5 values only)
