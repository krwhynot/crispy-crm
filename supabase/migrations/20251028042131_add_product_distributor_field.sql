-- ============================================================================
-- Add distributor field to products table
-- ============================================================================
-- Date: 2025-10-28
-- Description: Adding distributor_id column to products table to allow
--              associating products with distributor organizations.
--              This field is optional (nullable).
-- ============================================================================

-- Add distributor_id column with foreign key to organizations
ALTER TABLE products
  ADD COLUMN distributor_id integer REFERENCES organizations(id) ON DELETE SET NULL;

-- Add index for performance on distributor queries
CREATE INDEX idx_products_distributor_id ON products(distributor_id);

-- Add comment for documentation
COMMENT ON COLUMN products.distributor_id IS 'References the distributor organization for this product (optional)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- If you need to rollback this migration, run the following:
--
-- DROP INDEX IF EXISTS idx_products_distributor_id;
-- ALTER TABLE products DROP COLUMN IF EXISTS distributor_id;
--
-- Note: This is safe to rollback as the column is nullable.
-- ============================================================================
