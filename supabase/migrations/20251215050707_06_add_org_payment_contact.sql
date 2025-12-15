-- Payment terms and additional business fields
-- Note: phone, email, website columns already exist on organizations table

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS payment_terms TEXT
    CHECK (payment_terms IN ('net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30')),
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS territory TEXT;

COMMENT ON COLUMN organizations.payment_terms IS 'Standard payment terms for this organization';
COMMENT ON COLUMN organizations.credit_limit IS 'Credit limit in USD';
COMMENT ON COLUMN organizations.territory IS 'Sales territory assignment';
