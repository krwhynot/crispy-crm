-- Fix contacts_summary view to use security_invoker instead of security_definer
-- This addresses the security advisor warning about SECURITY DEFINER views

-- Drop the existing view
DROP VIEW IF EXISTS contacts_summary;

-- Recreate with security_invoker = true
-- This makes the view execute with the calling user's permissions,
-- enforcing RLS policies from the underlying contacts and organizations tables
CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
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
    c.organization_id,
    o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON contacts_summary TO authenticated;

COMMENT ON VIEW contacts_summary IS
    'Contact summary view with organization name. Uses security_invoker to enforce RLS from underlying tables.';
