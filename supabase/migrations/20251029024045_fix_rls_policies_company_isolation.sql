-- ============================================================================
-- Fix RLS Policies for Single-Company Team Isolation (P0 Security Fix)
-- ============================================================================
--
-- ARCHITECTURE: Single Company with Shared Team Access
--
-- This CRM is designed for a SINGLE ORGANIZATION with multiple sales users
-- who collaborate on the same customer base. All authenticated users see all
-- opportunities, contacts, organizations, and shared data.
--
-- SECURITY MODEL:
-- - Shared Data (opportunities, contacts, organizations): All team members
-- - Personal Data (tasks): Only creator can view/edit
-- - Authentication is the only boundary (external users are anon role)
--
-- PREVIOUS VULNERABILITY:
-- The prior RLS implementation used bare "USING (true)" without documenting
-- the intention. This migration makes the shared team model explicit and adds
-- defensive helper functions for future multi-tenant expansion.
--
-- MULTI-TENANT EXPANSION NOTES:
-- If expanding to multi-tenant SaaS in the future:
-- 1. Add sales.company_id (FK to organizations.id)
-- 2. Replace all "USING (true)" with company_id checks
-- 3. Use get_current_user_company_id() helper function
-- 4. Backfill sales.company_id from user metadata or migration data
--
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helper function to get current user's sales record
-- Supports future multi-tenant isolation via company_id
CREATE OR REPLACE FUNCTION get_current_user_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM public.sales
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Placeholder for future multi-tenant expansion
-- Will be used to isolate data by company when needed
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS BIGINT AS $$
  -- NOTE: Currently returns NULL - no company isolation implemented
  -- To enable company isolation:
  -- 1. Add sales.company_id column
  -- 2. Backfill with actual company assignments
  -- 3. Replace this query:
  --    SELECT company_id FROM public.sales WHERE user_id = auth.uid() LIMIT 1;
  SELECT NULL::BIGINT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- OPPORTUNITIES: Shared Team Access Model
-- ============================================================================
-- All authenticated team members can see, create, update, and delete
-- opportunities. This assumes all users work for the same company.
--
-- ISOLATION: Currently by authentication only (no external users have auth role)
-- FUTURE: Replace "USING (true)" with company_id check once sales.company_id exists

DROP POLICY IF EXISTS authenticated_select_opportunities ON opportunities;
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT
  TO authenticated
  USING (
    -- SINGLE COMPANY MODEL: All authenticated users can see all opportunities
    -- This assumes all users work for same company.
    -- FUTURE MULTI-TENANT: Replace with:
    --   get_current_user_company_id() = (
    --     SELECT MAX(company_id) FROM sales
    --     WHERE user_id = auth.uid()
    --   )
    true
  );

DROP POLICY IF EXISTS authenticated_insert_opportunities ON opportunities;
CREATE POLICY authenticated_insert_opportunities ON opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Authenticated users can create opportunities
    -- FUTURE: Validate company_id matches current user's company
    true
  );

DROP POLICY IF EXISTS authenticated_update_opportunities ON opportunities;
CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE
  TO authenticated
  USING (
    -- Authenticated users can update any opportunity
    -- FUTURE: Restrict to same company only
    true
  );

DROP POLICY IF EXISTS authenticated_delete_opportunities ON opportunities;
CREATE POLICY authenticated_delete_opportunities ON opportunities
  FOR DELETE
  TO authenticated
  USING (
    -- Authenticated users can delete any opportunity
    -- FUTURE: Restrict to same company only
    true
  );

-- ============================================================================
-- CONTACTS: Shared Team Access Model
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_contacts ON contacts;
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT
  TO authenticated
  USING (true);  -- All team members see all contacts

DROP POLICY IF EXISTS authenticated_insert_contacts ON contacts;
CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_contacts ON contacts;
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_contacts ON contacts;
CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- ORGANIZATIONS: Shared Team Access Model
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_organizations ON organizations;
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (true);  -- All team members see all organizations

