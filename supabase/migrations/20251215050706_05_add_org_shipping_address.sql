-- Shipping address (flat model for MVP)

ALTER TABLE organizations
  ADD COLUMN shipping_street TEXT,
  ADD COLUMN shipping_city TEXT,
  ADD COLUMN shipping_state TEXT,
  ADD COLUMN shipping_postal_code TEXT,
  ADD COLUMN shipping_country TEXT DEFAULT 'US';
