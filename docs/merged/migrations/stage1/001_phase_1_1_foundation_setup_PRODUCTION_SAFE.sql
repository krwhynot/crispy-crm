-- =====================================================
-- Stage 1, Phase 1.1: Foundation Setup (PRODUCTION SAFE VERSION)
-- Migration: Merged CRM Foundation
-- Date: 2025-01-22
-- Description: Core schema enhancements with production safety measures
--
-- SAFETY FEATURES ADDED:
-- - Full transaction wrapping with savepoints
-- - Batched updates for large tables
-- - Concurrent index creation where possible
-- - Connection management
-- - Progress tracking
-- - Rollback capability
-- - Resource management
-- =====================================================

-- Pre-flight safety checks
DO $$
DECLARE
    v_active_connections INT;
    v_table_sizes RECORD;
BEGIN
    -- Check for active connections
    SELECT COUNT(*) INTO v_active_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state != 'idle';

    IF v_active_connections > 0 THEN
        RAISE WARNING 'Active connections detected: %. Consider terminating before migration.', v_active_connections;
    END IF;

    -- Log table sizes for monitoring
    FOR v_table_sizes IN
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('companies', 'contacts', 'deals')
    LOOP
        RAISE NOTICE 'Table %.%: %', v_table_sizes.schemaname, v_table_sizes.tablename, v_table_sizes.size;
    END LOOP;
END $$;

-- Start main transaction
BEGIN;

-- Set safety parameters
SET lock_timeout = '30s';
SET statement_timeout = '60min';
SET maintenance_work_mem = '1GB';
SET work_mem = '256MB';

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
    rows_affected BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress tracking table
CREATE TABLE IF NOT EXISTS migration_progress (
    id BIGSERIAL PRIMARY KEY,
    phase TEXT NOT NULL,
    step TEXT NOT NULL,
    progress_pct INT,
    rows_processed BIGINT,
    total_rows BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.1', 'Foundation Setup', 'in_progress', NOW());

-- Create progress logging function
CREATE OR REPLACE FUNCTION log_migration_progress(
    p_phase TEXT,
    p_step TEXT,
    p_progress_pct INT,
    p_rows_processed BIGINT DEFAULT NULL,
    p_total_rows BIGINT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO migration_progress (phase, step, progress_pct, rows_processed, total_rows)
    VALUES (p_phase, p_step, p_progress_pct, p_rows_processed, p_total_rows);

    RAISE NOTICE '[%] Migration Progress: % - % (%% complete)',
        clock_timestamp()::time, p_phase, p_step, p_progress_pct;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAVEPOINT: BACKUP CRITICAL DATA
-- =====================================================
SAVEPOINT backup_creation;

PERFORM log_migration_progress('1.1', 'Creating backup tables', 0);

-- Create backup tables for critical data
CREATE TABLE IF NOT EXISTS companies_backup_phase_1_1 AS
SELECT * FROM companies;

CREATE TABLE IF NOT EXISTS contacts_backup_phase_1_1 AS
SELECT * FROM contacts;

CREATE TABLE IF NOT EXISTS deals_backup_phase_1_1 AS
SELECT * FROM deals;

-- Store existing view definitions
CREATE TABLE IF NOT EXISTS view_definitions_backup_phase_1_1 AS
SELECT
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('deals_summary', 'init_state');

-- Store existing RLS policies
CREATE TABLE IF NOT EXISTS rls_policies_backup_phase_1_1 AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'contacts', 'deals');

PERFORM log_migration_progress('1.1', 'Creating backup tables', 100);

RELEASE SAVEPOINT backup_creation;

-- =====================================================
-- SAVEPOINT: ENUM TYPES
-- =====================================================
SAVEPOINT enum_creation;

PERFORM log_migration_progress('1.1', 'Creating enum types', 0);

-- Organization types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
        CREATE TYPE organization_type AS ENUM (
            'customer',
            'principal',
            'distributor',
            'prospect',
            'vendor',
            'partner',
            'unknown'
        );
    END IF;
END $$;

-- Contact roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_role') THEN
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
    END IF;
END $$;

-- Opportunity stages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_stage') THEN
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
    END IF;
END $$;

-- Opportunity status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status') THEN
        CREATE TYPE opportunity_status AS ENUM (
            'active',
            'on_hold',
            'nurturing',
            'stalled',
            'expired'
        );
    END IF;
END $$;

-- Interaction types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type') THEN
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
    END IF;
END $$;

-- Activity types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM (
            'engagement',
            'interaction'
        );
    END IF;
END $$;

-- Priority levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
        );
    END IF;
