-- Create opportunity_products table for tracking product associations
-- Simplified: no pricing or quantity, just product associations with notes

CREATE TABLE IF NOT EXISTS opportunity_products (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id_reference BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Denormalized fields for performance (no JOIN needed on reads)
  product_name TEXT,
  product_category TEXT,

  -- Optional notes about this product in this opportunity
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate products in same opportunity
  UNIQUE(opportunity_id, product_id_reference)
);

-- Enable RLS
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage products for opportunities in their company
CREATE POLICY "Users can view opportunity products in their company"
  ON opportunity_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN sales s ON s.id = o.opportunity_owner_id
      WHERE o.id = opportunity_products.opportunity_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert opportunity products in their company"
  ON opportunity_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN sales s ON s.id = o.opportunity_owner_id
      WHERE o.id = opportunity_products.opportunity_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update opportunity products in their company"
  ON opportunity_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN sales s ON s.id = o.opportunity_owner_id
      WHERE o.id = opportunity_products.opportunity_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete opportunity products in their company"
  ON opportunity_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN sales s ON s.id = o.opportunity_owner_id
      WHERE o.id = opportunity_products.opportunity_id
      AND s.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_opportunity_products_opportunity_id ON opportunity_products(opportunity_id);
CREATE INDEX idx_opportunity_products_product_id_reference ON opportunity_products(product_id_reference);

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_opportunity_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_opportunity_products_updated_at
  BEFORE UPDATE ON opportunity_products
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_products_updated_at();

-- Comment
COMMENT ON TABLE opportunity_products IS 'Simplified product associations - tracks which products are discussed in opportunities without pricing details';
