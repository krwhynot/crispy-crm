-- Migration: Remove 'seasonal' and 'limited_availability' product statuses
-- Created: 2025-10-18
-- 
-- Context: Simplifying product status to only 3 values: active, discontinued, coming_soon
-- Removes unused/redundant statuses: seasonal, limited_availability

-- ============================================================================
-- STEP 1: Update existing products with removed statuses
-- ============================================================================
-- Convert 'seasonal' products to 'active' (they're available)
UPDATE products 
SET status = 'active'
WHERE status = 'seasonal';

-- Convert 'limited_availability' products to 'active' (they're still available)
UPDATE products 
SET status = 'active'
WHERE status = 'limited_availability';

-- ============================================================================
-- STEP 2: Recreate the enum type without removed values
-- ============================================================================
-- PostgreSQL doesn't allow removing enum values, so we need to recreate the type

-- Create new temporary enum with only the statuses we want to keep
CREATE TYPE product_status_new AS ENUM ('active', 'discontinued', 'coming_soon');

-- Drop the default constraint first (it references the old enum)
ALTER TABLE products ALTER COLUMN status DROP DEFAULT;

-- Alter the column to use the new enum type
ALTER TABLE products 
  ALTER COLUMN status TYPE product_status_new 
  USING status::text::product_status_new;

-- Drop the old enum type
DROP TYPE product_status;

-- Rename the new type to the original name
ALTER TYPE product_status_new RENAME TO product_status;

-- Re-add the default constraint
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active'::product_status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Add comment documenting the change
COMMENT ON TYPE product_status IS 'Product status enum - simplified on 2025-10-18 to: active, discontinued, coming_soon';
COMMENT ON TABLE products IS 'Products table - Removed seasonal and limited_availability statuses on 2025-10-18';

-- Verify no products have invalid statuses (this should return 0 rows)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count 
  FROM products 
  WHERE status NOT IN ('active', 'discontinued', 'coming_soon');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % products still have invalid statuses', invalid_count;
  END IF;
  
  RAISE NOTICE 'Migration successful: All product statuses are valid';
END $$;
