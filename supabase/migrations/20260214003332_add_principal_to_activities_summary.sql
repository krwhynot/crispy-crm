-- Add principal_organization_id and principal_organization_name to activities_summary
-- Root cause: WeeklyActivitySummary shows "No Principal" because it fetches customer org
-- (organization_id) not the manufacturer (principal) linked via opportunity.
--
-- Changes:
-- 1. Relax opportunity JOIN: remove AND opp.deleted_at IS NULL so activities on
--    archived opportunities still resolve their principal.
-- 2. Add LEFT JOIN to organizations for principal_organization_id from opportunity.
-- 3. Add two new columns: principal_organization_id, principal_organization_name.
--
-- The WHERE a.deleted_at IS NULL still filters deleted activities.
-- Relaxing the opp JOIN is safe: we want to show which principal an activity was for,
-- even if the opportunity was later archived.

DROP VIEW IF EXISTS activities_summary;

CREATE VIEW activities_summary
WITH (security_invoker = true)
AS SELECT
  a.id,
  a.type,
  a.subject,
  a.description,
  a.activity_date,
  a.duration_minutes,
  a.contact_id,
  a.organization_id,
  a.opportunity_id,
  a.follow_up_required,
  a.follow_up_date,
  a.outcome,
  a.created_at,
  a.updated_at,
  a.created_by,
  a.updated_by,
  a.deleted_at,
  a.activity_type,
  -- Task-related fields
  a.due_date,
  a.reminder_date,
  a.completed,
  a.completed_at,
  a.priority,
  a.sales_id,
  a.snooze_until,
  a.overdue_notified_at,
  a.related_task_id,
  -- Pre-joined creator info
  s.first_name AS creator_first_name,
  s.last_name AS creator_last_name,
  s.email AS creator_email,
  s.avatar_url AS creator_avatar_url,
  -- Pre-joined names for display
  c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
  o.name AS organization_name,
  opp.name AS opportunity_name,
  -- Principal (manufacturer) info via opportunity
  opp.principal_organization_id AS principal_organization_id,
  prin_org.name AS principal_organization_name
FROM activities a
LEFT JOIN sales s ON a.created_by = s.id AND s.deleted_at IS NULL
LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN organizations o ON a.organization_id = o.id AND o.deleted_at IS NULL
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id
LEFT JOIN organizations prin_org ON opp.principal_organization_id = prin_org.id
WHERE a.deleted_at IS NULL;

GRANT SELECT ON activities_summary TO authenticated;
GRANT SELECT ON activities_summary TO anon;

COMMENT ON VIEW activities_summary IS 'Activities view with pre-joined creator, entity, and principal data. security_invoker=true for RLS.';

-- ============================================================
-- Post-migration assertions
-- ============================================================

-- Assert: new columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities_summary'
    AND column_name = 'principal_organization_id'
  ) THEN RAISE EXCEPTION 'Missing column principal_organization_id'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities_summary'
    AND column_name = 'principal_organization_name'
  ) THEN RAISE EXCEPTION 'Missing column principal_organization_name'; END IF;
END $$;

-- Assert: security_invoker is set
DO $$
DECLARE
  sec_inv text;
BEGIN
  SELECT reloptions::text INTO sec_inv
    FROM pg_class WHERE relname = 'activities_summary';
  IF sec_inv IS NULL OR sec_inv NOT LIKE '%security_invoker=true%' THEN
    RAISE EXCEPTION 'security_invoker not set on activities_summary';
  END IF;
END $$;

-- Assert: grants exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'activities_summary' AND grantee = 'authenticated' AND privilege_type = 'SELECT'
  ) THEN RAISE EXCEPTION 'Missing SELECT grant for authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'activities_summary' AND grantee = 'anon' AND privilege_type = 'SELECT'
  ) THEN RAISE EXCEPTION 'Missing SELECT grant for anon'; END IF;
END $$;

-- Assert: row-count parity (view should return same count as filtered base table)
DO $$
DECLARE
  view_count bigint;
  base_count bigint;
BEGIN
  SELECT count(*) INTO view_count FROM activities_summary;
  SELECT count(*) INTO base_count FROM activities WHERE deleted_at IS NULL;
  IF view_count != base_count THEN
    RAISE EXCEPTION 'Row count mismatch: view=%, base=%', view_count, base_count;
  END IF;
END $$;
