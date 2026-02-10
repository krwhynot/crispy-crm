-- Add notes from all 3 notes tables to entity_timeline view
-- Resolves BUSINESS_LOGIC_CONFLICT Q5: notes should appear on unified timeline
--
-- Based on CLOUD view definition (STI-based, single activities table)
-- Local migration 20260119000001 references a separate 'tasks' table that
-- does NOT exist on cloud — this migration is authoritative.

CREATE OR REPLACE VIEW public.entity_timeline AS
-- Existing: activities (activities + tasks via STI)
SELECT
  id,
  CASE WHEN activity_type = 'task' THEN 'task'::text ELSE 'activity'::text END AS entry_type,
  type::text AS subtype,
  subject AS title,
  description,
  CASE WHEN activity_type = 'task' THEN due_date::timestamptz ELSE activity_date END AS entry_date,
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  sales_id,
  created_at,
  completed,
  completed_at,
  priority
FROM activities
WHERE deleted_at IS NULL
  AND (activity_type <> 'task' OR snooze_until IS NULL OR snooze_until <= now())

UNION ALL

-- Contact notes
SELECT
  id + 100000000 AS id,
  'note'::text AS entry_type,
  'contact_note'::text AS subtype,
  LEFT(text, 100) AS title,
  text AS description,
  date AS entry_date,
  contact_id,
  NULL::bigint AS organization_id,
  NULL::bigint AS opportunity_id,
  created_by,
  sales_id,
  created_at,
  NULL::boolean AS completed,
  NULL::timestamptz AS completed_at,
  NULL::priority_level AS priority
FROM contact_notes
WHERE deleted_at IS NULL

UNION ALL

-- Organization notes (no created_by column — use NULL)
SELECT
  id + 200000000 AS id,
  'note'::text AS entry_type,
  'organization_note'::text AS subtype,
  LEFT(text, 100) AS title,
  text AS description,
  date AS entry_date,
  NULL::bigint AS contact_id,
  organization_id,
  NULL::bigint AS opportunity_id,
  NULL::bigint AS created_by,
  sales_id,
  created_at,
  NULL::boolean AS completed,
  NULL::timestamptz AS completed_at,
  NULL::priority_level AS priority
FROM organization_notes
WHERE deleted_at IS NULL

UNION ALL

-- Opportunity notes
SELECT
  id + 300000000 AS id,
  'note'::text AS entry_type,
  'opportunity_note'::text AS subtype,
  LEFT(text, 100) AS title,
  text AS description,
  date AS entry_date,
  NULL::bigint AS contact_id,
  NULL::bigint AS organization_id,
  opportunity_id,
  created_by,
  sales_id,
  created_at,
  NULL::boolean AS completed,
  NULL::timestamptz AS completed_at,
  NULL::priority_level AS priority
FROM opportunity_notes
WHERE deleted_at IS NULL;

-- Grant select to authenticated role (same as existing view)
GRANT SELECT ON public.entity_timeline TO authenticated;

-- Performance indexes for timeline filtering on notes tables
CREATE INDEX IF NOT EXISTS idx_contact_notes_timeline
  ON contact_notes (contact_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organization_notes_timeline
  ON organization_notes (organization_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunity_notes_timeline
  ON opportunity_notes (opportunity_id, date DESC) WHERE deleted_at IS NULL;
