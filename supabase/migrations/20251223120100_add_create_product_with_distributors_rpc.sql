-- Migration: Add atomic RPC function for creating products with distributors
-- Purpose: Atomically create product and product_distributors junction records
-- Follows pattern from sync_opportunity_with_products (cloud_schema_fresh.sql:760-846)

CREATE OR REPLACE FUNCTION public.create_product_with_distributors(
    product_data JSONB,
    distributors JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
    v_product_id BIGINT;
    v_created_product RECORD;
BEGIN
    -- 1. Insert the product
    INSERT INTO products (
        name,
        principal_id,
        category,
        status,
        description,
        manufacturer_part_number,
        created_by,
        updated_by
    )
    VALUES (
        product_data->>'name',
        (product_data->>'principal_id')::BIGINT,
        product_data->>'category',
        COALESCE(product_data->>'status', 'active')::product_status,
        product_data->>'description',
        product_data->>'manufacturer_part_number',
        (product_data->>'created_by')::BIGINT,
        (product_data->>'updated_by')::BIGINT
    )
    RETURNING id INTO v_product_id;

    -- 2. Insert product_distributors junction records if provided
    IF distributors IS NOT NULL AND JSONB_ARRAY_LENGTH(distributors) > 0 THEN
        INSERT INTO product_distributors (
            product_id,
            distributor_id,
            vendor_item_number,
            status,
            notes
        )
        SELECT
            v_product_id,
            (d->>'distributor_id')::BIGINT,
            d->>'vendor_item_number',
            COALESCE(d->>'status', 'pending'),
            d->>'notes'
        FROM JSONB_ARRAY_ELEMENTS(distributors) AS d;
    END IF;

    -- 3. Return the created product
    SELECT * FROM products WHERE id = v_product_id INTO v_created_product;
    RETURN TO_JSONB(v_created_product);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_product_with_distributors(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_product_with_distributors(JSONB, JSONB) TO service_role;

-- Add documentation
COMMENT ON FUNCTION public.create_product_with_distributors(JSONB, JSONB) IS
'Atomically creates a product and its distributor associations.
SECURITY INVOKER: RLS policies apply (per Engineering Constitution).
Parameters:
- product_data: JSONB with product fields (name, principal_id, category, status, description, manufacturer_part_number, created_by, updated_by)
- distributors: JSONB array of distributor records [{distributor_id, vendor_item_number, status, notes}]
Returns: The created product record as JSONB';
