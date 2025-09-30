-- Add missing columns to organizations table
-- These fields exist in the frontend validation but were missing from the database

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS context_links jsonb,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tax_identifier text;

-- Add comments for documentation
COMMENT ON COLUMN organizations.context_links IS 'Array of related URLs or references stored as JSONB';
COMMENT ON COLUMN organizations.description IS 'Organization description or notes';
COMMENT ON COLUMN organizations.tax_identifier IS 'Tax identification number (EIN, VAT, etc.)';