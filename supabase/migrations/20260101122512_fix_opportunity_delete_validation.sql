-- ============================================================================
-- FIX: archive_opportunity_with_relations silent failure
--
-- Bug: RPC returned void and silently succeeded when 0 rows were updated,
-- causing UI to show success but record reappears on refresh.
--
-- Fix: Add pre-check SELECT and RAISE EXCEPTION with specific error messages:
-- - "does not exist" for invalid IDs
-- - "was already deleted" for soft-deleted records
-- - "concurrent modification" for race conditions (safety check)
--
-- SECURITY: Keeps SECURITY DEFINER (required for cascade to related tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INTEGER;
  existing_deleted_at TIMESTAMPTZ;
BEGIN
  -- Validate input
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Pre-check: Does the opportunity exist? Is it already deleted?
  SELECT deleted_at INTO existing_deleted_at
  FROM opportunities WHERE id = opp_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity with ID % does not exist', opp_id;
  END IF;

  IF existing_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Opportunity with ID % was already deleted', opp_id;
  END IF;

  -- Archive the opportunity
  UPDATE opportunities
  SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- Fail-fast safety check (should never hit due to pre-checks, but guards against race conditions)
  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Failed to archive opportunity %: concurrent modification', opp_id;
  END IF;

  -- Cascade archive to activities
  UPDATE activities
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity notes
  UPDATE "opportunityNotes"
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity participants
  UPDATE opportunity_participants
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to tasks
  UPDATE tasks
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity_products (junction table)
  UPDATE opportunity_products
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERY (run manually after migration)
-- ============================================================================
-- Test 1: Valid delete (should succeed)
--   SELECT archive_opportunity_with_relations(<existing_active_id>);
--
-- Test 2: Already deleted (should fail)
--   SELECT archive_opportunity_with_relations(<same_id_from_test_1>);
--   Expected: ERROR: Opportunity with ID X was already deleted
--
-- Test 3: Non-existent (should fail)
--   SELECT archive_opportunity_with_relations(999999);
--   Expected: ERROR: Opportunity with ID 999999 does not exist
-- ============================================================================
