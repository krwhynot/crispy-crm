-- ============================================================================
-- Migration: Enforce Activity Business Rule Constraints
-- ============================================================================
-- Business Rules:
--   WF-H1-002: Interaction activities MUST have an opportunity_id
--   WF-H1-003: Every activity MUST link to contact_id OR organization_id
--
-- Context: These constraints already exist but were modified to exempt tasks.
-- This migration removes task exemptions to align database constraints with
-- Zod validation schemas (src/atomic-crm/validation/activities/schemas.ts:102-109)
--
-- IMPORTANT: This enforces stricter validation at the database layer to prevent
-- orphaned activities from direct Supabase API calls bypassing Zod validation.
-- ============================================================================

-- ============================================================================
-- STEP 1: Pre-flight Data Validation
-- ============================================================================
-- Check for existing violations before applying constraints

-- Verify no interaction activities exist without opportunity_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM activities
    WHERE activity_type = 'interaction'
    AND opportunity_id IS NULL
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add constraint: % interaction activities have NULL opportunity_id',
      (SELECT COUNT(*) FROM activities WHERE activity_type = 'interaction' AND opportunity_id IS NULL AND deleted_at IS NULL);
  END IF;
END $$;

-- Verify no activities exist without contact_id AND organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM activities
    WHERE contact_id IS NULL
    AND organization_id IS NULL
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add constraint: % activities have both contact_id and organization_id as NULL',
      (SELECT COUNT(*) FROM activities WHERE contact_id IS NULL AND organization_id IS NULL AND deleted_at IS NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop Existing Constraints
-- ============================================================================
-- Remove old constraints that included task exemptions

ALTER TABLE activities DROP CONSTRAINT IF EXISTS check_interaction_has_opportunity;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS check_has_contact_or_org;

-- ============================================================================
-- STEP 3: Add Strict Constraints (No Exemptions)
-- ============================================================================

-- Constraint 1: Interaction activities MUST have opportunity_id
ALTER TABLE activities
ADD CONSTRAINT interactions_require_opportunity_check
CHECK (
  activity_type != 'interaction'
  OR opportunity_id IS NOT NULL
);

COMMENT ON CONSTRAINT interactions_require_opportunity_check ON activities IS
  'Business rule WF-H1-002: Interaction activities must be linked to an opportunity.';

-- Constraint 2: All activities MUST have contact_id OR organization_id
ALTER TABLE activities
ADD CONSTRAINT activities_require_entity_check
CHECK (
  contact_id IS NOT NULL
  OR organization_id IS NOT NULL
);

COMMENT ON CONSTRAINT activities_require_entity_check ON activities IS
  'Business rule WF-H1-003: Every activity must be linked to either a contact OR organization.';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================
-- Verify constraints were added successfully

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'activities'::regclass
  AND conname IN ('interactions_require_opportunity_check', 'activities_require_entity_check');

  IF constraint_count != 2 THEN
    RAISE EXCEPTION 'Constraint verification failed: Expected 2 constraints, found %', constraint_count;
  END IF;

  RAISE NOTICE 'Successfully added % activity constraints', constraint_count;
END $$;
