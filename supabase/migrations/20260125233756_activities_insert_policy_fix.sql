-- Fix activities INSERT policy to require authentication
-- and validate foreign key references
--
-- SECURITY ISSUE: Previous policy used USING(true) which allowed
-- unauthenticated inserts and didn't validate foreign key access
--
-- FIX: Require authentication and verify user has access to
-- referenced opportunities and organizations

DROP POLICY IF EXISTS "activities_insert_policy" ON activities;

CREATE POLICY "activities_insert_policy"
ON activities FOR INSERT
TO authenticated
WITH CHECK (
  -- Require authenticated user
  auth.uid() IS NOT NULL
  AND (
    -- Validate opportunity access if provided
    opportunity_id IS NULL
    OR EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = opportunity_id
      AND deleted_at IS NULL
    )
  )
  AND (
    -- Validate organization access if provided
    organization_id IS NULL
    OR EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_id
      AND deleted_at IS NULL
    )
  )
);

-- Create indexes to support the EXISTS checks if they don't exist
CREATE INDEX IF NOT EXISTS idx_opportunities_id_not_deleted
  ON opportunities(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_id_not_deleted
  ON organizations(id) WHERE deleted_at IS NULL;

COMMENT ON POLICY "activities_insert_policy" ON activities IS
'Authenticated users can insert activities with validation of foreign key references';
