-- Migration: Add get_sale_by_id SECURITY DEFINER function
-- Purpose: Allow Edge Functions to look up sales by ID without needing service_role RLS bypass

CREATE OR REPLACE FUNCTION get_sale_by_id(target_sale_id INTEGER)
RETURNS SETOF sales
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM sales WHERE id = target_sale_id AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_sale_by_id IS
  'SECURITY DEFINER: Allows Edge Functions to fetch sales profile by sales ID';

GRANT EXECUTE ON FUNCTION get_sale_by_id(INTEGER) TO authenticated;
