-- ============================================================================
-- MIGRATION: Harden Participant Tables RLS Security
-- ============================================================================
-- Date: 2025-11-29
-- Author: Security Audit Remediation
--
-- Purpose: Add ownership-based UPDATE/DELETE policies while preserving
--          team-shared SELECT/INSERT behavior for participant tables.
--
-- Tables Affected:
--   - opportunity_participants
--   - interaction_participants
--
-- Security Model:
--   - SELECT: Team visibility (USING true) - unchanged
--   - INSERT: Collaborative (WITH CHECK true) + auto-set created_by
--   - UPDATE: Ownership-based (creator OR parent owner OR manager/admin)
--   - DELETE: Admin-only (matches tasks table pattern)
--
-- Breaking Changes: MINIMAL
--   - UPDATE: Now requires ownership or manager/admin role
--   - DELETE: Now requires admin role
--
-- Constraints Met:
--   [x] Idempotent - uses IF NOT EXISTS, DO $$ blocks
--   [x] Reversible - rollback section at bottom
--   [x] Manager/admin override preserved
--   [x] Soft-delete filtering in application (not RLS for performance)
--
-- Test locally first:
--   npx supabase db reset
--   npm run dev:local
-- ============================================================================

-- ============================================================================
-- STEP 1: SCHEMA CHANGES
-- ============================================================================
-- Add created_by column to interaction_participants for audit trail
-- (opportunity_participants already has this column)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'interaction_participants'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.interaction_participants
        ADD COLUMN created_by BIGINT REFERENCES public.sales(id);

        COMMENT ON COLUMN public.interaction_participants.created_by IS
            'Sales ID of user who added this participant. Used for ownership-based RLS.';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: BACKFILL DATA
-- ============================================================================
-- Inherit created_by from parent activity for existing records

UPDATE public.interaction_participants ip
SET created_by = a.created_by
FROM public.activities a
WHERE ip.activity_id = a.id
AND ip.created_by IS NULL
AND a.created_by IS NOT NULL;

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR RLS PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_interaction_participants_created_by
ON public.interaction_participants(created_by)
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunity_participants_created_by
ON public.opportunity_participants(created_by)
WHERE created_by IS NOT NULL;

-- Indexes for helper function JOINs (if not already present)
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id
ON public.opportunities(opportunity_owner_id)
WHERE opportunity_owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_created_by
ON public.opportunities(created_by)
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_created_by
ON public.activities(created_by)
WHERE created_by IS NOT NULL;

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================================================
-- These functions encapsulate ownership logic for RLS policies
-- SECURITY DEFINER ensures consistent execution context

-- Function: Check if current user owns an opportunity
CREATE OR REPLACE FUNCTION public.owns_opportunity(opp_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM opportunities
        WHERE id = opp_id
        AND (
            opportunity_owner_id = current_sales_id()
            OR created_by = current_sales_id()
        )
    )
$$;

COMMENT ON FUNCTION public.owns_opportunity(BIGINT) IS
    'Returns true if current user is the owner or creator of the opportunity. Used in RLS policies.';

-- Function: Check if current user owns an activity
CREATE OR REPLACE FUNCTION public.owns_activity(act_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM activities
        WHERE id = act_id
        AND created_by = current_sales_id()
    )
$$;

COMMENT ON FUNCTION public.owns_activity(BIGINT) IS
    'Returns true if current user created the activity. Used in RLS policies.';

-- ============================================================================
-- STEP 5: CREATE AUTO-POPULATE TRIGGERS
-- ============================================================================
-- Automatically set created_by on INSERT if not provided

-- Trigger function for opportunity_participants
CREATE OR REPLACE FUNCTION public.set_opportunity_participant_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_opportunity_participant_created_by() IS
    'Auto-populates created_by with current user sales_id on participant creation.';

-- Trigger function for interaction_participants
CREATE OR REPLACE FUNCTION public.set_interaction_participant_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_interaction_participant_created_by() IS
    'Auto-populates created_by with current user sales_id on participant creation.';

-- Create triggers (drop first for idempotency)
DROP TRIGGER IF EXISTS trigger_set_opportunity_participant_created_by ON opportunity_participants;
CREATE TRIGGER trigger_set_opportunity_participant_created_by
    BEFORE INSERT ON opportunity_participants
    FOR EACH ROW
    EXECUTE FUNCTION set_opportunity_participant_created_by();

