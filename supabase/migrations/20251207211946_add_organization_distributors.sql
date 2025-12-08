-- =====================================================
-- organization_distributors Table
-- =====================================================
-- Purpose: Track which distributors serve which customer/prospect organizations
-- Answers the question: "Which distributor does this customer buy from?"

-- Business Context:
-- - MFB three-party model: Principal -> Distributor -> Customer/Operator
-- - Customers (operators like restaurants) buy from distributors
-- - A customer may work with multiple distributors (e.g., Sysco for produce, GFS for proteins)
-- - One distributor is marked as the "primary" distributor per customer

-- =====================================================
-- Table Definition
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_distributors (
    -- Primary key (IDENTITY for auto-increment)
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- Foreign keys to organizations table
    -- organization_id is the customer/prospect receiving products
    organization_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- distributor_id is the organization that supplies products (organization_type='distributor')
    distributor_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Primary distributor flag
    -- Only ONE distributor per organization can be marked as primary
    -- Enforced by partial unique index below
    is_primary BOOLEAN NOT NULL DEFAULT false,

    -- Optional metadata
    notes TEXT,

    -- Audit fields (standard pattern)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES public.sales(id),
    deleted_at TIMESTAMPTZ,

    -- =====================================================
    -- Constraints
    -- =====================================================

    -- Unique constraint: One relationship record per organization-distributor pair
    -- Prevents duplicate relationships
    CONSTRAINT uq_organization_distributor UNIQUE (organization_id, distributor_id),

    -- Prevent self-referential distribution (org can't be its own distributor)
    CONSTRAINT no_self_distribution CHECK (organization_id <> distributor_id)
);

-- Table comment for documentation
COMMENT ON TABLE public.organization_distributors IS
'Tracks which distributors serve which customer/prospect organizations.
Supports many-to-many: customers can have multiple distributors.
Uses is_primary flag to designate the main/default distributor.
Part of MFB three-party model: Principal -> Distributor -> Customer/Operator';

COMMENT ON COLUMN public.organization_distributors.organization_id IS
'Reference to the customer/prospect organization that buys from the distributor';

COMMENT ON COLUMN public.organization_distributors.distributor_id IS
'Reference to an organization with organization_type = distributor';

COMMENT ON COLUMN public.organization_distributors.is_primary IS
'Designates the primary/default distributor for this organization. Only one can be true per organization.';

-- =====================================================
-- Indexes
-- =====================================================

-- CRITICAL: Partial unique index enforces ONLY ONE primary distributor per organization
-- This is the key constraint that maintains data integrity
CREATE UNIQUE INDEX idx_organization_one_primary_distributor
    ON public.organization_distributors (organization_id)
    WHERE is_primary = true AND deleted_at IS NULL;

COMMENT ON INDEX idx_organization_one_primary_distributor IS
'Enforces business rule: each organization can have at most one primary distributor';

-- Index for queries filtering by organization
CREATE INDEX idx_org_distributors_org_id ON public.organization_distributors(organization_id)
    WHERE deleted_at IS NULL;

-- Index for queries filtering by distributor (reverse lookup: "which customers does this distributor serve?")
CREATE INDEX idx_org_distributors_dist_id ON public.organization_distributors(distributor_id)
    WHERE deleted_at IS NULL;

-- Composite index for primary distributor lookups
CREATE INDEX idx_org_distributors_primary ON public.organization_distributors(organization_id, distributor_id)
    WHERE deleted_at IS NULL AND is_primary = true;

-- =====================================================
-- Helper View: Fast Primary Distributor Lookups
-- =====================================================
-- Avoids join complexity when you just need the primary distributor name

CREATE OR REPLACE VIEW public.organization_primary_distributor AS
SELECT
    od.organization_id,
    od.distributor_id,
    d.name AS distributor_name,
    d.city AS distributor_city,
    d.state AS distributor_state
FROM public.organization_distributors od
JOIN public.organizations d ON d.id = od.distributor_id AND d.deleted_at IS NULL
WHERE od.is_primary = true AND od.deleted_at IS NULL;

COMMENT ON VIEW public.organization_primary_distributor IS
'Convenience view for fast primary distributor lookups. Returns distributor details for each organization''s primary distributor.';

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp on changes
CREATE TRIGGER update_organization_distributors_updated_at
    BEFORE UPDATE ON public.organization_distributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Pattern: Shared team access (same as organizations, contacts, opportunities)
-- All authenticated users can CRUD - this is collaborative data

ALTER TABLE public.organization_distributors ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view distributor relationships
CREATE POLICY authenticated_select_organization_distributors
    ON public.organization_distributors
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- INSERT: All authenticated users can create distributor relationships
CREATE POLICY authenticated_insert_organization_distributors
    ON public.organization_distributors
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: All authenticated users can update distributor relationships
CREATE POLICY authenticated_update_organization_distributors
    ON public.organization_distributors
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: All authenticated users can delete (soft-delete recommended)
CREATE POLICY authenticated_delete_organization_distributors
    ON public.organization_distributors
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
    ON TABLE public.organization_distributors
    TO authenticated;

-- Sequence access for INSERT (auto-increment id)
GRANT USAGE ON SEQUENCE public.organization_distributors_id_seq
    TO authenticated;

-- Service role needs full access for administrative operations
GRANT ALL ON TABLE public.organization_distributors TO service_role;
GRANT USAGE ON SEQUENCE public.organization_distributors_id_seq TO service_role;

-- View access
GRANT SELECT ON public.organization_primary_distributor TO authenticated;
GRANT SELECT ON public.organization_primary_distributor TO service_role;

-- =====================================================
-- Policy Documentation
-- =====================================================

COMMENT ON POLICY authenticated_select_organization_distributors
    ON public.organization_distributors IS
'Shared team access for viewing customer-distributor relationships.
All sales team members need visibility into distribution networks.';

COMMENT ON POLICY authenticated_insert_organization_distributors
    ON public.organization_distributors IS
'All authenticated users can create new distributor relationships.
Audit trail via created_by and created_at.';

COMMENT ON POLICY authenticated_update_organization_distributors
    ON public.organization_distributors IS
'All authenticated users can update distributor relationships.
Audit trail via updated_at.';

COMMENT ON POLICY authenticated_delete_organization_distributors
    ON public.organization_distributors IS
'All authenticated users can delete distributor relationships.
Soft-delete pattern: set deleted_at instead of hard delete.';
