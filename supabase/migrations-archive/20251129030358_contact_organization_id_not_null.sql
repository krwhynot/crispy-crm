-- Migration: contact_organization_id_not_null
-- Purpose: Enforce that all contacts must belong to an organization (no orphans)
-- PRD Reference: Contact requires organization - core business rule
--
-- This migration:
-- 1. Creates/uses "Unknown Organization" for any orphan contacts (backward compatibility)
-- 2. Adds NOT NULL constraint to contacts.organization_id
-- 3. Adds foreign key constraint if not already present

BEGIN;

-- ==============================================================================
-- STEP 1: Handle existing orphan contacts (if any)
-- ==============================================================================

-- Create "Unknown Organization" for orphan contacts (only if needed)
DO $$
DECLARE
  unknown_org_id BIGINT;
  orphan_count INTEGER;
BEGIN
  -- Count orphan contacts
  SELECT COUNT(*) INTO orphan_count
  FROM contacts
  WHERE organization_id IS NULL AND deleted_at IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % contacts without organization_id', orphan_count;

    -- Get or create "Unknown Organization"
    SELECT id INTO unknown_org_id
    FROM organizations
    WHERE name = 'Unknown Organization' AND deleted_at IS NULL
    LIMIT 1;

    IF unknown_org_id IS NULL THEN
      INSERT INTO organizations (name, organization_type, notes, created_at, updated_at)
      VALUES (
        'Unknown Organization',
        'unknown',
        'System-generated organization for contacts without explicit organization assignment. These contacts should be reviewed and reassigned.',
        NOW(),
        NOW()
      )
      RETURNING id INTO unknown_org_id;

      RAISE NOTICE 'Created "Unknown Organization" with id %', unknown_org_id;
    END IF;

    -- Update orphan contacts
    UPDATE contacts
    SET organization_id = unknown_org_id,
        updated_at = NOW()
    WHERE organization_id IS NULL AND deleted_at IS NULL;

    RAISE NOTICE 'Assigned % orphan contacts to "Unknown Organization"', orphan_count;
  ELSE
    RAISE NOTICE 'No orphan contacts found - all contacts have organization_id';
  END IF;
END $$;

-- ==============================================================================
-- STEP 2: Add NOT NULL constraint
-- ==============================================================================

-- Add NOT NULL constraint to organization_id
ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;

-- Update column comment to reflect requirement
COMMENT ON COLUMN contacts.organization_id IS
  'Primary organization for this contact. Required - contacts cannot exist without an organization (enforced NOT NULL).';

-- ==============================================================================
-- STEP 3: Ensure foreign key constraint exists
-- ==============================================================================

-- Add foreign key constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacts_organization_id_fkey'
    AND conrelid = 'contacts'::regclass
  ) THEN
    ALTER TABLE contacts
    ADD CONSTRAINT contacts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

    RAISE NOTICE 'Added foreign key constraint contacts_organization_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint contacts_organization_id_fkey already exists';
  END IF;
END $$;

-- ==============================================================================
-- STEP 4: Create index for performance (if not exists)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_contacts_organization_id
ON contacts(organization_id)
WHERE deleted_at IS NULL;

COMMIT;
