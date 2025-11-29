-- =====================================================
-- product_distributor_authorizations Table
-- =====================================================
-- Purpose: Product-level authorization overrides for distributor relationships
-- This table allows product-specific exceptions to the org-level authorizations
-- defined in distributor_principal_authorizations.
--
-- Business Context:
-- - distributor_principal_authorizations: "McCRUM products can be sold through Sysco"
-- - product_distributor_authorizations: "McCRUM SKU #123 can be sold through Sysco with special pricing"
--   OR "McCRUM SKU #456 is NOT authorized for Sysco (even though McCRUM generally is)"
--
-- Hierarchy:
-- 1. Check product_distributor_authorizations first (specific override)
-- 2. If no product-level override exists, inherit from distributor_principal_authorizations
-- 3. If no org-level auth exists, product is not authorized for that distributor

-- =====================================================
-- Table Definition
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_distributor_authorizations (
    -- Primary key (IDENTITY for auto-increment)
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- Foreign key to products table
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

    -- Foreign key to organizations table (distributor)
    -- distributor_id references an organization with is_distributor = true
    distributor_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Authorization status (can override org-level auth)
    -- true = explicitly authorized at product level
    -- false = explicitly NOT authorized (blocks org-level auth)
    is_authorized BOOLEAN NOT NULL DEFAULT true,

    -- Authorization dates
    authorization_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,

    -- Product-specific pricing override (JSONB for flexibility)
    -- Example: {"unit_price": 12.50, "discount_percent": 5, "min_quantity": 100}
    special_pricing JSONB,

    -- Territory restrictions (NULL = inherits from org-level or all territories)
    territory_restrictions TEXT[],

    -- Free-form notes
    notes TEXT,

    -- Audit fields (standard pattern)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES public.sales(id),
    deleted_at TIMESTAMPTZ,

    -- =====================================================
    -- Constraints
    -- =====================================================

    -- Unique constraint: One authorization record per product-distributor pair
    -- Prevents duplicate relationships
    CONSTRAINT uq_product_distributor_authorization UNIQUE (product_id, distributor_id),

    -- Ensure expiration is after authorization date
    CONSTRAINT valid_product_authorization_dates CHECK (
        expiration_date IS NULL OR expiration_date > authorization_date
    )
);

-- Table comment for documentation
COMMENT ON TABLE public.product_distributor_authorizations IS
'Product-level authorization overrides for distributor relationships.
Allows specific products to have different authorization status than their principal''s
org-level authorization (distributor_principal_authorizations).
Use cases:
- Special pricing for specific products
- Excluding specific products from a distributor relationship
- Time-limited product authorizations';

COMMENT ON COLUMN public.product_distributor_authorizations.product_id IS
'Reference to the product being authorized/restricted';

COMMENT ON COLUMN public.product_distributor_authorizations.distributor_id IS
'Reference to an organization with is_distributor = true';

COMMENT ON COLUMN public.product_distributor_authorizations.is_authorized IS
'true = product explicitly authorized, false = product explicitly NOT authorized (overrides org-level)';

COMMENT ON COLUMN public.product_distributor_authorizations.special_pricing IS
'JSONB for product-specific pricing (unit_price, discount_percent, min_quantity, etc.)';

COMMENT ON COLUMN public.product_distributor_authorizations.territory_restrictions IS
'Array of territory/region codes where authorization applies (NULL = inherits from org-level or all)';

-- =====================================================
-- Indexes
-- =====================================================

-- Index for queries filtering by product
CREATE INDEX idx_pda_product_id ON public.product_distributor_authorizations(product_id)
    WHERE deleted_at IS NULL;

-- Index for queries filtering by distributor
CREATE INDEX idx_pda_distributor_id ON public.product_distributor_authorizations(distributor_id)
    WHERE deleted_at IS NULL;

-- Index for active authorizations lookup
CREATE INDEX idx_pda_active ON public.product_distributor_authorizations(product_id, distributor_id)
    WHERE deleted_at IS NULL AND is_authorized = true;

-- Index for expiration date checks (find expiring authorizations)
CREATE INDEX idx_pda_expiration ON public.product_distributor_authorizations(expiration_date)
    WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;

-- Index for special pricing lookups (products with custom pricing)
CREATE INDEX idx_pda_special_pricing ON public.product_distributor_authorizations(product_id)
    WHERE deleted_at IS NULL AND special_pricing IS NOT NULL;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp on changes
CREATE TRIGGER update_product_distributor_authorizations_updated_at
    BEFORE UPDATE ON public.product_distributor_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Pattern: Shared team access (same as distributor_principal_authorizations)
-- All authenticated users can CRUD - this is collaborative data

