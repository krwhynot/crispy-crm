-- Migration: Require segment_id for organizations (Defense-in-Depth)
-- Purpose: Enforce business rule at database level that every organization must have a segment
--
-- Layer 2 of validation architecture:
-- 1. Backfill null segment_id values to "Unknown" segment
-- 2. Add NOT NULL constraint
-- 3. Update column comment to reflect requirement
--
-- Background: Organizations with null segment_id bypass validation layers.
-- This migration ensures the database enforces the business rule regardless of client state.

-- Step 1: Backfill existing null values to "Unknown" segment
UPDATE organizations
SET segment_id = '22222222-2222-4222-8222-000000000009'
WHERE segment_id IS NULL
  AND deleted_at IS NULL;

-- Step 2: Add NOT NULL constraint
ALTER TABLE organizations
ALTER COLUMN segment_id SET NOT NULL;

-- Step 3: Update column comment
COMMENT ON COLUMN organizations.segment_id IS
  'Required: Playbook category segment (operator type). Must reference segments.id. Defaults to Unknown (22222222-2222-4222-8222-000000000009) if unspecified.';
