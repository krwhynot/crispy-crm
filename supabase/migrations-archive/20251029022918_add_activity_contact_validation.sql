-- Migration: Add server-side contact validation for activities
-- Purpose: Enhance activity consistency validation to enforce that contacts
--          belong to the opportunity's customer organization (security fix for API)
-- P1 Priority: Prevents malicious users from creating invalid contact-opportunity relationships
-- Author: Claude Code

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_validate_activity_consistency ON activities;
DROP FUNCTION IF EXISTS validate_activity_consistency();

-- Recreate the function with enhanced contact validation
CREATE OR REPLACE FUNCTION validate_activity_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_opp_customer_id BIGINT;
    v_contact_org_id BIGINT;
BEGIN
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        -- Get the customer organization from the opportunity
        SELECT customer_organization_id INTO v_opp_customer_id
        FROM opportunities
        WHERE id = NEW.opportunity_id
          AND deleted_at IS NULL;

        -- SECURITY: Validate contact belongs to opportunity's customer organization
        IF NEW.contact_id IS NOT NULL THEN
            SELECT organization_id INTO v_contact_org_id
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_opp_customer_id
              AND deleted_at IS NULL
            LIMIT 1;

            -- Raise EXCEPTION (not just WARNING) to enforce data integrity
            IF v_contact_org_id IS NULL THEN
                RAISE EXCEPTION 'Contact % does not belong to opportunity %s customer organization',
                                NEW.contact_id, NEW.opportunity_id;
            END IF;
        END IF;

        -- Set organization_id from opportunity's customer organization if not set
        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    -- Mark founding interaction for new opportunities
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_validate_activity_consistency
    BEFORE INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION validate_activity_consistency();

-- Add comment documenting the validation
COMMENT ON FUNCTION validate_activity_consistency() IS
'Validates activity consistency, especially contact-opportunity relationships.
For interaction activities with both contact_id and opportunity_id:
- Verifies contact belongs to the opportunity customer organization
- Raises exception if validation fails (prevents API manipulation)
- Auto-sets organization_id from opportunity customer if not provided
Marks the founding interaction when a new opportunity interaction is created.';
