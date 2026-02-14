-- Performance indexes for product_distributors

CREATE INDEX IF NOT EXISTS idx_product_dist_product
  ON product_distributors(product_id);

CREATE INDEX IF NOT EXISTS idx_product_dist_distributor
  ON product_distributors(distributor_id);

CREATE INDEX IF NOT EXISTS idx_product_dist_status
  ON product_distributors(status);

CREATE INDEX IF NOT EXISTS idx_product_dist_vendor_item
  ON product_distributors(vendor_item_number)
  WHERE vendor_item_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_dist_active
  ON product_distributors(distributor_id, status)
  WHERE status = 'active';
