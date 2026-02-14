-- ============================================================================
-- P3: Rename camelCase Tables to snake_case
-- Migration: 20251129230942_p3_rename_camelcase_tables.sql
--
-- PROBLEM: Three tables violate PostgreSQL snake_case convention:
--   - contactNotes → contact_notes
--   - opportunityNotes → opportunity_notes
--   - organizationNotes → organization_notes
--
-- STRATEGY:
--   1. Rename tables to snake_case
--   2. Rename FK constraints to match new naming
--   3. Recreate triggers with new names
--   4. Recreate RLS policies with new names
--   5. Create backward-compatible VIEWS with old names (temporary)
--   6. Update grants
--
-- The views allow existing application code to continue working while
-- we update the codebase to use the new names.
-- ============================================================================

-- ============================================================================
-- SECTION 1: RENAME contactNotes → contact_notes
-- ============================================================================

-- 1.1 Drop triggers first (they reference table name)
DROP TRIGGER IF EXISTS set_updated_by_contactnotes ON "contactNotes";

-- 1.2 Drop RLS policies (they reference table name)
DROP POLICY IF EXISTS select_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS insert_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS update_contactnotes ON "contactNotes";
DROP POLICY IF EXISTS delete_contactnotes ON "contactNotes";

-- 1.3 Rename the table
ALTER TABLE "contactNotes" RENAME TO contact_notes;

-- 1.4 Rename foreign key constraints
ALTER TABLE contact_notes RENAME CONSTRAINT "contactNotes_pkey" TO contact_notes_pkey;
ALTER TABLE contact_notes RENAME CONSTRAINT "contactNotes_contact_id_fkey" TO contact_notes_contact_id_fkey;
ALTER TABLE contact_notes RENAME CONSTRAINT "contactNotes_sales_id_fkey" TO contact_notes_sales_id_fkey;
ALTER TABLE contact_notes RENAME CONSTRAINT "contactNotes_created_by_fkey" TO contact_notes_created_by_fkey;
ALTER TABLE contact_notes RENAME CONSTRAINT "contactNotes_updated_by_fkey" TO contact_notes_updated_by_fkey;

-- 1.5 Recreate trigger with new name
CREATE TRIGGER set_updated_by_contact_notes
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- 1.6 Recreate RLS policies with new names
CREATE POLICY select_contact_notes ON contact_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_contact_notes ON contact_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_contact_notes ON contact_notes
  FOR UPDATE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

CREATE POLICY delete_contact_notes ON contact_notes
  FOR DELETE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

-- 1.7 Ensure grants are in place
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_notes TO authenticated;

-- 1.8 Create backward-compatible view
CREATE OR REPLACE VIEW "contactNotes" AS SELECT * FROM contact_notes;
GRANT SELECT, INSERT, UPDATE, DELETE ON "contactNotes" TO authenticated;

-- ============================================================================
-- SECTION 2: RENAME opportunityNotes → opportunity_notes
-- ============================================================================

-- 2.1 Drop triggers
DROP TRIGGER IF EXISTS set_updated_by_opportunitynotes ON "opportunityNotes";

-- 2.2 Drop RLS policies
DROP POLICY IF EXISTS select_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS insert_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS update_opportunitynotes ON "opportunityNotes";
DROP POLICY IF EXISTS delete_opportunitynotes ON "opportunityNotes";

-- 2.3 Rename the table
ALTER TABLE "opportunityNotes" RENAME TO opportunity_notes;

-- 2.4 Rename foreign key constraints
ALTER TABLE opportunity_notes RENAME CONSTRAINT "opportunityNotes_pkey" TO opportunity_notes_pkey;
ALTER TABLE opportunity_notes RENAME CONSTRAINT "opportunityNotes_opportunity_id_fkey" TO opportunity_notes_opportunity_id_fkey;
ALTER TABLE opportunity_notes RENAME CONSTRAINT "opportunityNotes_sales_id_fkey" TO opportunity_notes_sales_id_fkey;
ALTER TABLE opportunity_notes RENAME CONSTRAINT "opportunityNotes_created_by_fkey" TO opportunity_notes_created_by_fkey;
ALTER TABLE opportunity_notes RENAME CONSTRAINT "opportunityNotes_updated_by_fkey" TO opportunity_notes_updated_by_fkey;

