-- Fix segments indexes to support soft-delete reuse
-- Issue: Current UNIQUE indexes prevent reusing names of soft-deleted segments
-- Solution: Convert to partial indexes that only enforce uniqueness on active records

BEGIN;

-- Drop existing rigid indexes
DROP INDEX IF EXISTS industries_name_case_insensitive_idx;
DROP INDEX IF EXISTS segments_name_type_case_insensitive_idx;
-- Note: segments_name_type_unique is a CONSTRAINT, not just an index
ALTER TABLE segments DROP CONSTRAINT IF EXISTS segments_name_type_unique;

-- Step 1: Soft-delete duplicate segments (keeping the oldest by created_at)
-- This ensures we can create the unique index without conflicts
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY LOWER(name)
               ORDER BY created_at ASC, id ASC
           ) as rn
    FROM segments
    WHERE deleted_at IS NULL
)
UPDATE segments
SET deleted_at = NOW()
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Log how many duplicates were soft-deleted
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    IF affected_count > 0 THEN
        RAISE NOTICE 'Soft-deleted % duplicate segment(s) (keeping oldest by created_at)', affected_count;
    END IF;
END $$;

-- Step 2: Create partial unique index on segment name (case-insensitive, only active records)
CREATE UNIQUE INDEX segments_name_case_insensitive_idx
    ON segments (LOWER(name))
    WHERE deleted_at IS NULL;

-- Step 3: Create partial unique index on segment name + type combination (only active records)
CREATE UNIQUE INDEX segments_name_type_case_insensitive_idx
    ON segments (LOWER(name), segment_type)
    WHERE deleted_at IS NULL;

COMMIT;
