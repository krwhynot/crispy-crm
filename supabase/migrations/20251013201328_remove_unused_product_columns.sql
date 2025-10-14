-- =====================================================================
-- Remove Unused Product Columns for MVP
-- Date: 2025-10-13
--
-- Removes B2B complexity fields that aren't needed for food product sales:
-- - brand: Can be part of product name
-- - cost_per_unit: Internal margin tracking deferred
-- - min_order_quantity: Edge cases handled manually in MVP
--
-- Related to: Aggressive MVP product form simplification
-- =====================================================================

-- Update the products search function to remove brand reference
CREATE OR REPLACE FUNCTION update_products_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop dependent views first (product_catalog depends on brand column)
DROP VIEW IF EXISTS product_catalog CASCADE;

-- Drop unused columns from products table
ALTER TABLE public.products
    DROP COLUMN IF EXISTS brand CASCADE,
    DROP COLUMN IF EXISTS cost_per_unit CASCADE,
    DROP COLUMN IF EXISTS min_order_quantity CASCADE;

-- Note: unit_of_measure kept with default 'each' (MVP requirement)
-- Note: list_price kept (required for sales)

COMMENT ON TABLE products IS 'MVP product schema - focused on essential fields for food product sales';
