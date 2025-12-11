-- Add distributor-specific product codes to products table
-- All fields are TEXT, NULLABLE (optional per business requirements)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS usf_code TEXT,
  ADD COLUMN IF NOT EXISTS sysco_code TEXT,
  ADD COLUMN IF NOT EXISTS gfs_code TEXT,
  ADD COLUMN IF NOT EXISTS pfg_code TEXT,
  ADD COLUMN IF NOT EXISTS greco_code TEXT,
  ADD COLUMN IF NOT EXISTS gofo_code TEXT,
  ADD COLUMN IF NOT EXISTS rdp_code TEXT,
  ADD COLUMN IF NOT EXISTS wilkens_code TEXT;

-- Add indexes for lookup performance (Zen Audit Recommended)
-- High-cardinality distributor codes benefit from B-tree indexes
CREATE INDEX IF NOT EXISTS idx_products_usf_code ON products (usf_code);
CREATE INDEX IF NOT EXISTS idx_products_sysco_code ON products (sysco_code);
CREATE INDEX IF NOT EXISTS idx_products_gfs_code ON products (gfs_code);
CREATE INDEX IF NOT EXISTS idx_products_pfg_code ON products (pfg_code);
CREATE INDEX IF NOT EXISTS idx_products_greco_code ON products (greco_code);
CREATE INDEX IF NOT EXISTS idx_products_gofo_code ON products (gofo_code);
CREATE INDEX IF NOT EXISTS idx_products_rdp_code ON products (rdp_code);
CREATE INDEX IF NOT EXISTS idx_products_wilkens_code ON products (wilkens_code);

-- Add column comments for documentation
COMMENT ON COLUMN products.usf_code IS 'US Foods product code';
COMMENT ON COLUMN products.sysco_code IS 'Sysco product code';
COMMENT ON COLUMN products.gfs_code IS 'Gordon Food Service product code';
COMMENT ON COLUMN products.pfg_code IS 'Performance Food Group product code';
COMMENT ON COLUMN products.greco_code IS 'Greco and Sons product code';
COMMENT ON COLUMN products.gofo_code IS 'GOFO product code';
COMMENT ON COLUMN products.rdp_code IS 'RDP product code';
COMMENT ON COLUMN products.wilkens_code IS 'Wilkens product code';
