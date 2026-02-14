/**
 * Create entity_timeline View
 *
 * This view provides a unified timeline of activities and tasks for display
 * on contact and organization detail pages. Combines both record types into
 * a single, sortable stream with consistent column structure.
 *
 * Usage:
 * - Filter by contact_id or organization_id
 * - Sort by entry_date DESC for chronological timeline
 * - entry_type distinguishes 'activity' vs 'task'
 * - subtype provides specific type (call, email, meeting, follow_up, etc.)
 *
 * Performance Notes:
 * - Indexes on filter columns are CRITICAL for view performance
 * - UNION ALL used (no deduplication) for optimal performance
 * - Snoozed tasks are excluded until their snooze_until date passes
 */

-- ============================================================================
-- STEP 1: Ensure indexes exist on activities for view performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_contact_id
  ON activities(contact_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_organization_id
  ON activities(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_entry_date
  ON activities(activity_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Ensure indexes exist on tasks for view performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_entry_date
  ON tasks(due_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 3: Create unified timeline view
-- ============================================================================

CREATE OR REPLACE VIEW entity_timeline AS
SELECT
  id,
  'activity'::text AS entry_type,
  type::text AS subtype,           -- call, email, meeting, etc.
  subject AS title,
  description,
  activity_date AS entry_date,
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  NULL::bigint AS sales_id,        -- activities don't have assignee
  created_at
FROM activities
WHERE deleted_at IS NULL

UNION ALL

SELECT
  id,
  'task'::text AS entry_type,
  type::text AS subtype,           -- call, email, meeting, follow_up, etc.
  title,
  description,
  due_date AS entry_date,
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  sales_id,                        -- task assignee for permission checks
  created_at
FROM tasks
WHERE deleted_at IS NULL
  AND (snooze_until IS NULL OR snooze_until <= CURRENT_DATE);

-- ============================================================================
-- STEP 4: Grant access to authenticated role
-- ============================================================================

GRANT SELECT ON entity_timeline TO authenticated;

-- ============================================================================
-- STEP 5: Add documentation comment
-- ============================================================================

COMMENT ON VIEW entity_timeline IS
  'Unified timeline of activities and tasks for contacts/organizations.
   Filter by contact_id or organization_id. Sort by entry_date DESC.
   entry_type: activity | task. subtype: specific type (call, email, etc.).
   Snoozed tasks excluded until snooze_until date passes.';

-- ============================================================================
-- Verification Queries (for manual testing)
-- ============================================================================
-- Uncomment and run these after migration to verify:
--
-- -- Check view exists and returns data:
-- SELECT entry_type, COUNT(*) FROM entity_timeline GROUP BY entry_type;
--
-- -- Check timeline for a specific contact:
-- SELECT entry_type, subtype, title, entry_date
-- FROM entity_timeline
-- WHERE contact_id = 1
-- ORDER BY entry_date DESC
-- LIMIT 10;
--
-- -- Check timeline for a specific organization:
-- SELECT entry_type, subtype, title, entry_date
-- FROM entity_timeline
-- WHERE organization_id = 1
-- ORDER BY entry_date DESC
-- LIMIT 10;
--
-- -- Verify indexes exist:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('activities', 'tasks')
--   AND indexname LIKE 'idx_%entry_date%' OR indexname LIKE 'idx_%contact_id%' OR indexname LIKE 'idx_%organization_id%';
