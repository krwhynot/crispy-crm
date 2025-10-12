-- Migration: Update contacts_summary view to use direct organization_id relationship
-- Date: 2025-10-08
-- Description: Replace contact_organizations junction table with direct contacts.organization_id field

-- Drop dependent view first (deprecated with single-org model)
DROP VIEW IF EXISTS contact_organization_details;

-- Drop the existing contacts_summary view
DROP VIEW IF EXISTS contacts_summary;

-- Recreate the view with updated organization logic
CREATE VIEW contacts_summary AS
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

-- Grant permissions to authenticated and anon roles
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contacts_summary TO anon;

-- Add comment to document the change
COMMENT ON VIEW contacts_summary IS 'Denormalized view of contacts with organization name. Uses direct contacts.organization_id relationship (not junction table).';
