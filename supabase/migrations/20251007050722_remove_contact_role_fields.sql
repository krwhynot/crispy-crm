-- Migration: Remove legacy role, purchase_influence, and decision_authority fields
-- Date: 2025-10-07
-- Description: Clean up contact and contact_organizations tables by removing unused/overcomplicated fields
-- Impact: Data loss - these fields will be permanently dropped

-- Drop contacts_summary view (it depends on the columns we're removing)
DROP VIEW IF EXISTS contacts_summary;

-- Drop columns from contacts table (legacy fields)
ALTER TABLE contacts
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS purchase_influence,
  DROP COLUMN IF EXISTS decision_authority;

-- Drop columns from contact_organizations table (active but being removed)
ALTER TABLE contact_organizations
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS purchase_influence,
  DROP COLUMN IF EXISTS decision_authority;

-- Recreate contacts_summary view without the removed fields
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    array_agg(DISTINCT co.organization_id) FILTER (WHERE co.organization_id IS NOT NULL) AS organization_ids,
    (
        SELECT o.name
        FROM contact_organizations co2
        JOIN organizations o ON o.id = co2.organization_id
        WHERE co2.contact_id = c.id
          AND o.deleted_at IS NULL
        ORDER BY co2.is_primary DESC, co2.created_at
        LIMIT 1
    ) AS company_name
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Drop and recreate get_contact_organizations() function to remove role field
DROP FUNCTION IF EXISTS public.get_contact_organizations(bigint);

CREATE FUNCTION public.get_contact_organizations(p_contact_id bigint)
RETURNS TABLE(
    organization_id bigint,
    organization_name text,
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
        o.name,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations o ON o.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND o.deleted_at IS NULL
    ORDER BY co.is_primary DESC, o.name;
END;
$function$;

COMMENT ON FUNCTION public.get_contact_organizations(bigint) IS
'Returns all organizations associated with a contact, ordered by primary status';

-- Note: contact_role enum type is preserved as it may be used elsewhere
-- If you want to drop it, verify no other tables use it first, then run:
-- DROP TYPE IF EXISTS contact_role;
