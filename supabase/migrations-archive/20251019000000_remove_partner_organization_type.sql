-- Remove 'partner' from organization_type enum values and lead_source check constraint
-- This migration removes 'partner' from all data types across the schema

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

-- Step 3: Update opportunities.lead_source CHECK constraint to remove 'partner' option
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_lead_source_check;

ALTER TABLE opportunities
ADD CONSTRAINT opportunities_lead_source_check CHECK ((lead_source = ANY (ARRAY['referral'::text, 'trade_show'::text, 'website'::text, 'cold_call'::text, 'email_campaign'::text, 'social_media'::text, 'existing_customer'::text])));

-- Step 4: Update opportunity_participants role constraint to reject 'partner'
ALTER TABLE opportunity_participants
DROP CONSTRAINT IF EXISTS opportunity_participants_role_check;

ALTER TABLE opportunity_participants
ADD CONSTRAINT opportunity_participants_role_check
CHECK (role = ANY(ARRAY['customer', 'principal', 'distributor', 'competitor']));
