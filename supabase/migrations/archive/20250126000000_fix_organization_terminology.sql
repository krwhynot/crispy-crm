-- Migration: Fix organizations terminology (remove all "companies" references)
-- Purpose: Complete the incomplete migration from companies to organizations
-- Author: Engineering Team
-- Date: 2025-01-26
--
-- IMPORTANT: This migration is for pre-production environments only
-- Since we're not live yet, we can be aggressive with these changes

BEGIN;

-- ============================================================================
-- STEP 1: Rename all constraints from companies_* to organizations_*
-- ============================================================================

-- Drop existing constraints (we'll recreate them with proper names)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_pkey CASCADE;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_sales_id_fkey CASCADE;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_created_by_fkey CASCADE;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_parent_company_id_fkey CASCADE;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_priority_check CASCADE;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_parent_company_id_fkey CASCADE; -- Also drop the newer one

-- Recreate constraints with correct naming
ALTER TABLE organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE organizations ADD CONSTRAINT organizations_sales_id_fkey
    FOREIGN KEY (sales_id) REFERENCES sales(id);
ALTER TABLE organizations ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES sales(id);
ALTER TABLE organizations ADD CONSTRAINT organizations_parent_organization_id_fkey
    FOREIGN KEY (parent_company_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE organizations ADD CONSTRAINT organizations_priority_check
    CHECK (priority IN ('A', 'B', 'C', 'D'));

-- ============================================================================
-- STEP 2: Rename the sequence
-- ============================================================================

ALTER SEQUENCE IF EXISTS companies_id_seq RENAME TO organizations_id_seq;

-- Ensure the sequence is properly owned by the organizations table
ALTER SEQUENCE organizations_id_seq OWNED BY organizations.id;

-- Update the default value to use the renamed sequence
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT nextval('organizations_id_seq');

-- ============================================================================
-- STEP 3: Rename columns that still reference "company"
-- ============================================================================

ALTER TABLE organizations
    RENAME COLUMN parent_company_id TO parent_organization_id;

-- Also rename parent_company_id in opportunities table if it exists
ALTER TABLE opportunities
    RENAME COLUMN parent_company_id TO parent_organization_id;

-- ============================================================================
-- STEP 4: Update any views that might reference companies
-- ============================================================================

-- Drop and recreate the companies_summary view if it exists
DROP VIEW IF EXISTS companies_summary CASCADE;

-- Create properly named view
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.segment,
    o.priority,
    o.industry,
    o.annual_revenue,
    o.employee_count,
    COUNT(DISTINCT opp.id) as opportunities_count,
    COUNT(DISTINCT co.contact_id) as contacts_count,
    MAX(opp.updated_at) as last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
) AND opp.deleted_at IS NULL
LEFT JOIN contact_organizations co ON co.organization_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Grant appropriate permissions
GRANT SELECT ON organizations_summary TO authenticated;

-- ============================================================================
-- STEP 5: Update foreign key references in other tables
-- ============================================================================

-- Check and update contact_organizations constraints if needed
ALTER TABLE contact_organizations
    DROP CONSTRAINT IF EXISTS contact_companies_company_id_fkey CASCADE;
ALTER TABLE contact_organizations
    DROP CONSTRAINT IF EXISTS contact_organizations_company_id_fkey CASCADE;

-- Ensure proper constraint exists
ALTER TABLE contact_organizations
    ADD CONSTRAINT contact_organizations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Update any functions that might reference companies
-- ============================================================================

-- Update search trigger function if it exists
CREATE OR REPLACE FUNCTION update_organizations_search_tsv()
RETURNS trigger AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.industry, '') || ' ' ||
        coalesce(NEW.city, '') || ' ' ||
        coalesce(NEW.state, '') || ' ' ||
        coalesce(NEW.country, '') || ' ' ||
        coalesce(NEW.notes, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with correct name
DROP TRIGGER IF EXISTS update_companies_search_tsv ON organizations;
DROP TRIGGER IF EXISTS update_organizations_search_tsv ON organizations;

CREATE TRIGGER update_organizations_search_tsv
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_search_tsv();

-- ============================================================================
-- STEP 7: Update any indexes that might have old naming
-- ============================================================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_companies_name;
DROP INDEX IF EXISTS idx_companies_created_at;
DROP INDEX IF EXISTS idx_companies_sales_id;
DROP INDEX IF EXISTS idx_companies_parent_company_id;
DROP INDEX IF EXISTS idx_companies_search_tsv;

-- Create properly named indexes (if they don't already exist)
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_sales_id ON organizations(sales_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_organization_id ON organizations(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_search_tsv ON organizations USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);

-- ============================================================================
-- STEP 8: Add helpful comments to document the schema
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations (companies) in the CRM system';
COMMENT ON COLUMN organizations.parent_organization_id IS 'Reference to parent organization for hierarchical relationships';
COMMENT ON CONSTRAINT organizations_parent_organization_id_fkey ON organizations
    IS 'Ensures parent organization exists';

-- ============================================================================
-- STEP 9: Validate the changes
-- ============================================================================

-- This will fail the transaction if anything is wrong
DO $$
DECLARE
    constraint_count INTEGER;
    bad_constraint_count INTEGER;
BEGIN
    -- Check that no companies-named constraints remain
    SELECT COUNT(*) INTO bad_constraint_count
    FROM pg_constraint con
    JOIN pg_class cl ON con.conrelid = cl.oid
    JOIN pg_namespace nsp ON cl.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public'
        AND cl.relname = 'organizations'
        AND con.conname LIKE '%compan%';

    IF bad_constraint_count > 0 THEN
        RAISE EXCEPTION 'Found % constraints still containing "compan" in the name', bad_constraint_count;
    END IF;

    -- Check that the sequence was renamed
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences
        WHERE schemaname = 'public' AND sequencename = 'organizations_id_seq'
    ) THEN
        RAISE EXCEPTION 'Sequence organizations_id_seq not found';
    END IF;

    -- Check that the column was renamed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = 'parent_company_id'
    ) THEN
        RAISE EXCEPTION 'Column parent_company_id still exists';
    END IF;

    RAISE NOTICE 'All terminology fixes applied successfully';
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES:
-- ============================================================================
-- After this migration is applied, you need to:
-- 1. Update all TypeScript/JavaScript code references from companies to organizations
-- 2. Regenerate TypeScript types from the database schema
-- 3. Update any API documentation
-- 4. Search for and update any remaining "company" references in the codebase