-- ============================================================
-- SECURITY FIX: Replace Permissive WITH CHECK (true) Policies
-- ============================================================
-- Audit Reference: DB Hardening - 9 High Priority Issues
--
-- This migration replaces all WITH CHECK (true) policies with
-- proper ownership-based checks using the existing helper functions:
--   - current_sales_id(): Returns the sales.id for the authenticated user
--   - is_admin(): Returns true if user has admin role
--   - is_manager_or_admin(): Returns true if user has manager or admin role
--   - private.is_admin_or_manager(): Private schema version (preferred)
--
-- Security Model:
--   - INSERT: User must be the creator (created_by = current_sales_id())
--   - UPDATE: Owner OR manager/admin can modify
--   - Reference data (tags, segments): Manager/admin only
--   - Service tables (notifications): Service role only (unchanged)
--
-- Tables affected:
--   1. activities - INSERT
--   2. contacts - INSERT, UPDATE
--   3. organizations - INSERT, UPDATE
--   4. products - INSERT (UPDATE already fixed in security_remediation.sql)
--   5. contact_notes - INSERT
--   6. opportunity_notes - INSERT, UPDATE
--   7. organization_notes - INSERT, UPDATE
--   8. product_distributors - INSERT, UPDATE
--   9. segments - INSERT, UPDATE
--   10. tags - INSERT (UPDATE/DELETE already fixed in security_remediation.sql)
--   11. interaction_participants - INSERT
--   12. opportunity_participants - INSERT
--
-- NOT modified (correct as-is):
--   - notifications: service_insert_notifications uses service_role
--   - sales: service_role_full_access is intentional for admin operations
--   - test_user_metadata: test table, service role only
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: ACTIVITIES
-- Table has: created_by (bigint), sales_id (bigint)
-- ============================================================

DROP POLICY IF EXISTS "activities_insert_all" ON activities;
DROP POLICY IF EXISTS "activities_insert_owner" ON activities;

DROP POLICY IF EXISTS "activities_insert_owner" ON activities;

CREATE POLICY "activities_insert_owner"
ON activities FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "activities_insert_owner" ON activities IS
    'INSERT requires ownership (created_by = current user) or manager/admin role';

-- ============================================================
-- SECTION 2: CONTACTS
-- Table has: created_by (bigint), sales_id (bigint)
-- ============================================================

DROP POLICY IF EXISTS "insert_contacts" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_owner" ON contacts;

DROP POLICY IF EXISTS "contacts_insert_owner" ON contacts;

CREATE POLICY "contacts_insert_owner"
ON contacts FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "contacts_insert_owner" ON contacts IS
    'INSERT requires ownership (created_by = current user) or manager/admin role';

DROP POLICY IF EXISTS "update_contacts" ON contacts;
DROP POLICY IF EXISTS "contacts_update_owner_or_privileged" ON contacts;

DROP POLICY IF EXISTS "contacts_update_owner_or_privileged" ON contacts;

CREATE POLICY "contacts_update_owner_or_privileged"
ON contacts FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "contacts_update_owner_or_privileged" ON contacts IS
    'UPDATE requires ownership (created_by or sales_id match) or manager/admin role';

-- ============================================================
-- SECTION 3: ORGANIZATIONS
-- Table has: created_by (bigint), sales_id (bigint)
-- ============================================================

DROP POLICY IF EXISTS "insert_organizations" ON organizations;

DROP POLICY IF EXISTS "organizations_insert_owner" ON organizations;

CREATE POLICY "organizations_insert_owner"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "organizations_insert_owner" ON organizations IS
    'INSERT requires ownership (created_by = current user) or manager/admin role';

DROP POLICY IF EXISTS "update_organizations" ON organizations;

DROP POLICY IF EXISTS "organizations_update_owner_or_privileged" ON organizations;

CREATE POLICY "organizations_update_owner_or_privileged"
ON organizations FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "organizations_update_owner_or_privileged" ON organizations IS
    'UPDATE requires ownership (created_by or sales_id match) or manager/admin role';

-- ============================================================
-- SECTION 4: PRODUCTS (Reference Data)
-- Table has: created_by (bigint), NO sales_id
-- Note: UPDATE policy already fixed in security_remediation.sql
-- ============================================================

