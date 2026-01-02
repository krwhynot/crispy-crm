-- Migration: Remove 'operator' from organization_type enum
-- This removes the redundant 'operator' type while preserving operator segments
-- for categorizing customers/prospects by restaurant type.
--
-- Background: In MFB's domain model, "operators" (restaurants/foodservice) are
-- effectively customers. The operator SEGMENTS (Full-Service, Quick Service, etc.)
-- remain useful for categorization, but the separate organization TYPE is redundant.

-- Step 1: Migrate any existing 'operator' records to 'customer'
-- (Operators ARE customers in the business domain)
UPDATE organizations
SET organization_type = 'customer'
WHERE organization_type = 'operator';

-- Step 2: Drop the DEFAULT constraint (required before type change)
-- PostgreSQL can't auto-cast the default value during enum type change
ALTER TABLE organizations
  ALTER COLUMN organization_type DROP DEFAULT;

-- Step 3: Drop dependent view (will be recreated after type change)
DROP VIEW IF EXISTS authorization_status;

-- Step 4: Create new enum without 'operator'
CREATE TYPE organization_type_new AS ENUM ('customer', 'prospect', 'principal', 'distributor');

-- Step 5: Alter column to use new enum
-- The USING clause handles the type conversion
ALTER TABLE organizations
  ALTER COLUMN organization_type TYPE organization_type_new
  USING organization_type::text::organization_type_new;

-- Step 6: Drop old enum and rename new one
DROP TYPE organization_type;
ALTER TYPE organization_type_new RENAME TO organization_type;

-- Step 7: Re-add the DEFAULT constraint with new enum type
ALTER TABLE organizations
  ALTER COLUMN organization_type SET DEFAULT 'prospect'::organization_type;

-- Step 8: Recreate the authorization_status view
CREATE VIEW authorization_status AS
SELECT
    dpa.id AS authorization_id,
    dpa.distributor_id,
    d.name AS distributor_name,
    d.organization_type = 'distributor'::organization_type AS is_distributor,
    dpa.principal_id,
    p.name AS principal_name,
    p.organization_type = 'principal'::organization_type AS is_principal,
    dpa.is_authorized,
    dpa.authorization_date,
    dpa.expiration_date,
    dpa.territory_restrictions,
    dpa.notes,
    CASE
        WHEN dpa.is_authorized = false THEN false
        WHEN dpa.deleted_at IS NOT NULL THEN false
        WHEN dpa.expiration_date IS NOT NULL AND dpa.expiration_date < CURRENT_DATE THEN false
        ELSE true
    END AS is_currently_valid,
    dpa.created_at,
    dpa.updated_at,
    dpa.deleted_at
FROM distributor_principal_authorizations dpa
LEFT JOIN organizations d ON dpa.distributor_id = d.id
LEFT JOIN organizations p ON dpa.principal_id = p.id
WHERE dpa.deleted_at IS NULL;

-- Add comment documenting the change
COMMENT ON TYPE organization_type IS 'Organization classification: customer (active buyer), prospect (potential), principal (manufacturer), distributor (warehouse/delivery partner). Note: operator segments still exist for restaurant categorization.';
