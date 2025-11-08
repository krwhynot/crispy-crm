-- Fix RLS Policies - Role-Based Access Control
--
-- Security Issue: Previous migration used USING (true) for ALL operations,
-- allowing ANY authenticated user to UPDATE and DELETE all data.
--
-- Fix: Implement admin-only restrictions for destructive operations:
-- - SELECT: Shared (team collaboration)
-- - INSERT: Shared (team collaboration)
-- - UPDATE: Admin-only
-- - DELETE: Admin-only
--
-- This prevents data breach while maintaining team collaboration.
-- Fixes OWASP A01:2021 - Broken Access Control
--
-- Reference: docs/SECURITY_AUDIT_2025-11-08.md (lines 36-94)

-- ============================================================================
-- CONTACTS: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_contacts ON contacts;
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update contacts
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_contacts ON contacts;
CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete contacts
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- ORGANIZATIONS: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_organizations ON organizations;
CREATE POLICY authenticated_update_organizations ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update organizations
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_organizations ON organizations;
CREATE POLICY authenticated_delete_organizations ON organizations
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete organizations
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- OPPORTUNITIES: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_opportunities ON opportunities;
CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update opportunities
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_opportunities ON opportunities;
CREATE POLICY authenticated_delete_opportunities ON opportunities
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete opportunities
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- CONTACT NOTES: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_contactNotes ON "contactNotes";
CREATE POLICY authenticated_update_contactNotes ON "contactNotes"
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update contact notes
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_contactNotes ON "contactNotes";
CREATE POLICY authenticated_delete_contactNotes ON "contactNotes"
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete contact notes
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- OPPORTUNITY NOTES: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_update_opportunityNotes ON "opportunityNotes"
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update opportunity notes
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_delete_opportunityNotes ON "opportunityNotes"
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete opportunity notes
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- PRODUCTS: Admin-only UPDATE and DELETE
-- ============================================================================

DROP POLICY IF EXISTS authenticated_update_products ON products;
CREATE POLICY authenticated_update_products ON products
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update products
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

DROP POLICY IF EXISTS authenticated_delete_products ON products;
CREATE POLICY authenticated_delete_products ON products
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete products
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- TASKS: Already secured with personal visibility
-- ============================================================================
-- Tasks table policies remain unchanged - already restricted to owner access
-- via: sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid())

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies are correctly applied:
--
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('contacts', 'organizations', 'opportunities', 'tasks')
-- ORDER BY tablename, cmd;