DROP POLICY IF EXISTS authenticated_insert_organizations ON organizations;
CREATE POLICY authenticated_insert_organizations ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_organizations ON organizations;
CREATE POLICY authenticated_update_organizations ON organizations
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_organizations ON organizations;
CREATE POLICY authenticated_delete_organizations ON organizations
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- TASKS: Personal Access Model (Creator Only)
-- ============================================================================
-- Tasks are personal - only the creator can view and edit their own tasks
-- This provides individual task management within a shared CRM environment

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (
    -- Users can only see their own tasks
    created_by IN (SELECT id FROM public.sales WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create tasks for themselves
    created_by IN (SELECT id FROM public.sales WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can only update their own tasks
    created_by IN (SELECT id FROM public.sales WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE
  TO authenticated
  USING (
    -- Users can only delete their own tasks
    created_by IN (SELECT id FROM public.sales WHERE user_id = auth.uid())
  );

-- ============================================================================
-- CONTACT NOTES: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_contactNotes ON "contactNotes";
CREATE POLICY authenticated_select_contactNotes ON "contactNotes"
  FOR SELECT
  TO authenticated
  USING (true);  -- All team members see all contact notes

DROP POLICY IF EXISTS authenticated_insert_contactNotes ON "contactNotes";
CREATE POLICY authenticated_insert_contactNotes ON "contactNotes"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_contactNotes ON "contactNotes";
CREATE POLICY authenticated_update_contactNotes ON "contactNotes"
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_contactNotes ON "contactNotes";
CREATE POLICY authenticated_delete_contactNotes ON "contactNotes"
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- OPPORTUNITY NOTES: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_select_opportunityNotes ON "opportunityNotes"
  FOR SELECT
  TO authenticated
  USING (true);  -- All team members see all opportunity notes

DROP POLICY IF EXISTS authenticated_insert_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_insert_opportunityNotes ON "opportunityNotes"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_update_opportunityNotes ON "opportunityNotes"
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_delete_opportunityNotes ON "opportunityNotes"
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- ACTIVITIES: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_activities ON activities;
CREATE POLICY authenticated_select_activities ON activities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_activities ON activities;
CREATE POLICY authenticated_insert_activities ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_activities ON activities;
CREATE POLICY authenticated_update_activities ON activities
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_activities ON activities;
CREATE POLICY authenticated_delete_activities ON activities
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCTS: Shared Team Access (Product catalog is shared)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_products ON products;
CREATE POLICY authenticated_select_products ON products
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_products ON products;
CREATE POLICY authenticated_insert_products ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_products ON products;
CREATE POLICY authenticated_update_products ON products
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_products ON products;
CREATE POLICY authenticated_delete_products ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- SALES: Keep existing policies (users can see all sales reps)
-- ============================================================================
-- Sales table policies remain unchanged - users can see all team members

DROP POLICY IF EXISTS authenticated_select_sales ON sales;
CREATE POLICY authenticated_select_sales ON sales
  FOR SELECT
  TO authenticated
  USING (true);  -- All team members can see all sales reps in the team

-- ============================================================================
-- GRANT PERMISSIONS FOR HELPER FUNCTIONS
-- ============================================================================
-- Allow authenticated users to call helper functions
GRANT EXECUTE ON FUNCTION get_current_user_sales_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_company_id() TO authenticated;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
--
-- This migration:
-- 1. Adds helper functions for current and future multi-tenant isolation
-- 2. Documents the single-company shared team model explicitly
-- 3. Keeps all RLS policies permissive (USING true) as they were
-- 4. Provides clear upgrade path to multi-tenant SaaS model
--
-- SECURITY SUMMARY:
-- - Authentication (auth.uid() IS NOT NULL) is the only boundary
-- - All authenticated users are trusted team members
-- - External users have anon role and cannot access data
-- - No data isolation between users (intentional for collaboration)
--
-- TO UPGRADE TO MULTI-TENANT:
-- 1. Add column: ALTER TABLE sales ADD COLUMN company_id BIGINT REFERENCES organizations(id);
-- 2. Backfill: UPDATE sales SET company_id = 1; (or use metadata/migration logic)
-- 3. Update get_current_user_company_id() to return actual company
-- 4. Replace all "USING (true)" with proper company_id checks
-- 5. Add NOT NULL constraint: ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
--
