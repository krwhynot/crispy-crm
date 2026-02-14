-- Batch 1, Q1+Q5: Expand DELETE permissions to managers and record creators
-- Decision: Managers can delete any record + creators can delete their own records
-- Rationale: Empowers managers without full admin access, allows reps to clean up own mistakes

-- Helper function check (these should already exist from earlier migrations)
-- is_admin() - checks if user has admin role
-- is_manager_or_admin() - checks if user has manager or admin role
-- current_sales_id() - returns current user's sales ID

-- ====================
-- CONTACTS
-- ====================
DROP POLICY IF EXISTS delete_contacts ON contacts;
CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    created_by = public.current_sales_id()
  );

COMMENT ON POLICY delete_contacts ON contacts IS
'Batch 1 Q1+Q5: Managers can delete any contact. Creators can delete their own contacts. Admins have full access.';

-- ====================
-- ORGANIZATIONS
-- ====================
DROP POLICY IF EXISTS delete_organizations ON organizations;
CREATE POLICY delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    created_by = public.current_sales_id()
  );

COMMENT ON POLICY delete_organizations ON organizations IS
'Batch 1 Q1+Q5: Managers can delete any organization. Creators can delete their own organizations. Admins have full access.';

-- ====================
-- OPPORTUNITIES
-- ====================
DROP POLICY IF EXISTS delete_opportunities ON opportunities;
CREATE POLICY delete_opportunities ON opportunities
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    created_by = public.current_sales_id()
  );

COMMENT ON POLICY delete_opportunities ON opportunities IS
'Batch 1 Q1+Q5: Managers can delete any opportunity. Creators can delete their own opportunities. Admins have full access.';

-- ====================
-- PRODUCTS
-- ====================
DROP POLICY IF EXISTS delete_products ON products;
CREATE POLICY delete_products ON products
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    created_by = public.current_sales_id()
  );

COMMENT ON POLICY delete_products ON products IS
'Batch 1 Q1+Q5: Managers can delete any product. Creators can delete their own products. Admins have full access.';

-- ====================
-- TASKS (stored in activities table - no separate tasks table exists)
-- ====================
-- Note: Tasks are NOT in a separate table. They use activities table.
-- The activities DELETE policy below covers both tasks and activities.

-- ====================
-- ACTIVITIES
-- ====================
DROP POLICY IF EXISTS delete_activities ON activities;
CREATE POLICY delete_activities ON activities
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    created_by = public.current_sales_id()
  );

COMMENT ON POLICY delete_activities ON activities IS
'Batch 1 Q1+Q5: Managers can delete any activity. Creators can delete their own activities. Admins have full access.';

-- ====================
-- NOTES TABLES
-- ====================
-- Note: Notes tables use sales_id instead of created_by for ownership

-- contact_notes (snake_case - actual table)
-- Note: contactNotes (camelCase) is a compatibility view
DROP POLICY IF EXISTS delete_contact_notes ON contact_notes;
CREATE POLICY delete_contact_notes ON contact_notes
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

COMMENT ON POLICY delete_contact_notes ON contact_notes IS
'Batch 1 Q1+Q5: Managers can delete any contact note. Note creators (sales_id) can delete their own notes. Admins have full access.';

-- opportunity_notes (snake_case - actual table)
-- Note: opportunityNotes (camelCase) is a compatibility view
DROP POLICY IF EXISTS delete_opportunity_notes ON opportunity_notes;
CREATE POLICY delete_opportunity_notes ON opportunity_notes
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

COMMENT ON POLICY delete_opportunity_notes ON opportunity_notes IS
'Batch 1 Q1+Q5: Managers can delete any opportunity note. Note creators (sales_id) can delete their own notes. Admins have full access.';

-- organization_notes (snake_case - actual table)
-- Note: organizationNotes (camelCase) is a compatibility view
DROP POLICY IF EXISTS delete_organization_notes ON organization_notes;
CREATE POLICY delete_organization_notes ON organization_notes
  FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

COMMENT ON POLICY delete_organization_notes ON organization_notes IS
'Batch 1 Q1+Q5: Managers can delete any organization note. Note creators (sales_id) can delete their own notes. Admins have full access.';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration expands DELETE permissions from admin-only to:
-- 1. Admins - full access (unchanged)
-- 2. Managers - can delete any record (NEW)
-- 3. Record creators - can delete their own records (NEW)
--
-- Affected tables: contacts, organizations, opportunities, products, activities,
--                  contactNotes, opportunityNotes, organizationNotes
--
-- Note: Tasks are stored in activities table (no separate tasks table)
--
-- Security note: This is an ADDITIVE change (more permissive). No data access is restricted.
-- Rollback: If needed, replace is_manager_or_admin() OR created_by checks with just is_admin()
