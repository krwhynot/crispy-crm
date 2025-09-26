-- =====================================================
-- ROLLBACK SCRIPT FOR STAGE 1.5 (MVP+1)
-- Basic Principal Features Rollback
-- Date: 2025-01-22
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Stage 1.5: Basic Principal Features';

    -- Drop views
    DROP VIEW IF EXISTS distributor_relationship_summary CASCADE;
    DROP VIEW IF EXISTS principal_product_summary CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS add_product(BIGINT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS get_principal_distributors(BIGINT) CASCADE;
    DROP FUNCTION IF EXISTS get_distributor_products(BIGINT) CASCADE;

    -- Backup data before dropping
    CREATE TABLE IF NOT EXISTS products_backup AS
    SELECT * FROM products;

    CREATE TABLE IF NOT EXISTS principal_distributor_relationships_backup AS
    SELECT * FROM principal_distributor_relationships;

    -- Drop foreign key from opportunity_products
    ALTER TABLE opportunity_products
    DROP COLUMN IF EXISTS product_id;

    -- Drop tables
    DROP TABLE IF EXISTS principal_distributor_relationships CASCADE;
    DROP TABLE IF EXISTS products CASCADE;

    -- Update migration history
    UPDATE migration_history
    SET status = 'rolled_back',
        error_message = 'Manual rollback executed',
        completed_at = NOW()
    WHERE phase_number = '1.5';

    RAISE NOTICE 'Stage 1.5 rollback completed';
    RAISE NOTICE 'Data backups created in:';
    RAISE NOTICE '  - products_backup';
    RAISE NOTICE '  - principal_distributor_relationships_backup';
END $$;

-- =====================================================
-- END OF STAGE 1.5 ROLLBACK
-- =====================================================