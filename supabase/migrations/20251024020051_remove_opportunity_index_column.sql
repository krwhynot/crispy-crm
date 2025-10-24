-- Migration: Remove index column and use timestamp-based ordering
-- Rationale: Eliminates race conditions, simplifies code, defers drag-and-drop to Phase 2
-- Per Engineering Constitution: NO OVER-ENGINEERING - use simplest solution that works

-- Drop the index column (no longer needed)
ALTER TABLE opportunities DROP COLUMN IF EXISTS index;

COMMENT ON TABLE opportunities IS
  'Opportunities ordered by created_at DESC within each stage';

-- Add index on (stage, created_at) for efficient sorting
-- Using DESC for newest-first ordering within each stage
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_created
ON opportunities(stage, created_at DESC)
WHERE deleted_at IS NULL;
