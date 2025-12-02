-- Migration: add_timezone_to_sales
-- Purpose: Add timezone preference column to sales table for distributed team support
--
-- This enables users to select their preferred timezone for displaying timestamps
-- throughout the application. Uses IANA timezone format (e.g., 'America/New_York').
--
-- Default: America/Chicago (Central Time)
-- Validation: CHECK constraint ensures IANA format (Area/Location)

-- =============================================================================
-- STEP 1: Add timezone column with CHECK constraint
-- =============================================================================

ALTER TABLE sales
ADD COLUMN timezone TEXT DEFAULT 'America/Chicago'
  CHECK (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$');

-- =============================================================================
-- STEP 2: Add documentation
-- =============================================================================

COMMENT ON COLUMN sales.timezone IS
  'User timezone for display. Uses IANA timezone format (e.g., America/Chicago). '
  'Default is America/Chicago (Central Time).';
