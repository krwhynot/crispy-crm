-- Migration: Add contact duplicate detection view and merge function
-- Purpose: Enable monitoring and cleanup of duplicate contact records

-- ============================================================================
-- VIEW: contact_duplicates
-- Identifies duplicate contacts (same name + same organization)
-- ============================================================================
CREATE OR REPLACE VIEW contact_duplicates AS
WITH duplicate_groups AS (
  SELECT
    LOWER(TRIM(COALESCE(first_name, ''))) || ' ' || LOWER(TRIM(COALESCE(last_name, ''))) as normalized_name,
    organization_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at ASC) as contact_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
  FROM contacts
  WHERE first_name IS NOT NULL OR last_name IS NOT NULL
  GROUP BY
    LOWER(TRIM(COALESCE(first_name, ''))) || ' ' || LOWER(TRIM(COALESCE(last_name, ''))),
    organization_id
  HAVING COUNT(*) > 1
)
SELECT
  dg.normalized_name,
  dg.organization_id,
  o.name as organization_name,
  dg.duplicate_count,
  dg.contact_ids,
  dg.first_created,
  dg.last_created,
  -- First ID (oldest) is the "keeper", rest should be merged/deleted
  dg.contact_ids[1] as keeper_id,
  dg.contact_ids[2:] as duplicate_ids
FROM duplicate_groups dg
LEFT JOIN organizations o ON o.id = dg.organization_id
ORDER BY dg.duplicate_count DESC, dg.normalized_name;

-- Grant access to authenticated users (admin-only in practice via RLS on underlying tables)
GRANT SELECT ON contact_duplicates TO authenticated;

-- ============================================================================
-- VIEW: duplicate_stats
-- Summary statistics for duplicate monitoring dashboard
-- ============================================================================
CREATE OR REPLACE VIEW duplicate_stats AS
SELECT
  COUNT(*) as total_duplicate_groups,
  SUM(duplicate_count - 1) as total_extra_records,
  SUM(CASE WHEN duplicate_count >= 3 THEN 1 ELSE 0 END) as high_priority_groups,
  SUM(CASE WHEN duplicate_count = 2 THEN 1 ELSE 0 END) as medium_priority_groups
FROM contact_duplicates;

GRANT SELECT ON duplicate_stats TO authenticated;

-- ============================================================================
-- FUNCTION: merge_duplicate_contacts
-- Safely merges duplicate contacts by transferring relationships to keeper
-- ============================================================================
CREATE OR REPLACE FUNCTION merge_duplicate_contacts(
  p_keeper_id BIGINT,
  p_duplicate_ids BIGINT[]
) RETURNS jsonb AS $$
DECLARE
  v_interactions_moved INT := 0;
  v_tasks_moved INT := 0;
  v_contacts_deleted INT := 0;
  v_result jsonb;
BEGIN
  -- Validate keeper exists
  IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_keeper_id) THEN
    RAISE EXCEPTION 'Keeper contact ID % does not exist', p_keeper_id;
  END IF;

  -- Validate all duplicate IDs exist
  IF EXISTS (
    SELECT 1 FROM unnest(p_duplicate_ids) AS did
    WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = did)
  ) THEN
    RAISE EXCEPTION 'One or more duplicate contact IDs do not exist';
  END IF;

  -- Prevent keeper from being in duplicate list
  IF p_keeper_id = ANY(p_duplicate_ids) THEN
    RAISE EXCEPTION 'Keeper ID cannot be in the duplicate IDs list';
  END IF;

  -- Transfer interactions to keeper
  UPDATE interactions
  SET contact_id = p_keeper_id
  WHERE contact_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_interactions_moved = ROW_COUNT;

  -- Transfer tasks to keeper
  UPDATE tasks
  SET contact_id = p_keeper_id
  WHERE contact_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_tasks_moved = ROW_COUNT;

  -- Delete duplicate contacts
  DELETE FROM contacts WHERE id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_contacts_deleted = ROW_COUNT;

  -- Return summary
  v_result := jsonb_build_object(
    'success', true,
    'keeper_id', p_keeper_id,
    'duplicates_removed', v_contacts_deleted,
    'interactions_transferred', v_interactions_moved,
    'tasks_transferred', v_tasks_moved
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only allow admins to execute merge function
REVOKE EXECUTE ON FUNCTION merge_duplicate_contacts FROM PUBLIC;
GRANT EXECUTE ON FUNCTION merge_duplicate_contacts TO authenticated;

-- ============================================================================
-- FUNCTION: get_duplicate_details
-- Returns detailed info about a specific duplicate group for review
-- ============================================================================
CREATE OR REPLACE FUNCTION get_duplicate_details(p_contact_ids BIGINT[])
RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  email JSONB,
  phone JSONB,
  organization_id BIGINT,
  organization_name TEXT,
  created_at TIMESTAMPTZ,
  interaction_count BIGINT,
  task_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.organization_id,
    o.name as organization_name,
    c.created_at,
    (SELECT COUNT(*) FROM interactions i WHERE i.contact_id = c.id) as interaction_count,
    (SELECT COUNT(*) FROM tasks t WHERE t.contact_id = c.id) as task_count
  FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = ANY(p_contact_ids)
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_duplicate_details TO authenticated;

-- ============================================================================
-- Add helpful comments
-- ============================================================================
COMMENT ON VIEW contact_duplicates IS 'Identifies duplicate contacts sharing the same normalized name and organization';
COMMENT ON VIEW duplicate_stats IS 'Summary statistics for duplicate contact monitoring';
COMMENT ON FUNCTION merge_duplicate_contacts IS 'Safely merges duplicate contacts by transferring relationships to a keeper contact';
COMMENT ON FUNCTION get_duplicate_details IS 'Returns detailed information about contacts in a duplicate group for review';
