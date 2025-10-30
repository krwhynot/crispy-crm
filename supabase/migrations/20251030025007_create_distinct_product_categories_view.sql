-- ============================================================================
-- Create distinct_product_categories view for efficient category filtering
-- ============================================================================
-- Date: 2025-10-30
-- Description: Creates a view that returns unique product categories with
--              formatted display names. This view is used by the product
--              filter component to show all available categories without
--              fetching the entire product catalog.
--
-- Benefits:
--   - Efficient: Returns only unique categories, not all products
--   - Scalable: Works regardless of product count (no pagination limit)
--   - Formatted: Handles snake_case to Title Case conversion in database
--   - Dynamic: Always reflects current product categories
-- ============================================================================

CREATE OR REPLACE VIEW distinct_product_categories AS
  SELECT DISTINCT
    category AS id,
    -- Format category from snake_case to Title Case
    INITCAP(REPLACE(category, '_', ' ')) AS name
  FROM products
  WHERE
    category IS NOT NULL
    AND deleted_at IS NULL
  ORDER BY name;

-- Add comment for documentation
COMMENT ON VIEW distinct_product_categories IS
  'Returns unique product categories with formatted display names for filter UI';

-- Grant SELECT permission to authenticated users
GRANT SELECT ON distinct_product_categories TO authenticated;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- If you need to rollback this migration, run:
-- DROP VIEW IF EXISTS distinct_product_categories;
-- ============================================================================
