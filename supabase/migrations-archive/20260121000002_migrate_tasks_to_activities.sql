/**
 * Phase 2: Migrate Existing Tasks to Activities Table
 *
 * This migration copies all existing tasks into the activities table with
 * activity_type = 'task'. It also creates a mapping table for reference
 * integrity during the transition period.
 *
 * Migration Strategy:
 * 1. Create ID mapping table for old → new ID translation
 * 2. Insert all tasks as activities with type mapping
 * 3. Populate mapping table with old/new IDs
 * 4. Update any related_task_id references using the mapping
 *
 * IMPORTANT: This is a DATA migration - run only ONCE per environment.
 * Running multiple times will create duplicate activities.
 */

BEGIN;

-- ============================================================================
-- STEP 1: Create ID mapping table
-- ============================================================================
-- This table enables lookup of new activity IDs from old task IDs
-- Essential for:
-- - UI redirects during transition
-- - API backwards compatibility
-- - Debugging/auditing

CREATE TABLE IF NOT EXISTS task_id_mapping (
  old_task_id bigint PRIMARY KEY,
  new_activity_id bigint NOT NULL,
  migrated_at timestamptz DEFAULT NOW()
);

COMMENT ON TABLE task_id_mapping IS
  'Maps old tasks.id to new activities.id for STI migration. Keep until 2026-03-21 for rollback capability.';

CREATE INDEX IF NOT EXISTS idx_task_id_mapping_new_id ON task_id_mapping(new_activity_id);

-- ============================================================================
-- STEP 2: Map task_type to interaction_type
-- ============================================================================
-- Task types use Title Case, interaction types use snake_case
-- Mapping:
--   Call → call
--   Email → email
--   Meeting → meeting
--   Follow-up → follow_up
--   Demo → demo
--   Proposal → proposal
--   Other → other
--   None → administrative (no direct equivalent)

-- Create a temporary mapping function for cleaner SQL
CREATE OR REPLACE FUNCTION temp_map_task_type(task_type_value text)
RETURNS interaction_type AS $$
BEGIN
  RETURN CASE task_type_value
    WHEN 'Call' THEN 'call'::interaction_type
    WHEN 'Email' THEN 'email'::interaction_type
    WHEN 'Meeting' THEN 'meeting'::interaction_type
    WHEN 'Follow-up' THEN 'follow_up'::interaction_type
    WHEN 'Demo' THEN 'demo'::interaction_type
    WHEN 'Proposal' THEN 'proposal'::interaction_type
    WHEN 'Other' THEN 'other'::interaction_type
    WHEN 'None' THEN 'administrative'::interaction_type
    ELSE 'other'::interaction_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: Migrate tasks to activities
-- ============================================================================
-- Insert all tasks as activities with activity_type = 'task'
-- Uses ROW_NUMBER to track insertion order for ID mapping

-- First, get the count for verification
DO $$
DECLARE
  task_count integer;
BEGIN
  SELECT COUNT(*) INTO task_count FROM tasks;
  RAISE NOTICE 'Migrating % tasks to activities table', task_count;
END $$;

-- Insert tasks as activities
INSERT INTO activities (
  -- Activity core fields
  activity_type,
  type,
  subject,
  description,
  activity_date,

  -- Entity relationships
  contact_id,
  organization_id,
  opportunity_id,

  -- Task-specific fields (new columns from Phase 1)
  due_date,
  reminder_date,
  completed,
  completed_at,
  priority,
  sales_id,
  snooze_until,
  overdue_notified_at,

  -- Audit fields
  created_by,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  'task'::activity_type,
  temp_map_task_type(t.type::text),
  t.title,                                          -- title → subject
  t.description,
  COALESCE(t.due_date::timestamptz, t.created_at),  -- activity_date = due_date or created_at

  t.contact_id,
  t.organization_id,
  t.opportunity_id,

  t.due_date,
  t.reminder_date,
  COALESCE(t.completed, false),
  t.completed_at,
  COALESCE(t.priority, 'medium'::priority_level),
  t.sales_id,
  t.snooze_until,
  t.overdue_notified_at,

  t.created_by,
  t.created_at,
  t.updated_at,
  t.deleted_at
FROM tasks t
WHERE NOT EXISTS (
  -- Idempotency check: Skip if already migrated
  SELECT 1 FROM task_id_mapping m WHERE m.old_task_id = t.id
);

-- ============================================================================
-- STEP 4: Populate mapping table
-- ============================================================================
-- Match tasks to newly created activities by unique combination of:
-- - subject (title)
-- - created_at timestamp
-- - activity_type = 'task'

INSERT INTO task_id_mapping (old_task_id, new_activity_id)
SELECT t.id, a.id
FROM tasks t
JOIN activities a ON
  a.activity_type = 'task'
  AND a.subject = t.title
  AND a.created_at = t.created_at
  AND a.due_date = t.due_date
WHERE NOT EXISTS (
  SELECT 1 FROM task_id_mapping m WHERE m.old_task_id = t.id
);

-- ============================================================================
-- STEP 5: Update related_task_id references
-- ============================================================================
-- Any existing activities that reference tasks (via related_task_id column
-- that was added in Phase 1) need to be updated to point to the new activity IDs

-- Note: This handles future use cases. Currently related_task_id is new and empty.
UPDATE activities a
SET related_task_id = m.new_activity_id
FROM task_id_mapping m
WHERE a.related_task_id = m.old_task_id;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
  original_count integer;
  migrated_count integer;
  mapping_count integer;
BEGIN
  SELECT COUNT(*) INTO original_count FROM tasks;
  SELECT COUNT(*) INTO migrated_count FROM activities WHERE activity_type = 'task';
  SELECT COUNT(*) INTO mapping_count FROM task_id_mapping;

  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'Original tasks: %', original_count;
  RAISE NOTICE 'Migrated activities (type=task): %', migrated_count;
  RAISE NOTICE 'ID mappings created: %', mapping_count;

  IF original_count != mapping_count THEN
    RAISE WARNING 'Mapping count mismatch! Expected %, got %. Manual review recommended.',
      original_count, mapping_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Cleanup temporary function
-- ============================================================================

DROP FUNCTION IF EXISTS temp_map_task_type(text);

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration)
-- ============================================================================
--
-- -- Count comparison:
-- SELECT 'tasks' AS source, COUNT(*) AS total, COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active
-- FROM tasks
-- UNION ALL
-- SELECT 'activities (tasks)', COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NULL)
-- FROM activities WHERE activity_type = 'task';
--
-- -- Sample migrated data:
-- SELECT
--   t.id AS old_id,
--   m.new_activity_id,
--   t.title,
--   a.subject,
--   t.type AS old_type,
--   a.type AS new_type
-- FROM tasks t
-- JOIN task_id_mapping m ON m.old_task_id = t.id
-- JOIN activities a ON a.id = m.new_activity_id
-- LIMIT 10;
--
-- -- Verify type mapping:
-- SELECT t.type AS old_type, a.type AS new_type, COUNT(*)
-- FROM tasks t
-- JOIN task_id_mapping m ON m.old_task_id = t.id
-- JOIN activities a ON a.id = m.new_activity_id
-- GROUP BY t.type, a.type
-- ORDER BY t.type;
