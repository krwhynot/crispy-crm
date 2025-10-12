-- Make industry_id nullable to allow organizations without industry classification
-- This aligns with the UX expectation where industry is optional
-- An "Unknown" industry will be pre-selected in the UI as a sensible default

-- Drop NOT NULL constraint on industry_id
ALTER TABLE organizations
ALTER COLUMN industry_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN organizations.industry_id IS 'Optional foreign key to industries table. NULL indicates industry is not specified. UI defaults to "Unknown" industry for better UX.';
