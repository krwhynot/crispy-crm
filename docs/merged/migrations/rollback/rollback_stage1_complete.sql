-- =====================================================
-- ROLLBACK SCRIPT FOR STAGE 1 (All Phases)
-- Execute phases in REVERSE order (1.4 → 1.3 → 1.2 → 1.1)
-- Date: 2025-01-22
-- =====================================================

-- =====================================================
-- ROLLBACK PHASE 1.4: Activities System
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Phase 1.4: Activities System';

    -- Drop views
    DROP VIEW IF EXISTS contact_engagement_summary CASCADE;
    DROP VIEW IF EXISTS interaction_analytics CASCADE;
    DROP VIEW IF EXISTS engagement_analytics CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS get_activity_timeline(VARCHAR, BIGINT, INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS convert_engagement_to_interaction(BIGINT, BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS log_interaction(BIGINT, interaction_type, TEXT, TEXT, BIGINT, BIGINT, TIMESTAMPTZ, INTEGER, BOOLEAN, DATE, TEXT, VARCHAR, BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS log_engagement(interaction_type, TEXT, TEXT, BIGINT, BIGINT, TIMESTAMPTZ, INTEGER, BOOLEAN, DATE, TEXT, BIGINT) CASCADE;

    -- Drop triggers
    DROP TRIGGER IF EXISTS trigger_validate_activity_consistency ON activities;
    DROP FUNCTION IF EXISTS validate_activity_consistency() CASCADE;

    -- Backup activities data before dropping
    CREATE TABLE IF NOT EXISTS activities_backup AS
    SELECT * FROM activities;

    -- Drop tables
    DROP TABLE IF EXISTS interaction_participants CASCADE;
    DROP TABLE IF EXISTS activities CASCADE;

    -- Update migration history
    UPDATE migration_history
    SET status = 'rolled_back',
        error_message = 'Manual rollback executed',
        completed_at = NOW()
    WHERE phase_number = '1.4';

    RAISE NOTICE 'Phase 1.4 rollback completed';
END $$;

-- =====================================================
-- ROLLBACK PHASE 1.3: Opportunity Enhancements
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Phase 1.3: Opportunity Enhancements';

    -- Drop views
    DROP VIEW IF EXISTS opportunities_legacy CASCADE;
    DROP VIEW IF EXISTS opportunities_with_participants CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS validate_opportunity_participants() CASCADE;
    DROP FUNCTION IF EXISTS get_opportunity_with_participants(BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS sync_opportunity_participants(BIGINT, JSONB[]) CASCADE;
    DROP FUNCTION IF EXISTS create_opportunity_with_participants(JSONB, JSONB[]) CASCADE;

    -- Drop triggers
    DROP TRIGGER IF EXISTS trigger_validate_opportunity_participants ON opportunity_participants;

    -- Backup participant data before dropping
    CREATE TABLE IF NOT EXISTS opportunity_participants_backup AS
    SELECT * FROM opportunity_participants;

    CREATE TABLE IF NOT EXISTS opportunity_products_backup AS
    SELECT * FROM opportunity_products;

    -- Restore legacy columns data from participants
    UPDATE opportunities o
    SET customer_organization_id = (
        SELECT organization_id FROM opportunity_participants
        WHERE opportunity_id = o.id AND role = 'customer' AND is_primary = true
        LIMIT 1
    ),
    principal_organization_id = (
        SELECT organization_id FROM opportunity_participants
        WHERE opportunity_id = o.id AND role = 'principal' AND is_primary = true
        LIMIT 1
    ),
    distributor_organization_id = (
        SELECT organization_id FROM opportunity_participants
        WHERE opportunity_id = o.id AND role = 'distributor' AND is_primary = true
        LIMIT 1
    );

    -- Drop tables
    DROP TABLE IF EXISTS opportunity_products CASCADE;
    DROP TABLE IF EXISTS opportunity_participants CASCADE;

    -- Update migration history
    UPDATE migration_history
    SET status = 'rolled_back',
        error_message = 'Manual rollback executed',
        completed_at = NOW()
    WHERE phase_number = '1.3';

    RAISE NOTICE 'Phase 1.3 rollback completed';
END $$;

-- =====================================================
-- ROLLBACK PHASE 1.2: Contact-Organization Relationships
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Phase 1.2: Contact-Organization Relationships';

    -- Drop views
    DROP VIEW IF EXISTS contacts_summary CASCADE;
    DROP VIEW IF EXISTS principal_advocacy_dashboard CASCADE;
    DROP VIEW IF EXISTS contact_influence_profile CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS add_principal_advocacy(BIGINT, BIGINT, INTEGER, TEXT, VARCHAR, BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS add_contact_to_organization(BIGINT, BIGINT, BOOLEAN, BOOLEAN, contact_role, VARCHAR, BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS get_organization_contacts(BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS get_contact_organizations(BIGINT) CASCADE;

    -- Backup relationship data before dropping
    CREATE TABLE IF NOT EXISTS contact_organizations_backup AS
    SELECT * FROM contact_organizations;

    CREATE TABLE IF NOT EXISTS contact_preferred_principals_backup AS
    SELECT * FROM contact_preferred_principals;

    -- Restore primary contact relationships to contacts table
    UPDATE contacts c
    SET company_id = (
        SELECT organization_id FROM contact_organizations co
        WHERE co.contact_id = c.id AND co.is_primary_contact = true
        LIMIT 1
    );

    -- Drop tables
    DROP TABLE IF EXISTS contact_preferred_principals CASCADE;
    DROP TABLE IF EXISTS contact_organizations CASCADE;

    -- Update migration history
    UPDATE migration_history
    SET status = 'rolled_back',
        error_message = 'Manual rollback executed',
        completed_at = NOW()
    WHERE phase_number = '1.2';

    RAISE NOTICE 'Phase 1.2 rollback completed';
END $$;

-- =====================================================
-- ROLLBACK PHASE 1.1: Foundation Setup
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Phase 1.1: Foundation Setup';

    -- Drop views
    DROP VIEW IF EXISTS opportunities_with_status CASCADE;
    DROP VIEW IF EXISTS deals CASCADE;

    -- Drop triggers
    DROP TRIGGER IF EXISTS trigger_calculate_opportunity_probability ON opportunities;
    DROP FUNCTION IF EXISTS calculate_opportunity_probability() CASCADE;

    DROP TRIGGER IF EXISTS trigger_update_opportunities_search_tsv ON opportunities;
    DROP TRIGGER IF EXISTS trigger_update_contacts_search_tsv ON contacts;
    DROP TRIGGER IF EXISTS trigger_update_companies_search_tsv ON companies;
    DROP FUNCTION IF EXISTS update_search_tsv() CASCADE;

    -- Rename opportunities back to deals
    ALTER TABLE IF EXISTS "opportunityNotes" RENAME COLUMN opportunity_id TO deal_id;
    ALTER TABLE IF EXISTS "opportunityNotes" RENAME TO "dealNotes";

    -- Restore company_id from customer_organization_id
    UPDATE opportunities
    SET company_id = customer_organization_id
    WHERE customer_organization_id IS NOT NULL;

    -- Drop opportunity-specific columns
    ALTER TABLE opportunities
    DROP COLUMN IF EXISTS stage,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS probability,
    DROP COLUMN IF EXISTS estimated_close_date,
    DROP COLUMN IF EXISTS actual_close_date,
    DROP COLUMN IF EXISTS customer_organization_id,
    DROP COLUMN IF EXISTS principal_organization_id,
    DROP COLUMN IF EXISTS distributor_organization_id,
    DROP COLUMN IF EXISTS founding_interaction_id,
    DROP COLUMN IF EXISTS stage_manual,
    DROP COLUMN IF EXISTS status_manual,
    DROP COLUMN IF EXISTS next_action,
    DROP COLUMN IF EXISTS next_action_date,
    DROP COLUMN IF EXISTS competition,
    DROP COLUMN IF EXISTS decision_criteria,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS search_tsv;

    -- Rename opportunities back to deals
    ALTER TABLE IF EXISTS opportunities RENAME TO deals;
    ALTER SEQUENCE IF EXISTS opportunities_id_seq RENAME TO deals_id_seq;

    -- Drop contacts enhancements
    ALTER TABLE contacts
    DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS department,
    DROP COLUMN IF EXISTS is_primary_contact,
    DROP COLUMN IF EXISTS purchase_influence,
    DROP COLUMN IF EXISTS decision_authority,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS search_tsv;

    -- Drop companies enhancements
    ALTER TABLE companies
    DROP COLUMN IF EXISTS organization_type,
    DROP COLUMN IF EXISTS is_principal,
    DROP COLUMN IF EXISTS is_distributor,
    DROP COLUMN IF EXISTS parent_company_id,
    DROP COLUMN IF EXISTS segment,
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS import_session_id,
    DROP COLUMN IF EXISTS search_tsv;

    -- Drop indexes
    DROP INDEX IF EXISTS idx_companies_deleted_at;
    DROP INDEX IF EXISTS idx_companies_organization_type;
    DROP INDEX IF EXISTS idx_companies_parent_company_id;
    DROP INDEX IF EXISTS idx_companies_search_tsv;
    DROP INDEX IF EXISTS idx_contacts_deleted_at;
    DROP INDEX IF EXISTS idx_contacts_is_primary;
    DROP INDEX IF EXISTS idx_contacts_search_tsv;
    DROP INDEX IF EXISTS idx_opportunities_stage;
    DROP INDEX IF EXISTS idx_opportunities_status;
    DROP INDEX IF EXISTS idx_opportunities_customer_org;
    DROP INDEX IF EXISTS idx_opportunities_principal_org;
    DROP INDEX IF EXISTS idx_opportunities_deleted_at;
    DROP INDEX IF EXISTS idx_opportunities_search_tsv;

    -- Drop enum types
    DROP TYPE IF EXISTS activity_type CASCADE;
    DROP TYPE IF EXISTS priority_level CASCADE;
    DROP TYPE IF EXISTS interaction_type CASCADE;
    DROP TYPE IF EXISTS opportunity_status CASCADE;
    DROP TYPE IF EXISTS opportunity_stage CASCADE;
    DROP TYPE IF EXISTS contact_role CASCADE;
    DROP TYPE IF EXISTS organization_type CASCADE;

    -- Update migration history
    UPDATE migration_history
    SET status = 'rolled_back',
        error_message = 'Manual rollback executed',
        completed_at = NOW()
    WHERE phase_number = '1.1';

    -- Recreate original views if needed
    CREATE OR REPLACE VIEW deals_summary AS
    SELECT * FROM deals;

    RAISE NOTICE 'Phase 1.1 rollback completed';
END $$;

-- =====================================================
-- FINAL CLEANUP
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Stage 1 complete rollback finished';
    RAISE NOTICE 'Data backups created in:';
    RAISE NOTICE '  - activities_backup';
    RAISE NOTICE '  - opportunity_participants_backup';
    RAISE NOTICE '  - opportunity_products_backup';
    RAISE NOTICE '  - contact_organizations_backup';
    RAISE NOTICE '  - contact_preferred_principals_backup';
    RAISE NOTICE '';
    RAISE NOTICE 'Review backup tables before dropping them';
END $$;

-- =====================================================
-- END OF STAGE 1 ROLLBACK
-- =====================================================