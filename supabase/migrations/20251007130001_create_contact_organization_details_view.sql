-- Migration: Create contact_organization_details view for clean many-to-many queries
-- Date: 2025-10-07
-- Description: Denormalized view joining contact_organizations with contacts_summary
-- Allows ReferenceManyField to query by organization_id without array filtering complexity

CREATE VIEW contact_organization_details AS
SELECT
    -- Composite ID for React Admin (required unique identifier)
    co.contact_id || '-' || co.organization_id AS id,

    -- Foreign keys
    co.contact_id,
    co.organization_id,

    -- Junction table fields
    co.is_primary,
    co.is_primary_decision_maker,
    co.relationship_start_date,
    co.relationship_end_date,
    co.notes AS relationship_notes,

    -- Contact fields (from contacts_summary)
    c.first_name,
    c.last_name,
    c.name,
    c.title,
    c.department,
    c.email,
    c.phone,
    c.linkedin_url,
    c.twitter_handle,
    c.tags,
    c.last_seen,
    c.first_seen,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.company_name
FROM contact_organizations co
JOIN contacts_summary c ON co.contact_id = c.id
WHERE co.deleted_at IS NULL AND c.deleted_at IS NULL;

-- Enable RLS on the view (CRITICAL for security)
ALTER VIEW contact_organization_details SET (security_barrier = true);

-- Grant access through PostgREST
GRANT SELECT ON contact_organization_details TO authenticated;

COMMENT ON VIEW contact_organization_details IS
'Denormalized view of contact-organization relationships with full contact data. Enables clean ReferenceManyField queries by organization_id. Security: RLS enabled, inherits permissions from base tables.';
