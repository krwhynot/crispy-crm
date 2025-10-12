-- Migration: Fix industries table and organizations_summary view permissions
-- Date: 2025-01-07
-- Purpose: Add proper grants and ownership to fix 403 Forbidden errors

BEGIN;

-- =====================================================
-- 1. Set proper ownership for industries table
-- =====================================================
ALTER TABLE industries OWNER TO postgres;

-- =====================================================
-- 2. Grant access to Supabase roles for industries
-- =====================================================
GRANT ALL ON industries TO postgres, service_role;
GRANT SELECT, INSERT ON industries TO authenticated;

-- =====================================================
-- 3. Set proper ownership for organizations_summary view
-- =====================================================
ALTER VIEW organizations_summary OWNER TO postgres;

-- =====================================================
-- 4. Grant access to Supabase roles for organizations_summary
-- =====================================================
GRANT SELECT ON organizations_summary TO postgres, authenticator, authenticated, service_role;

-- =====================================================
-- 5. Verify RLS policies are in correct format
-- =====================================================
-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Allow authenticated read access" ON industries;
DROP POLICY IF EXISTS "Allow authenticated users to create" ON industries;

-- Recreate policies with proper conditions
CREATE POLICY "Allow authenticated read access"
ON industries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create"
ON industries FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;
