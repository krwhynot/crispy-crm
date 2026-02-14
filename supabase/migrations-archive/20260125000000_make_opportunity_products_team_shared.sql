-- Migration: Make opportunity_products RLS Policies Team-Shared
-- Issue: Only opportunity OWNER can view/modify products on that opportunity
-- Team members can see opportunities but NOT the products on them
-- Solution: Make all authenticated users able to view/modify all opportunity products
--
-- Pattern follows: 20260121053244_relax_rls_for_shared_visibility.sql
-- Rollback: See 20251029051540_create_opportunity_products_table.sql for original policies

-- ============================================================
-- STEP 1: Drop Existing Ownership-Based Policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view opportunity products in their company" ON opportunity_products;
DROP POLICY IF EXISTS "Users can insert opportunity products in their company" ON opportunity_products;
DROP POLICY IF EXISTS "Users can update opportunity products in their company" ON opportunity_products;
DROP POLICY IF EXISTS "Users can delete opportunity products in their company" ON opportunity_products;

-- ============================================================
-- STEP 2: Add Audit Column (created_by)
-- Tracks who added each product association
-- ============================================================

ALTER TABLE opportunity_products
ADD COLUMN IF NOT EXISTS created_by BIGINT
    DEFAULT get_current_sales_id()
    REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN opportunity_products.created_by IS 'Sales ID who created this product association (audit trail)';

-- ============================================================
-- STEP 3: Create Team-Shared Policies
-- All authenticated users can view/modify products on non-deleted opportunities
-- ============================================================

-- SELECT: All authenticated users can view products on non-deleted opportunities
CREATE POLICY "opportunity_products_select_all"
ON opportunity_products FOR SELECT TO authenticated
USING (
    deleted_at IS NULL
    AND EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_products.opportunity_id
        AND o.deleted_at IS NULL
    )
);

-- INSERT: All authenticated users can add products to non-deleted opportunities
CREATE POLICY "opportunity_products_insert_authenticated"
ON opportunity_products FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_products.opportunity_id
        AND o.deleted_at IS NULL
    )
);

-- UPDATE: All authenticated users can update products on non-deleted opportunities
CREATE POLICY "opportunity_products_update_authenticated"
ON opportunity_products FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_products.opportunity_id
        AND o.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_products.opportunity_id
        AND o.deleted_at IS NULL
    )
);

-- DELETE: All authenticated users can (soft) delete products on non-deleted opportunities
CREATE POLICY "opportunity_products_delete_authenticated"
ON opportunity_products FOR DELETE TO authenticated
USING (
    deleted_at IS NULL
    AND EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_products.opportunity_id
        AND o.deleted_at IS NULL
    )
);

-- ============================================================
-- STEP 4: Performance Index for EXISTS Subquery
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_opportunity_products_opp_id_deleted
ON opportunity_products(opportunity_id)
WHERE deleted_at IS NULL;

-- ============================================================
-- STEP 5: Add Policy Comments for Documentation
-- ============================================================

COMMENT ON POLICY "opportunity_products_select_all" ON opportunity_products IS
    'All authenticated users can view products on non-deleted opportunities (team-shared visibility)';
COMMENT ON POLICY "opportunity_products_insert_authenticated" ON opportunity_products IS
    'All authenticated users can add products to non-deleted opportunities (team-shared access)';
COMMENT ON POLICY "opportunity_products_update_authenticated" ON opportunity_products IS
    'All authenticated users can update products on non-deleted opportunities (team-shared access)';
COMMENT ON POLICY "opportunity_products_delete_authenticated" ON opportunity_products IS
    'All authenticated users can soft-delete products on non-deleted opportunities (team-shared access)';

-- ============================================================
-- VERIFICATION BLOCK
-- ============================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'opportunity_products'
    AND policyname IN (
        'opportunity_products_select_all',
        'opportunity_products_insert_authenticated',
        'opportunity_products_update_authenticated',
        'opportunity_products_delete_authenticated'
    );

    IF policy_count != 4 THEN
        RAISE EXCEPTION 'Expected 4 opportunity_products policies, found %', policy_count;
    END IF;

    RAISE NOTICE 'SUCCESS: All 4 team-shared RLS policies created for opportunity_products';
END $$;
