-- Migration: Auto-cascade contact_id from opportunity's primary contact
-- Purpose: When an activity is inserted with opportunity_id but no contact_id,
--          automatically fill contact_id from the opportunity's primary contact
-- Trigger: BEFORE INSERT on activities (runs before validate_activity_consistency)
-- Author: Claude Code
-- Date: 2025-11-29

-- =====================================================
-- Trigger Function: Auto-fill contact_id from primary contact
-- =====================================================

CREATE OR REPLACE FUNCTION cascade_activity_contact_from_opportunity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_primary_contact_id BIGINT;
BEGIN
    -- Only cascade if:
    -- 1. opportunity_id is provided
    -- 2. contact_id is NOT provided (NULL)
    IF NEW.opportunity_id IS NOT NULL AND NEW.contact_id IS NULL THEN
        -- Look up the primary contact for this opportunity
        SELECT oc.contact_id INTO v_primary_contact_id
        FROM opportunity_contacts oc
        WHERE oc.opportunity_id = NEW.opportunity_id
          AND oc.is_primary = true
        LIMIT 1;

        -- If a primary contact exists, cascade it to the activity
        IF v_primary_contact_id IS NOT NULL THEN
            NEW.contact_id := v_primary_contact_id;

            -- Debug logging (optional, can be commented out in production)
            RAISE NOTICE 'Cascaded contact_id % from opportunity % primary contact',
                         v_primary_contact_id, NEW.opportunity_id;
        END IF;

        -- Note: If no primary contact exists, contact_id remains NULL
        -- The validate_activity_consistency trigger will handle organization_id
    END IF;

    RETURN NEW;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION cascade_activity_contact_from_opportunity() IS
'Auto-cascades contact_id from the opportunity''s primary contact when:
- Activity is inserted with opportunity_id
- Activity does NOT have an explicit contact_id
This ensures activities are automatically linked to the primary stakeholder
without requiring explicit contact selection in the UI.';

-- =====================================================
-- Trigger Definition
-- =====================================================

-- Create the trigger with a name that sorts BEFORE validate_activity_consistency
-- PostgreSQL executes triggers in alphabetical order within the same timing
-- "cascade_" comes before "trigger_" alphabetically
CREATE TRIGGER cascade_activity_contact_trigger
    BEFORE INSERT ON activities
    FOR EACH ROW
    EXECUTE FUNCTION cascade_activity_contact_from_opportunity();

-- Add comment documenting trigger execution order
COMMENT ON TRIGGER cascade_activity_contact_trigger ON activities IS
'Runs BEFORE INSERT to auto-fill contact_id from opportunity primary contact.
Executes before trigger_validate_activity_consistency (alphabetical order).
Cascade happens first, then validation verifies the contact is valid.';

-- =====================================================
-- Verification Query (for testing)
-- =====================================================

-- Test query to verify trigger works (run manually after migration):
--
-- -- Setup: Find an opportunity with a primary contact
-- SELECT o.id as opp_id, oc.contact_id as primary_contact
-- FROM opportunities o
-- JOIN opportunity_contacts oc ON oc.opportunity_id = o.id AND oc.is_primary = true
-- LIMIT 1;
--
-- -- Insert activity without contact_id
-- INSERT INTO activities (activity_type, type, subject, opportunity_id)
-- VALUES ('interaction', 'call', 'Test auto-cascade', <opp_id from above>)
-- RETURNING id, contact_id;
--
-- -- Verify: contact_id should be populated with the primary contact
