-- ============================================================================
-- Remove csv_line_number column from organizations
-- ============================================================================
--
-- This column was used for CSV import mapping but is no longer needed.
-- The new approach generates seed.sql files directly from CSVs using
-- name-based deduplication (industry standard).
--
-- Migration is reversible via the down migration if needed.
-- ============================================================================

-- Drop the unique constraint first
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_csv_line_number_key;

-- Drop the column
ALTER TABLE organizations DROP COLUMN IF EXISTS csv_line_number;

-- Add comment documenting the change
COMMENT ON TABLE organizations IS 'Organizations table. CSV import now uses seed.sql generation (see scripts/generate-seed.ts)';
