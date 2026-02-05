-- ============================================================================
-- Migration 2/2: Backfill and simplify activity types
-- ============================================================================
-- Removes the engagement/interaction distinction from activities.
-- After this migration:
--   - activity_type has two meaningful values: 'activity' and 'task'
--   - opportunity_id is optional for all activities (no type-based constraints)
--   - activities still require contact_id OR organization_id (tasks exempt)
--   - all existing engagement/interaction records are backfilled to 'activity'
--
-- Note: PostgreSQL cannot remove enum values. 'engagement' and 'interaction'
-- remain in the enum but are unused. This is an acceptable tradeoff vs
-- converting to a TEXT column.
--
-- Depends on: 20260204000000_simplify_activity_types.sql (adds 'activity' enum value)
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill existing data
-- ============================================================================

UPDATE activities
SET activity_type = 'activity'
WHERE activity_type IN ('engagement', 'interaction')
  AND deleted_at IS NULL;

-- Also backfill soft-deleted records for consistency
UPDATE activities
SET activity_type = 'activity'
WHERE activity_type IN ('engagement', 'interaction')
  AND deleted_at IS NOT NULL;

-- ============================================================================
-- STEP 2: Drop engagement/interaction-specific constraints
-- ============================================================================

-- Drop: "interaction activities must have opportunity_id"
ALTER TABLE activities DROP CONSTRAINT IF EXISTS interactions_require_opportunity_check;

-- Drop: Original constraint from cloud_schema_fresh (may already be dropped)
ALTER TABLE activities DROP CONSTRAINT IF EXISTS check_interaction_has_opportunity;

-- Keep: activities_require_entity_check (still valid - activities need contact OR org)
-- Keep: check_task_required_fields (unchanged - tasks need due_date + sales_id)

-- Update comment on remaining constraint
COMMENT ON CONSTRAINT activities_require_entity_check ON activities IS
  'Activities must be linked to contact OR organization. Exception: Tasks can exist independently as standalone to-do items.';

-- ============================================================================
-- STEP 3: Update founding interaction trigger
-- ============================================================================
-- The trigger sets founding_interaction_id on opportunities when the first
-- activity linked to that opportunity is created. Previously only fired for
-- activity_type = 'interaction'; now fires for activity_type = 'activity'.

CREATE OR REPLACE FUNCTION public.set_founding_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark founding activity for new opportunities
    -- Fires for any activity (not tasks) linked to an opportunity
    IF NEW.activity_type = 'activity' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION set_founding_interaction() IS
'Sets the founding_interaction_id on opportunities when the first activity is created for that opportunity. Runs AFTER INSERT to ensure the activity ID exists.';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  engagement_count INTEGER;
  interaction_count INTEGER;
  activity_count INTEGER;
  task_count INTEGER;
  constraint_exists BOOLEAN;
BEGIN
  -- Verify backfill completed
  SELECT COUNT(*) INTO engagement_count
  FROM activities WHERE activity_type = 'engagement';

  SELECT COUNT(*) INTO interaction_count
  FROM activities WHERE activity_type = 'interaction';

  SELECT COUNT(*) INTO activity_count
  FROM activities WHERE activity_type = 'activity';

  SELECT COUNT(*) INTO task_count
  FROM activities WHERE activity_type = 'task';

  IF engagement_count > 0 OR interaction_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % engagements, % interactions still exist',
      engagement_count, interaction_count;
  END IF;

  -- Verify interaction constraint was dropped
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'activities'::regclass
    AND conname = 'interactions_require_opportunity_check'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE EXCEPTION 'Constraint interactions_require_opportunity_check was not dropped';
  END IF;

  -- Verify entity constraint still exists
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'activities'::regclass
    AND conname = 'activities_require_entity_check'
  ) INTO constraint_exists;

  IF NOT constraint_exists THEN
    RAISE EXCEPTION 'Constraint activities_require_entity_check is missing';
  END IF;

  RAISE NOTICE 'Migration successful: % activities, % tasks, 0 engagements, 0 interactions',
    activity_count, task_count;
END $$;
