-- Billing address fields (flat model for MVP)
-- Note: Existing address/city/state/postal_code fields remain as primary address
-- These billing_* fields support separate billing address when needed

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_street TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_state TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'US';
