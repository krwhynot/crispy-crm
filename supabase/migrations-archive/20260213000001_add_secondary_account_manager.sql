-- ============================================================================
-- Migration: Add Secondary Account Manager Support
-- ============================================================================
-- Purpose: Allow contacts and organizations to have a secondary account manager
--          (secondary_sales_id) in addition to the primary (sales_id).
--
-- Changes:
--   1a. Add secondary_sales_id columns, indexes, and check constraints
--   1b. Recreate contacts_summary view with secondary_sales_id
--   1c. Recreate organizations_summary view with secondary_sales_id
--   1d. Recreate contacts_with_account_manager view with secondary join
--   1e. Recreate organizations_with_account_manager view with secondary join
--   1f. Update RLS UPDATE policies for contacts and organizations
--   1i. Recreate principal_pipeline_summary view with opportunity_owner_id
--
-- Security:
--   - All views retain security_invoker for RLS pass-through
--   - RLS UPDATE policies expanded to allow secondary managers to edit
--   - Soft-delete filters preserved in all views and policies
--
-- ON DELETE convention: SET NULL for ownership references (per DATABASE_LAYER.md)
-- ============================================================================

-- ============================================================================
-- SECTION 1a: Schema Changes (ALTER TABLE, INDEX, CONSTRAINT)
-- ============================================================================

-- --- Contacts ---

ALTER TABLE contacts
  ADD COLUMN secondary_sales_id bigint REFERENCES sales(id) ON DELETE SET NULL;

-- Partial index: only index non-deleted rows for RLS/query efficiency
CREATE INDEX idx_contacts_secondary_sales_id
  ON contacts(secondary_sales_id)
  WHERE deleted_at IS NULL;

-- Prevent assigning the same person as both primary and secondary manager.
-- OR-NULL guard: if either is NULL, the constraint passes (no conflict).
-- IS DISTINCT FROM would reject both-NULL which is valid (unassigned).
ALTER TABLE contacts
  ADD CONSTRAINT contacts_different_managers
  CHECK (sales_id IS NULL OR secondary_sales_id IS NULL OR sales_id != secondary_sales_id);

-- --- Organizations ---

ALTER TABLE organizations
  ADD COLUMN secondary_sales_id bigint REFERENCES sales(id) ON DELETE SET NULL;

CREATE INDEX idx_organizations_secondary_sales_id
  ON organizations(secondary_sales_id)
  WHERE deleted_at IS NULL;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_different_managers
  CHECK (sales_id IS NULL OR secondary_sales_id IS NULL OR sales_id != secondary_sales_id);


-- ============================================================================
-- SECTION 1b: Recreate contacts_summary view
-- ============================================================================
-- Source: 20260210000003_fix_views_use_activities.sql (lines 29-107)
-- Change: Added c.secondary_sales_id after c.sales_id in SELECT list

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
    c.secondary_sales_id,  -- NEW: secondary account manager
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

-- Tasks count subquery (queries activities with activity_type='task')
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

COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Includes secondary_sales_id for secondary account manager support. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes nb_notes (contact_notes count), nb_tasks (activities with type=task), '
    'and nb_activities (all activities count) for UI display. '
    'All counts are soft-delete aware (deleted_at IS NULL).';


-- ============================================================================
-- SECTION 1c: Recreate organizations_summary view
-- ============================================================================
-- Source: 20260209121011_add_organization_tags.sql (lines 37-145)
-- Change: Added o.secondary_sales_id after o.sales_id in SELECT list

DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary
WITH (security_invoker = on)
AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.org_scope,
  o.parent_organization_id,
  parent.name AS parent_organization_name,
  o.priority,
  o.segment_id,
  segments.name AS segment_name,
  o.sales_id,
  o.secondary_sales_id,  -- NEW: secondary account manager
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,
  o.updated_at,
  o.deleted_at,
  o.email,
  o.linkedin_url,
  o.search_tsv,
  o.tags,

  COALESCE(child_branches.cnt, 0)::integer AS child_branch_count,
  COALESCE(branch_contacts.cnt, 0)::integer AS total_contacts_across_branches,
  COALESCE(branch_opportunities.cnt, 0)::integer AS total_opportunities_across_branches,
  COALESCE(direct_opportunities.cnt, 0)::integer AS nb_opportunities,
  COALESCE(direct_contacts.cnt, 0)::integer AS nb_contacts,
  last_opp_activity.val AS last_opportunity_activity,
  COALESCE(org_notes.cnt, 0)::integer AS nb_notes

FROM organizations o

LEFT JOIN organizations parent
  ON o.parent_organization_id = parent.id
  AND parent.deleted_at IS NULL

