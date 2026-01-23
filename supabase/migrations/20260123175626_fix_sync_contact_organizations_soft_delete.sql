-- ============================================================================
-- FIX SYNC_CONTACT_ORGANIZATIONS TO USE SOFT DELETE
-- ============================================================================
-- Issue: DI-002 from Data Integrity Audit 2026-01-23
-- Original: DELETE FROM contact_organizations (hard delete, loses history)
-- New: UPDATE SET deleted_at = NOW() (soft delete, preserves history)
--
-- Engineering Principle: Soft deletes rule - "Use deleted_at timestamp, never hard delete"
-- Reference: PROVIDER_RULES.md - Soft Deletes section
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_contact_organizations(
  p_contact_id BIGINT,
  p_organizations JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_record record;
  v_org_ids BIGINT[];
BEGIN
  -- Extract organization IDs from the input JSONB array
  SELECT ARRAY_AGG((elem->>'organization_id')::BIGINT)
  INTO v_org_ids
  FROM jsonb_array_elements(p_organizations) AS elem
  WHERE elem->>'organization_id' IS NOT NULL;

  -- Handle null/empty array case
  v_org_ids := COALESCE(v_org_ids, ARRAY[]::BIGINT[]);

  -- Fixed: DI-002 hard delete converted to soft delete
  -- SOFT DELETE existing associations NOT in the new list
  -- (Replaces hard DELETE per PROVIDER_RULES.md - Soft Deletes section)
  UPDATE contact_organizations
  SET deleted_at = NOW()
  WHERE contact_id = p_contact_id
    AND deleted_at IS NULL
    AND (
      array_length(v_org_ids, 1) IS NULL  -- Soft-delete all if empty array
      OR organization_id <> ALL(v_org_ids)  -- Soft-delete those not in new list
    );

  -- Reactivate any soft-deleted rows that are in the new list
  IF array_length(v_org_ids, 1) > 0 THEN
    UPDATE contact_organizations
    SET
      deleted_at = NULL,
      updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND organization_id = ANY(v_org_ids)
      AND deleted_at IS NOT NULL;
  END IF;

  -- Insert new associations from JSONB payload (only those that don't exist at all)
  FOR org_record IN
    SELECT
      (elem->>'organization_id')::BIGINT as organization_id,
      COALESCE((elem->>'is_primary')::BOOLEAN, false) as is_primary,
      COALESCE((elem->>'is_primary_decision_maker')::BOOLEAN, false) as is_primary_decision_maker,
      (elem->>'relationship_start_date')::DATE as relationship_start_date,
      (elem->>'relationship_end_date')::DATE as relationship_end_date,
      elem->>'notes' as notes
    FROM jsonb_array_elements(p_organizations) AS elem
  LOOP
    -- Only insert if the relationship doesn't already exist
    INSERT INTO contact_organizations (
      contact_id,
      organization_id,
      is_primary,
      is_primary_decision_maker,
      relationship_start_date,
      relationship_end_date,
      notes,
      created_at,
      updated_at
    )
    SELECT
      p_contact_id,
      org_record.organization_id,
      org_record.is_primary,
      org_record.is_primary_decision_maker,
      org_record.relationship_start_date,
      org_record.relationship_end_date,
      org_record.notes,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM contact_organizations co
      WHERE co.contact_id = p_contact_id
        AND co.organization_id = org_record.organization_id
    )
    ON CONFLICT DO NOTHING;

    -- Update existing active associations with new data
    UPDATE contact_organizations
    SET
      is_primary = org_record.is_primary,
      is_primary_decision_maker = org_record.is_primary_decision_maker,
      relationship_start_date = org_record.relationship_start_date,
      relationship_end_date = org_record.relationship_end_date,
      notes = org_record.notes,
      updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND organization_id = org_record.organization_id
      AND deleted_at IS NULL;
  END LOOP;
END;
$$;

-- Update ownership and comment
ALTER FUNCTION public.sync_contact_organizations(BIGINT, JSONB) OWNER TO postgres;

COMMENT ON FUNCTION public.sync_contact_organizations(BIGINT, JSONB) IS
  'Atomically syncs contact-organization relationships using SOFT DELETE. Fixed DI-002 audit item 2026-01-23. Validation at API boundary only.';
