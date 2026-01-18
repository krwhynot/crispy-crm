-- Fix segments indexes to support soft-delete reuse
-- Issue: Current UNIQUE indexes prevent reusing names of soft-deleted segments
-- Solution: Convert to partial indexes that only enforce uniqueness on active records

BEGIN;

-- Drop existing rigid indexes
DROP INDEX IF EXISTS industries_name_case_insensitive_idx;
DROP INDEX IF EXISTS segments_name_type_case_insensitive_idx;
-- Note: segments_name_type_unique is a CONSTRAINT, not just an index
ALTER TABLE segments DROP CONSTRAINT IF EXISTS segments_name_type_unique;

-- Create partial unique index on segment name (case-insensitive, only active records)
CREATE UNIQUE INDEX segments_name_case_insensitive_idx
    ON segments (LOWER(name))
    WHERE deleted_at IS NULL;

-- Create partial unique index on segment name + type combination (only active records)
CREATE UNIQUE INDEX segments_name_type_case_insensitive_idx
    ON segments (LOWER(name), segment_type)
    WHERE deleted_at IS NULL;

COMMIT;
