-- ============================================================================
-- Migration: Add NOT NULL constraint to segments.created_by
-- ============================================================================
-- Audit Issue: DB-001 - Audit trail requires attribution for all records
-- Pattern: Backfill nulls before adding constraint (PostgreSQL best practice)
-- ============================================================================

-- Step 1: Backfill NULL created_by values with system user
-- Using the first admin user as the default attribution for historical records
UPDATE segments
SET created_by = (
  SELECT s.id
  FROM sales s
  WHERE s.role = 'admin'
  ORDER BY s.created_at ASC
  LIMIT 1
)
WHERE created_by IS NULL;

-- Step 2: Add NOT NULL constraint
-- This will fail if any NULL values remain (fail-fast principle)
ALTER TABLE segments ALTER COLUMN created_by SET NOT NULL;

-- Step 3: Add comment documenting the constraint
COMMENT ON COLUMN segments.created_by IS 'UUID of auth.users who created this segment. Required for audit trail.';
