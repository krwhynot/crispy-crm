-- Migration: Drop legacy product columns
-- Purpose: Remove SKU, legacy distributor_id FK, and 8 hardcoded distributor code columns
-- These are replaced by product_distributors junction table with vendor_item_number

-- Step 1: Drop indexes first (if they exist)
DROP INDEX IF EXISTS idx_products_sku;
DROP INDEX IF EXISTS idx_products_distributor_id;
DROP INDEX IF EXISTS idx_products_usf_code;
DROP INDEX IF EXISTS idx_products_sysco_code;
DROP INDEX IF EXISTS idx_products_gfs_code;
DROP INDEX IF EXISTS idx_products_pfg_code;
DROP INDEX IF EXISTS idx_products_greco_code;
DROP INDEX IF EXISTS idx_products_gofo_code;
DROP INDEX IF EXISTS idx_products_rdp_code;
DROP INDEX IF EXISTS idx_products_wilkens_code;

-- Step 2: Drop unique constraint on SKU (if exists)
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_sku_per_principal;

-- Step 3: Drop foreign key constraint for distributor_id
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_distributor_id_fkey;

-- Step 4: Drop the columns
ALTER TABLE products
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS distributor_id,
  DROP COLUMN IF EXISTS usf_code,
  DROP COLUMN IF EXISTS sysco_code,
  DROP COLUMN IF EXISTS gfs_code,
  DROP COLUMN IF EXISTS pfg_code,
  DROP COLUMN IF EXISTS greco_code,
  DROP COLUMN IF EXISTS gofo_code,
  DROP COLUMN IF EXISTS rdp_code,
  DROP COLUMN IF EXISTS wilkens_code;

-- Add comment explaining the change
COMMENT ON TABLE products IS 'Products catalog. Distributor relationships now managed via product_distributors junction table.';
