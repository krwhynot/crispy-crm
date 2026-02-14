-- ============================================================================
-- RLS Consolidation Migration
-- Purpose: Clean up duplicate policies, standardize naming, use {authenticated} role
-- Access Model: Team-wide collaboration (all authenticated users can CRUD)
-- Exception: tutorial_progress remains owner-only
-- ============================================================================

-- ============================================================================
-- SECTION 1: PRODUCT_DISTRIBUTORS
-- Change from {public} role to {authenticated}, team-wide access
-- ============================================================================

-- Drop existing policies (exact names from database)
DROP POLICY IF EXISTS "Authenticated users can view product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can insert product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can update product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can delete product_distributors" ON product_distributors;
-- Drop new-style policies if they exist (idempotent)
DROP POLICY IF EXISTS "select_product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "insert_product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "update_product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "delete_product_distributors" ON product_distributors;

-- Create clean team-wide policies
CREATE POLICY "select_product_distributors" ON product_distributors
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "insert_product_distributors" ON product_distributors
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_product_distributors" ON product_distributors
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "delete_product_distributors" ON product_distributors
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 2: TUTORIAL_PROGRESS
-- Change from {public} role to {authenticated}, keep owner-only pattern
-- ============================================================================

-- Drop existing policies (exact names from database)
DROP POLICY IF EXISTS "Users can view own tutorial progress" ON tutorial_progress;
DROP POLICY IF EXISTS "Users can insert own tutorial progress" ON tutorial_progress;
DROP POLICY IF EXISTS "Users can update own tutorial progress" ON tutorial_progress;
-- Drop new-style policies if they exist (idempotent)
DROP POLICY IF EXISTS "select_tutorial_progress" ON tutorial_progress;
DROP POLICY IF EXISTS "insert_tutorial_progress" ON tutorial_progress;
DROP POLICY IF EXISTS "update_tutorial_progress" ON tutorial_progress;

-- Create clean owner-only policies
CREATE POLICY "select_tutorial_progress" ON tutorial_progress
  FOR SELECT TO authenticated
  USING (sales_id = get_current_sales_id());

CREATE POLICY "insert_tutorial_progress" ON tutorial_progress
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = get_current_sales_id());

CREATE POLICY "update_tutorial_progress" ON tutorial_progress
  FOR UPDATE TO authenticated
  USING (sales_id = get_current_sales_id())
  WITH CHECK (sales_id = get_current_sales_id());

-- ============================================================================
-- SECTION 3: CONTACT_NOTES
-- Drop all 8 duplicate policies, create 4 clean team-wide policies
-- ============================================================================

-- Drop authenticated_* policies
DROP POLICY IF EXISTS "authenticated_select_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "authenticated_insert_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "authenticated_update_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "authenticated_delete_contact_notes" ON contact_notes;

-- Drop legacy policies (also serves as idempotent drop for new-style names)
DROP POLICY IF EXISTS "select_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "insert_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "update_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "delete_contact_notes" ON contact_notes;

-- Create clean team-wide policies
CREATE POLICY "select_contact_notes" ON contact_notes
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "insert_contact_notes" ON contact_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_contact_notes" ON contact_notes
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "delete_contact_notes" ON contact_notes
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 4: OPPORTUNITY_NOTES
-- Drop all 8 duplicate policies, create 4 clean team-wide policies
-- ============================================================================

-- Drop authenticated_* policies
DROP POLICY IF EXISTS "authenticated_select_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "authenticated_insert_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "authenticated_update_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "authenticated_delete_opportunity_notes" ON opportunity_notes;

-- Drop legacy policies (also serves as idempotent drop for new-style names)
DROP POLICY IF EXISTS "select_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "insert_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "update_opportunity_notes" ON opportunity_notes;
DROP POLICY IF EXISTS "delete_opportunity_notes" ON opportunity_notes;

-- Create clean team-wide policies
CREATE POLICY "select_opportunity_notes" ON opportunity_notes
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "insert_opportunity_notes" ON opportunity_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_opportunity_notes" ON opportunity_notes
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "delete_opportunity_notes" ON opportunity_notes
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 5: ORGANIZATION_NOTES
-- Drop all 6 policies, create 4 clean team-wide policies
-- Note: camelCase names in authenticated_* policies!
-- ============================================================================

-- Drop authenticated_* policies (note camelCase!)
DROP POLICY IF EXISTS "authenticated_select_organizationNotes" ON organization_notes;
DROP POLICY IF EXISTS "authenticated_insert_organizationNotes" ON organization_notes;

-- Drop legacy policies (also serves as idempotent drop for new-style names)
DROP POLICY IF EXISTS "select_organization_notes" ON organization_notes;
DROP POLICY IF EXISTS "insert_organization_notes" ON organization_notes;
DROP POLICY IF EXISTS "update_organization_notes" ON organization_notes;
DROP POLICY IF EXISTS "delete_organization_notes" ON organization_notes;

-- Create clean team-wide policies
CREATE POLICY "select_organization_notes" ON organization_notes
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "insert_organization_notes" ON organization_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_organization_notes" ON organization_notes
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "delete_organization_notes" ON organization_notes
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 6: SEGMENTS
-- Add missing UPDATE and DELETE policies (team-wide)
-- ============================================================================

-- Drop existing policies to recreate with consistent naming
DROP POLICY IF EXISTS "Allow authenticated read access" ON segments;
DROP POLICY IF EXISTS "Allow authenticated users to create" ON segments;
-- Drop new-style policies if they exist (idempotent)
DROP POLICY IF EXISTS "select_segments" ON segments;
DROP POLICY IF EXISTS "insert_segments" ON segments;
DROP POLICY IF EXISTS "update_segments" ON segments;
DROP POLICY IF EXISTS "delete_segments" ON segments;

-- Create full CRUD team-wide policies
CREATE POLICY "select_segments" ON segments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "insert_segments" ON segments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_segments" ON segments
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "delete_segments" ON segments
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 7: DOCUMENTATION
-- Add comments explaining SELECT-only tables
-- ============================================================================

COMMENT ON TABLE audit_trail IS
  'Audit log for data changes. SELECT-only via RLS - inserts handled by database triggers and Edge Functions.';

COMMENT ON TABLE dashboard_snapshots IS
  'Pre-computed dashboard metrics. SELECT-only via RLS - inserts handled by scheduled Edge Functions.';
