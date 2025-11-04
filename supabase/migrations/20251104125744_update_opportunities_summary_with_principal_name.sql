/**
 * Update opportunities_summary View - Add principal_name to Products Array
 *
 * Enhances the products array in opportunities_summary to include principal_name
 * for each product by joining with products and organizations tables.
 *
 * This enables ProductsTable to display the principal organization for each product.
 *
 * Note: Using DROP + CREATE instead of CREATE OR REPLACE to avoid column ordering issues
 */

-- Drop existing view
DROP VIEW IF EXISTS opportunities_summary;

-- Recreate view with principal_name in products array
CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
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
          'principal_name', prod_org.name,
          'notes', op.notes
        )
        ORDER BY op.created_at
      )
      FROM opportunity_products op
      LEFT JOIN products p ON op.product_id_reference = p.id
      LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
      WHERE op.opportunity_id = o.id
    ),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;

-- Comment
COMMENT ON VIEW opportunities_summary IS 'Denormalized opportunity view with organization names and products array (including principal_name) for efficient reads';

-- Grant permissions
GRANT SELECT ON opportunities_summary TO authenticated, anon;
