-- Migration: Create sync_contact_organizations RPC function
-- Date: 2025-10-07
-- Description: Creates a function to atomically sync contact-organization relationships
-- Validation happens at API boundary (Zod), this just syncs to junction table

CREATE OR REPLACE FUNCTION sync_contact_organizations(
    p_contact_id bigint,
    p_organizations jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_record record;
BEGIN
    -- Delete existing associations (delete-then-insert pattern)
    DELETE FROM contact_organizations WHERE contact_id = p_contact_id;

    -- Insert new associations from JSONB payload
    FOR org_record IN
        SELECT
            (elem->>'organization_id')::bigint as organization_id,
            COALESCE((elem->>'is_primary')::boolean, false) as is_primary,
            COALESCE((elem->>'is_primary_decision_maker')::boolean, false) as is_primary_decision_maker,
            (elem->>'relationship_start_date')::date as relationship_start_date,
            (elem->>'relationship_end_date')::date as relationship_end_date,
            elem->>'notes' as notes
        FROM jsonb_array_elements(p_organizations) AS elem
    LOOP
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
        ) VALUES (
            p_contact_id,
            org_record.organization_id,
            org_record.is_primary,
            org_record.is_primary_decision_maker,
            org_record.relationship_start_date,
            org_record.relationship_end_date,
            org_record.notes,
            now(),
            now()
        );
    END LOOP;
END;
$$;

COMMENT ON FUNCTION sync_contact_organizations(bigint, jsonb) IS
'Syncs contact-organization relationships. Validation at API boundary only.';
