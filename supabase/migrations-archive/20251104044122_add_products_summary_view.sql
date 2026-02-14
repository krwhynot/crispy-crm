-- Add products_summary view to include principal organization name
-- This view joins products with organizations to provide denormalized data for lists

CREATE OR REPLACE VIEW products_summary
WITH (security_invoker = on)
AS
SELECT
  p.id,
  p.principal_id,
  p.name,
  p.description,
  p.sku,
  p.status,
  p.category,
  p.manufacturer_part_number,
  p.distributor_id,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by,
  p.deleted_at,
  -- Denormalized principal organization name
  po.name AS principal_name
FROM products p
LEFT JOIN organizations po ON p.principal_id = po.id;

-- Grant permissions
GRANT SELECT ON products_summary TO authenticated;

COMMENT ON VIEW products_summary IS 'Products with denormalized principal organization name for efficient list display';
