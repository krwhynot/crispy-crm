-- Fix activities INSERT policy - CONSOLIDATE all insert logic into ONE policy
--
-- SECURITY FIX: Multiple PERMISSIVE INSERT policies create OR logic,
-- allowing bypass of ownership requirements. This migration consolidates
-- ALL insert logic into a single policy with AND semantics.
--
-- Policy History:
-- - 20260109: Created activities_insert_owner (ownership only)
-- - 20260123: Modified activities_insert_owner (ownership only)
-- - 20260125000002: Created insert_activities_hybrid_assignment (role-based)
-- - This migration: CONSOLIDATES both into single policy
--
-- This version:
-- 1. Drops ALL existing INSERT policies on activities
-- 2. Creates single consolidated policy with:
--    a) Role-based assignment (manager/admin can assign to anyone)
--    b) Rep self-assignment (created_by OR sales_id match)
--    c) FK integrity checks (opportunity/organization exist and not deleted)

-- 1. Drop ALL existing INSERT policies to prevent OR logic bypass
DROP POLICY IF EXISTS "activities_insert_owner" ON "public"."activities";
DROP POLICY IF EXISTS "activities_insert_policy" ON "public"."activities";
DROP POLICY IF EXISTS "insert_activities_hybrid_assignment" ON "public"."activities";
DROP POLICY IF EXISTS "insert_activities" ON "public"."activities";
DROP POLICY IF EXISTS "authenticated_insert_activities" ON "public"."activities";

-- 2. Create single CONSOLIDATED insert policy
-- Combines: Role-based assignment + Ownership + FK Integrity
CREATE POLICY "activities_insert_policy"
ON "public"."activities"
FOR INSERT
TO authenticated
WITH CHECK (
  -- COND 1: AUTHORIZATION (Who can create, and for whom?)
  -- Managers/admins can create for anyone, reps only for themselves
  (
    public.is_manager_or_admin()
    OR
    created_by = public.current_sales_id()
    OR
    sales_id = public.current_sales_id()
  )

  AND

  -- COND 2: FK INTEGRITY (Does the opportunity exist & is it alive?)
  (
    opportunity_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = activities.opportunity_id
      AND deleted_at IS NULL
    )
  )

  AND

  -- COND 3: FK INTEGRITY (Does the organization exist & is it alive?)
  (
    organization_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = activities.organization_id
      AND deleted_at IS NULL
    )
  )
);

-- 3. Create indexes to support the EXISTS checks if they don't exist
-- These prevent full table scans on every INSERT
CREATE INDEX IF NOT EXISTS idx_opportunities_id_not_deleted
  ON opportunities(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_id_not_deleted
  ON organizations(id) WHERE deleted_at IS NULL;

COMMENT ON POLICY "activities_insert_policy" ON activities IS
'CONSOLIDATED INSERT policy (replaces activities_insert_owner + insert_activities_hybrid_assignment):
- Authorization: Managers/admins can create for anyone, reps only for themselves
- Integrity: Validates FK references exist and are not soft-deleted
- Security: Single policy prevents PERMISSIVE OR bypass';
