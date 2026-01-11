-- Migration: Fix merge function to use correct table names
-- The original function referenced "interactions" but the actual table is "contactNotes"
--
-- HISTORICAL NOTE (2026-01-11): This migration is OBSOLETE.
-- The merge_duplicate_contacts function uses hard DELETE (line 62) which violates
-- PROVIDER_RULES.md §5 (Soft Deletes Only). This function has been superseded by
-- soft-delete-aware merge patterns. Retained for migration history integrity only.
-- Do NOT use merge_duplicate_contacts() in new code - implement soft delete merges instead.

-- Drop and recreate the merge function with correct table names
CREATE OR REPLACE FUNCTION merge_duplicate_contacts(
  p_keeper_id BIGINT,
  p_duplicate_ids BIGINT[]
) RETURNS jsonb AS $$
DECLARE
  v_notes_moved INT := 0;
  v_tasks_moved INT := 0;
  v_participants_moved INT := 0;
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

  -- Transfer contact notes to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contactNotes' AND table_schema = 'public') THEN
    UPDATE "contactNotes"
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_notes_moved = ROW_COUNT;
  END IF;

  -- Transfer tasks to keeper (if table exists and has contact_id column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'contact_id' AND table_schema = 'public'
  ) THEN
    UPDATE tasks
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_tasks_moved = ROW_COUNT;
  END IF;

  -- Transfer interaction participants to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interaction_participants' AND table_schema = 'public') THEN
    UPDATE interaction_participants
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_participants_moved = ROW_COUNT;
  END IF;

  -- Delete duplicate contacts
  DELETE FROM contacts WHERE id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_contacts_deleted = ROW_COUNT;

  -- Return summary
  v_result := jsonb_build_object(
    'success', true,
    'keeper_id', p_keeper_id,
    'duplicates_removed', v_contacts_deleted,
    'notes_transferred', v_notes_moved,
    'tasks_transferred', v_tasks_moved,
    'participants_transferred', v_participants_moved
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_duplicate_details function to use correct table names
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
    -- Count notes instead of interactions
    (SELECT COUNT(*) FROM "contactNotes" cn WHERE cn.contact_id = c.id) as interaction_count,
    -- Count tasks if contact_id column exists
    COALESCE(
      (SELECT COUNT(*) FROM tasks t WHERE t.contact_id = c.id),
      0
    ) as task_count
  FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = ANY(p_contact_ids)
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
