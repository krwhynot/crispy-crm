-- Junction table for product-distributor relationships with DOT numbers
-- Enables: "McCRUM Potato Flakes is USF# 4587291 at US Foods"
-- Schema note: All FKs are BIGINT (verified pre-flight)

CREATE TABLE IF NOT EXISTS product_distributors (
  -- Composite primary key - BIGINT to match source tables
  product_id BIGINT NOT NULL,
  distributor_id BIGINT NOT NULL,

  -- DOT number (vendor's internal product code)
  vendor_item_number TEXT,

  -- Authorization status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive')),

  -- Temporal validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,

  -- Context
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY (product_id, distributor_id),

  -- Foreign keys
  CONSTRAINT fk_product_distributors_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_distributors_distributor
    FOREIGN KEY (distributor_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- RLS policies
ALTER TABLE product_distributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product_distributors"
  ON product_distributors FOR SELECT USING (true);

CREATE POLICY "Users can insert product_distributors"
  ON product_distributors FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update product_distributors"
  ON product_distributors FOR UPDATE USING (true);

CREATE POLICY "Users can delete product_distributors"
  ON product_distributors FOR DELETE USING (true);

COMMENT ON TABLE product_distributors IS 'Junction: products to distributors with vendor item numbers (DOT#)';
COMMENT ON COLUMN product_distributors.vendor_item_number IS 'Distributor code: USF#, Sysco#, GFS#';
