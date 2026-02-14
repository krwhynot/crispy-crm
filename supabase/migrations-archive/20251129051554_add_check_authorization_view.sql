-- =====================================================
-- Authorization Check VIEW and RPC Function
-- =====================================================
-- Purpose: Provide efficient authorization verification for:
-- 1. Direct organization (principal/distributor) authorization
-- 2. Product->Organization fallback (check product's principal)
--
-- Business Context:
-- - MFB needs to verify if a principal is authorized for a distributor
-- - Products belong to principals (via principal_id)
-- - When checking product authorization, we look up the principal first
--
-- Usage:
-- SELECT * FROM authorization_status
--   WHERE distributor_id = X AND principal_id = Y;
-- -- or via RPC for product fallback --
-- SELECT check_authorization(distributor_id, principal_id, product_id);

-- =====================================================
-- VIEW: authorization_status
-- =====================================================
-- Materialized view of active authorizations for fast lookups
-- Includes organization details for display purposes

CREATE OR REPLACE VIEW public.authorization_status
WITH (security_invoker = on)
AS
SELECT
    dpa.id AS authorization_id,
    dpa.distributor_id,
    d.name AS distributor_name,
    (d.organization_type = 'distributor') AS is_distributor,
    dpa.principal_id,
    p.name AS principal_name,
    (p.organization_type = 'principal') AS is_principal,
    dpa.is_authorized,
    dpa.authorization_date,
    dpa.expiration_date,
    dpa.territory_restrictions,
    dpa.notes,
    -- Computed authorization validity
    CASE
        WHEN dpa.is_authorized = false THEN false
        WHEN dpa.deleted_at IS NOT NULL THEN false
        WHEN dpa.expiration_date IS NOT NULL AND dpa.expiration_date < CURRENT_DATE THEN false
        ELSE true
    END AS is_currently_valid,
    -- For debugging/audit
    dpa.created_at,
    dpa.updated_at,
    dpa.deleted_at
FROM public.distributor_principal_authorizations dpa
LEFT JOIN public.organizations d ON dpa.distributor_id = d.id
LEFT JOIN public.organizations p ON dpa.principal_id = p.id
WHERE dpa.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON public.authorization_status TO authenticated;

COMMENT ON VIEW public.authorization_status IS
'View combining authorization records with organization details.
Used for efficient authorization lookups with is_currently_valid computed field.
Filters out soft-deleted records automatically.';

-- =====================================================
-- FUNCTION: check_authorization
-- =====================================================
-- Versatile authorization check function with Product->Org fallback
--
-- Parameters:
--   _distributor_id: The distributor to check authorization for
--   _principal_id: (Optional) Direct principal ID to check
--   _product_id: (Optional) Product ID - will look up principal from product
--
-- Logic:
--   1. If _principal_id provided, use it directly
--   2. If _product_id provided (and no _principal_id), get principal_id from product
--   3. Check authorization_status view for valid authorization
--
-- Returns:
--   JSON object with authorization status and details

CREATE OR REPLACE FUNCTION public.check_authorization(
    _distributor_id BIGINT,
    _principal_id BIGINT DEFAULT NULL,
    _product_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_principal_id BIGINT;
    v_product_name TEXT;
    v_result JSONB;
    v_auth_record RECORD;
BEGIN
    -- =====================================================
    -- Step 1: Resolve principal_id (direct or via product)
    -- =====================================================

    IF _principal_id IS NOT NULL THEN
        -- Direct principal check
        v_principal_id := _principal_id;
    ELSIF _product_id IS NOT NULL THEN
        -- Product->Org fallback: Get principal from product
        SELECT principal_id, name
        INTO v_principal_id, v_product_name
        FROM public.products
        WHERE id = _product_id AND deleted_at IS NULL;

        IF v_principal_id IS NULL THEN
            RETURN jsonb_build_object(
                'authorized', false,
                'error', 'Product not found or has no principal',
                'product_id', _product_id,
                'distributor_id', _distributor_id
            );
        END IF;
    ELSE
        -- Neither provided - error
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'Either principal_id or product_id must be provided',
            'distributor_id', _distributor_id
        );
    END IF;

    -- =====================================================
    -- Step 2: Check authorization status
    -- =====================================================

    SELECT
        authorization_id,
        distributor_name,
        principal_name,
        is_authorized,
        is_currently_valid,
        authorization_date,
        expiration_date,
        territory_restrictions,
        notes
    INTO v_auth_record
    FROM public.authorization_status
    WHERE distributor_id = _distributor_id
      AND principal_id = v_principal_id;

    -- =====================================================
    -- Step 3: Build result
    -- =====================================================

    IF v_auth_record IS NULL THEN
        -- No authorization record exists
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', 'no_authorization_record',
            'distributor_id', _distributor_id,
            'principal_id', v_principal_id
        );
    ELSIF NOT v_auth_record.is_currently_valid THEN
        -- Authorization exists but is not valid
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', CASE
                WHEN NOT v_auth_record.is_authorized THEN 'authorization_revoked'
                WHEN v_auth_record.expiration_date < CURRENT_DATE THEN 'authorization_expired'
                ELSE 'authorization_invalid'
            END,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'expiration_date', v_auth_record.expiration_date
        );
    ELSE
        -- Authorization is valid
        v_result := jsonb_build_object(
            'authorized', true,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'authorization_date', v_auth_record.authorization_date,
            'expiration_date', v_auth_record.expiration_date,
            'territory_restrictions', v_auth_record.territory_restrictions,
            'notes', v_auth_record.notes
        );
    END IF;

    -- Add product info if queried via product
    IF _product_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'product_id', _product_id,
            'product_name', v_product_name,
            'resolved_via', 'product_lookup'
        );
    END IF;

    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_authorization(BIGINT, BIGINT, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.check_authorization IS
'Check if a principal is authorized to sell through a distributor.
Supports Product->Org fallback: if product_id is provided instead of principal_id,
the function will look up the product''s principal_id automatically.

Parameters:
  _distributor_id: Required. The distributor to check authorization for.
  _principal_id: Optional. Direct principal ID to check.
  _product_id: Optional. Product ID (principal will be resolved from product).

Returns JSONB with:
  - authorized: boolean
  - reason: string (if not authorized)
  - authorization_id, distributor_name, principal_name, etc. (if found)
  - product_id, product_name, resolved_via (if using product fallback)';

-- =====================================================
-- FUNCTION: check_authorization_batch
-- =====================================================
-- Batch authorization check for multiple products/principals at once
-- Useful for validating opportunity line items

CREATE OR REPLACE FUNCTION public.check_authorization_batch(
    _distributor_id BIGINT,
    _product_ids BIGINT[] DEFAULT NULL,
    _principal_ids BIGINT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_results JSONB := '[]'::jsonb;
    v_id BIGINT;
    v_check_result JSONB;
BEGIN
    -- Check products if provided
    IF _product_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _product_ids
        LOOP
            v_check_result := public.check_authorization(_distributor_id, NULL, v_id);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    -- Check principals if provided
    IF _principal_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _principal_ids
        LOOP
            v_check_result := public.check_authorization(_distributor_id, v_id, NULL);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    -- Return summary
    RETURN jsonb_build_object(
        'distributor_id', _distributor_id,
        'total_checked', jsonb_array_length(v_results),
        'all_authorized', (
            SELECT bool_and((item->>'authorized')::boolean)
            FROM jsonb_array_elements(v_results) AS item
        ),
        'results', v_results
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_authorization_batch(BIGINT, BIGINT[], BIGINT[]) TO authenticated;

COMMENT ON FUNCTION public.check_authorization_batch IS
'Batch authorization check for multiple products or principals.
Useful for validating entire opportunity line item lists at once.

Parameters:
  _distributor_id: Required. The distributor to check authorization for.
  _product_ids: Optional. Array of product IDs to check.
  _principal_ids: Optional. Array of principal IDs to check.

Returns JSONB with:
  - distributor_id: The distributor checked
  - total_checked: Number of items checked
  - all_authorized: Boolean if ALL items are authorized
  - results: Array of individual check results';
