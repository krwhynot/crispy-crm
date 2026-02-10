-- Migration: Fix views referencing deprecated tasks table
-- Purpose: Update contacts_summary and principal_pipeline_summary to query activities
--          instead of the deprecated tasks table (renamed to tasks_deprecated in 20260121000005)
--
-- Background:
--   The tasks table was consolidated into the activities table with activity_type='task'
--   in migration 20260121000002. However, two views were not updated:
--   1. contacts_summary - nb_tasks count still queries FROM tasks
--   2. principal_pipeline_summary - next_action_summary subquery queries FROM tasks
--
-- Column mapping:
--   tasks.title        -> activities.subject (aliased as title in tasks_v)
--   tasks.due_date     -> activities.due_date
--   tasks.completed    -> activities.completed
--   tasks.contact_id   -> activities.contact_id
--   tasks.opportunity_id -> activities.opportunity_id
--   tasks.deleted_at   -> activities.deleted_at
--
-- Security: Both views retain security_invoker = true for RLS enforcement

-- =============================================================================
-- STEP 1: Recreate contacts_summary view
-- =============================================================================
-- Change: nb_tasks subquery now queries activities WHERE activity_type = 'task'
-- All other columns and logic remain unchanged from 20251130173144

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
    COALESCE(activities_count.cnt, 0) AS nb_activities

FROM contacts c

-- Organization join
LEFT JOIN organizations o
    ON o.id = c.organization_id
   AND o.deleted_at IS NULL

-- Notes count subquery (soft-delete aware)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM contact_notes cn
    WHERE cn.contact_id = c.id
      AND cn.deleted_at IS NULL
) notes_count ON true

-- Tasks count subquery (FIXED: now queries activities with activity_type='task')
-- Previously: FROM tasks t WHERE t.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM activities a
    WHERE a.contact_id = c.id
      AND a.activity_type = 'task'
      AND a.deleted_at IS NULL
) tasks_count ON true

-- Activities count subquery (soft-delete aware)
-- Note: This counts ALL activities including tasks (for total activity badge)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM activities a
    WHERE a.contact_id = c.id
      AND a.deleted_at IS NULL
) activities_count ON true

WHERE c.deleted_at IS NULL;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON contacts_summary TO authenticated;

-- Update documentation
COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes nb_notes (contact_notes count), nb_tasks (activities with type=task), '
    'and nb_activities (all activities count) for UI display. '
    'All counts are soft-delete aware (deleted_at IS NULL). '
    'Fixed in 20260210000003: nb_tasks now queries activities table instead of deprecated tasks.';

-- =============================================================================
-- STEP 2: Recreate principal_pipeline_summary view
-- =============================================================================
-- Change: next_action_summary subquery now queries activities WHERE activity_type = 'task'
-- Column mapping: a.subject (tasks had title), a.due_date, a.completed
-- All other columns and logic remain unchanged from 20260102180656

DROP VIEW IF EXISTS principal_pipeline_summary;

CREATE VIEW principal_pipeline_summary
WITH (security_invoker = true)
AS
SELECT o.id,
    o.id AS principal_id,
    o.name AS principal_name,
    o.created_at,
    o.updated_at,
    o.deleted_at,
    count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) AS total_pipeline,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_this_week,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_last_week,
    CASE
        WHEN count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) > 0 AND count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) = 0 THEN 'stale'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) > count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'increasing'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) < count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'decreasing'::text
        ELSE 'steady'::text
    END AS momentum,
    -- FIXED: Query activities with activity_type='task' instead of deprecated tasks table
    -- Column mapping: a.subject = title, a.due_date, a.completed
    (SELECT task.subject
        FROM activities task
        JOIN opportunities sub_opp ON task.opportunity_id = sub_opp.id
        WHERE sub_opp.principal_organization_id = o.id
          AND task.activity_type = 'task'
          AND task.completed = false
          AND task.deleted_at IS NULL
          AND sub_opp.deleted_at IS NULL
        ORDER BY task.due_date NULLS LAST
        LIMIT 1) AS next_action_summary,
    (SELECT opportunities.account_manager_id
        FROM opportunities
        WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL AND opportunities.account_manager_id IS NOT NULL
        ORDER BY opportunities.created_at DESC
        LIMIT 1) AS sales_id
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'::organization_type AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.created_at, o.updated_at, o.deleted_at;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON principal_pipeline_summary TO authenticated;

-- Update documentation
COMMENT ON VIEW principal_pipeline_summary IS
    'Principal pipeline metrics: total pipeline count, weekly activity trends, momentum indicator, next action. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Fixed in 20260210000003: next_action_summary now queries activities table (activity_type=task) '
    'instead of deprecated tasks table. Column mapping: activities.subject = tasks.title.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
DO $$
DECLARE
    deprecated_refs INTEGER;
BEGIN
    -- Check if any views still reference tasks_deprecated
    SELECT COUNT(*) INTO deprecated_refs
    FROM pg_views
    WHERE schemaname = 'public'
      AND (definition ILIKE '%FROM tasks %' OR definition ILIKE '%FROM tasks_deprecated%')
      AND viewname NOT IN ('tasks_v', 'tasks_summary'); -- Compatibility views are expected

    IF deprecated_refs > 0 THEN
        RAISE WARNING '% view(s) may still reference deprecated tasks table. Run: SELECT viewname FROM pg_views WHERE schemaname = ''public'' AND definition ILIKE ''%%FROM tasks %%'';', deprecated_refs;
    ELSE
        RAISE NOTICE 'All views updated to use activities table for task data.';
    END IF;
END $$;
