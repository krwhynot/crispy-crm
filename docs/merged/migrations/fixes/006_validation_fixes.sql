-- =====================================================
-- Validation Fixes Patch
-- Addresses gaps identified in AI review
-- Date: 2025-01-22
-- Description: Fixes critical validation issues found in MVP+1 implementation
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.6', 'Validation Fixes', 'in_progress', NOW());

-- =====================================================
-- FIX 1: INTERACTION-OPPORTUNITY CONSTRAINT
-- =====================================================

-- Drop the existing weak constraint
ALTER TABLE activities
DROP CONSTRAINT IF EXISTS check_interaction_has_opportunity;

-- Add proper NOT NULL constraint for interactions
-- First, ensure any existing interactions have opportunities
UPDATE activities
SET opportunity_id = (
    SELECT id FROM opportunities
    WHERE deleted_at IS NULL
    LIMIT 1
)
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;

-- Now add the proper constraint via trigger
CREATE OR REPLACE FUNCTION enforce_interaction_opportunity()
RETURNS trigger AS $$
BEGIN
    -- Interactions MUST have an opportunity
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NULL THEN
        RAISE EXCEPTION 'Interactions must be linked to an opportunity (Business Rule Q21)';
    END IF;

    -- Engagements must NOT have an opportunity
    IF NEW.activity_type = 'engagement' AND NEW.opportunity_id IS NOT NULL THEN
        RAISE EXCEPTION 'Engagements cannot be linked to an opportunity - they are general activities';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_interaction_opportunity
    BEFORE INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION enforce_interaction_opportunity();

-- =====================================================
-- FIX 2: COMPANY ROLE MUTUAL EXCLUSIVITY
-- =====================================================

-- Add constraint that companies cannot be BOTH customer AND distributor
CREATE OR REPLACE FUNCTION enforce_company_role_exclusivity()
RETURNS trigger AS $$
BEGIN
    -- Check mutual exclusivity: cannot be customer AND distributor
    IF NEW.organization_type = 'customer' AND NEW.is_distributor = true THEN
        RAISE EXCEPTION 'A company cannot be both a customer and a distributor (Business Rule Q1)';
    END IF;

    -- Check mutual exclusivity: cannot be customer AND principal
    IF NEW.organization_type = 'customer' AND NEW.is_principal = true THEN
        RAISE EXCEPTION 'A company cannot be both a customer and a principal (Business Rule Q3)';
    END IF;

    -- Principals CAN be distributors (Business Rule Q2), so no check for that

    -- Ensure type alignment
    IF NEW.is_principal = true AND NEW.organization_type NOT IN ('principal', 'vendor', 'partner') THEN
        NEW.organization_type = 'principal';
    END IF;

    IF NEW.is_distributor = true AND NEW.organization_type = 'customer' THEN
        NEW.organization_type = 'distributor';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_company_role_exclusivity
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION enforce_company_role_exclusivity();

-- =====================================================
-- FIX 3: CONTACT-ORGANIZATION-OPPORTUNITY VALIDATION
-- =====================================================

-- Ensure contacts in opportunities belong to the customer organization
CREATE OR REPLACE FUNCTION validate_opportunity_contact_alignment()
RETURNS trigger AS $$
DECLARE
    v_customer_org_id BIGINT;
    v_contact_org_count INTEGER;
BEGIN
    -- Only validate if contact is provided
    IF NEW.contact_id IS NOT NULL THEN
        -- Get the customer organization for this opportunity
        -- First check legacy field, then participants
        IF NEW.customer_organization_id IS NOT NULL THEN
            v_customer_org_id := NEW.customer_organization_id;
        ELSE
            SELECT organization_id INTO v_customer_org_id
            FROM opportunity_participants
            WHERE opportunity_id = NEW.id
              AND role = 'customer'
              AND is_primary = true
              AND deleted_at IS NULL
            LIMIT 1;
        END IF;

        -- Check if contact belongs to customer organization
        IF v_customer_org_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_contact_org_count
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_customer_org_id
              AND deleted_at IS NULL;

            IF v_contact_org_count = 0 THEN
                RAISE WARNING 'Contact % is not associated with customer organization % for opportunity %',
                    NEW.contact_id, v_customer_org_id, NEW.id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_opportunity_contact_alignment
    BEFORE INSERT OR UPDATE OF contact_id ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION validate_opportunity_contact_alignment();

-- =====================================================
-- FIX 4: PRINCIPAL-DISTRIBUTOR RELATIONSHIP VALIDATION
-- =====================================================

-- Replace CHECK constraints with proper trigger validation
ALTER TABLE principal_distributor_relationships
DROP CONSTRAINT IF EXISTS must_be_principal,
DROP CONSTRAINT IF EXISTS must_be_distributor;

