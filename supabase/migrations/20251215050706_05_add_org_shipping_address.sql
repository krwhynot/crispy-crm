-- Shipping address fields (flat model for MVP)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS shipping_street TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_state TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'US';
