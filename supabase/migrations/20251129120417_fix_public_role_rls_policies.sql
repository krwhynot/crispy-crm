-- ============================================================================
-- Migration: Fix Public Role RLS Policies (P0 Security Fix)
-- ============================================================================
--
-- SECURITY ISSUE: 10 RLS policies are assigned to {public} role instead of
-- {authenticated}. This violates the principle of least privilege.
--
-- While the policy expressions do check auth.uid() or get_current_sales_id(),
-- assigning policies to {public} role means:
-- 1. The policy is explicitly granted to unauthenticated users
-- 2. If helper functions return NULL for anon, EXISTS checks may behave unexpectedly
-- 3. Defense-in-depth requires role-level restriction BEFORE expression evaluation
--
-- AFFECTED TABLES:
-- - opportunity_contacts (4 policies)
-- - opportunity_products (4 policies)
-- - test_user_metadata (2 policies)
--
-- FIX: Change all policies from TO public to TO authenticated
--
-- PATTERN: PostgreSQL does not support ALTER POLICY ... TO <role> directly.
-- We must DROP and recreate each policy with the correct role assignment.
--
-- IDEMPOTENCY: Using DROP POLICY IF EXISTS ensures safe re-runs.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix opportunity_contacts policies
-- ============================================================================
-- These policies control access to the junction table linking opportunities
-- to contacts. Must be authenticated to view/modify opportunity relationships.

-- 1a. SELECT policy
DROP POLICY IF EXISTS "Users can view opportunity_contacts through opportunities" ON opportunity_contacts;
CREATE POLICY "Users can view opportunity_contacts through opportunities"
ON opportunity_contacts
FOR SELECT
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        WHERE o.id = opportunity_contacts.opportunity_id
        AND (
            EXISTS (
                SELECT 1
                FROM opportunity_participants op
                JOIN sales s ON s.id = get_current_sales_id()
                WHERE op.opportunity_id = o.id
            )
            OR o.created_by = get_current_sales_id()
            OR o.opportunity_owner_id = get_current_sales_id()
            OR o.account_manager_id = get_current_sales_id()
        )
    )
);

-- 1b. INSERT policy
DROP POLICY IF EXISTS "Users can insert opportunity_contacts" ON opportunity_contacts;
CREATE POLICY "Users can insert opportunity_contacts"
ON opportunity_contacts
FOR INSERT
TO authenticated  -- FIXED: was {public}
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM opportunities o
        WHERE o.id = opportunity_contacts.opportunity_id
        AND (
            o.created_by = get_current_sales_id()
            OR o.opportunity_owner_id = get_current_sales_id()
            OR o.account_manager_id = get_current_sales_id()
        )
    )
);

-- 1c. UPDATE policy
DROP POLICY IF EXISTS "Users can update opportunity_contacts" ON opportunity_contacts;
CREATE POLICY "Users can update opportunity_contacts"
ON opportunity_contacts
FOR UPDATE
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        WHERE o.id = opportunity_contacts.opportunity_id
        AND (
            o.created_by = get_current_sales_id()
            OR o.opportunity_owner_id = get_current_sales_id()
            OR o.account_manager_id = get_current_sales_id()
        )
    )
);

-- 1d. DELETE policy
DROP POLICY IF EXISTS "Users can delete opportunity_contacts" ON opportunity_contacts;
CREATE POLICY "Users can delete opportunity_contacts"
ON opportunity_contacts
FOR DELETE
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        WHERE o.id = opportunity_contacts.opportunity_id
        AND (
            o.created_by = get_current_sales_id()
            OR o.opportunity_owner_id = get_current_sales_id()
            OR o.account_manager_id = get_current_sales_id()
        )
    )
);

-- ============================================================================
-- STEP 2: Fix opportunity_products policies
-- ============================================================================
-- These policies control access to the junction table linking opportunities
-- to products. Access is based on opportunity ownership.

-- 2a. SELECT policy
DROP POLICY IF EXISTS "Users can view opportunity products in their company" ON opportunity_products;
CREATE POLICY "Users can view opportunity products in their company"
ON opportunity_products
FOR SELECT
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        JOIN sales s ON s.id = o.opportunity_owner_id
        WHERE o.id = opportunity_products.opportunity_id
        AND s.user_id = auth.uid()
    )
);

-- 2b. INSERT policy
DROP POLICY IF EXISTS "Users can insert opportunity products in their company" ON opportunity_products;
CREATE POLICY "Users can insert opportunity products in their company"
ON opportunity_products
FOR INSERT
TO authenticated  -- FIXED: was {public}
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM opportunities o
        JOIN sales s ON s.id = o.opportunity_owner_id
        WHERE o.id = opportunity_products.opportunity_id
        AND s.user_id = auth.uid()
    )
);

-- 2c. UPDATE policy
DROP POLICY IF EXISTS "Users can update opportunity products in their company" ON opportunity_products;
CREATE POLICY "Users can update opportunity products in their company"
ON opportunity_products
FOR UPDATE
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        JOIN sales s ON s.id = o.opportunity_owner_id
        WHERE o.id = opportunity_products.opportunity_id
        AND s.user_id = auth.uid()
    )
);

-- 2d. DELETE policy
DROP POLICY IF EXISTS "Users can delete opportunity products in their company" ON opportunity_products;
CREATE POLICY "Users can delete opportunity products in their company"
ON opportunity_products
FOR DELETE
TO authenticated  -- FIXED: was {public}
USING (
    EXISTS (
        SELECT 1
        FROM opportunities o
        JOIN sales s ON s.id = o.opportunity_owner_id
        WHERE o.id = opportunity_products.opportunity_id
        AND s.user_id = auth.uid()
    )
);

-- ============================================================================
-- STEP 3: Fix test_user_metadata policies
-- ============================================================================
-- This table stores test user data for E2E testing. While it's a test table,
-- it should still follow security best practices.

-- 3a. SELECT policy (already checks auth.role() = 'authenticated')
DROP POLICY IF EXISTS "Test metadata readable by authenticated users" ON test_user_metadata;
CREATE POLICY "Test metadata readable by authenticated users"
ON test_user_metadata
FOR SELECT
TO authenticated  -- FIXED: was {public}
USING (auth.role() = 'authenticated'::text);

-- 3b. ALL policy for service_role (keep as-is but move to service_role explicitly)
-- Note: The original policy used {public} with auth.role() = 'service_role' check
-- This is redundant - if role is service_role, they bypass RLS anyway
-- We recreate it properly scoped to service_role
DROP POLICY IF EXISTS "Test metadata writable by service role" ON test_user_metadata;
CREATE POLICY "Test metadata writable by service role"
ON test_user_metadata
FOR ALL
TO service_role  -- FIXED: was {public} with auth.role() check
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to confirm fix)
-- ============================================================================
--
-- Check no public role policies remain (except intentional ones):
--   SELECT tablename, policyname, roles FROM pg_policies
--   WHERE schemaname = 'public' AND roles::text LIKE '%public%';
--   Expected: 0 rows
--
-- Verify policies are now authenticated:
--   SELECT tablename, policyname, roles FROM pg_policies
--   WHERE schemaname = 'public'
--   AND tablename IN ('opportunity_contacts', 'opportunity_products', 'test_user_metadata');
--   Expected: All show {authenticated} or {service_role}
--
-- ============================================================================

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Fixed 10 RLS policies across 3 tables:
-- - opportunity_contacts: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - opportunity_products: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - test_user_metadata: 2 policies (SELECT, ALL)
--
-- All policies now correctly assigned to {authenticated} or {service_role}
-- instead of the overly permissive {public} role.
-- ============================================================================