END $$;

PERFORM log_migration_progress('1.1', 'Creating enum types', 100);

RELEASE SAVEPOINT enum_creation;

-- =====================================================
-- SAVEPOINT: ENHANCE COMPANIES TABLE
-- =====================================================
SAVEPOINT companies_enhancement;

PERFORM log_migration_progress('1.1', 'Enhancing companies table', 0);

-- Add new columns to companies table (each in separate statement for safety)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS organization_type organization_type DEFAULT 'customer';

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_distributor BOOLEAN DEFAULT false;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS parent_company_id BIGINT REFERENCES companies(id);

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'Standard';

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS priority VARCHAR(1) DEFAULT 'C';

-- Add CHECK constraint separately to validate existing data first
DO $$
DECLARE
    v_invalid_count INT;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM companies
    WHERE priority NOT IN ('A', 'B', 'C', 'D');

    IF v_invalid_count > 0 THEN
        UPDATE companies SET priority = 'C' WHERE priority NOT IN ('A', 'B', 'C', 'D');
        RAISE NOTICE 'Updated % invalid priority values to default C', v_invalid_count;
    END IF;
END $$;

ALTER TABLE companies
ADD CONSTRAINT chk_companies_priority CHECK (priority IN ('A', 'B', 'C', 'D'));

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS import_session_id UUID;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

PERFORM log_migration_progress('1.1', 'Enhancing companies table', 100);

RELEASE SAVEPOINT companies_enhancement;

-- =====================================================
-- SAVEPOINT: ENHANCE CONTACTS TABLE
-- =====================================================
SAVEPOINT contacts_enhancement;

PERFORM log_migration_progress('1.1', 'Enhancing contacts table', 0);

-- Add new columns to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS role contact_role;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS purchase_influence VARCHAR(10) DEFAULT 'Unknown';

-- Validate and add constraint
DO $$
DECLARE
    v_invalid_count INT;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM contacts
    WHERE purchase_influence NOT IN ('High', 'Medium', 'Low', 'Unknown');

    IF v_invalid_count > 0 THEN
        UPDATE contacts SET purchase_influence = 'Unknown'
        WHERE purchase_influence NOT IN ('High', 'Medium', 'Low', 'Unknown');
        RAISE NOTICE 'Updated % invalid purchase_influence values', v_invalid_count;
    END IF;
END $$;

ALTER TABLE contacts
ADD CONSTRAINT chk_contacts_purchase_influence
CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown'));

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS decision_authority VARCHAR(20) DEFAULT 'End User';

-- Validate and add constraint
DO $$
DECLARE
    v_invalid_count INT;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM contacts
    WHERE decision_authority NOT IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper');

    IF v_invalid_count > 0 THEN
        UPDATE contacts SET decision_authority = 'End User'
        WHERE decision_authority NOT IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper');
        RAISE NOTICE 'Updated % invalid decision_authority values', v_invalid_count;
    END IF;
END $$;

ALTER TABLE contacts
ADD CONSTRAINT chk_contacts_decision_authority
CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper'));

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

PERFORM log_migration_progress('1.1', 'Enhancing contacts table', 100);

RELEASE SAVEPOINT contacts_enhancement;

-- =====================================================
-- SAVEPOINT: RENAME DEALS TO OPPORTUNITIES
-- =====================================================
SAVEPOINT deals_rename;

PERFORM log_migration_progress('1.1', 'Renaming deals to opportunities', 0);

-- Drop dependent views first (backed up earlier)
DROP VIEW IF EXISTS deals_summary CASCADE;
DROP VIEW IF EXISTS init_state CASCADE;

-- Rename the table
ALTER TABLE deals RENAME TO opportunities;

-- Rename the sequence
ALTER SEQUENCE deals_id_seq RENAME TO opportunities_id_seq;

