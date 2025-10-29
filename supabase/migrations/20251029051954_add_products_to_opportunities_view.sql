-- Add products array to opportunities for display
-- Uses JSONB aggregation for denormalized product data

-- Drop and recreate opportunities_summary view with products
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
  o.*,
  cust_org.name AS customer_organization_name,
  prin_org.name AS principal_organization_name,
  dist_org.name AS distributor_organization_name,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'product_id_reference', op.product_id_reference,
          'product_name', op.product_name,
          'product_category', op.product_category,
          'notes', op.notes
        )
        ORDER BY op.created_at
      )
      FROM opportunity_products op
      WHERE op.opportunity_id = o.id
    ),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;

-- Comment
COMMENT ON VIEW opportunities_summary IS 'Denormalized opportunity view with organization names and products array for efficient reads';
