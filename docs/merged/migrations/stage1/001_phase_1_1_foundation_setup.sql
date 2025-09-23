-- =====================================================
-- Stage 1, Phase 1.1: Foundation Setup
-- Migration: Merged CRM Foundation
-- Date: 2025-01-22
-- Description: Core schema enhancements, enum types, and base tables
-- =====================================================

-- CRITICAL FIX: Transaction safety with savepoints for safe rollback
BEGIN;
SAVEPOINT phase_1_1_start;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
    id BIGSERIAL PRIMARY KEY,
    phase_number TEXT NOT NULL,
    phase_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    rollback_sql TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.1', 'Foundation Setup', 'in_progress', NOW());

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Organization types (from old CRM)
CREATE TYPE organization_type AS ENUM (
    'customer',
    'principal',
    'distributor',
    'prospect',
    'vendor',
    'partner',
    'unknown'
);

-- Contact roles
CREATE TYPE contact_role AS ENUM (
    'decision_maker',
    'influencer',
    'buyer',
    'end_user',
    'gatekeeper',
    'champion',
    'technical',
    'executive'
);

-- Opportunity stages (replacing deal stages)
CREATE TYPE opportunity_stage AS ENUM (
    'lead',
    'qualified',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
    'nurturing'
);

-- Opportunity status
CREATE TYPE opportunity_status AS ENUM (
    'active',
    'on_hold',
    'nurturing',
    'stalled',
    'expired'
);

-- Interaction types
CREATE TYPE interaction_type AS ENUM (
    'call',
    'email',
    'meeting',
    'demo',
    'proposal',
    'follow_up',
    'trade_show',
    'site_visit',
    'contract_review',
    'check_in',
    'social'
);

-- Activity types (broader than interactions)
CREATE TYPE activity_type AS ENUM (
    'engagement',     -- No opportunity attached
    'interaction'     -- Has opportunity attached
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- =====================================================
-- ENHANCE COMPANIES TABLE
-- =====================================================

-- Add new columns to companies table for organization capabilities
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS organization_type organization_type DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_distributor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_company_id BIGINT REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS priority VARCHAR(1) DEFAULT 'C' CHECK (priority IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS import_session_id UUID,
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Create index for soft deletes
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at
ON companies(deleted_at)
WHERE deleted_at IS NULL;

-- Create index for organization types
CREATE INDEX IF NOT EXISTS idx_companies_organization_type
ON companies(organization_type);

-- Create index for parent relationships
CREATE INDEX IF NOT EXISTS idx_companies_parent_company_id
ON companies(parent_company_id)
WHERE parent_company_id IS NOT NULL;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_companies_search_tsv
ON companies USING GIN(search_tsv);

-- =====================================================
-- ENHANCE CONTACTS TABLE
-- =====================================================

-- Add new columns to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS role contact_role,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS purchase_influence VARCHAR(10) DEFAULT 'Unknown'
    CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')),
ADD COLUMN IF NOT EXISTS decision_authority VARCHAR(20) DEFAULT 'End User'
    CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Create index for soft deletes
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at
ON contacts(deleted_at)
WHERE deleted_at IS NULL;

-- Create index for primary contacts
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary
ON contacts(is_primary_contact)
WHERE is_primary_contact = true AND deleted_at IS NULL;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_contacts_search_tsv
ON contacts USING GIN(search_tsv);

-- =====================================================
-- ADD BACKUP COLUMNS BEFORE ANY MODIFICATIONS
-- =====================================================

-- Add backup columns to preserve original relationships
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id_backup BIGINT;
UPDATE contacts SET company_id_backup = company_id WHERE company_id IS NOT NULL;

ALTER TABLE deals ADD COLUMN IF NOT EXISTS original_company_id BIGINT;
UPDATE deals SET original_company_id = company_id WHERE company_id IS NOT NULL;

-- =====================================================
-- RENAME DEALS TO OPPORTUNITIES
-- =====================================================

-- First, drop dependent views if they exist
DROP VIEW IF EXISTS deals_summary CASCADE;
DROP VIEW IF EXISTS init_state CASCADE;

-- Rename the table
ALTER TABLE IF EXISTS deals RENAME TO opportunities;

-- Rename the sequence
ALTER SEQUENCE IF EXISTS deals_id_seq RENAME TO opportunities_id_seq;

-- Add new columns for opportunity model
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS stage opportunity_stage DEFAULT 'lead',
ADD COLUMN IF NOT EXISTS status opportunity_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN IF NOT EXISTS estimated_close_date DATE,
ADD COLUMN IF NOT EXISTS actual_close_date DATE,
ADD COLUMN IF NOT EXISTS customer_organization_id BIGINT REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS principal_organization_id BIGINT REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS distributor_organization_id BIGINT REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS founding_interaction_id BIGINT,
ADD COLUMN IF NOT EXISTS stage_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS competition TEXT,
ADD COLUMN IF NOT EXISTS decision_criteria TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Migrate existing company_id to customer_organization_id if needed
UPDATE opportunities
SET customer_organization_id = company_id
WHERE customer_organization_id IS NULL AND company_id IS NOT NULL;

-- Create indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_org ON opportunities(customer_organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org ON opportunities(principal_organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_search_tsv ON opportunities USING GIN(search_tsv);

-- =====================================================
-- UPDATE NOTES TABLES
-- =====================================================

-- Rename dealNotes to opportunityNotes
ALTER TABLE IF EXISTS "dealNotes" RENAME TO "opportunityNotes";

-- Update foreign key column
ALTER TABLE "opportunityNotes"
RENAME COLUMN deal_id TO opportunity_id;

-- =====================================================
-- CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_search_tsv()
RETURNS trigger AS $$
BEGIN
    -- For companies
    IF TG_TABLE_NAME = 'companies' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.industry, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '')
        );
    -- For contacts
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '')
        );
    -- For opportunities
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
CREATE TRIGGER trigger_update_companies_search_tsv
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_contacts_search_tsv
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_opportunities_search_tsv
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

