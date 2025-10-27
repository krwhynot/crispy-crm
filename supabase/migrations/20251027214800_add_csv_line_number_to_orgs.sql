-- Add csv_line_number column to organizations table for CSV import mapping
-- This allows us to map contacts' CSV-based organization_id (line numbers)
-- to actual database IDs during import

ALTER TABLE organizations
  ADD COLUMN csv_line_number INTEGER UNIQUE;

COMMENT ON COLUMN organizations.csv_line_number IS
  'Original line number from CSV import (1-indexed, excluding header). Used for mapping contacts to organizations during import. Can be dropped after import is complete.';