DROP POLICY IF EXISTS "insert_products" ON products;

DROP POLICY IF EXISTS "products_insert_privileged" ON products;

CREATE POLICY "products_insert_privileged"
ON products FOR INSERT
TO authenticated
WITH CHECK (
    private.is_admin_or_manager()
);

COMMENT ON POLICY "products_insert_privileged" ON products IS
    'Products are reference data - only manager/admin can create';

-- Fix UPDATE if it still has WITH CHECK (true)
DROP POLICY IF EXISTS "update_products" ON products;
DROP POLICY IF EXISTS "update_products_owned" ON products;

DROP POLICY IF EXISTS "products_update_privileged" ON products;

CREATE POLICY "products_update_privileged"
ON products FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    is_admin() OR created_by = current_sales_id()
);

COMMENT ON POLICY "products_update_privileged" ON products IS
    'Products UPDATE requires admin or ownership';

-- ============================================================
-- SECTION 5: CONTACT_NOTES
-- Table has: created_by (bigint), sales_id (bigint)
-- ============================================================

DROP POLICY IF EXISTS "insert_contact_notes" ON contact_notes;

DROP POLICY IF EXISTS "contact_notes_insert_owner" ON contact_notes;

CREATE POLICY "contact_notes_insert_owner"
ON contact_notes FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "contact_notes_insert_owner" ON contact_notes IS
    'INSERT requires ownership (created_by or sales_id match) or manager/admin role';

-- ============================================================
-- SECTION 6: OPPORTUNITY_NOTES
-- Table has: created_by (bigint), sales_id (bigint)
-- ============================================================

DROP POLICY IF EXISTS "insert_opportunity_notes" ON opportunity_notes;

DROP POLICY IF EXISTS "opportunity_notes_insert_owner" ON opportunity_notes;

CREATE POLICY "opportunity_notes_insert_owner"
ON opportunity_notes FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "opportunity_notes_insert_owner" ON opportunity_notes IS
    'INSERT requires ownership (created_by or sales_id match) or manager/admin role';

DROP POLICY IF EXISTS "update_opportunity_notes" ON opportunity_notes;

DROP POLICY IF EXISTS "opportunity_notes_update_owner_or_privileged" ON opportunity_notes;

CREATE POLICY "opportunity_notes_update_owner_or_privileged"
ON opportunity_notes FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "opportunity_notes_update_owner_or_privileged" ON opportunity_notes IS
    'UPDATE requires ownership (created_by or sales_id match) or manager/admin role';

-- ============================================================
-- SECTION 7: ORGANIZATION_NOTES
-- Table has: sales_id (bigint), NO created_by
-- ============================================================

DROP POLICY IF EXISTS "insert_organization_notes" ON organization_notes;

DROP POLICY IF EXISTS "organization_notes_insert_owner" ON organization_notes;

CREATE POLICY "organization_notes_insert_owner"
ON organization_notes FOR INSERT
TO authenticated
WITH CHECK (
    sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "organization_notes_insert_owner" ON organization_notes IS
    'INSERT requires ownership (sales_id = current user) or manager/admin role';

DROP POLICY IF EXISTS "update_organization_notes" ON organization_notes;

DROP POLICY IF EXISTS "organization_notes_update_owner_or_privileged" ON organization_notes;

CREATE POLICY "organization_notes_update_owner_or_privileged"
ON organization_notes FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    sales_id = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "organization_notes_update_owner_or_privileged" ON organization_notes IS
    'UPDATE requires ownership (sales_id match) or manager/admin role';

-- ============================================================
-- SECTION 8: PRODUCT_DISTRIBUTORS
-- Table has: created_by (bigint), NO sales_id
-- ============================================================

DROP POLICY IF EXISTS "insert_product_distributors" ON product_distributors;

DROP POLICY IF EXISTS "product_distributors_insert_owner" ON product_distributors;

CREATE POLICY "product_distributors_insert_owner"
ON product_distributors FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "product_distributors_insert_owner" ON product_distributors IS
    'INSERT requires ownership (created_by = current user) or manager/admin role';

DROP POLICY IF EXISTS "update_product_distributors" ON product_distributors;

DROP POLICY IF EXISTS "product_distributors_update_owner_or_privileged" ON product_distributors;

CREATE POLICY "product_distributors_update_owner_or_privileged"
ON product_distributors FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
);