-- Join to segments table for segment_name
-- NOTE: Segments table does NOT have deleted_at (static reference data)
LEFT JOIN segments
  ON o.segment_id = segments.id

-- 1. Count of child branch organizations
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM organizations children
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
) child_branches ON true

-- 2. Count of distinct contacts across child branches
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT c.id)::integer AS cnt
  FROM organizations children
  LEFT JOIN contacts c ON c.organization_id = children.id
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
    AND c.deleted_at IS NULL
) branch_contacts ON true

-- 3. Count of distinct opportunities across child branches
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT opp.id)::integer AS cnt
  FROM organizations children
  LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
    AND opp.deleted_at IS NULL
) branch_opportunities ON true

-- 4. Count of direct opportunities
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM opportunities
  WHERE opportunities.principal_organization_id = o.id
    AND opportunities.deleted_at IS NULL
) direct_opportunities ON true

-- 5. Count of direct contacts
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM contacts
  WHERE contacts.organization_id = o.id
    AND contacts.deleted_at IS NULL
) direct_contacts ON true

-- 6. Most recent opportunity activity timestamp
LEFT JOIN LATERAL (
  SELECT MAX(opportunities.updated_at) AS val
  FROM opportunities
  WHERE opportunities.principal_organization_id = o.id
    AND opportunities.deleted_at IS NULL
) last_opp_activity ON true

-- 7. Count of organization notes
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM organization_notes
  WHERE organization_notes.organization_id = o.id
    AND organization_notes.deleted_at IS NULL
) org_notes ON true

WHERE o.deleted_at IS NULL;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON organizations_summary TO authenticated;

COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy, rollup metrics, segment_name, org_scope, search_tsv, tags, and audit columns. '
  'Includes secondary_sales_id for secondary account manager support. '
  'Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. '
  'Segments JOIN provides segment_name for sorting and display. '
  'Optimized: 7 correlated subqueries converted to LEFT JOIN LATERAL for better query planning. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';


-- ============================================================================
-- SECTION 1d: Recreate contacts_with_account_manager view
-- ============================================================================
-- Source: 20251130010932 (lines 214-226)
-- Change: Added secondary manager join and computed columns

DROP VIEW IF EXISTS contacts_with_account_manager;

CREATE VIEW contacts_with_account_manager
WITH (security_invoker = on)
AS
SELECT
  c.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user,
  COALESCE(
    s2.first_name || COALESCE(' ' || s2.last_name, ''),
    NULL
  ) AS secondary_account_manager_name,
  s2.user_id IS NOT NULL AS secondary_account_manager_is_user
FROM contacts c
LEFT JOIN sales s ON c.sales_id = s.id
LEFT JOIN sales s2 ON c.secondary_sales_id = s2.id;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON contacts_with_account_manager TO authenticated;

COMMENT ON VIEW contacts_with_account_manager IS
  'Contacts with denormalized primary and secondary account manager names. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';


-- ============================================================================
-- SECTION 1e: Recreate organizations_with_account_manager view
-- ============================================================================
-- Source: 20251130010932 (lines 234-245)
-- Change: Switched to o.* pattern (picks up org_scope, tags, secondary_sales_id)
--         and added secondary manager join

DROP VIEW IF EXISTS organizations_with_account_manager;

CREATE VIEW organizations_with_account_manager
WITH (security_invoker = on)
AS
SELECT
  o.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user,
  COALESCE(
    s2.first_name || COALESCE(' ' || s2.last_name, ''),
    NULL
  ) AS secondary_account_manager_name,
  s2.user_id IS NOT NULL AS secondary_account_manager_is_user
FROM organizations o
LEFT JOIN sales s ON o.sales_id = s.id
LEFT JOIN sales s2 ON o.secondary_sales_id = s2.id;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON organizations_with_account_manager TO authenticated;

COMMENT ON VIEW organizations_with_account_manager IS
  'Organizations with denormalized primary and secondary account manager names. '
  'Uses o.* to automatically include all organization columns (org_scope, tags, etc.). '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';


-- ============================================================================
-- SECTION 1f: Update RLS UPDATE policies for contacts and organizations
-- ============================================================================
-- Add secondary_sales_id ownership check to allow secondary managers to edit.
-- Uses (SELECT) wrappers for initPlan caching (per performance best practices).

-- --- Contacts UPDATE policy ---
-- Source: 20260201000001 (lines 111-121)
-- Change: Added secondary_sales_id ownership check

DROP POLICY IF EXISTS "contacts_update_owner_or_privileged" ON contacts;

