-- =====================================================================
-- FIX LEGACY COMPANIES TABLE REFERENCES
-- =====================================================================
-- Purpose: Update functions that still reference old 'companies' table name
-- Date: 2025-10-06
-- Issue: Functions fail because 'companies' table was renamed to 'organizations'
--
-- Affected Functions:
-- 1. get_contact_organizations() - Used by contacts pages
-- 2. validate_opportunity_participants() - Used by opportunity validation
--
-- Impact: Fixes app rendering issues when querying empty/populated tables
-- =====================================================================

-- =====================================================================
-- FUNCTION 1: get_contact_organizations()
-- =====================================================================
-- Fix: Change 'companies' table reference to 'organizations'
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_contact_organizations(p_contact_id bigint)
RETURNS TABLE(
    organization_id bigint,
    organization_name text,
    role contact_role,
    is_primary boolean,
    is_primary_decision_maker boolean
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        co.organization_id,
        o.name,  -- FIXED: changed from 'c.name' (companies alias)
        co.role,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations o ON o.id = co.organization_id  -- FIXED: changed from 'companies c'
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND o.deleted_at IS NULL  -- FIXED: changed from 'c.deleted_at'
    ORDER BY co.is_primary DESC, o.name;  -- FIXED: changed from 'c.name'
END;
$function$;

COMMENT ON FUNCTION public.get_contact_organizations(bigint) IS
'Returns all organizations associated with a contact, ordered by primary status';

-- =====================================================================
-- FUNCTION 2: validate_opportunity_participants()
-- =====================================================================
-- Fix: Change 'companies' table reference to 'organizations'
-- =====================================================================

CREATE OR REPLACE FUNCTION public.validate_opportunity_participants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_org_type organization_type;
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
    v_primary_count INTEGER;
BEGIN
    -- FIXED: changed FROM companies to FROM organizations
    SELECT organization_type, is_principal, is_distributor
    INTO v_org_type, v_is_principal, v_is_distributor
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate principal role
    IF NEW.role = 'principal' AND NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', NEW.organization_id;
    END IF;

    -- Validate distributor role
    IF NEW.role = 'distributor' AND NOT v_is_distributor THEN
        RAISE EXCEPTION 'Organization % is not marked as a distributor', NEW.organization_id;
    END IF;

    -- Ensure only one primary per role
    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
            UPDATE opportunity_participants
            SET is_primary = false,
                updated_at = NOW()
            WHERE opportunity_id = NEW.opportunity_id
              AND role = NEW.role
              AND is_primary = true
              AND id != COALESCE(NEW.id, -1)
              AND deleted_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.validate_opportunity_participants() IS
'Validates opportunity participants and ensures only one primary per role type';

-- =====================================================================
-- VERIFICATION QUERY (commented out - uncomment to verify)
-- =====================================================================
-- Verify functions were updated successfully:
--
-- SELECT
--     p.proname as function_name,
--     pg_get_functiondef(p.oid) as definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN ('get_contact_organizations', 'validate_opportunity_participants');

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
-- ✅ get_contact_organizations() now references 'organizations' table
-- ✅ validate_opportunity_participants() now references 'organizations' table
-- ✅ App should now load correctly without "companies does not exist" errors
-- =====================================================================