-- Function to auto-calculate probability based on stage
CREATE OR REPLACE FUNCTION calculate_opportunity_probability()
RETURNS trigger AS $$
BEGIN
    -- Only auto-calculate if not manually set
    IF NOT NEW.stage_manual THEN
        NEW.probability := CASE NEW.stage
            WHEN 'lead' THEN 10
            WHEN 'qualified' THEN 25
            WHEN 'needs_analysis' THEN 40
            WHEN 'proposal' THEN 60
            WHEN 'negotiation' THEN 80
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
            WHEN 'nurturing' THEN 15
        END;
    END IF;

    -- Set actual close date for closed stages
    IF NEW.stage IN ('closed_won', 'closed_lost') AND NEW.actual_close_date IS NULL THEN
        NEW.actual_close_date := CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for probability calculation
CREATE TRIGGER trigger_calculate_opportunity_probability
    BEFORE INSERT OR UPDATE OF stage ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_opportunity_probability();

-- =====================================================
-- CREATE COMPATIBILITY VIEWS
-- =====================================================

-- Create opportunities_summary view (critical for app functionality)
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.*,
    c.name as company_name,
    array_agg(DISTINCT ct.name) FILTER (WHERE ct.name IS NOT NULL) as contact_names
FROM opportunities o
LEFT JOIN companies c ON o.customer_organization_id = c.id
LEFT JOIN contacts ct ON ct.id = ANY(o.contact_ids)
WHERE o.deleted_at IS NULL
GROUP BY o.id, c.name;

-- Create backward compatibility view for deals
CREATE OR REPLACE VIEW deals AS
SELECT * FROM opportunities;

-- Backward compatibility for deals_summary
CREATE OR REPLACE VIEW deals_summary AS
SELECT * FROM opportunities_summary;

-- Create view for opportunities with deal flag
CREATE OR REPLACE VIEW opportunities_with_status AS
SELECT
    *,
    CASE
        WHEN stage IN ('closed_won', 'closed_lost') THEN true
        ELSE false
    END AS is_deal
FROM opportunities;

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on modified tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Copy existing RLS policies from deals to opportunities
DO $$
DECLARE
    policy_record RECORD;
    policy_def TEXT;
BEGIN
    -- Get all policies from deals table and recreate them for opportunities
    FOR policy_record IN
        SELECT polname, polcmd, polroles::regrole[], polqual, polwithcheck
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        WHERE c.relname = 'deals'
    LOOP
        -- Get the policy definition and replace table name
        SELECT pg_get_policydef(p.oid) INTO policy_def
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        WHERE c.relname = 'deals' AND p.polname = policy_record.polname;

        -- Replace 'deals' with 'opportunities' in the policy definition
        policy_def := REPLACE(policy_def, ' ON deals ', ' ON opportunities ');

        -- Execute the modified policy definition
        EXECUTE policy_def;

        RAISE NOTICE 'Migrated RLS policy: %', policy_record.polname;
    END LOOP;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Deals table not found, creating default policies';
END $$;

-- Update policies to respect soft deletes
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON companies;
CREATE POLICY "Enable all access for authenticated users" ON companies
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contacts;
CREATE POLICY "Enable all access for authenticated users" ON contacts
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON opportunities;
CREATE POLICY "Enable all access for authenticated users" ON opportunities
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_enum_count INTEGER;
    v_column_count INTEGER;
    v_index_count INTEGER;
BEGIN
    -- Check enum types created
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type
    WHERE typname IN ('organization_type', 'contact_role', 'opportunity_stage',
                      'opportunity_status', 'interaction_type', 'activity_type', 'priority_level');

    IF v_enum_count < 7 THEN
        RAISE EXCEPTION 'Not all enum types were created successfully';
    END IF;

    -- Check companies table enhancements
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_name = 'companies'
    AND column_name IN ('organization_type', 'is_principal', 'is_distributor',
                        'deleted_at', 'search_tsv');

    IF v_column_count < 5 THEN
        RAISE EXCEPTION 'Not all company columns were added successfully';
    END IF;

    -- Check opportunities table exists (renamed from deals)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        RAISE EXCEPTION 'Opportunities table was not created/renamed successfully';
    END IF;

    -- Check indexes created
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE tablename IN ('companies', 'contacts', 'opportunities')
    AND indexname LIKE 'idx_%';

    IF v_index_count < 10 THEN
        RAISE WARNING 'Some indexes may not have been created: % found', v_index_count;
    END IF;

    RAISE NOTICE 'Phase 1.1 validation passed successfully';
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.1'
AND status = 'in_progress';

-- Create savepoint for next phase
SAVEPOINT phase_1_1_complete;

-- =====================================================
-- END OF PHASE 1.1 - FOUNDATION SETUP
-- =====================================================