CREATE POLICY "contacts_update_owner_or_privileged"
  ON contacts FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (
    created_by = (SELECT current_sales_id())
    OR sales_id = (SELECT current_sales_id())
    OR secondary_sales_id = (SELECT current_sales_id())
    OR (SELECT private.is_admin_or_manager())
  );

COMMENT ON POLICY "contacts_update_owner_or_privileged" ON contacts IS
  'UPDATE requires ownership (created_by, sales_id, or secondary_sales_id match) or manager/admin role. '
  'Uses (SELECT) wrappers for initPlan caching.';

-- --- Organizations UPDATE policy (role-based) ---
-- Source: 20260201000001 (lines 166-181), kept after 20260202000001 consolidation
-- Note: organizations_update_owner_or_privileged was DROPPED in 20260202000001.
--       Only organizations_update_role_based survives for organizations UPDATE.
-- Change: Added secondary_sales_id access check

DROP POLICY IF EXISTS "organizations_update_role_based" ON organizations;

CREATE POLICY "organizations_update_role_based"
  ON public.organizations FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (SELECT private.is_admin_or_manager())
      OR (SELECT private.can_access_by_role(sales_id, created_by))
      OR (secondary_sales_id IS NOT NULL AND (SELECT private.can_access_by_role(secondary_sales_id, NULL)))
    )
  )
  WITH CHECK (
    (SELECT private.is_admin_or_manager())
    OR (SELECT private.can_access_by_role(sales_id, created_by))
    OR (secondary_sales_id IS NOT NULL AND (SELECT private.can_access_by_role(secondary_sales_id, NULL)))
  );

COMMENT ON POLICY "organizations_update_role_based" ON organizations IS
  'UPDATE requires role-based access: admin/manager for all, reps for owned records '
  '(sales_id or created_by match), or secondary account manager access. '
  'Uses (SELECT) wrappers for initPlan caching.';


-- ============================================================================
-- SECTION 1i: Recreate principal_pipeline_summary view
-- ============================================================================
-- Source: 20260211000002_add_task_metrics_to_principal_pipeline_summary.sql
-- Change: Added opportunity_owner_id subquery after sales_id subquery

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
    -- Primary account manager (most recent opportunity's account_manager_id)
    (SELECT opportunities.account_manager_id
        FROM opportunities
        WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL AND opportunities.account_manager_id IS NOT NULL
        ORDER BY opportunities.created_at DESC
        LIMIT 1) AS sales_id,
    -- NEW: Opportunity owner (most recent opportunity's opportunity_owner_id)
    (SELECT opportunities.opportunity_owner_id
        FROM opportunities
        WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL AND opportunities.opportunity_owner_id IS NOT NULL
        ORDER BY opportunities.created_at DESC
        LIMIT 1) AS opportunity_owner_id,
    -- Task metrics for principal pipeline table (30-day window)
    (SELECT count(*)
        FROM activities t
        JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
        WHERE t_opp.principal_organization_id = o.id
          AND t.activity_type = 'task'
          AND t.completed = true
          AND t.completed_at >= (CURRENT_DATE - '30 days'::interval)
          AND t.deleted_at IS NULL
          AND t_opp.deleted_at IS NULL) AS completed_tasks_30d,
    (SELECT count(*)
        FROM activities t
        JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
        WHERE t_opp.principal_organization_id = o.id
          AND t.activity_type = 'task'
          AND t.deleted_at IS NULL
          AND t_opp.deleted_at IS NULL
          AND (t.due_date >= (CURRENT_DATE - '30 days'::interval)
               OR t.created_at >= (CURRENT_DATE - '30 days'::interval))) AS total_tasks_30d
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'::organization_type AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.created_at, o.updated_at, o.deleted_at;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON principal_pipeline_summary TO authenticated;

COMMENT ON VIEW principal_pipeline_summary IS
    'Principal pipeline metrics: total pipeline count, weekly activity trends, momentum indicator, '
    'next action, sales_id (account manager), opportunity_owner_id, and task completion (30d). '
    'Uses security_invoker to enforce RLS from underlying tables.';


-- ============================================================================
-- POST-MIGRATION ASSERTIONS
-- ============================================================================

-- Assert: secondary_sales_id columns exist on base tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'secondary_sales_id'
  ) THEN
    RAISE EXCEPTION 'Missing column contacts.secondary_sales_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'secondary_sales_id'
  ) THEN
    RAISE EXCEPTION 'Missing column organizations.secondary_sales_id';
  END IF;

  RAISE NOTICE 'PASS: secondary_sales_id columns exist on contacts and organizations';
END $$;

