-- =====================================================================
-- Role-Based Permission System
-- =====================================================================
-- Implements 3-tier role system: admin, manager, rep
--
-- Permission Matrix:
-- - Admin: Full CRUD on all resources
-- - Manager: View all + Edit all + No delete
-- - Rep: View all + Edit own only + No delete
-- - Shared resources (contacts/orgs/products): All roles can edit
-- =====================================================================

-- =====================================================================
-- PART 1: Create Role Enum Type
-- =====================================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

COMMENT ON TYPE user_role IS 'User roles: admin (full access), manager (edit all, no delete), rep (edit own only, no delete)';

-- =====================================================================
-- PART 2: Add Role Column to Sales Table
-- =====================================================================

-- Add role column with default 'rep'
ALTER TABLE sales
ADD COLUMN role user_role DEFAULT 'rep';

-- Backfill from existing is_admin column
UPDATE sales
SET role = CASE
  WHEN is_admin = true THEN 'admin'::user_role
  ELSE 'rep'::user_role
END;

-- Make role NOT NULL after backfill
ALTER TABLE sales
ALTER COLUMN role SET NOT NULL;

-- Add index for role-based queries
CREATE INDEX idx_sales_role ON sales(role);

-- Deprecate is_admin column (keep for backward compatibility)
COMMENT ON COLUMN sales.is_admin IS 'DEPRECATED: Use role column instead. Kept for backward compatibility during transition.';

-- =====================================================================
-- PART 3: Helper Functions for Role Checking
-- =====================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_role() IS 'Returns the role of the currently authenticated user';

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin role';

-- Check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_manager_or_admin() IS 'Returns true if current user has manager or admin role';

-- Get current user's sales_id
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_sales_id() IS 'Returns the sales record ID for the currently authenticated user';

-- =====================================================================
-- PART 4: Update handle_new_user() to Assign Default Role
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.sales (
    user_id,
    email,
    first_name,
    last_name,
    role,  -- New: assign default role
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'rep',  -- Default all new users to 'rep'
    NEW.created_at,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates sales record when auth.users record is created. Assigns default role of "rep".';

-- =====================================================================
-- PART 5: Update RLS Policies - Tasks Table (Personal Ownership)
-- =====================================================================

-- Tasks: Reps can view all but only edit their own
DROP POLICY IF EXISTS select_tasks ON tasks;
DROP POLICY IF EXISTS insert_tasks ON tasks;
DROP POLICY IF EXISTS update_tasks ON tasks;
DROP POLICY IF EXISTS delete_tasks ON tasks;

-- SELECT: All authenticated users can view all tasks
CREATE POLICY select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: All users can create tasks (assigned to themselves by default)
CREATE POLICY insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = public.current_sales_id());

-- UPDATE: Reps can only update their own, managers/admins can update all
CREATE POLICY update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

-- DELETE: Only admins can delete tasks
CREATE POLICY delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PART 6: Update RLS Policies - Shared Resources
-- =====================================================================
-- Contacts, Organizations, Products: All can view/edit, only admins delete

-- CONTACTS
DROP POLICY IF EXISTS select_contacts ON contacts;
DROP POLICY IF EXISTS insert_contacts ON contacts;
DROP POLICY IF EXISTS update_contacts ON contacts;
DROP POLICY IF EXISTS delete_contacts ON contacts;

CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ORGANIZATIONS
DROP POLICY IF EXISTS select_organizations ON organizations;
DROP POLICY IF EXISTS insert_organizations ON organizations;
DROP POLICY IF EXISTS update_organizations ON organizations;
DROP POLICY IF EXISTS delete_organizations ON organizations;

CREATE POLICY select_organizations ON organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_organizations ON organizations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY update_organizations ON organizations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS select_products ON products;
DROP POLICY IF EXISTS insert_products ON products;
DROP POLICY IF EXISTS update_products ON products;
DROP POLICY IF EXISTS delete_products ON products;

CREATE POLICY select_products ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_products ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY update_products ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_products ON products
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PART 7: Update RLS Policies - Opportunities
-- =====================================================================

DROP POLICY IF EXISTS select_opportunities ON opportunities;
DROP POLICY IF EXISTS insert_opportunities ON opportunities;
DROP POLICY IF EXISTS update_opportunities ON opportunities;
DROP POLICY IF EXISTS delete_opportunities ON opportunities;

-- SELECT: All can view all opportunities
CREATE POLICY select_opportunities ON opportunities
  FOR SELECT TO authenticated USING (true);

