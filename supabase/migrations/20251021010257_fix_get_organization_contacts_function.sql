-- Fix get_organization_contacts function to match UI reality
-- UI is the single source of truth - removing purchase_influence that UI doesn't use

-- Drop the old function first (can't change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_organization_contacts(bigint);

-- Recreate with corrected signature
CREATE FUNCTION public.get_organization_contacts(p_organization_id bigint)
RETURNS TABLE(
    contact_id bigint,
    contact_name text,
    role contact_role,
    is_primary_decision_maker boolean
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.contact_id,
        c.name AS contact_name,
        co.role,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN contacts c ON c.id = co.contact_id
    WHERE co.organization_id = p_organization_id
    AND co.deleted_at IS NULL
    ORDER BY co.is_primary_decision_maker DESC, co.role;
END;
$$;

COMMENT ON FUNCTION public.get_organization_contacts(p_organization_id bigint) IS 'Returns all contacts associated with an organization, ordered by decision maker status and role';