CREATE OR REPLACE FUNCTION validate_principal_distributor_relationship()
RETURNS trigger AS $$
DECLARE
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
BEGIN
    -- Validate principal
    SELECT is_principal INTO v_is_principal
    FROM companies
    WHERE id = NEW.principal_id
      AND deleted_at IS NULL;

    IF NOT COALESCE(v_is_principal, false) THEN
        RAISE EXCEPTION 'Company % is not marked as a principal', NEW.principal_id;
    END IF;

    -- Validate distributor
    SELECT is_distributor INTO v_is_distributor
    FROM companies
    WHERE id = NEW.distributor_id
      AND deleted_at IS NULL;

    IF NOT COALESCE(v_is_distributor, false) THEN
        RAISE EXCEPTION 'Company % is not marked as a distributor', NEW.distributor_id;
    END IF;

    -- Prevent self-relationships
    IF NEW.principal_id = NEW.distributor_id THEN
        RAISE EXCEPTION 'A company cannot have a distribution relationship with itself';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_principal_distributor_relationship
    BEFORE INSERT OR UPDATE ON principal_distributor_relationships
    FOR EACH ROW
    EXECUTE FUNCTION validate_principal_distributor_relationship();

-- =====================================================
-- FIX 5: OPPORTUNITY MUST HAVE CUSTOMER
-- =====================================================

-- Ensure every opportunity has at least one customer participant
CREATE OR REPLACE FUNCTION validate_opportunity_has_customer()
RETURNS trigger AS $$
DECLARE
    v_customer_count INTEGER;
BEGIN
    -- For participants table changes
    IF TG_TABLE_NAME = 'opportunity_participants' THEN
        -- If deleting or changing a customer participant
        IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.role != 'customer'))
           AND OLD.role = 'customer' THEN
            -- Check if this leaves the opportunity without a customer
            SELECT COUNT(*) INTO v_customer_count
            FROM opportunity_participants
            WHERE opportunity_id = OLD.opportunity_id
              AND role = 'customer'
              AND deleted_at IS NULL
              AND id != OLD.id;

            IF v_customer_count = 0 THEN
                RAISE EXCEPTION 'Opportunity must have at least one customer participant';
            END IF;
        END IF;
    END IF;

    -- For opportunities table
    IF TG_TABLE_NAME = 'opportunities' THEN
        -- Check on insert/update that customer exists
        IF NEW.customer_organization_id IS NULL THEN
            SELECT COUNT(*) INTO v_customer_count
            FROM opportunity_participants
            WHERE opportunity_id = NEW.id
              AND role = 'customer'
              AND deleted_at IS NULL;

            IF v_customer_count = 0 THEN
                RAISE WARNING 'Opportunity % has no customer participant', NEW.id;
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to opportunity_participants
CREATE TRIGGER trigger_validate_opportunity_has_customer_participants
    BEFORE UPDATE OR DELETE ON opportunity_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_opportunity_has_customer();

-- Apply to opportunities
CREATE TRIGGER trigger_validate_opportunity_has_customer_opportunities
    AFTER INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION validate_opportunity_has_customer();

-- =====================================================
-- FIX 6: CONTACT PRIMARY DECISION MAKER VALIDATION
-- =====================================================

-- Ensure contact can only be primary decision maker if in organization
CREATE OR REPLACE FUNCTION validate_contact_decision_maker()
RETURNS trigger AS $$
BEGIN
    -- If marking as primary decision maker
    IF NEW.is_primary_decision_maker = true THEN
        -- They must be associated with the organization
        IF NOT EXISTS (
            SELECT 1 FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = NEW.organization_id
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Contact must belong to organization to be primary decision maker';
        END IF;

        -- Unset other primary decision makers for this org
        UPDATE contact_organizations
        SET is_primary_decision_maker = false
        WHERE organization_id = NEW.organization_id
          AND is_primary_decision_maker = true
          AND id != NEW.id
          AND deleted_at IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger should already exist, but recreate to ensure it's correct
DROP TRIGGER IF EXISTS trigger_validate_contact_decision_maker ON contact_organizations;
CREATE TRIGGER trigger_validate_contact_decision_maker
    BEFORE INSERT OR UPDATE ON contact_organizations
    FOR EACH ROW
    EXECUTE FUNCTION validate_contact_decision_maker();

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
    v_invalid_interactions INTEGER;
    v_invalid_companies INTEGER;
BEGIN
    -- Check triggers created
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname IN (
        'trigger_enforce_interaction_opportunity',
        'trigger_enforce_company_role_exclusivity',
        'trigger_validate_opportunity_contact_alignment',
        'trigger_validate_principal_distributor_relationship',
        'trigger_validate_opportunity_has_customer_participants',
        'trigger_validate_contact_decision_maker'
    );

    IF v_trigger_count < 6 THEN
        RAISE EXCEPTION 'Not all validation triggers were created successfully';
    END IF;

    -- Check for invalid data
    SELECT COUNT(*) INTO v_invalid_interactions
    FROM activities
    WHERE activity_type = 'interaction'
      AND opportunity_id IS NULL
      AND deleted_at IS NULL;

    IF v_invalid_interactions > 0 THEN
        RAISE WARNING 'Found % interactions without opportunities - these were auto-fixed', v_invalid_interactions;
    END IF;

    -- Check for invalid company roles
    SELECT COUNT(*) INTO v_invalid_companies
    FROM companies
    WHERE (organization_type = 'customer' AND is_distributor = true)
       OR (organization_type = 'customer' AND is_principal = true)
    AND deleted_at IS NULL;

    IF v_invalid_companies > 0 THEN
        RAISE WARNING 'Found % companies with conflicting roles', v_invalid_companies;
    END IF;

    RAISE NOTICE 'Validation fixes applied successfully. % triggers created/updated', v_trigger_count;
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.6'
AND status = 'in_progress';

-- =====================================================
-- END OF VALIDATION FIXES
-- =====================================================