-- Assert: secondary_sales_id appears in summary views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts_summary' AND column_name = 'secondary_sales_id'
  ) THEN
    RAISE EXCEPTION 'Missing column contacts_summary.secondary_sales_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations_summary' AND column_name = 'secondary_sales_id'
  ) THEN
    RAISE EXCEPTION 'Missing column organizations_summary.secondary_sales_id';
  END IF;

  RAISE NOTICE 'PASS: secondary_sales_id columns exist in summary views';
END $$;

-- Assert: secondary account manager columns exist in _with_account_manager views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts_with_account_manager' AND column_name = 'secondary_account_manager_name'
  ) THEN
    RAISE EXCEPTION 'Missing column contacts_with_account_manager.secondary_account_manager_name';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations_with_account_manager' AND column_name = 'secondary_account_manager_name'
  ) THEN
    RAISE EXCEPTION 'Missing column organizations_with_account_manager.secondary_account_manager_name';
  END IF;

  RAISE NOTICE 'PASS: secondary_account_manager_name columns exist in _with_account_manager views';
END $$;

-- Assert: opportunity_owner_id column exists in principal_pipeline_summary
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'principal_pipeline_summary' AND column_name = 'opportunity_owner_id'
  ) THEN
    RAISE EXCEPTION 'Missing column principal_pipeline_summary.opportunity_owner_id';
  END IF;

  RAISE NOTICE 'PASS: opportunity_owner_id column exists in principal_pipeline_summary';
END $$;

-- Assert: check constraints exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'contacts_different_managers'
  ) THEN
    RAISE EXCEPTION 'Missing constraint contacts_different_managers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'organizations_different_managers'
  ) THEN
    RAISE EXCEPTION 'Missing constraint organizations_different_managers';
  END IF;

  RAISE NOTICE 'PASS: different_managers check constraints exist on contacts and organizations';
END $$;

-- Assert: grants exist on all recreated views
DO $$
DECLARE
  view_name TEXT;
  view_list TEXT[] := ARRAY[
    'contacts_summary',
    'organizations_summary',
    'contacts_with_account_manager',
    'organizations_with_account_manager',
    'principal_pipeline_summary'
  ];
BEGIN
  FOREACH view_name IN ARRAY view_list LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = view_name AND grantee = 'authenticated' AND privilege_type = 'SELECT'
    ) THEN
      RAISE EXCEPTION 'Missing SELECT grant for authenticated on %', view_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'PASS: SELECT grants exist for authenticated on all recreated views';
END $$;

-- Assert: security_invoker is set on all recreated views
DO $$
DECLARE
  view_name TEXT;
  view_list TEXT[] := ARRAY[
    'contacts_summary',
    'organizations_summary',
    'contacts_with_account_manager',
    'organizations_with_account_manager',
    'principal_pipeline_summary'
  ];
  opts TEXT;
BEGIN
  FOREACH view_name IN ARRAY view_list LOOP
    SELECT COALESCE(c.reloptions::text, '{}') INTO opts
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = view_name;

    IF opts NOT LIKE '%security_invoker=on%' AND opts NOT LIKE '%security_invoker=true%' THEN
      RAISE EXCEPTION 'security_invoker not set on %', view_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'PASS: security_invoker is set on all recreated views';
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECONDARY ACCOUNT MANAGER MIGRATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Schema changes:';
  RAISE NOTICE '  - contacts.secondary_sales_id (bigint, FK -> sales, ON DELETE SET NULL)';
  RAISE NOTICE '  - organizations.secondary_sales_id (bigint, FK -> sales, ON DELETE SET NULL)';
  RAISE NOTICE '  - idx_contacts_secondary_sales_id (partial index)';
  RAISE NOTICE '  - idx_organizations_secondary_sales_id (partial index)';
  RAISE NOTICE '  - contacts_different_managers CHECK constraint';
  RAISE NOTICE '  - organizations_different_managers CHECK constraint';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Views recreated:';
  RAISE NOTICE '  - contacts_summary (+ secondary_sales_id)';
  RAISE NOTICE '  - organizations_summary (+ secondary_sales_id)';
  RAISE NOTICE '  - contacts_with_account_manager (+ secondary join)';
  RAISE NOTICE '  - organizations_with_account_manager (+ secondary join, o.* pattern)';
  RAISE NOTICE '  - principal_pipeline_summary (+ opportunity_owner_id)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS policies updated:';
  RAISE NOTICE '  - contacts_update_owner_or_privileged (+ secondary_sales_id check)';
  RAISE NOTICE '  - organizations_update_role_based (+ secondary_sales_id access)';
  RAISE NOTICE '============================================';
END $$;
