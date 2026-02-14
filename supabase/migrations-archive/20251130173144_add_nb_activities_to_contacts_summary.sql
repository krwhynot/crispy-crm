-- Migration: add_nb_activities_to_contacts_summary
-- Purpose: Add nb_activities count to contacts_summary view for tab badge display
--
-- This enables the ContactSlideOver component to show activity counts in tab badges.
-- The count includes all activities (engagements and interactions) linked to the contact.
--
-- Security: Uses security_invoker to enforce RLS from underlying tables
-- Performance: Creates partial index on activities.contact_id for efficient count queries
-- Soft-delete: Subquery filters deleted_at IS NULL

-- =============================================================================
-- STEP 1: Add performance index for activities.contact_id
-- =============================================================================
-- Partial index excludes soft-deleted rows for efficient count lookups

CREATE INDEX IF NOT EXISTS idx_activities_contact_id
ON activities(contact_id)
WHERE deleted_at IS NULL AND contact_id IS NOT NULL;

-- =============================================================================
-- STEP 2: Drop and recreate contacts_summary view with nb_activities
-- =============================================================================
-- Adding activities count alongside existing nb_notes and nb_tasks

DROP VIEW IF EXISTS contacts_summary;

CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    -- Core contact fields
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
    c.status,

    -- Organization reference
    o.name AS company_name,

    -- Activity count metrics via LEFT JOIN LATERAL
    -- COALESCE ensures 0 instead of NULL when no related records exist
    COALESCE(notes_count.cnt, 0) AS nb_notes,
    COALESCE(tasks_count.cnt, 0) AS nb_tasks,
    COALESCE(activities_count.cnt, 0) AS nb_activities  -- NEW

FROM contacts c

-- Organization join
LEFT JOIN organizations o
    ON o.id = c.organization_id
   AND o.deleted_at IS NULL

-- Notes count subquery (soft-delete aware)
-- Uses snake_case table name per P3 rename migration
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM contact_notes cn
    WHERE cn.contact_id = c.id
      AND cn.deleted_at IS NULL
) notes_count ON true

-- Tasks count subquery (soft-delete aware)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM tasks t
    WHERE t.contact_id = c.id
      AND t.deleted_at IS NULL
) tasks_count ON true

-- Activities count subquery (soft-delete aware) -- NEW
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM activities a
    WHERE a.contact_id = c.id
      AND a.deleted_at IS NULL
) activities_count ON true

WHERE c.deleted_at IS NULL;

-- =============================================================================
-- STEP 3: Re-grant permissions (CRITICAL - views lose grants on recreation)
-- =============================================================================
GRANT SELECT ON contacts_summary TO authenticated;

-- =============================================================================
-- STEP 4: Update documentation
-- =============================================================================
COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes nb_notes (contact_notes count), nb_tasks (tasks count), and nb_activities (activities count) for UI display. '
    'All counts are soft-delete aware (deleted_at IS NULL).';
