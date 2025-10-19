-- Remove 'partner' from organization_type enum values
-- This migration updates the enum type to remove 'partner' and migrates existing records
-- PostgreSQL doesn't allow removing enum values directly, so we must create a new type

-- Step 1: Migrate existing 'partner' organization records to 'prospect' BEFORE type change
-- This is safe as 'prospect' is the closest semantic equivalent to 'partner'
UPDATE organizations
SET organization_type = 'prospect'::organization_type,
    updated_at = NOW()
WHERE organization_type = 'partner'::organization_type;

-- Step 2: Migrate any existing 'partner' opportunity participant roles to 'principal'
-- This is safe as 'principal' is the primary partner concept in the B2B relationship model
UPDATE opportunity_participants
SET role = 'principal'::"text",
    updated_at = NOW()
WHERE role = 'partner'::"text";

-- Step 3: Remove 'partner' from opportunities.lead_source enum by recreating the type
-- First, create new enum without 'partner'
CREATE TYPE "public"."lead_source_type_new" AS ENUM (
    'referral',
    'trade_show',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'existing_customer'
);

-- Alter the column to use text temporarily
ALTER TABLE opportunities ALTER COLUMN lead_source TYPE text;

-- Drop the old enum
DROP TYPE "public"."lead_source_type";

-- Create new enum with correct name
CREATE TYPE "public"."lead_source_type" AS ENUM (
    'referral',
    'trade_show',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'existing_customer'
);

-- Convert column back to new enum type
ALTER TABLE opportunities ALTER COLUMN lead_source TYPE "public"."lead_source_type" USING lead_source::"public"."lead_source_type";

-- Drop temporary type
DROP TYPE IF EXISTS "public"."lead_source_type_new";

-- Step 4: Update opportunity_participants role constraint to reject 'partner'
ALTER TABLE opportunity_participants
DROP CONSTRAINT IF EXISTS opportunity_participants_role_check;

ALTER TABLE opportunity_participants
ADD CONSTRAINT opportunity_participants_role_check
CHECK (role = ANY(ARRAY['customer', 'principal', 'distributor', 'competitor']));
