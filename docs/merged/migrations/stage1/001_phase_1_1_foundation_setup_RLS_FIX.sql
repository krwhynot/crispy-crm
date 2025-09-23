-- =====================================================
-- RLS POLICY MIGRATION AND VIEW RECREATION FIX
-- =====================================================
-- Purpose: Migrate RLS policies from deals to opportunities and recreate missing views
-- Critical: Without this, all users will be locked out of the opportunities table

BEGIN;

-- =====================================================
-- MIGRATE RLS POLICIES FROM DEALS TO OPPORTUNITIES
-- =====================================================

-- First, enable RLS on opportunities if not already enabled
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on opportunities to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON opportunities;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON opportunities;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON opportunities;
DROP POLICY IF EXISTS "Opportunities Delete Policy" ON opportunities;

-- Create all policies that existed on deals table
CREATE POLICY "Enable insert for authenticated users only"
ON opportunities
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
ON opportunities
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users only"
ON opportunities
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Opportunities Delete Policy"
ON opportunities
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- MIGRATE DEALNOTES TO OPPORTUNITYNOTES
-- =====================================================

-- Rename dealNotes table to opportunityNotes
ALTER TABLE IF EXISTS dealNotes RENAME TO opportunityNotes;

-- Rename the foreign key column
ALTER TABLE opportunityNotes
RENAME COLUMN deal_id TO opportunity_id;

-- Rename the sequence
ALTER SEQUENCE IF EXISTS dealNotes_id_seq RENAME TO opportunityNotes_id_seq;

-- Enable RLS on opportunityNotes
ALTER TABLE opportunityNotes ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON opportunityNotes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON opportunityNotes;
DROP POLICY IF EXISTS "Deal Notes Delete Policy" ON opportunityNotes;
DROP POLICY IF EXISTS "Deal Notes Update Policy" ON opportunityNotes;

-- Create policies for opportunityNotes (migrated from dealNotes)
CREATE POLICY "Enable insert for authenticated users only"
ON opportunityNotes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
ON opportunityNotes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Opportunity Notes Delete Policy"
ON opportunityNotes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Opportunity Notes Update Policy"
ON opportunityNotes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);  -- FIXED: Added missing WITH CHECK clause

-- =====================================================
-- RECREATE OPPORTUNITIES_SUMMARY VIEW
-- =====================================================

-- Create the opportunities_summary view (replacement for deals_summary)
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.id,
    o.name,
    o.amount,
    o.stage,
    o.status,
    o.priority,
    o.probability,
    o.expected_closing_date,
    o.estimated_close_date,
    o.actual_close_date,
    o.created_at,
    o.updated_at,
    o.archived_at,
    o.sales_id,
    o.company_id,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.contact_ids,
    o.category,
    o.description,
    o.index,
    o.next_action,
    o.next_action_date,
    c.name AS company_name,
    c.logo AS company_logo,
    s.first_name AS sales_first_name,
    s.last_name AS sales_last_name,
    s.email AS sales_email,
    COUNT(DISTINCT on.id) AS nb_notes
FROM opportunities o
LEFT JOIN companies c ON c.id = COALESCE(o.customer_organization_id, o.company_id)
LEFT JOIN sales s ON s.id = o.sales_id
LEFT JOIN opportunityNotes on ON on.opportunity_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY
    o.id, o.name, o.amount, o.stage, o.status, o.priority, o.probability,
    o.expected_closing_date, o.estimated_close_date, o.actual_close_date,
    o.created_at, o.updated_at, o.archived_at, o.sales_id,
    o.company_id, o.customer_organization_id, o.principal_organization_id,
    o.distributor_organization_id, o.contact_ids, o.category, o.description,
    o.index, o.next_action, o.next_action_date,
    c.name, c.logo, s.first_name, s.last_name, s.email;

-- Grant necessary permissions on the view
GRANT SELECT ON opportunities_summary TO authenticated;

-- =====================================================
-- CREATE BACKWARD COMPATIBILITY VIEW (deals)
-- =====================================================

-- Create a backward compatible view for deals
CREATE OR REPLACE VIEW deals AS
SELECT
    id,
    name,
    COALESCE(customer_organization_id, company_id) AS company_id,
    contact_ids,
    category,
    stage::text AS stage, -- Cast enum to text for compatibility
    description,
    amount,
    created_at,
    updated_at,
    archived_at,
    expected_closing_date,
    sales_id,
    index
FROM opportunities;

-- Grant permissions on the backward compatibility view
GRANT SELECT, INSERT, UPDATE, DELETE ON deals TO authenticated;

