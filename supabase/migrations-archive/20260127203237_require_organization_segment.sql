-- Migration: Require segment_id for organizations (Defense-in-Depth)
-- Purpose: Enforce business rule at database level that every organization must have a segment
--
-- Defense-in-depth validation architecture:
-- 1. Create trigger to auto-fill NULL segment_id on INSERT
-- 2. Backfill existing null segment_id values to "Unknown" segment
-- 3. Add NOT NULL constraint
--
-- Background: Organizations with null segment_id bypass validation layers.
-- This migration ensures the database enforces the business rule regardless of client state.

-- Step 1: Create trigger to auto-fill segment_id with "Unknown" segment
-- This fires BEFORE INSERT, so seed data with NULL values gets auto-filled
CREATE OR REPLACE FUNCTION set_default_segment_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.segment_id IS NULL THEN
    -- Default to "Unknown" segment
    NEW.segment_id := '22222222-2222-4222-8222-000000000009';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_default_segment_id_trigger ON organizations;
CREATE TRIGGER set_default_segment_id_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_default_segment_id();

-- Step 2: Backfill existing null values to "Unknown" segment
UPDATE organizations
SET segment_id = '22222222-2222-4222-8222-000000000009'
WHERE segment_id IS NULL
  AND deleted_at IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE organizations
ALTER COLUMN segment_id SET NOT NULL;

-- Step 4: Update column comment
COMMENT ON COLUMN organizations.segment_id IS
  'Required: Playbook category segment (operator type). Must reference segments.id. Trigger auto-fills with Unknown segment if NULL on INSERT.';
