-- Grant authenticated role permissions on all tables
-- This ensures authenticated users can interact with the database through RLS policies

-- Grant permissions on ALL existing tables in public schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on all sequences (required for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set default privileges for future tables created by postgres role
-- This ensures new tables automatically get the correct permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Comment
COMMENT ON SCHEMA public IS 'Standard public schema with authenticated role having full CRUD access, governed by RLS policies';
