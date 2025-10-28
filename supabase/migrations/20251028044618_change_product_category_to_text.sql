-- ============================================================================
-- Change product category from ENUM to TEXT for flexible custom categories
-- ============================================================================
-- Date: 2025-10-28
-- Description: Converts the product category field from a fixed ENUM type to
--              TEXT to allow users to create custom F&B categories on the fly.
--              Preserves all existing category data.
-- ============================================================================

-- Step 1: Add new TEXT column for category
ALTER TABLE products
  ADD COLUMN category_text TEXT;

-- Step 2: Copy existing ENUM values to TEXT column
UPDATE products
  SET category_text = category::TEXT;

-- Step 3: Drop the old ENUM column
ALTER TABLE products
  DROP COLUMN category;

-- Step 4: Rename the TEXT column to category
ALTER TABLE products
  RENAME COLUMN category_text TO category;

-- Step 5: Add NOT NULL constraint (since category was required)
ALTER TABLE products
  ALTER COLUMN category SET NOT NULL;

-- Step 6: Add check constraint to ensure it's not empty
ALTER TABLE products
  ADD CONSTRAINT category_not_empty CHECK (category <> '');

-- Add index for filtering by category
CREATE INDEX idx_products_category ON products(category);

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- WARNING: This rollback will fail if any custom categories were added
-- that are not in the original ENUM values
--
-- DROP INDEX IF EXISTS idx_products_category;
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS category_not_empty;
-- ALTER TABLE products ADD COLUMN category_enum product_category;
-- UPDATE products SET category_enum = category::product_category;
-- ALTER TABLE products DROP COLUMN category;
-- ALTER TABLE products RENAME COLUMN category_enum TO category;
-- ALTER TABLE products ALTER COLUMN category SET NOT NULL;
-- ============================================================================
