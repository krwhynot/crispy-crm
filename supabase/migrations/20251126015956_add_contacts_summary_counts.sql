-- Migration: add_contacts_summary_counts
-- Purpose: Extend contacts_summary view with nb_notes and nb_tasks count metrics
-- Also adds missing status column to contacts table
--
-- Security: Uses security_invoker to enforce RLS from underlying tables
-- Performance: Adds index on tasks.contact_id for efficient count queries
-- Soft-delete: All subqueries filter deleted_at IS NULL

-- =============================================================================
-- STEP 1: Add missing status column to contacts table
-- =============================================================================
-- The frontend ContactStatusBadge expects this column but it was never created
-- Default 'cold' matches the badge component's first status level

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contacts'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'cold';
        COMMENT ON COLUMN contacts.status IS
            'Contact engagement level: cold (dormant), warm (engaged), hot (ready), in-contract (closed)';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Add performance index for tasks.contact_id
-- =============================================================================
-- The tasks table has contact_id but no index for efficient lookups
-- Partial index excludes soft-deleted rows

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id
ON tasks(contact_id)
WHERE deleted_at IS NULL;

-- =============================================================================
-- STEP 3: Drop and recreate contacts_summary view with count columns
-- =============================================================================
-- Using LEFT JOIN LATERAL with COALESCE for null-safe counts
-- security_invoker ensures RLS is enforced on subqueries

DROP VIEW IF EXISTS contacts_summary;

CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    -- Core contact fields (unchanged)
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
    c.status,  -- NEW: engagement status (cold/warm/hot/in-contract)

    -- Organization reference (unchanged)
    o.name AS company_name,

    -- NEW: Activity count metrics via LEFT JOIN LATERAL
    -- COALESCE ensures 0 instead of NULL when no related records exist
    COALESCE(notes_count.cnt, 0) AS nb_notes,
    COALESCE(tasks_count.cnt, 0) AS nb_tasks

FROM contacts c

-- Organization join (unchanged)
LEFT JOIN organizations o
    ON o.id = c.organization_id
   AND o.deleted_at IS NULL

-- Notes count subquery (soft-delete aware)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM "contactNotes" cn
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

WHERE c.deleted_at IS NULL;

-- =============================================================================
-- STEP 4: Re-grant permissions (CRITICAL - views lose grants on recreation)
-- =============================================================================
GRANT SELECT ON contacts_summary TO authenticated;

-- =============================================================================
-- STEP 5: Update documentation
-- =============================================================================
COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes nb_notes (contactNotes count) and nb_tasks (tasks count) for UI display. '
    'All counts are soft-delete aware (deleted_at IS NULL).';
