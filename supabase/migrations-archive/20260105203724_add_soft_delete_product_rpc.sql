-- Migration: Add SECURITY DEFINER functions for product soft-delete
--
-- Problem: The SELECT RLS policy on products (deleted_at IS NULL) blocks UPDATE
-- operations that set deleted_at, because PostgreSQL verifies the user can see
-- the resulting row after UPDATE.
--
-- Solution: Use SECURITY DEFINER functions that bypass RLS for soft-delete operations.
-- These functions run with elevated privileges (schema owner) while still being
-- callable by authenticated users.

-- ============================================================================
-- FUNCTION: soft_delete_product (single record)
-- ============================================================================
-- Soft-deletes a single product by setting deleted_at timestamp.
-- Bypasses RLS SELECT policy that would otherwise block the update.
--
-- Usage from app: await supabase.rpc('soft_delete_product', { product_id: 123 })
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_product(product_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate product exists and is not already deleted
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Product not found or already deleted: %', product_id;
  END IF;

  -- Perform soft delete
  UPDATE products
  SET
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = product_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_product(BIGINT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION soft_delete_product(BIGINT) IS
  'Soft-deletes a product by setting deleted_at. Uses SECURITY DEFINER to bypass RLS SELECT policy.';


-- ============================================================================
-- FUNCTION: soft_delete_products (bulk operation)
-- ============================================================================
-- Soft-deletes multiple products by their IDs.
-- Used by React Admin's deleteMany operation.
--
-- Usage from app: await supabase.rpc('soft_delete_products', { product_ids: [1, 2, 3] })
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_products(product_ids BIGINT[])
RETURNS SETOF BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id BIGINT;
BEGIN
  -- Update all specified products and return their IDs
  FOR deleted_id IN
    UPDATE products
    SET
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = ANY(product_ids)
      AND deleted_at IS NULL
    RETURNING id
  LOOP
    RETURN NEXT deleted_id;
  END LOOP;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_products(BIGINT[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION soft_delete_products(BIGINT[]) IS
  'Soft-deletes multiple products by setting deleted_at. Returns array of deleted IDs. Uses SECURITY DEFINER to bypass RLS SELECT policy.';