-- INSERT: Reps create opportunities assigned to themselves
CREATE POLICY insert_opportunities ON opportunities
  FOR INSERT TO authenticated
  WITH CHECK (account_manager_id = public.current_sales_id());

-- UPDATE: Reps can update their own, managers/admins can update all
CREATE POLICY update_opportunities ON opportunities
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    account_manager_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    account_manager_id = public.current_sales_id()
  );

-- DELETE: Only admins can delete
CREATE POLICY delete_opportunities ON opportunities
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PART 8: Update RLS Policies - Notes (Contact & Opportunity)
-- =====================================================================

-- CONTACT NOTES
DROP POLICY IF EXISTS select_contactNotes ON "contactNotes";
DROP POLICY IF EXISTS insert_contactNotes ON "contactNotes";
DROP POLICY IF EXISTS update_contactNotes ON "contactNotes";
DROP POLICY IF EXISTS delete_contactNotes ON "contactNotes";

CREATE POLICY select_contactNotes ON "contactNotes"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_contactNotes ON "contactNotes"
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = public.current_sales_id());

CREATE POLICY update_contactNotes ON "contactNotes"
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

CREATE POLICY delete_contactNotes ON "contactNotes"
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- OPPORTUNITY NOTES
DROP POLICY IF EXISTS select_opportunityNotes ON "opportunityNotes";
DROP POLICY IF EXISTS insert_opportunityNotes ON "opportunityNotes";
DROP POLICY IF EXISTS update_opportunityNotes ON "opportunityNotes";
DROP POLICY IF EXISTS delete_opportunityNotes ON "opportunityNotes";

CREATE POLICY select_opportunityNotes ON "opportunityNotes"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_opportunityNotes ON "opportunityNotes"
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = public.current_sales_id());

CREATE POLICY update_opportunityNotes ON "opportunityNotes"
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

CREATE POLICY delete_opportunityNotes ON "opportunityNotes"
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PART 9: Update RLS Policies - Sales Table (Role Management)
-- =====================================================================

DROP POLICY IF EXISTS select_sales ON sales;
DROP POLICY IF EXISTS insert_sales ON sales;
DROP POLICY IF EXISTS update_sales ON sales;
DROP POLICY IF EXISTS delete_sales ON sales;

-- SELECT: All can view all sales reps
CREATE POLICY select_sales ON sales
  FOR SELECT TO authenticated USING (true);

-- INSERT: Only admins can create new sales records
CREATE POLICY insert_sales ON sales
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Admins can update all, others can only update their own profile
CREATE POLICY update_sales ON sales
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin() OR
    (user_id = auth.uid() AND role = (SELECT role FROM sales WHERE user_id = auth.uid()))
  );

-- DELETE: Only admins can delete (soft delete recommended)
CREATE POLICY delete_sales ON sales
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PART 10: Sync Trigger to Keep is_admin Compatible
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role();

COMMENT ON TRIGGER keep_is_admin_synced ON sales IS 'Keeps is_admin column in sync with role column during transition period';

-- =====================================================================
-- PART 11: Verification
-- =====================================================================

DO $$
DECLARE
  admin_count INTEGER;
  manager_count INTEGER;
  rep_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count users by role
  SELECT COUNT(*) INTO admin_count FROM sales WHERE role = 'admin';
  SELECT COUNT(*) INTO manager_count FROM sales WHERE role = 'manager';
  SELECT COUNT(*) INTO rep_count FROM sales WHERE role = 'rep';
  SELECT COUNT(*) INTO total_count FROM sales;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role-Based Permission System Installed';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_count;
  RAISE NOTICE '  - Admins: %', admin_count;
  RAISE NOTICE '  - Managers: %', manager_count;
  RAISE NOTICE '  - Reps: %', rep_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper functions created:';
  RAISE NOTICE '  - auth.user_role()';
  RAISE NOTICE '  - public.is_admin()';
  RAISE NOTICE '  - public.is_manager_or_admin()';
  RAISE NOTICE '  - public.current_sales_id()';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policies updated for:';
  RAISE NOTICE '  - tasks (personal ownership)';
  RAISE NOTICE '  - contacts (shared, admin-only delete)';
  RAISE NOTICE '  - organizations (shared, admin-only delete)';
  RAISE NOTICE '  - products (shared, admin-only delete)';
  RAISE NOTICE '  - opportunities (ownership-based)';
  RAISE NOTICE '  - contactNotes (ownership-based)';
  RAISE NOTICE '  - opportunityNotes (ownership-based)';
  RAISE NOTICE '  - sales (role management)';
  RAISE NOTICE '========================================';
END $$;