COMMENT ON POLICY "product_distributors_update_owner_or_privileged" ON product_distributors IS
    'UPDATE requires ownership (created_by match) or manager/admin role';

-- ============================================================
-- SECTION 9: SEGMENTS (Reference Data)
-- Table has: created_by (uuid - references auth.uid directly)
-- ============================================================

DROP POLICY IF EXISTS "insert_segments" ON segments;

DROP POLICY IF EXISTS "segments_insert_privileged" ON segments;

CREATE POLICY "segments_insert_privileged"
ON segments FOR INSERT
TO authenticated
WITH CHECK (
    private.is_admin_or_manager()
);

COMMENT ON POLICY "segments_insert_privileged" ON segments IS
    'Segments are reference data - only manager/admin can create';

DROP POLICY IF EXISTS "update_segments" ON segments;

DROP POLICY IF EXISTS "segments_update_privileged" ON segments;

CREATE POLICY "segments_update_privileged"
ON segments FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
    private.is_admin_or_manager()
);

COMMENT ON POLICY "segments_update_privileged" ON segments IS
    'Segments are reference data - only manager/admin can update';

-- ============================================================
-- SECTION 10: TAGS (Reference Data - No ownership columns)
-- Table has: NO created_by, NO sales_id
-- Note: UPDATE/DELETE already fixed in security_remediation.sql
-- ============================================================

DROP POLICY IF EXISTS "authenticated_insert_tags" ON tags;

DROP POLICY IF EXISTS "tags_insert_privileged" ON tags;

CREATE POLICY "tags_insert_privileged"
ON tags FOR INSERT
TO authenticated
WITH CHECK (
    private.is_admin_or_manager()
);

COMMENT ON POLICY "tags_insert_privileged" ON tags IS
    'Tags are reference data - only manager/admin can create';

-- ============================================================
-- SECTION 11: INTERACTION_PARTICIPANTS
-- Table has: created_by (bigint), NO sales_id
-- Junction table - check via parent activity ownership
-- ============================================================

DROP POLICY IF EXISTS "interaction_participants_insert_policy" ON interaction_participants;

DROP POLICY IF EXISTS "interaction_participants_insert_owner" ON interaction_participants;

CREATE POLICY "interaction_participants_insert_owner"
ON interaction_participants FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
    OR EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = activity_id
        AND (a.created_by = current_sales_id() OR a.sales_id = current_sales_id())
    )
);

COMMENT ON POLICY "interaction_participants_insert_owner" ON interaction_participants IS
    'INSERT requires ownership, manager/admin role, or ownership of parent activity';

-- ============================================================
-- SECTION 12: OPPORTUNITY_PARTICIPANTS
-- Table has: created_by (bigint), NO sales_id
-- Junction table - check via parent opportunity ownership
-- ============================================================

DROP POLICY IF EXISTS "opportunity_participants_insert_policy" ON opportunity_participants;

DROP POLICY IF EXISTS "opportunity_participants_insert_owner" ON opportunity_participants;

CREATE POLICY "opportunity_participants_insert_owner"
ON opportunity_participants FOR INSERT
TO authenticated
WITH CHECK (
    created_by = current_sales_id()
    OR private.is_admin_or_manager()
    OR EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_id
        AND (o.created_by = current_sales_id()
             OR o.opportunity_owner_id = current_sales_id()
             OR o.account_manager_id = current_sales_id())
    )
);

COMMENT ON POLICY "opportunity_participants_insert_owner" ON opportunity_participants IS
    'INSERT requires ownership, manager/admin role, or ownership of parent opportunity';

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================
--
-- 1. Check no more WITH CHECK (true) on user tables:
--    SELECT tablename, policyname, cmd, with_check::text
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND with_check::text = 'true'
--      AND tablename NOT IN ('sales', 'notifications', 'test_user_metadata')
--    ORDER BY tablename;
--    Expected: 0 rows
--
-- 2. Verify all ownership policies created:
--    SELECT tablename, policyname FROM pg_policies
--    WHERE policyname LIKE '%_owner%' OR policyname LIKE '%_privileged%'
--    ORDER BY tablename;
--    Expected: 14 rows (one per policy created above)
--
-- ============================================================