-- Create INSTEAD OF triggers for the view to handle DML operations
CREATE OR REPLACE FUNCTION deals_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- FIXED: Validate stage enum before casting
    IF NEW.stage IS NOT NULL THEN
        -- Check if stage value is valid for the enum
        IF NOT EXISTS (
            SELECT 1 FROM unnest(enum_range(NULL::opportunity_stage)) AS e(val)
            WHERE e.val::text = NEW.stage
        ) THEN
            -- Try to map old stage values to new ones
            NEW.stage := CASE NEW.stage
                WHEN 'New' THEN 'lead'
                WHEN 'Qualified' THEN 'qualified'
                WHEN 'Proposal' THEN 'proposal'
                WHEN 'Won' THEN 'closed_won'
                WHEN 'Lost' THEN 'closed_lost'
                ELSE NEW.stage -- Keep original if already valid
            END;

            -- If still not valid after mapping, raise error
            IF NOT EXISTS (
                SELECT 1 FROM unnest(enum_range(NULL::opportunity_stage)) AS e(val)
                WHERE e.val::text = NEW.stage
            ) THEN
                RAISE EXCEPTION 'Invalid opportunity stage: %', NEW.stage;
            END IF;
        END IF;
    END IF;

    INSERT INTO opportunities (
        name, company_id, customer_organization_id, contact_ids,
        category, stage, description, amount,
        expected_closing_date, sales_id, index
    ) VALUES (
        NEW.name, NEW.company_id, NEW.company_id, NEW.contact_ids,
        NEW.category, NEW.stage::opportunity_stage, NEW.description, NEW.amount,
        NEW.expected_closing_date, NEW.sales_id, NEW.index
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_insert
    INSTEAD OF INSERT ON deals
    FOR EACH ROW
    EXECUTE FUNCTION deals_insert_trigger();

CREATE OR REPLACE FUNCTION deals_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE opportunities SET
        name = NEW.name,
        company_id = NEW.company_id,
        customer_organization_id = NEW.company_id,
        contact_ids = NEW.contact_ids,
        category = NEW.category,
        stage = NEW.stage::opportunity_stage,
        description = NEW.description,
        amount = NEW.amount,
        expected_closing_date = NEW.expected_closing_date,
        sales_id = NEW.sales_id,
        index = NEW.index,
        archived_at = NEW.archived_at
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_update
    INSTEAD OF UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION deals_update_trigger();

CREATE OR REPLACE FUNCTION deals_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM opportunities WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_delete
    INSTEAD OF DELETE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION deals_delete_trigger();

-- =====================================================
-- CREATE DEALS_SUMMARY BACKWARD COMPATIBILITY VIEW
-- =====================================================

CREATE OR REPLACE VIEW deals_summary AS
SELECT * FROM opportunities_summary;

GRANT SELECT ON deals_summary TO authenticated;

-- =====================================================
-- DATA VALIDATION
-- =====================================================

DO $$
DECLARE
    v_policy_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Check that RLS policies were created
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'opportunities';

    IF v_policy_count < 4 THEN
        RAISE WARNING 'Only % RLS policies found on opportunities table, expected 4', v_policy_count;
    ELSE
        RAISE NOTICE 'RLS policies successfully migrated: % policies on opportunities', v_policy_count;
    END IF;

    -- Check that views were created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN ('opportunities_summary', 'deals', 'deals_summary');

    IF v_view_count < 3 THEN
        RAISE WARNING 'Only % views created, expected 3', v_view_count;
    ELSE
        RAISE NOTICE 'Views successfully created: % views', v_view_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Save separately)
-- =====================================================
-- BEGIN;
-- -- Drop new policies
-- DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON opportunities;
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON opportunities;
-- DROP POLICY IF EXISTS "Enable update for authenticated users only" ON opportunities;
-- DROP POLICY IF EXISTS "Opportunities Delete Policy" ON opportunities;
--
-- -- Drop views
-- DROP VIEW IF EXISTS deals CASCADE;
-- DROP VIEW IF EXISTS deals_summary CASCADE;
-- DROP VIEW IF EXISTS opportunities_summary CASCADE;
--
-- -- Rename opportunityNotes back to dealNotes
-- ALTER TABLE IF EXISTS opportunityNotes RENAME TO dealNotes;
-- ALTER TABLE dealNotes RENAME COLUMN opportunity_id TO deal_id;
-- ALTER SEQUENCE IF EXISTS opportunityNotes_id_seq RENAME TO dealNotes_id_seq;
--
-- -- Restore original policies on dealNotes
-- -- (would need to recreate original policies here)
--
-- COMMIT;