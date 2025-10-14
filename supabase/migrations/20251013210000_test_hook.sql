-- Test migration to verify post-merge hook
-- This file can be deleted after testing

-- Add a comment to test table (harmless)
COMMENT ON TABLE contacts IS 'Test hook detection - this is a dummy migration';
