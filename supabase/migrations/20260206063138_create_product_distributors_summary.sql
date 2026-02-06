-- Create product_distributors_summary view for list performance
-- Eliminates N+1 queries by denormalizing product and organization names
-- Part of Cache Invalidation Audit fix

CREATE OR REPLACE VIEW product_distributors_summary
WITH (security_invoker = on)
AS
SELECT
  pd.product_id,
  pd.distributor_id,
  pd.vendor_item_number,
  pd.status,
  pd.valid_from,
  pd.valid_to,
  pd.notes,
  pd.created_at,
  pd.updated_at,
  pd.deleted_at,
  -- Denormalized fields (eliminate N+1 queries)
  p.name AS product_name,
  o.name AS distributor_name
FROM product_distributors pd
LEFT JOIN products p ON pd.product_id = p.id AND p.deleted_at IS NULL
LEFT JOIN organizations o ON pd.distributor_id = o.id AND o.deleted_at IS NULL
WHERE pd.deleted_at IS NULL;

-- Grant access to authenticated users
GRANT SELECT ON product_distributors_summary TO authenticated;

COMMENT ON VIEW product_distributors_summary IS 'Summary view for product_distributors list with denormalized product and distributor names. Eliminates N+1 queries.';