ALTER TABLE public.product_distributor_authorizations ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view product authorizations
CREATE POLICY authenticated_select_product_distributor_authorizations
    ON public.product_distributor_authorizations
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- INSERT: All authenticated users can create product authorizations
CREATE POLICY authenticated_insert_product_distributor_authorizations
    ON public.product_distributor_authorizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: All authenticated users can update product authorizations
CREATE POLICY authenticated_update_product_distributor_authorizations
    ON public.product_distributor_authorizations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: All authenticated users can delete (soft-delete recommended)
CREATE POLICY authenticated_delete_product_distributor_authorizations
    ON public.product_distributor_authorizations
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- =====================================================
-- GRANT Permissions (CRITICAL!)
-- =====================================================
-- PostgreSQL requires BOTH RLS policies AND GRANT statements
-- RLS without GRANT = "permission denied" errors

-- Table access for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.product_distributor_authorizations
    TO authenticated;

-- Sequence access for INSERT (auto-increment id)
GRANT USAGE ON SEQUENCE public.product_distributor_authorizations_id_seq
    TO authenticated;

-- Service role needs full access for administrative operations
GRANT ALL ON TABLE public.product_distributor_authorizations TO service_role;
GRANT USAGE ON SEQUENCE public.product_distributor_authorizations_id_seq TO service_role;

-- =====================================================
-- Policy Documentation
-- =====================================================

COMMENT ON POLICY authenticated_select_product_distributor_authorizations
    ON public.product_distributor_authorizations IS
'Shared team access for viewing product-distributor authorization overrides.
All sales team members need visibility into product-level exceptions.';

COMMENT ON POLICY authenticated_insert_product_distributor_authorizations
    ON public.product_distributor_authorizations IS
'All authenticated users can create product authorization records.
Audit trail via created_by and created_at.';

COMMENT ON POLICY authenticated_update_product_distributor_authorizations
    ON public.product_distributor_authorizations IS
'All authenticated users can update product authorization details.
Audit trail via updated_at.';

COMMENT ON POLICY authenticated_delete_product_distributor_authorizations
    ON public.product_distributor_authorizations IS
'All authenticated users can delete product authorizations.
Soft-delete pattern: set deleted_at instead of hard delete.';

-- =====================================================
-- Helper Function: Check Product Authorization
-- =====================================================
-- Returns whether a product is authorized for a given distributor
-- Checks product-level first, then falls back to org-level

CREATE OR REPLACE FUNCTION public.is_product_authorized_for_distributor(
    p_product_id BIGINT,
    p_distributor_id BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_auth RECORD;
    v_org_auth RECORD;
    v_principal_id BIGINT;
BEGIN
    -- Get the product's principal
    SELECT principal_id INTO v_principal_id
    FROM products
    WHERE id = p_product_id AND deleted_at IS NULL;

    IF v_principal_id IS NULL THEN
        RETURN false; -- Product not found or deleted
    END IF;

    -- Check product-level authorization first (most specific)
    SELECT is_authorized, expiration_date
    INTO v_product_auth
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        -- Product-level override exists
        -- Check if expired
        IF v_product_auth.expiration_date IS NOT NULL
           AND v_product_auth.expiration_date < CURRENT_DATE THEN
            -- Product auth expired, fall through to org-level
            NULL;
        ELSE
            RETURN v_product_auth.is_authorized;
        END IF;
    END IF;

    -- Fall back to org-level authorization
    SELECT is_authorized, expiration_date
    INTO v_org_auth
    FROM distributor_principal_authorizations
    WHERE principal_id = v_principal_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        -- Check if org-level auth is expired
        IF v_org_auth.expiration_date IS NOT NULL
           AND v_org_auth.expiration_date < CURRENT_DATE THEN
            RETURN false;
        END IF;
        RETURN v_org_auth.is_authorized;
    END IF;

    -- No authorization found at any level
    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_product_authorized_for_distributor IS
'Checks if a product is authorized for a distributor.
Resolution order:
1. Product-level auth (product_distributor_authorizations) - most specific
2. Org-level auth (distributor_principal_authorizations) - inherited
3. No auth found = false';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_product_authorized_for_distributor TO authenticated;

-- =====================================================
-- Helper Function: Get Product Special Pricing
-- =====================================================
-- Returns special pricing for a product-distributor combination if exists

CREATE OR REPLACE FUNCTION public.get_product_distributor_pricing(
    p_product_id BIGINT,
    p_distributor_id BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pricing JSONB;
BEGIN
    SELECT special_pricing
    INTO v_pricing
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND is_authorized = true
      AND deleted_at IS NULL
      AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    RETURN v_pricing; -- NULL if not found or no special pricing
END;
$$;

COMMENT ON FUNCTION public.get_product_distributor_pricing IS
'Returns special pricing JSONB for a product-distributor combination.
Returns NULL if no active authorization or no special pricing defined.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_product_distributor_pricing TO authenticated;
