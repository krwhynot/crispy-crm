-- Add Helper Function and Audit Trail
--
-- This migration adds:
-- 1. Helper function auth.get_current_sales_id() for cleaner RLS policies
-- 2. Audit trail with updated_by column on all shared tables
-- 3. Trigger to auto-populate updated_by on UPDATE operations
--
-- Benefits:
-- - Cleaner, more readable RLS policies
-- - Automatic tracking of who last modified each record
-- - Consistent audit trail across all shared resources

-- ============================================================================
-- HELPER FUNCTION: Get Current Sales ID
-- ============================================================================

-- Create helper function to get the sales_id for the current authenticated user
-- This simplifies RLS policies from complex subqueries to simple equality checks
-- Note: Function is in public schema since migrations can't modify auth schema
CREATE OR REPLACE FUNCTION public.get_current_sales_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_sales_id() TO authenticated;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.get_current_sales_id() IS
  'Returns the sales_id for the currently authenticated user. Used in RLS policies for cleaner code.';

-- ============================================================================
-- UPDATE TASKS RLS POLICIES: Use Helper Function
-- ============================================================================

-- Update tasks policies to use the new helper function
-- This makes the policies more readable and maintainable

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (sales_id = public.get_current_sales_id());

DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = public.get_current_sales_id());

DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (sales_id = public.get_current_sales_id());

DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE
  TO authenticated
  USING (sales_id = public.get_current_sales_id());

-- ============================================================================
-- AUDIT TRAIL: Add updated_by Column
-- ============================================================================

-- Add updated_by column to all shared tables
-- This tracks which sales rep last modified each record

-- Contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN contacts.updated_by IS
  'Sales rep who last updated this contact. Auto-populated by trigger.';

-- Organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN organizations.updated_by IS
  'Sales rep who last updated this organization. Auto-populated by trigger.';

-- Opportunities
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN opportunities.updated_by IS
  'Sales rep who last updated this opportunity. Auto-populated by trigger.';

-- Contact Notes
ALTER TABLE "contactNotes"
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN "contactNotes".updated_by IS
  'Sales rep who last updated this contact note. Auto-populated by trigger.';

-- Opportunity Notes
ALTER TABLE "opportunityNotes"
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN "opportunityNotes".updated_by IS
  'Sales rep who last updated this opportunity note. Auto-populated by trigger.';

-- Products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_by bigint REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN products.updated_by IS
  'Sales rep who last updated this product. Auto-populated by trigger.';

-- ============================================================================
-- AUDIT TRAIL: Trigger Function
-- ============================================================================

-- Create trigger function to automatically set updated_by on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Set updated_by to the current user's sales_id
  NEW.updated_by := public.get_current_sales_id();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_by() IS
  'Automatically sets the updated_by column to the current user''s sales_id on UPDATE operations.';

-- ============================================================================
-- AUDIT TRAIL: Apply Triggers to All Shared Tables
-- ============================================================================

-- Contacts
DROP TRIGGER IF EXISTS set_updated_by_contacts ON contacts;
CREATE TRIGGER set_updated_by_contacts
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- Organizations
DROP TRIGGER IF EXISTS set_updated_by_organizations ON organizations;
CREATE TRIGGER set_updated_by_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- Opportunities
DROP TRIGGER IF EXISTS set_updated_by_opportunities ON opportunities;
CREATE TRIGGER set_updated_by_opportunities
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- Contact Notes
DROP TRIGGER IF EXISTS set_updated_by_contactNotes ON "contactNotes";
CREATE TRIGGER set_updated_by_contactNotes
  BEFORE UPDATE ON "contactNotes"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- Opportunity Notes
DROP TRIGGER IF EXISTS set_updated_by_opportunityNotes ON "opportunityNotes";
CREATE TRIGGER set_updated_by_opportunityNotes
  BEFORE UPDATE ON "opportunityNotes"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- Products
DROP TRIGGER IF EXISTS set_updated_by_products ON products;
CREATE TRIGGER set_updated_by_products
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the helper function works:
-- SELECT auth.get_current_sales_id();

-- To verify updated_by is set correctly after an update:
-- UPDATE contacts SET first_name = 'Test' WHERE id = '<some-id>';
-- SELECT id, first_name, updated_by FROM contacts WHERE id = '<some-id>';
