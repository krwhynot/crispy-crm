-- Migration: Add missing audit columns to product_distributors
-- This table has created_by (without FK) and deleted_at but lacks updated_by
-- Previous migration 20251222011040 added created_by without FK constraint

-- Add FK constraint to existing created_by column
ALTER TABLE product_distributors
  ADD CONSTRAINT fk_product_distributors_created_by
    FOREIGN KEY (created_by) REFERENCES sales(id) ON DELETE SET NULL;

-- Add updated_by column with FK constraint
ALTER TABLE product_distributors
  ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN product_distributors.created_by IS 'Sales rep who created this record';
COMMENT ON COLUMN product_distributors.updated_by IS 'Sales rep who last updated this record';
COMMENT ON COLUMN product_distributors.deleted_at IS 'Soft delete timestamp';
