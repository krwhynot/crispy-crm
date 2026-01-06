-- Migration: Fix lead_source enum constraint
-- Purpose: Ensure lead_source only accepts valid values defined in the application
--
-- The opportunities.lead_source field should only accept these values:
-- referral, trade_show, website, cold_call, email_campaign,
-- social_media, existing_customer, partner

-- Drop existing constraint if it exists
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_lead_source_check;

-- Add new constraint with correct enum values
ALTER TABLE opportunities ADD CONSTRAINT opportunities_lead_source_check
  CHECK (lead_source IS NULL OR lead_source = ANY (ARRAY[
    'referral',
    'trade_show',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'existing_customer',
    'partner'
  ]));

-- Add comment documenting the valid values
COMMENT ON COLUMN opportunities.lead_source IS 'Source of the lead. Valid values: referral, trade_show, website, cold_call, email_campaign, social_media, existing_customer, partner';
