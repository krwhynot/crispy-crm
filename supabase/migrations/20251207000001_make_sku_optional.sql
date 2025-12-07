-- Make SKU optional for product creation
-- Previously required, now nullable to allow quick product entry without SKU

ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;

COMMENT ON COLUMN products.sku IS 'Optional Stock Keeping Unit identifier';
