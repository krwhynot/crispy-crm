-- Update RLS Policies for Small Team Shared Access
--
-- Architecture Change:
-- - Contacts, Organizations, Opportunities: SHARED (everyone can see/edit all)
-- - Tasks: PERSONAL (only creator can see their own tasks)
--
-- This supports a small team collaborating on the same customer base
-- while maintaining personal task lists for each team member.

-- ============================================================================
-- CONTACTS: Shared Access (All Team Members)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_contacts ON contacts;
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT
  TO authenticated
  USING (true);  -- Everyone can see all contacts

DROP POLICY IF EXISTS authenticated_insert_contacts ON contacts;
CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Anyone can create contacts

DROP POLICY IF EXISTS authenticated_update_contacts ON contacts;
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);  -- Anyone can update any contact

DROP POLICY IF EXISTS authenticated_delete_contacts ON contacts;
CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE
  TO authenticated
  USING (true);  -- Anyone can delete any contact

-- ============================================================================
-- ORGANIZATIONS: Shared Access (All Team Members)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_organizations ON organizations;
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

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
-- OPPORTUNITIES: Shared Access (All Team Members)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_opportunities ON opportunities;
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_opportunities ON opportunities;
CREATE POLICY authenticated_insert_opportunities ON opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_opportunities ON opportunities;
CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_opportunities ON opportunities;
CREATE POLICY authenticated_delete_opportunities ON opportunities
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- TASKS: Personal Access (Only Creator)
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE
  TO authenticated
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));

-- ============================================================================
-- CONTACT NOTES: Shared Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_contactNotes ON "contactNotes";
CREATE POLICY authenticated_select_contactNotes ON "contactNotes"
  FOR SELECT
  TO authenticated
  USING (true);

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
-- OPPORTUNITY NOTES: Shared Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_opportunityNotes ON "opportunityNotes";
CREATE POLICY authenticated_select_opportunityNotes ON "opportunityNotes"
  FOR SELECT
  TO authenticated
  USING (true);

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
-- PRODUCTS: Shared Access (Product catalog is shared)
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
