-- Remove 'partner' from organization_type enum values
-- This migration updates the database constraints to remove the 'partner' organization type

-- Update the check constraint for companies.organization_type
-- First, we need to drop the old constraint and recreate it
ALTER TABLE companies
DROP CONSTRAINT IF EXISTS companies_organization_type_check;

ALTER TABLE companies
ADD CONSTRAINT companies_organization_type_check 
CHECK (organization_type = ANY(ARRAY['customer', 'prospect', 'principal', 'distributor', 'unknown']));

-- Update the check constraint for opportunity_participants.role
-- Remove 'partner' from the role options (keep only: customer, principal, distributor, competitor)
ALTER TABLE opportunity_participants
DROP CONSTRAINT IF EXISTS opportunity_participants_role_check;

ALTER TABLE opportunity_participants
ADD CONSTRAINT opportunity_participants_role_check 
CHECK (role = ANY(ARRAY['customer', 'principal', 'distributor', 'competitor']));

-- Data migration: Convert any existing 'partner' organization types to 'prospect'
-- This is safe as 'prospect' is the closest semantic equivalent
UPDATE companies 
SET organization_type = 'prospect' 
WHERE organization_type = 'partner';

-- Data migration: Convert any existing 'partner' opportunity participant roles to 'principal'
-- This is safe as 'principal' is the primary partner concept in the new system
UPDATE opportunity_participants 
SET role = 'principal' 
WHERE role = 'partner';
