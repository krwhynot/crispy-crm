-- Payment terms and basic contact fields

ALTER TABLE organizations
  ADD COLUMN phone TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN website TEXT,
  ADD COLUMN payment_terms TEXT
    CHECK (payment_terms IN ('net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30')),
  ADD COLUMN credit_limit DECIMAL(12,2),
  ADD COLUMN territory TEXT;
