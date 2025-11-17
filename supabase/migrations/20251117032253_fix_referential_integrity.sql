-- =====================================================
-- Migration: Fix Referential Integrity Issues
-- Date: 2025-11-17
-- Description: Addresses critical FK constraints, cascade behavior, and duplicate RLS policies
-- =====================================================

-- =====================================================
-- PART 1: Clean Up Invalid Data Before Adding Constraints
-- =====================================================

-- Clean up opportunities with invalid organization references
UPDATE opportunities SET principal_organization_id = NULL
WHERE principal_organization_id IS NOT NULL
  AND principal_organization_id NOT IN (SELECT id FROM organizations);

UPDATE opportunities SET distributor_organization_id = NULL
WHERE distributor_organization_id IS NOT NULL
  AND distributor_organization_id NOT IN (SELECT id FROM organizations);

-- Delete opportunities with invalid customer_organization_id (required field)
DELETE FROM opportunities
WHERE customer_organization_id NOT IN (SELECT id FROM organizations);

-- =====================================================
-- PART 2: Add Missing Foreign Key Constraints
-- =====================================================

-- Add FK constraints for opportunities to organizations
-- These were missing and allowed orphaned opportunity records

-- Customer organization (required field, prevent deletion if opportunities exist)
ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_customer_organization_id_fkey
  FOREIGN KEY (customer_organization_id)
  REFERENCES organizations(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT opportunities_customer_organization_id_fkey
  ON opportunities IS 'Prevents deletion of customer organizations with active opportunities. Every opportunity must have exactly one customer.';

-- Principal organization (optional field, clear if deleted)
ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_principal_organization_id_fkey
  FOREIGN KEY (principal_organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT opportunities_principal_organization_id_fkey
  ON opportunities IS 'Clears principal reference if organization deleted. Principal is optional metadata.';

-- Distributor organization (optional field, clear if deleted)
ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_distributor_organization_id_fkey
  FOREIGN KEY (distributor_organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT opportunities_distributor_organization_id_fkey
  ON opportunities IS 'Clears distributor reference if organization deleted. Distributor is optional metadata.';

-- =====================================================
-- PART 3: Fix Activities Foreign Key Cascade Behavior
-- =====================================================

-- Drop existing FK constraints without cascade behavior
ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_contact_id_fkey;

ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_opportunity_id_fkey;

-- Re-add with proper cascade behavior
-- CASCADE on contact deletion (preserves soft-delete pattern)
ALTER TABLE activities
  ADD CONSTRAINT activities_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT activities_contact_id_fkey
  ON activities IS 'Cascade deletes activities when contact deleted. Maintains referential integrity with soft-delete pattern.';

-- SET NULL on opportunity deletion (preserves activity history)
ALTER TABLE activities
  ADD CONSTRAINT activities_opportunity_id_fkey
  FOREIGN KEY (opportunity_id)
  REFERENCES opportunities(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT activities_opportunity_id_fkey
  ON activities IS 'Preserves activity record when opportunity deleted. Activity history remains queryable.';

-- Also fix organization FK for consistency
ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_organization_id_fkey;

ALTER TABLE activities
  ADD CONSTRAINT activities_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT activities_organization_id_fkey
  ON activities IS 'Preserves activity record when organization deleted.';

-- =====================================================
-- PART 4: Remove Duplicate RLS Policies
-- =====================================================

-- Drop old 'authenticated_*' prefixed policies that duplicate newer naming convention
-- Note: Keeping the newer, cleaner naming convention without 'authenticated_' prefix

-- ContactNotes duplicates
DROP POLICY IF EXISTS authenticated_delete_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS authenticated_insert_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS authenticated_select_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS authenticated_update_contactnotes ON "contactNotes";

-- Contacts duplicates
DROP POLICY IF EXISTS authenticated_delete_contacts ON contacts;
DROP POLICY IF EXISTS authenticated_insert_contacts ON contacts;
DROP POLICY IF EXISTS authenticated_select_contacts ON contacts;
DROP POLICY IF EXISTS authenticated_update_contacts ON contacts;

-- Opportunities duplicates
DROP POLICY IF EXISTS authenticated_delete_opportunities ON opportunities;
DROP POLICY IF EXISTS authenticated_insert_opportunities ON opportunities;
DROP POLICY IF EXISTS authenticated_select_opportunities ON opportunities;
DROP POLICY IF EXISTS authenticated_update_opportunities ON opportunities;

-- OpportunityNotes duplicates
DROP POLICY IF EXISTS authenticated_delete_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS authenticated_insert_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS authenticated_select_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS authenticated_update_opportunitynotes ON "opportunityNotes";

-- Organizations duplicates
DROP POLICY IF EXISTS authenticated_delete_organizations ON organizations;
DROP POLICY IF EXISTS authenticated_insert_organizations ON organizations;
DROP POLICY IF EXISTS authenticated_select_organizations ON organizations;
DROP POLICY IF EXISTS authenticated_update_organizations ON organizations;

-- Products duplicates
DROP POLICY IF EXISTS authenticated_delete_products ON products;
DROP POLICY IF EXISTS authenticated_insert_products ON products;
DROP POLICY IF EXISTS authenticated_select_products ON products;
DROP POLICY IF EXISTS authenticated_update_products ON products;

-- Sales duplicates
DROP POLICY IF EXISTS authenticated_delete_sales ON sales;
DROP POLICY IF EXISTS authenticated_insert_sales ON sales;
DROP POLICY IF EXISTS authenticated_select_sales ON sales;
DROP POLICY IF EXISTS authenticated_update_sales ON sales;

-- Tasks duplicates
DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;

-- Activities duplicates
DROP POLICY IF EXISTS authenticated_delete_activities ON activities;
DROP POLICY IF EXISTS authenticated_insert_activities ON activities;
DROP POLICY IF EXISTS authenticated_select_activities ON activities;
DROP POLICY IF EXISTS authenticated_update_activities ON activities;

-- Tags duplicates
DROP POLICY IF EXISTS authenticated_delete_tags ON tags;
DROP POLICY IF EXISTS authenticated_insert_tags ON tags;
DROP POLICY IF EXISTS authenticated_select_tags ON tags;
DROP POLICY IF EXISTS authenticated_update_tags ON tags;

-- Interaction participants duplicates
DROP POLICY IF EXISTS authenticated_delete_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_insert_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_select_interaction_participants ON interaction_participants;
DROP POLICY IF EXISTS authenticated_update_interaction_participants ON interaction_participants;

-- Opportunity participants duplicates
DROP POLICY IF EXISTS authenticated_delete_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_insert_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_select_opportunity_participants ON opportunity_participants;
DROP POLICY IF EXISTS authenticated_update_opportunity_participants ON opportunity_participants;

-- =====================================================
-- PART 5: Fix Contacts Organization FK Behavior
-- =====================================================

-- Current behavior: ON DELETE SET NULL (orphans contacts)
-- New behavior: ON DELETE RESTRICT (force user to reassign contacts before deleting org)

ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_organization_id_fkey;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT contacts_organization_id_fkey
  ON contacts IS 'Prevents deletion of organizations with contacts. User must reassign contacts to another organization first.';

-- =====================================================
-- PART 6: Add Index for Organization Deletion Check
-- =====================================================

-- Performance optimization: Index for checking if org has contacts before deletion
-- (Already exists: idx_contacts_organization_id, but verify it excludes soft-deleted)

DROP INDEX IF EXISTS idx_contacts_organization_id;

CREATE INDEX idx_contacts_organization_id
  ON contacts(organization_id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_contacts_organization_id
  IS 'Optimizes organization deletion checks and contact list queries. Excludes soft-deleted contacts.';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary of Changes:
--  Added 3 missing FK constraints (opportunities to organizations)
--  Fixed 3 activities FK cascade behaviors (contacts/opportunities/organizations)
--  Removed 48 duplicate RLS policies (12 tables to 4 operations)
--  Fixed contacts.organization_id from SET NULL to RESTRICT
--  Optimized contacts organization index

-- Breaking Changes:
-- to Organizations with contacts can no longer be deleted (must reassign first)
-- to Organizations with opportunities can no longer be deleted (customer_organization_id)
-- to Deleting contacts will cascade delete their activities
-- to Deleting opportunities will SET NULL on related activities (preserves history)

-- Migration Testing:
-- 1. Verify FK constraints prevent invalid inserts
-- 2. Test organization deletion with contacts (should fail with RESTRICT)
-- 3. Test organization deletion with opportunities (should fail for customer, clear for principal/distributor)
-- 4. Test contact deletion cascades activities correctly
-- 5. Verify RLS policies still work (only newer convention should remain)