-- Rename dealNotes table
ALTER TABLE IF EXISTS "dealNotes" RENAME TO "opportunityNotes";

-- Update foreign key column in notes
ALTER TABLE "opportunityNotes"
RENAME COLUMN deal_id TO opportunity_id;

PERFORM log_migration_progress('1.1', 'Renaming deals to opportunities', 100);

RELEASE SAVEPOINT deals_rename;

-- =====================================================
-- SAVEPOINT: ENHANCE OPPORTUNITIES TABLE
-- =====================================================
SAVEPOINT opportunities_enhancement;

PERFORM log_migration_progress('1.1', 'Enhancing opportunities table', 0);

-- Add new columns for opportunity model
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS stage opportunity_stage DEFAULT 'lead';

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS status opportunity_status DEFAULT 'active';

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium';

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0;

-- Validate probability constraint
DO $$
DECLARE
    v_invalid_count INT;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM opportunities
    WHERE probability < 0 OR probability > 100;

    IF v_invalid_count > 0 THEN
        UPDATE opportunities
        SET probability = CASE
            WHEN probability < 0 THEN 0
            WHEN probability > 100 THEN 100
        END
        WHERE probability < 0 OR probability > 100;
        RAISE NOTICE 'Fixed % invalid probability values', v_invalid_count;
    END IF;
END $$;

ALTER TABLE opportunities
ADD CONSTRAINT chk_opportunities_probability
CHECK (probability >= 0 AND probability <= 100);

-- Continue adding columns
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS estimated_close_date DATE;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS actual_close_date DATE;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS customer_organization_id BIGINT REFERENCES companies(id);

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS principal_organization_id BIGINT REFERENCES companies(id);

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS distributor_organization_id BIGINT REFERENCES companies(id);

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS founding_interaction_id BIGINT;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS stage_manual BOOLEAN DEFAULT false;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS status_manual BOOLEAN DEFAULT false;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS next_action TEXT;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS next_action_date DATE;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS competition TEXT;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS decision_criteria TEXT;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

PERFORM log_migration_progress('1.1', 'Enhancing opportunities table', 100);

RELEASE SAVEPOINT opportunities_enhancement;

-- =====================================================
-- SAVEPOINT: DATA MIGRATION (BATCHED)
-- =====================================================
SAVEPOINT data_migration;

PERFORM log_migration_progress('1.1', 'Migrating opportunity data', 0);

-- Migrate existing company_id to customer_organization_id in batches
DO $$
DECLARE
    v_batch_size INT := 10000;
    v_rows_updated INT;
    v_total_rows INT;
    v_rows_processed INT := 0;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO v_total_rows
    FROM opportunities
    WHERE customer_organization_id IS NULL AND company_id IS NOT NULL;

    RAISE NOTICE 'Starting migration of % opportunity records', v_total_rows;

    LOOP
        UPDATE opportunities
        SET customer_organization_id = company_id
        WHERE customer_organization_id IS NULL
          AND company_id IS NOT NULL
          AND id IN (
            SELECT id FROM opportunities
            WHERE customer_organization_id IS NULL
              AND company_id IS NOT NULL
            LIMIT v_batch_size
          );

        GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
        v_rows_processed := v_rows_processed + v_rows_updated;

        EXIT WHEN v_rows_updated = 0;

        -- Log progress
        PERFORM log_migration_progress(
            '1.1',
            'Migrating opportunity data',
            CASE
                WHEN v_total_rows > 0 THEN (v_rows_processed * 100 / v_total_rows)::INT
                ELSE 100
            END,
            v_rows_processed,
            v_total_rows
        );

        -- Brief pause to reduce lock contention
        PERFORM pg_sleep(0.01);
    END LOOP;

    RAISE NOTICE 'Completed migration of % opportunity records', v_rows_processed;
END $$;

PERFORM log_migration_progress('1.1', 'Migrating opportunity data', 100);

RELEASE SAVEPOINT data_migration;

-- =====================================================
-- SAVEPOINT: CREATE INDEXES (NON-CONCURRENT IN TRANSACTION)
-- =====================================================
SAVEPOINT index_creation;

