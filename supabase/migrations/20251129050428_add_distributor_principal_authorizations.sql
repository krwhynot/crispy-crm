-- =====================================================
-- distributor_principal_authorizations Table
-- =====================================================
-- Purpose: Track which principals are authorized to sell through which distributors

-- =====================================================
-- PREREQUISITE: Create update_updated_at_column() if not exists
-- =====================================================
-- This function is used by triggers to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
    'Trigger function to automatically set updated_at to NOW() on row update.';
-- This is a many-to-many relationship between organizations flagged as distributors
-- and organizations flagged as principals.
--
-- Business Context:
-- - MFB represents principals (food manufacturers)
-- - Distributors (Sysco, USF, GFS) carry authorized principal products
-- - This table captures the authorization relationship

-- =====================================================
-- Table Definition
-- =====================================================

CREATE TABLE IF NOT EXISTS public.distributor_principal_authorizations (
    -- Primary key (IDENTITY for auto-increment)
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- Foreign keys to organizations table
    -- distributor_id references an organization with is_distributor = true
    distributor_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- principal_id references an organization with is_principal = true
    principal_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Authorization metadata
    is_authorized BOOLEAN NOT NULL DEFAULT true,
    authorization_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    territory_restrictions TEXT[],
    notes TEXT,

    -- Audit fields (standard pattern)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES public.sales(id),
    deleted_at TIMESTAMPTZ,

    -- =====================================================
    -- Constraints
    -- =====================================================

    -- Unique constraint: One authorization record per distributor-principal pair
    -- Prevents duplicate relationships
    CONSTRAINT uq_distributor_principal_authorization UNIQUE (distributor_id, principal_id),

    -- Ensure expiration is after authorization date
    CONSTRAINT valid_authorization_dates CHECK (
        expiration_date IS NULL OR expiration_date > authorization_date
    ),

    -- Prevent self-referential authorization
    CONSTRAINT no_self_authorization CHECK (distributor_id <> principal_id)
);

-- Table comment for documentation
COMMENT ON TABLE public.distributor_principal_authorizations IS
'Tracks which principals (food manufacturers) are authorized to sell through which distributors.
Used for validating opportunities and understanding distribution networks.
Part of MFB three-party model: Principal -> Distributor -> Customer/Operator';

COMMENT ON COLUMN public.distributor_principal_authorizations.distributor_id IS
'Reference to an organization with is_distributor = true';

COMMENT ON COLUMN public.distributor_principal_authorizations.principal_id IS
'Reference to an organization with is_principal = true';

COMMENT ON COLUMN public.distributor_principal_authorizations.territory_restrictions IS
'Array of territory/region codes where authorization applies (NULL = all territories)';

-- =====================================================
-- Indexes
-- =====================================================

-- Index for queries filtering by distributor
CREATE INDEX idx_dpa_distributor_id ON public.distributor_principal_authorizations(distributor_id)
    WHERE deleted_at IS NULL;

-- Index for queries filtering by principal
CREATE INDEX idx_dpa_principal_id ON public.distributor_principal_authorizations(principal_id)
    WHERE deleted_at IS NULL;

-- Index for active authorizations lookup
CREATE INDEX idx_dpa_active ON public.distributor_principal_authorizations(distributor_id, principal_id)
    WHERE deleted_at IS NULL AND is_authorized = true;

-- Index for expiration date checks
CREATE INDEX idx_dpa_expiration ON public.distributor_principal_authorizations(expiration_date)
    WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp on changes
CREATE TRIGGER update_distributor_principal_authorizations_updated_at
    BEFORE UPDATE ON public.distributor_principal_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Pattern: Shared team access (same as organizations, contacts, opportunities)
-- All authenticated users can CRUD - this is collaborative data

ALTER TABLE public.distributor_principal_authorizations ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view authorizations
CREATE POLICY authenticated_select_distributor_principal_authorizations
    ON public.distributor_principal_authorizations
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- INSERT: All authenticated users can create authorizations
CREATE POLICY authenticated_insert_distributor_principal_authorizations
    ON public.distributor_principal_authorizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: All authenticated users can update authorizations
CREATE POLICY authenticated_update_distributor_principal_authorizations
    ON public.distributor_principal_authorizations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: All authenticated users can delete (soft-delete recommended)
CREATE POLICY authenticated_delete_distributor_principal_authorizations
    ON public.distributor_principal_authorizations
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
    ON TABLE public.distributor_principal_authorizations
    TO authenticated;

-- Sequence access for INSERT (auto-increment id)
GRANT USAGE ON SEQUENCE public.distributor_principal_authorizations_id_seq
    TO authenticated;

-- Service role needs full access for administrative operations
GRANT ALL ON TABLE public.distributor_principal_authorizations TO service_role;
GRANT USAGE ON SEQUENCE public.distributor_principal_authorizations_id_seq TO service_role;

-- =====================================================
-- Policy Documentation
-- =====================================================

COMMENT ON POLICY authenticated_select_distributor_principal_authorizations
    ON public.distributor_principal_authorizations IS
'Shared team access for viewing principal-distributor authorization relationships.
All sales team members need visibility into distribution networks.';

COMMENT ON POLICY authenticated_insert_distributor_principal_authorizations
    ON public.distributor_principal_authorizations IS
'All authenticated users can create new authorization records.
Audit trail via created_by and created_at.';

COMMENT ON POLICY authenticated_update_distributor_principal_authorizations
    ON public.distributor_principal_authorizations IS
'All authenticated users can update authorization details.
Audit trail via updated_at.';

COMMENT ON POLICY authenticated_delete_distributor_principal_authorizations
    ON public.distributor_principal_authorizations IS
'All authenticated users can delete authorizations.
Soft-delete pattern: set deleted_at instead of hard delete.';