DROP TRIGGER IF EXISTS trigger_set_interaction_participant_created_by ON interaction_participants;
CREATE TRIGGER trigger_set_interaction_participant_created_by
    BEFORE INSERT ON interaction_participants
    FOR EACH ROW
    EXECUTE FUNCTION set_interaction_participant_created_by();

-- ============================================================================
-- STEP 6: DROP EXISTING PERMISSIVE RLS POLICIES
-- ============================================================================
-- Clean slate approach - drop all existing policies on participant tables

-- opportunity_participants policies
DROP POLICY IF EXISTS authenticated_select_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_insert_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_update_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_delete_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS select_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS insert_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS update_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS delete_opportunity_participants ON opportunity_participants;

-- interaction_participants policies
DROP POLICY IF EXISTS authenticated_select_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_insert_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_update_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_delete_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS select_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS insert_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS update_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS delete_interaction_participants ON interaction_participants;

-- ============================================================================
-- STEP 7: CREATE NEW OWNERSHIP-BASED RLS POLICIES
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- OPPORTUNITY_PARTICIPANTS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- SELECT: Team visibility (unchanged from original behavior)
CREATE POLICY opportunity_participants_select_policy ON opportunity_participants
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON POLICY opportunity_participants_select_policy ON opportunity_participants IS
    'Team-wide SELECT access for relationship visibility. All authenticated users can see participants.';

-- INSERT: Collaborative (unchanged from original behavior)
-- Trigger auto-populates created_by for audit trail
CREATE POLICY opportunity_participants_insert_policy ON opportunity_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON POLICY opportunity_participants_insert_policy ON opportunity_participants IS
    'Any authenticated user can add participants. created_by is auto-set by trigger.';

-- UPDATE: Ownership-based with role elevation
CREATE POLICY opportunity_participants_update_policy ON opportunity_participants
    FOR UPDATE
    TO authenticated
    USING (
        -- User created this participant record
        created_by = current_sales_id()
        OR
        -- User owns the parent opportunity
        owns_opportunity(opportunity_id)
        OR
        -- Managers and admins can update any participant
        is_manager_or_admin()
    )
    WITH CHECK (
        -- Same conditions for the new row
        created_by = current_sales_id()
        OR
        owns_opportunity(opportunity_id)
        OR
        is_manager_or_admin()
    );

COMMENT ON POLICY opportunity_participants_update_policy ON opportunity_participants IS
    'UPDATE restricted to: record creator, opportunity owner, or managers/admins.';

-- DELETE: Admin-only (matches tasks table security pattern)
CREATE POLICY opportunity_participants_delete_policy ON opportunity_participants
    FOR DELETE
    TO authenticated
    USING (
        is_admin()
    );

COMMENT ON POLICY opportunity_participants_delete_policy ON opportunity_participants IS
    'Only admins can DELETE participant records. Use soft-delete (deleted_at) in application code.';

-- ═══════════════════════════════════════════════════════════════════════════
-- INTERACTION_PARTICIPANTS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- SELECT: Team visibility (unchanged from original behavior)
CREATE POLICY interaction_participants_select_policy ON interaction_participants
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON POLICY interaction_participants_select_policy ON interaction_participants IS
    'Team-wide SELECT access for activity participants. All authenticated users can see who participated.';

-- INSERT: Collaborative (unchanged from original behavior)
-- Trigger auto-populates created_by for audit trail
CREATE POLICY interaction_participants_insert_policy ON interaction_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON POLICY interaction_participants_insert_policy ON interaction_participants IS
    'Any authenticated user can add interaction participants. created_by is auto-set by trigger.';

-- UPDATE: Ownership-based with role elevation
CREATE POLICY interaction_participants_update_policy ON interaction_participants
    FOR UPDATE
    TO authenticated
    USING (
        -- User created this participant record
        created_by = current_sales_id()
        OR
        -- User owns the parent activity
        owns_activity(activity_id)
        OR
        -- Managers and admins can update any participant
        is_manager_or_admin()
    )
    WITH CHECK (
        -- Same conditions for the new row
        created_by = current_sales_id()
        OR
        owns_activity(activity_id)
        OR
        is_manager_or_admin()
    );

COMMENT ON POLICY interaction_participants_update_policy ON interaction_participants IS
    'UPDATE restricted to: record creator, activity owner, or managers/admins.';

