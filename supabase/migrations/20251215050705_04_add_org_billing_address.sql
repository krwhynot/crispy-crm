-- Billing address (flat model for MVP)

ALTER TABLE organizations
  ADD COLUMN billing_street TEXT,
  ADD COLUMN billing_city TEXT,
  ADD COLUMN billing_state TEXT,
  ADD COLUMN billing_postal_code TEXT,
  ADD COLUMN billing_country TEXT DEFAULT 'US';
