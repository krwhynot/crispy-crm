-- Remove 'partner' from organization_type enum values
-- This migration updates the database constraints to remove the 'partner' organization type
-- and migrates all existing partner records to their closest semantic equivalent

-- Step 1: Migrate existing 'partner' organization records to 'prospect'
-- This is safe as 'prospect' is the closest semantic equivalent to 'partner'
-- Partner relationships in opportunities will be handled via Principal/Distributor
UPDATE companies
SET organization_type = 'prospect',
    updated_at = NOW()
WHERE organization_type = 'partner';

-- Step 2: Migrate any existing 'partner' opportunity participant roles to 'principal'
-- This is safe as 'principal' is the primary partner concept in the B2B relationship model
UPDATE opportunity_participants
SET role = 'principal',
    updated_at = NOW()
WHERE role = 'partner';

-- Step 3: Update the check constraint for companies.organization_type
-- Drop the old constraint and recreate it without 'partner'
ALTER TABLE companies
DROP CONSTRAINT IF EXISTS companies_organization_type_check;

ALTER TABLE companies
ADD CONSTRAINT companies_organization_type_check
CHECK (organization_type = ANY(ARRAY['customer', 'prospect', 'principal', 'distributor', 'unknown']));

-- Step 4: Update the check constraint for opportunity_participants.role
-- Remove 'partner' from the role options (keep only: customer, principal, distributor, competitor)
ALTER TABLE opportunity_participants
DROP CONSTRAINT IF EXISTS opportunity_participants_role_check;

ALTER TABLE opportunity_participants
ADD CONSTRAINT opportunity_participants_role_check
CHECK (role = ANY(ARRAY['customer', 'principal', 'distributor', 'competitor']));