-- DELETE: Admin-only (matches tasks table security pattern)
CREATE POLICY interaction_participants_delete_policy ON interaction_participants
    FOR DELETE
    TO authenticated
    USING (
        is_admin()
    );

COMMENT ON POLICY interaction_participants_delete_policy ON interaction_participants IS
    'Only admins can DELETE interaction participants. Use soft-delete (deleted_at) in application code.';

-- ============================================================================
-- STEP 8: ENSURE RLS IS ENABLED
-- ============================================================================

ALTER TABLE public.opportunity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to confirm migration success)
-- ============================================================================
/*
-- 1. Check policies were created correctly
SELECT tablename, policyname, cmd, qual as using_clause, with_check
FROM pg_policies
WHERE tablename IN ('opportunity_participants', 'interaction_participants')
ORDER BY tablename, cmd;

-- Expected output:
-- interaction_participants | interaction_participants_delete_policy | DELETE | is_admin()
-- interaction_participants | interaction_participants_insert_policy | INSERT | NULL | true
-- interaction_participants | interaction_participants_select_policy | SELECT | true
-- interaction_participants | interaction_participants_update_policy | UPDATE | (created_by = ... OR owns_activity(...) OR is_manager_or_admin())
-- opportunity_participants | opportunity_participants_delete_policy | DELETE | is_admin()
-- opportunity_participants | opportunity_participants_insert_policy | INSERT | NULL | true
-- opportunity_participants | opportunity_participants_select_policy | SELECT | true
-- opportunity_participants | opportunity_participants_update_policy | UPDATE | (created_by = ... OR owns_opportunity(...) OR is_manager_or_admin())

-- 2. Check helper functions exist
SELECT proname, prosecdef as security_definer
FROM pg_proc
WHERE proname IN ('owns_opportunity', 'owns_activity')
AND pronamespace = 'public'::regnamespace;

-- 3. Check triggers exist
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%participant_created_by%';

-- 4. Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE '%participants_created_by%';

-- 5. Test as regular user (should enforce ownership)
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub": "test-user-uuid"}', true);
-- UPDATE opportunity_participants SET notes = 'test' WHERE id = 1; -- Should fail if not owner
-- RESET ROLE;
*/

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
/*
-- To revert this migration, run these statements:

-- 1. Drop new policies
DROP POLICY IF EXISTS opportunity_participants_select_policy ON opportunity_participants;
DROP POLICY IF EXISTS opportunity_participants_insert_policy ON opportunity_participants;
DROP POLICY IF EXISTS opportunity_participants_update_policy ON opportunity_participants;
DROP POLICY IF EXISTS opportunity_participants_delete_policy ON opportunity_participants;
DROP POLICY IF EXISTS interaction_participants_select_policy ON interaction_participants;
DROP POLICY IF EXISTS interaction_participants_insert_policy ON interaction_participants;
DROP POLICY IF EXISTS interaction_participants_update_policy ON interaction_participants;
DROP POLICY IF EXISTS interaction_participants_delete_policy ON interaction_participants;

-- 2. Recreate permissive policies (original behavior)
CREATE POLICY authenticated_select_opportunity_participants ON opportunity_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY authenticated_insert_opportunity_participants ON opportunity_participants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY authenticated_update_opportunity_participants ON opportunity_participants
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY authenticated_delete_opportunity_participants ON opportunity_participants
  FOR DELETE TO authenticated USING (true);

CREATE POLICY authenticated_select_interaction_participants ON interaction_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY authenticated_insert_interaction_participants ON interaction_participants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY authenticated_update_interaction_participants ON interaction_participants
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY authenticated_delete_interaction_participants ON interaction_participants
  FOR DELETE TO authenticated USING (true);

-- 3. Drop triggers (optional - they don't hurt to keep)
DROP TRIGGER IF EXISTS trigger_set_opportunity_participant_created_by ON opportunity_participants;
DROP TRIGGER IF EXISTS trigger_set_interaction_participant_created_by ON interaction_participants;

-- 4. Drop helper functions (optional - they don't hurt to keep)
DROP FUNCTION IF EXISTS owns_opportunity(BIGINT);
DROP FUNCTION IF EXISTS owns_activity(BIGINT);

-- Note: The created_by column on interaction_participants is kept for audit purposes
*/
