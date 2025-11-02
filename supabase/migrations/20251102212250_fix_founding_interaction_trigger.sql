-- Fix founding_interaction_id trigger to work with GENERATED ALWAYS AS IDENTITY
-- The BEFORE INSERT trigger can't use NEW.id because it doesn't exist yet
-- Move this logic to an AFTER INSERT trigger

-- First, update the existing BEFORE trigger to remove founding_interaction_id logic
CREATE OR REPLACE FUNCTION validate_activity_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_org_id BIGINT;
    v_opp_customer_id BIGINT;
BEGIN
    -- Only validate when both contact and opportunity are present
    IF NEW.contact_id IS NOT NULL AND NEW.opportunity_id IS NOT NULL THEN
        -- Get the contact's organization
        SELECT organization_id INTO v_contact_org_id
        FROM contacts
        WHERE id = NEW.contact_id;

        -- Get the opportunity's customer organization
        SELECT customer_organization_id INTO v_opp_customer_id
        FROM opportunities
        WHERE id = NEW.opportunity_id;

        -- Validate: contact must belong to opportunity's customer organization
        IF v_contact_org_id IS NOT NULL AND v_opp_customer_id IS NOT NULL THEN
            IF v_contact_org_id != v_opp_customer_id THEN
                RAISE EXCEPTION 'Contact % does not belong to opportunity customer organization %',
                    NEW.contact_id, v_opp_customer_id
                    USING HINT = 'The contact must work for the customer organization associated with this opportunity';
            END IF;
        END IF;

        -- Set organization_id from opportunity's customer organization if not set
        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    -- REMOVED: founding_interaction_id logic (moved to AFTER INSERT trigger)

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create a new AFTER INSERT trigger for founding_interaction_id
CREATE OR REPLACE FUNCTION set_founding_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark founding interaction for new opportunities
    -- This only runs AFTER INSERT, so NEW.id exists
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create the AFTER INSERT trigger
CREATE TRIGGER trigger_set_founding_interaction
    AFTER INSERT ON activities
    FOR EACH ROW
    EXECUTE FUNCTION set_founding_interaction();

-- Add comment documenting the new trigger
COMMENT ON FUNCTION set_founding_interaction() IS
'Sets the founding_interaction_id on opportunities when the first interaction activity is created.
This runs AFTER INSERT to ensure the activity ID exists.';

-- Update comment on validate_activity_consistency to reflect removed logic
COMMENT ON FUNCTION validate_activity_consistency() IS
'Validates activity consistency, especially contact-opportunity relationships.
For activities with both contact_id and opportunity_id:
- Verifies contact belongs to the opportunity customer organization
- Raises exception if validation fails (prevents API manipulation)
- Auto-sets organization_id from opportunity customer if not provided';