-- Fix opportunity_products unique constraint to support soft-delete reuse
-- Issues:
--   1. Inline UNIQUE constraint blocks soft-delete reuse
--   2. FK index on product_id_reference was dropped but never restored (performance issue)
-- Solution: Convert to partial index + restore FK index

BEGIN;

-- Drop the rigid unique constraint
ALTER TABLE opportunity_products
    DROP CONSTRAINT IF EXISTS opportunity_products_opportunity_id_product_id_reference_key;

-- Create partial unique index that only enforces on active records
CREATE UNIQUE INDEX idx_opportunity_products_unique_active
    ON opportunity_products (opportunity_id, product_id_reference)
    WHERE deleted_at IS NULL;

-- Restore FK index for query performance (was removed in a previous migration)
CREATE INDEX IF NOT EXISTS idx_opportunity_products_product_id_reference
    ON opportunity_products (product_id_reference);

COMMIT;
