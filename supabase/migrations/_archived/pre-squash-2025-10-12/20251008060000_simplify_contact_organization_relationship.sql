-- Migration: Simplify contact-organization relationship from many-to-many to one-to-many
-- Date: 2025-10-08
-- Description: Add organization_id to contacts table and migrate data from contact_organizations

-- Step 1: Add organization_id column to contacts table
ALTER TABLE contacts
ADD COLUMN organization_id bigint REFERENCES organizations(id) ON DELETE SET NULL;

-- Step 2: Create index for better query performance
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);

-- Step 3: Migrate existing data from contact_organizations to contacts.organization_id
-- Use the primary organization if it exists, otherwise use the first organization
UPDATE contacts c
SET organization_id = (
  SELECT co.organization_id
  FROM contact_organizations co
  WHERE co.contact_id = c.id
    AND co.deleted_at IS NULL
  ORDER BY co.is_primary DESC, co.id ASC
  LIMIT 1
);

-- Step 4: Add unique constraint to contact_organizations.contact_id to prevent multiple organizations per contact
-- This prevents new many-to-many relationships while keeping historical data
CREATE UNIQUE INDEX idx_contact_organizations_unique_contact
ON contact_organizations(contact_id)
WHERE deleted_at IS NULL;

-- Step 5: Add comment to document the schema change
COMMENT ON COLUMN contacts.organization_id IS 'Primary organization for this contact. Replaces many-to-many contact_organizations relationship.';
COMMENT ON TABLE contact_organizations IS 'DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly. Kept for historical data only.';