PERFORM log_migration_progress('1.1', 'Creating indexes', 0);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at
ON companies(deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_companies_organization_type
ON companies(organization_type);

CREATE INDEX IF NOT EXISTS idx_companies_parent_company_id
ON companies(parent_company_id)
WHERE parent_company_id IS NOT NULL;

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at
ON contacts(deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_is_primary
ON contacts(is_primary_contact)
WHERE is_primary_contact = true AND deleted_at IS NULL;

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_stage
ON opportunities(stage)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_status
ON opportunities(status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_customer_org
ON opportunities(customer_organization_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org
ON opportunities(principal_organization_id)
WHERE principal_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at
ON opportunities(deleted_at)
WHERE deleted_at IS NULL;

PERFORM log_migration_progress('1.1', 'Creating indexes', 100);

RELEASE SAVEPOINT index_creation;

-- =====================================================
-- SAVEPOINT: CREATE TRIGGER FUNCTIONS
-- =====================================================
SAVEPOINT trigger_creation;

PERFORM log_migration_progress('1.1', 'Creating triggers', 0);

-- Function to update search vectors (optimized)
CREATE OR REPLACE FUNCTION update_search_tsv()
RETURNS trigger AS $$
BEGIN
    -- Only update if relevant fields changed
    IF TG_TABLE_NAME = 'companies' THEN
        IF TG_OP = 'INSERT' OR
           OLD.name IS DISTINCT FROM NEW.name OR
           OLD.industry IS DISTINCT FROM NEW.industry OR
           OLD.website IS DISTINCT FROM NEW.website OR
           OLD.address IS DISTINCT FROM NEW.address THEN
            NEW.search_tsv := to_tsvector('english',
                COALESCE(NEW.name, '') || ' ' ||
                COALESCE(NEW.industry, '') || ' ' ||
                COALESCE(NEW.website, '') || ' ' ||
                COALESCE(NEW.address, '')
            );
        END IF;
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        IF TG_OP = 'INSERT' OR
           OLD.name IS DISTINCT FROM NEW.name OR
           OLD.title IS DISTINCT FROM NEW.title OR
           OLD.department IS DISTINCT FROM NEW.department THEN
            NEW.search_tsv := to_tsvector('english',
                COALESCE(NEW.name, '') || ' ' ||
                COALESCE(NEW.title, '') || ' ' ||
                COALESCE(NEW.department, '')
            );
        END IF;
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        IF TG_OP = 'INSERT' OR
           OLD.name IS DISTINCT FROM NEW.name OR
           OLD.description IS DISTINCT FROM NEW.description OR
           OLD.next_action IS DISTINCT FROM NEW.next_action THEN
            NEW.search_tsv := to_tsvector('english',
                COALESCE(NEW.name, '') || ' ' ||
                COALESCE(NEW.description, '') || ' ' ||
                COALESCE(NEW.next_action, '')
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
DROP TRIGGER IF EXISTS trigger_update_companies_search_tsv ON companies;
CREATE TRIGGER trigger_update_companies_search_tsv
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

DROP TRIGGER IF EXISTS trigger_update_contacts_search_tsv ON contacts;
CREATE TRIGGER trigger_update_contacts_search_tsv
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

DROP TRIGGER IF EXISTS trigger_update_opportunities_search_tsv ON opportunities;
CREATE TRIGGER trigger_update_opportunities_search_tsv
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

-- Function to auto-calculate probability based on stage
CREATE OR REPLACE FUNCTION calculate_opportunity_probability()
RETURNS trigger AS $$
BEGIN
    -- Only auto-calculate if stage changed and not manually set
    IF (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage) AND NOT NEW.stage_manual THEN
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
DROP TRIGGER IF EXISTS trigger_calculate_opportunity_probability ON opportunities;
CREATE TRIGGER trigger_calculate_opportunity_probability
    BEFORE INSERT OR UPDATE OF stage ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_opportunity_probability();

PERFORM log_migration_progress('1.1', 'Creating triggers', 100);

RELEASE SAVEPOINT trigger_creation;

-- =====================================================
-- SAVEPOINT: CREATE COMPATIBILITY VIEWS
-- =====================================================
SAVEPOINT view_creation;

PERFORM log_migration_progress('1.1', 'Creating compatibility views', 0);

-- Create backward compatibility view for deals with rules for DML
CREATE OR REPLACE VIEW deals AS
SELECT * FROM opportunities;

-- Create rules for INSERT/UPDATE/DELETE operations
CREATE OR REPLACE RULE deals_insert AS
ON INSERT TO deals
DO INSTEAD
INSERT INTO opportunities VALUES (NEW.*);

CREATE OR REPLACE RULE deals_update AS
ON UPDATE TO deals
DO INSTEAD
UPDATE opportunities SET
    id = NEW.id,
    name = NEW.name,
    company_id = NEW.company_id,
    contact_ids = NEW.contact_ids,
    description = NEW.description,
    amount = NEW.amount,
    category = NEW.category,
    index = NEW.index,
    stage = NEW.stage,
    status = NEW.status,
    priority = NEW.priority,
    probability = NEW.probability,
    estimated_close_date = NEW.estimated_close_date,
    actual_close_date = NEW.actual_close_date,
    customer_organization_id = NEW.customer_organization_id,
    principal_organization_id = NEW.principal_organization_id,
    distributor_organization_id = NEW.distributor_organization_id,
    founding_interaction_id = NEW.founding_interaction_id,
    stage_manual = NEW.stage_manual,
    status_manual = NEW.status_manual,
    next_action = NEW.next_action,
    next_action_date = NEW.next_action_date,
    competition = NEW.competition,
    decision_criteria = NEW.decision_criteria,
    deleted_at = NEW.deleted_at,
    search_tsv = NEW.search_tsv,
    created_at = NEW.created_at,
    updated_at = NEW.updated_at
WHERE id = OLD.id;

CREATE OR REPLACE RULE deals_delete AS
ON DELETE TO deals
DO INSTEAD
DELETE FROM opportunities WHERE id = OLD.id;

-- Create opportunities summary view
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.*,
    c.name as company_name,
    c.industry as company_industry,
    CASE
        WHEN o.stage IN ('closed_won', 'closed_lost') THEN true
        ELSE false
    END AS is_closed,
    CASE
        WHEN o.stage = 'closed_won' THEN true
        ELSE false
    END AS is_won
FROM opportunities o
LEFT JOIN companies c ON o.customer_organization_id = c.id
WHERE o.deleted_at IS NULL;

PERFORM log_migration_progress('1.1', 'Creating compatibility views', 100);

RELEASE SAVEPOINT view_creation;

-- =====================================================
-- SAVEPOINT: UPDATE RLS POLICIES
-- =====================================================
SAVEPOINT rls_update;

PERFORM log_migration_progress('1.1', 'Updating RLS policies', 0);

-- Enable RLS on modified tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Recreate policies based on backup
DO $$
DECLARE
    v_policy RECORD;
    v_sql TEXT;
BEGIN
    -- Recreate policies from backup
    FOR v_policy IN
        SELECT * FROM rls_policies_backup_phase_1_1
        WHERE tablename IN ('companies', 'contacts')
    LOOP
        -- Drop existing policy
        v_sql := format('DROP POLICY IF EXISTS %I ON %I',
            v_policy.policyname, v_policy.tablename);
        EXECUTE v_sql;

        -- Create new policy with soft delete filter
        v_sql := format('CREATE POLICY %I ON %I AS %s FOR %s TO %s',
            v_policy.policyname,
            v_policy.tablename,
            CASE WHEN v_policy.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
            v_policy.cmd,
            array_to_string(v_policy.roles, ', '));

        -- Add USING clause with soft delete filter
        IF v_policy.qual IS NOT NULL THEN
            v_sql := v_sql || format(' USING ((%s) AND deleted_at IS NULL)', v_policy.qual);
        ELSE
            v_sql := v_sql || ' USING (deleted_at IS NULL)';
        END IF;

        -- Add WITH CHECK clause if present
        IF v_policy.with_check IS NOT NULL THEN
            v_sql := v_sql || format(' WITH CHECK (%s)', v_policy.with_check);
        END IF;

        EXECUTE v_sql;
    END LOOP;

    -- Handle deals -> opportunities policies
    FOR v_policy IN
        SELECT * FROM rls_policies_backup_phase_1_1
        WHERE tablename = 'deals'
    LOOP
        -- Drop any existing policy with same name on opportunities
        v_sql := format('DROP POLICY IF EXISTS %I ON opportunities',
            v_policy.policyname);
        EXECUTE v_sql;

        -- Create policy on opportunities table
        v_sql := format('CREATE POLICY %I ON opportunities AS %s FOR %s TO %s',
            v_policy.policyname,
            CASE WHEN v_policy.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
            v_policy.cmd,
            array_to_string(v_policy.roles, ', '));

        -- Add USING clause with soft delete filter
        IF v_policy.qual IS NOT NULL THEN
            v_sql := v_sql || format(' USING ((%s) AND deleted_at IS NULL)', v_policy.qual);
        ELSE
            v_sql := v_sql || ' USING (deleted_at IS NULL)';
        END IF;

        -- Add WITH CHECK clause if present
        IF v_policy.with_check IS NOT NULL THEN
            v_sql := v_sql || format(' WITH CHECK (%s)', v_policy.with_check);
        END IF;

        EXECUTE v_sql;
    END LOOP;
END $$;

-- If no policies existed in backup, create default ones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM rls_policies_backup_phase_1_1
        WHERE tablename IN ('companies', 'contacts', 'deals')
    ) THEN
        -- Create default policies for authenticated users
        CREATE POLICY "Enable all access for authenticated users" ON companies
            FOR ALL
            TO authenticated
            USING (deleted_at IS NULL);

        CREATE POLICY "Enable all access for authenticated users" ON contacts
            FOR ALL
            TO authenticated
            USING (deleted_at IS NULL);

        CREATE POLICY "Enable all access for authenticated users" ON opportunities
            FOR ALL
            TO authenticated
            USING (deleted_at IS NULL);

        RAISE NOTICE 'Created default RLS policies as no existing policies found';
    END IF;
END $$;

PERFORM log_migration_progress('1.1', 'Updating RLS policies', 100);

RELEASE SAVEPOINT rls_update;

-- =====================================================
-- VALIDATION QUERIES (NON-BLOCKING)
-- =====================================================
PERFORM log_migration_progress('1.1', 'Running validation', 0);

DO $$
DECLARE
    v_enum_count INTEGER;
    v_column_count INTEGER;
    v_index_count INTEGER;
    v_data_count INTEGER;
    v_backup_count INTEGER;
    v_opportunities_count INTEGER;
BEGIN
    -- Check enum types created
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type
    WHERE typname IN ('organization_type', 'contact_role', 'opportunity_stage',
                      'opportunity_status', 'interaction_type', 'activity_type', 'priority_level');

    IF v_enum_count < 7 THEN
        RAISE WARNING 'Expected 7 enum types, found %', v_enum_count;
    ELSE
        RAISE NOTICE 'All enum types created successfully';
    END IF;

    -- Check companies table enhancements
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_name = 'companies'
    AND column_name IN ('organization_type', 'is_principal', 'is_distributor',
                        'deleted_at', 'search_tsv');

    IF v_column_count < 5 THEN
        RAISE WARNING 'Expected 5 new company columns, found %', v_column_count;
    ELSE
        RAISE NOTICE 'All company columns added successfully';
    END IF;

    -- Check opportunities table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        RAISE EXCEPTION 'Opportunities table was not created/renamed successfully';
    ELSE
        RAISE NOTICE 'Opportunities table exists';
    END IF;

    -- Verify data migration
    SELECT COUNT(*) INTO v_data_count
    FROM opportunities
    WHERE customer_organization_id IS NULL AND company_id IS NOT NULL;

    IF v_data_count > 0 THEN
        RAISE WARNING '% opportunities still have unmigrated company_id', v_data_count;
    ELSE
        RAISE NOTICE 'All opportunity data migrated successfully';
    END IF;

    -- Verify backup tables exist
    SELECT COUNT(*) INTO v_backup_count
    FROM information_schema.tables
    WHERE table_name IN (
        'companies_backup_phase_1_1',
        'contacts_backup_phase_1_1',
        'deals_backup_phase_1_1'
    );

    IF v_backup_count < 3 THEN
        RAISE WARNING 'Only % of 3 backup tables created', v_backup_count;
    ELSE
        RAISE NOTICE 'All backup tables created successfully';
    END IF;

    -- Compare record counts
    SELECT COUNT(*) INTO v_backup_count FROM deals_backup_phase_1_1;
    SELECT COUNT(*) INTO v_opportunities_count FROM opportunities;

    IF v_backup_count != v_opportunities_count THEN
        RAISE WARNING 'Record count mismatch: backup has % records, opportunities has %',
            v_backup_count, v_opportunities_count;
    ELSE
        RAISE NOTICE 'Record counts match: % records', v_opportunities_count;
    END IF;

    RAISE NOTICE 'Phase 1.1 validation completed';
END $$;

PERFORM log_migration_progress('1.1', 'Running validation', 100);

-- =====================================================
-- FINALIZE MIGRATION
-- =====================================================

-- Update migration history
UPDATE migration_history
SET
    status = 'completed',
    completed_at = NOW(),
    rows_affected = (SELECT COUNT(*) FROM opportunities)
WHERE phase_number = '1.1'
AND status = 'in_progress';

-- Create GIN indexes AFTER transaction commits (recommend running separately)
-- These should be created CONCURRENTLY outside the transaction for production
/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search_tsv
ON companies USING GIN(search_tsv);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_search_tsv
ON contacts USING GIN(search_tsv);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_search_tsv
ON opportunities USING GIN(search_tsv);
*/

-- Final summary
DO $$
DECLARE
    v_duration INTERVAL;
    v_rows_affected BIGINT;
BEGIN
    SELECT completed_at - started_at, rows_affected
    INTO v_duration, v_rows_affected
    FROM migration_history
    WHERE phase_number = '1.1'
    ORDER BY id DESC
    LIMIT 1;

    RAISE NOTICE '================================';
    RAISE NOTICE 'Migration 1.1 completed successfully';
    RAISE NOTICE 'Duration: %', v_duration;
    RAISE NOTICE 'Rows affected: %', v_rows_affected;
    RAISE NOTICE '================================';
    RAISE NOTICE 'POST-MIGRATION TASKS:';
    RAISE NOTICE '1. Create GIN indexes CONCURRENTLY (see commented section)';
    RAISE NOTICE '2. ANALYZE all modified tables';
    RAISE NOTICE '3. Verify application functionality';
    RAISE NOTICE '4. Monitor error logs for 30 minutes';
    RAISE NOTICE '5. Keep backup tables for 48 hours minimum';
END $$;

-- Commit the transaction
COMMIT;

-- =====================================================
-- POST-TRANSACTION TASKS (Run these separately)
-- =====================================================

-- 1. Create GIN indexes concurrently (run each in separate session)
/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search_tsv
ON companies USING GIN(search_tsv);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_search_tsv
ON contacts USING GIN(search_tsv);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_search_tsv
ON opportunities USING GIN(search_tsv);
*/

-- 2. Update table statistics
/*
ANALYZE companies;
ANALYZE contacts;
ANALYZE opportunities;
*/

-- 3. Vacuum tables to reclaim space
/*
VACUUM ANALYZE companies;
VACUUM ANALYZE contacts;
VACUUM ANALYZE opportunities;
*/

-- =====================================================
-- ROLLBACK PROCEDURE (Save this separately)
-- =====================================================
/*
-- Emergency rollback script
BEGIN;

-- Restore tables from backup
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies AS SELECT * FROM companies_backup_phase_1_1;

DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts AS SELECT * FROM contacts_backup_phase_1_1;

DROP TABLE IF EXISTS opportunities CASCADE;
CREATE TABLE deals AS SELECT * FROM deals_backup_phase_1_1;

-- Rename notes table back
ALTER TABLE "opportunityNotes" RENAME TO "dealNotes";
ALTER TABLE "dealNotes" RENAME COLUMN opportunity_id TO deal_id;

-- Restore views
-- (Execute CREATE VIEW statements from view_definitions_backup_phase_1_1)

-- Restore RLS policies
-- (Execute policy creation from rls_policies_backup_phase_1_1)

-- Mark migration as failed
UPDATE migration_history
SET status = 'rolled_back', error_message = 'Manual rollback executed'
WHERE phase_number = '1.1';

COMMIT;
*/