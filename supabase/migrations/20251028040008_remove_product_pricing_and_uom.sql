-- ============================================================================
-- Remove pricing and unit of measure fields from products table
-- ============================================================================
-- Date: 2025-10-28
-- Description: Removing list_price, currency_code, and unit_of_measure columns
--              from the products table as these fields are no longer needed in
--              the product data model.
-- ============================================================================

-- First, drop the currency_code constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_currency_code;

-- Drop the columns (using IF EXISTS for safety)
ALTER TABLE products
  DROP COLUMN IF EXISTS list_price,
  DROP COLUMN IF EXISTS currency_code,
  DROP COLUMN IF EXISTS unit_of_measure;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- If you need to rollback this migration, run the following:
--
-- ALTER TABLE products
--   ADD COLUMN list_price numeric(12,2),
--   ADD COLUMN currency_code text DEFAULT 'USD',
--   ADD COLUMN unit_of_measure text DEFAULT 'each';
--
-- ALTER TABLE products
--   ADD CONSTRAINT check_currency_code CHECK (currency_code ~ '^[A-Z]{3}$');
--
-- Note: Any data in these columns will be lost and would need to be restored
-- from a backup if this migration has already been applied.
-- ============================================================================
