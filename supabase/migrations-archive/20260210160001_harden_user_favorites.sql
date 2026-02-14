-- ============================================================================
-- ERD Remediation: Priority 4 (Polymorphic Reference Hardening)
--
-- user_favorites uses entity_type/entity_id without DB-level validation.
-- Adds:
--   1. CHECK constraint on entity_type (matches Zod enum)
--   2. BEFORE INSERT/UPDATE trigger validating entity_id exists and is active
--   3. Cascade cleanup in archive_*_with_relations() functions
--
-- Pre-flight: 11 rows (4 contacts, 7 organizations) - all valid entity_types
-- ============================================================================

-- ============================================================================
-- 1. CHECK constraint on entity_type
-- ============================================================================

ALTER TABLE user_favorites
  ADD CONSTRAINT user_favorites_entity_type_check
  CHECK (entity_type IN ('contacts', 'organizations', 'opportunities'));

-- ============================================================================
-- 2. Entity existence validation trigger
--    Validates entity_id references an active (non-deleted) row in the
--    table named by entity_type. Uses format() for safe dynamic SQL.
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_user_favorite_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_exists boolean;
BEGIN
  -- Dynamic lookup: verify entity exists and is not soft-deleted
  -- entity_type values are constrained by CHECK to valid table names
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1 AND deleted_at IS NULL)',
    NEW.entity_type
  ) INTO entity_exists USING NEW.entity_id;

  IF NOT entity_exists THEN
    RAISE EXCEPTION 'Entity %:% does not exist or is deleted',
      NEW.entity_type, NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_user_favorite_entity
  BEFORE INSERT OR UPDATE OF entity_type, entity_id ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_favorite_entity();

-- ============================================================================
-- 3. Add user_favorites cleanup to archive cascade functions
--    When an entity is archived, soft-delete its favorites too.
-- ============================================================================

-- Update archive_contact_with_relations
CREATE OR REPLACE FUNCTION archive_contact_with_relations(contact_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input (fail-fast)
  IF contact_id IS NULL THEN
    RAISE EXCEPTION 'Contact ID cannot be null';
  END IF;

  -- Archive the contact
  UPDATE contacts
  SET deleted_at = NOW()
  WHERE id = archive_contact_with_relations.contact_id AND deleted_at IS NULL;

  -- Cascade archive to activities (owned by this contact)
  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to contact notes
  UPDATE "contactNotes"
  SET deleted_at = NOW()
  WHERE "contactNotes".contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to interaction_participants
  UPDATE interaction_participants
  SET deleted_at = NOW()
  WHERE interaction_participants.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_contacts.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this contact
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'contacts'
    AND entity_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;
END;
$$;

-- Update archive_organization_with_relations
CREATE OR REPLACE FUNCTION archive_organization_with_relations(org_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_rec RECORD;
  opp_rec RECORD;
BEGIN
  -- Validate input (fail-fast)
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- Archive the organization
  UPDATE organizations
  SET deleted_at = NOW()
  WHERE id = org_id AND deleted_at IS NULL;

  -- Cascade archive to organization notes
  UPDATE "organizationNotes"
  SET deleted_at = NOW()
  WHERE "organizationNotes".organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to activities (owned by this organization)
  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to organization_distributors (junction table)
  UPDATE organization_distributors
  SET deleted_at = NOW()
  WHERE organization_distributors.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to distributor_principal_authorizations
  -- (where this org is principal OR distributor)
  UPDATE distributor_principal_authorizations
  SET deleted_at = NOW()
  WHERE (distributor_principal_authorizations.principal_id = archive_organization_with_relations.org_id
      OR distributor_principal_authorizations.distributor_id = archive_organization_with_relations.org_id)
    AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this organization
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'organizations'
    AND entity_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- RECURSIVE: Archive all contacts that belong to this organization
  FOR contact_rec IN
    SELECT id FROM contacts
    WHERE organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_contact_with_relations(contact_rec.id);
  END LOOP;

  -- RECURSIVE: Archive opportunities where this org is the CUSTOMER
  -- (Customer owns the opportunity; principal/distributor are references)
  FOR opp_rec IN
    SELECT id FROM opportunities
    WHERE customer_organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_opportunity_with_relations(opp_rec.id);
  END LOOP;
END;
$$;

-- Update archive_opportunity_with_relations
CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id bigint)
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

  -- Fail-fast safety check
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

  -- Cascade archive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity_products (junction table)
  UPDATE opportunity_products
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this opportunity
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'opportunities'
    AND entity_id = opp_id
    AND deleted_at IS NULL;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 1. CHECK constraint: INSERT with invalid type should fail:
--    INSERT INTO user_favorites (user_id, entity_type, entity_id, display_name)
--    VALUES (auth.uid(), 'invalid', 1, 'test');
--    Expected: ERROR: new row violates check constraint "user_favorites_entity_type_check"
--
-- 2. Entity validation: INSERT with deleted entity should fail:
--    INSERT INTO user_favorites (user_id, entity_type, entity_id, display_name)
--    VALUES (auth.uid(), 'contacts', 999999, 'test');
--    Expected: ERROR: Entity contacts:999999 does not exist or is deleted
--
-- 3. CASCADE: After archive_contact_with_relations(X), verify:
--    SELECT * FROM user_favorites WHERE entity_type = 'contacts' AND entity_id = X;
--    Expected: deleted_at IS NOT NULL
-- ============================================================================
