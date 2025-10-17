-- ============================================================================
-- REMOVE INVENTORY FEATURES FROM PRODUCTS
-- WARNING: This is DESTRUCTIVE - inventory data will be permanently deleted
-- Created: 2025-10-17
-- ============================================================================

-- Step 1: Archive product_inventory data (optional - uncomment if needed)
-- CREATE TABLE IF NOT EXISTS product_inventory_archive AS
-- SELECT * FROM product_inventory;
-- COMMENT ON TABLE product_inventory_archive IS 'Archived inventory data before removal - 2025-10-17';

-- Step 2: Drop the product_inventory table entirely
DROP TABLE IF EXISTS product_inventory CASCADE;

-- Step 3: Remove minimum_order_quantity column from products table
ALTER TABLE products
DROP COLUMN IF EXISTS minimum_order_quantity;

-- Step 4: Update product_status enum to remove 'out_of_stock'
-- First, update any existing products with 'out_of_stock' status to 'limited_availability'
UPDATE products
SET status = 'limited_availability'::product_status
WHERE status = 'out_of_stock'::product_status;

-- Now recreate the enum without 'out_of_stock'
-- Note: PostgreSQL doesn't support ALTER TYPE ... DROP VALUE, so we need to recreate

-- Drop the default constraint first
ALTER TABLE products ALTER COLUMN status DROP DEFAULT;

-- Rename old enum
ALTER TYPE product_status RENAME TO product_status_old;

-- Create new enum without 'out_of_stock'
CREATE TYPE product_status AS ENUM (
  'active',
  'discontinued',
  'seasonal',
  'coming_soon',
  'limited_availability'
);

-- Update the column to use the new type
ALTER TABLE products
  ALTER COLUMN status TYPE product_status
  USING status::text::product_status;

-- Drop the old type
DROP TYPE product_status_old;

-- Restore the default
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active'::product_status;

-- Step 5: Document the changes
COMMENT ON TABLE products IS 'Products table - inventory features removed on 2025-10-17. Removed: minimum_order_quantity column, out_of_stock status. Dropped table: product_inventory';
