-- ============================================================================
-- ERD Remediation: Priority 3 (Tag Array Integrity)
--
-- contacts.tags and organizations.tags use bigint[] arrays referencing tag IDs
-- but have no FK enforcement (PostgreSQL limitation on arrays). When a tag is
-- soft-deleted, stale IDs remain in these arrays.
--
-- This trigger removes the soft-deleted tag ID from all entity arrays.
--
-- WARNING: This cleanup is DESTRUCTIVE and IRREVERSIBLE.
-- Un-deleting a tag (setting deleted_at = NULL) will NOT restore the array
-- relationships. This is acceptable because:
--   (a) Tags feature is currently unused (0 rows in production)
--   (b) Soft-deleting a tag implies intentional permanent removal from entities
--
-- SCOPE: contacts.tags (bigint[]) and organizations.tags (bigint[]) only.
-- opportunities.tags is text[] (free-form labels, not managed tag IDs) and
-- is intentionally excluded.
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_tag_references()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when tag transitions from active to soft-deleted
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Remove tag ID from contacts arrays
    UPDATE contacts
    SET tags = array_remove(tags, OLD.id)
    WHERE OLD.id = ANY(tags)
      AND deleted_at IS NULL;

    -- Remove tag ID from organizations arrays
    UPDATE organizations
    SET tags = array_remove(tags, OLD.id)
    WHERE OLD.id = ANY(tags)
      AND deleted_at IS NULL;

    -- opportunities.tags is text[] (free-form, not bigint[] managed) — excluded
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION cleanup_tag_references() IS
  'Removes soft-deleted tag IDs from contacts/organizations bigint[] arrays. '
  'DESTRUCTIVE: un-deleting a tag does NOT restore array relationships. '
  'opportunities.tags excluded (text[] free-form labels, not bigint[] managed IDs).';

CREATE TRIGGER trg_cleanup_tag_references
  AFTER UPDATE OF deleted_at ON tags
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_tag_references();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 1. Create a test tag:
--    INSERT INTO tags (name) VALUES ('test-cleanup') RETURNING id;
--
-- 2. Assign to a contact:
--    UPDATE contacts SET tags = array_append(tags, <tag_id>) WHERE id = <contact_id>;
--
-- 3. Soft-delete the tag:
--    UPDATE tags SET deleted_at = NOW() WHERE id = <tag_id>;
--
-- 4. Verify cleanup:
--    SELECT tags FROM contacts WHERE id = <contact_id>;
--    Expected: <tag_id> removed from array
-- ============================================================================