-- 2.5 Recreate trigger
CREATE TRIGGER set_updated_by_opportunity_notes
  BEFORE UPDATE ON opportunity_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- 2.6 Recreate RLS policies
CREATE POLICY select_opportunity_notes ON opportunity_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_opportunity_notes ON opportunity_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_opportunity_notes ON opportunity_notes
  FOR UPDATE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

CREATE POLICY delete_opportunity_notes ON opportunity_notes
  FOR DELETE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

-- 2.7 Ensure grants
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_notes TO authenticated;

-- 2.8 Create backward-compatible view
CREATE OR REPLACE VIEW "opportunityNotes" AS SELECT * FROM opportunity_notes;
GRANT SELECT, INSERT, UPDATE, DELETE ON "opportunityNotes" TO authenticated;

-- ============================================================================
-- SECTION 3: RENAME organizationNotes → organization_notes
-- ============================================================================

-- 3.1 Drop triggers
DROP TRIGGER IF EXISTS trigger_set_organizationNotes_updated_by ON "organizationNotes";
DROP TRIGGER IF EXISTS trigger_update_organizationNotes_updated_at ON "organizationNotes";

-- 3.2 Drop RLS policies
DROP POLICY IF EXISTS authenticated_select_organizationNotes ON "organizationNotes";
DROP POLICY IF EXISTS authenticated_insert_organizationNotes ON "organizationNotes";
DROP POLICY IF EXISTS update_organizationnotes ON "organizationNotes";
DROP POLICY IF EXISTS delete_organizationnotes ON "organizationNotes";

-- 3.3 Rename the table
ALTER TABLE "organizationNotes" RENAME TO organization_notes;

-- 3.4 Rename foreign key constraints
ALTER TABLE organization_notes RENAME CONSTRAINT "organizationNotes_pkey" TO organization_notes_pkey;
ALTER TABLE organization_notes RENAME CONSTRAINT "organizationNotes_organization_id_fkey" TO organization_notes_organization_id_fkey;
ALTER TABLE organization_notes RENAME CONSTRAINT "organizationNotes_sales_id_fkey" TO organization_notes_sales_id_fkey;
ALTER TABLE organization_notes RENAME CONSTRAINT "organizationNotes_updated_by_fkey" TO organization_notes_updated_by_fkey;

-- 3.5 Recreate triggers
CREATE TRIGGER set_organization_notes_updated_by
  BEFORE UPDATE ON organization_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_notes_updated_by();

CREATE TRIGGER update_organization_notes_updated_at
  BEFORE UPDATE ON organization_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_notes_updated_at();

-- 3.6 Recreate RLS policies
CREATE POLICY select_organization_notes ON organization_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_organization_notes ON organization_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_organization_notes ON organization_notes
  FOR UPDATE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

CREATE POLICY delete_organization_notes ON organization_notes
  FOR DELETE TO authenticated
  USING (is_manager_or_admin() OR sales_id = current_sales_id());

-- 3.7 Ensure grants
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_notes TO authenticated;

-- 3.8 Create backward-compatible view
CREATE OR REPLACE VIEW "organizationNotes" AS SELECT * FROM organization_notes;
GRANT SELECT, INSERT, UPDATE, DELETE ON "organizationNotes" TO authenticated;

-- ============================================================================
-- SECTION 4: ENABLE RLS ON NEW TABLES
-- ============================================================================
-- RLS was enabled on old tables, ensure it's on the renamed tables
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE contact_notes IS
  'Notes attached to contacts. Renamed from contactNotes per P3 audit (2025-11-29)';

COMMENT ON TABLE opportunity_notes IS
  'Notes attached to opportunities. Renamed from opportunityNotes per P3 audit (2025-11-29)';

COMMENT ON TABLE organization_notes IS
  'Notes attached to organizations. Renamed from organizationNotes per P3 audit (2025-11-29)';

COMMENT ON VIEW "contactNotes" IS
  'DEPRECATED: Backward-compatible view. Use contact_notes table directly.';

COMMENT ON VIEW "opportunityNotes" IS
  'DEPRECATED: Backward-compatible view. Use opportunity_notes table directly.';

COMMENT ON VIEW "organizationNotes" IS
  'DEPRECATED: Backward-compatible view. Use organization_notes table directly.';
