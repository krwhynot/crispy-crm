-- Fix singular/plural naming inconsistency for junction table
-- Renames contact_organization to contact_organizations for consistency with other tables

-- Rename the table
ALTER TABLE IF EXISTS contact_organization RENAME TO contact_organizations;

-- Verify foreign key constraints transferred correctly
-- PostgreSQL handles this automatically with RENAME

-- Update any policies that may reference the old name
-- Note: Policies are automatically updated with table rename in PostgreSQL

-- Add comment for documentation
COMMENT ON TABLE contact_organizations IS 'Junction table for many-to-many relationship between contacts and organizations';