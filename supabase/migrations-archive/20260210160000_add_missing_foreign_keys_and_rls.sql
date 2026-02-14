-- ============================================================================
-- ERD Remediation: Priority 1 (Missing FKs) + Priority 5 (RLS Hardening)
--
-- Adds 5 missing foreign key constraints using lock-safe NOT VALID pattern.
-- Replaces permissive opportunity_participants INSERT/UPDATE policies with
-- versions that validate organization_id references an active organization.
--
-- Pre-flight: 0 orphaned values confirmed on 2026-02-10
-- ============================================================================

-- ============================================================================
-- STEP 1: Add FK constraints NOT VALID (instant, no table scan)
-- ============================================================================

-- products.principal_id -> organizations.id
-- RESTRICT: Cannot delete a principal that has products referencing it
ALTER TABLE products
  ADD CONSTRAINT products_principal_id_fkey
  FOREIGN KEY (principal_id) REFERENCES organizations(id) ON DELETE RESTRICT
  NOT VALID;

-- activities.related_task_id -> activities.id (self-referential)
-- SET NULL: If the linked task is deleted, clear the reference
-- DROP first: constraint may already exist from 20260125082942
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_related_task_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_related_task_id_fkey
  FOREIGN KEY (related_task_id) REFERENCES activities(id) ON DELETE SET NULL
  NOT VALID;

-- interaction_participants.organization_id -> organizations.id
-- SET NULL: Column is nullable; if org is deleted, clear the reference
ALTER TABLE interaction_participants
  ADD CONSTRAINT interaction_participants_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
  NOT VALID;

-- opportunity_participants.organization_id -> organizations.id
-- RESTRICT: Column is NOT NULL; cannot delete org while participants reference it
ALTER TABLE opportunity_participants
  ADD CONSTRAINT opportunity_participants_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT
  NOT VALID;

-- product_features.created_by -> sales.id
-- SET NULL: Audit metadata; if sales user removed, clear the reference
ALTER TABLE product_features
  ADD CONSTRAINT product_features_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES sales(id) ON DELETE SET NULL
  NOT VALID;

-- ============================================================================
-- STEP 2: Validate constraints (SHARE UPDATE EXCLUSIVE lock - non-blocking)
-- ============================================================================

ALTER TABLE products VALIDATE CONSTRAINT products_principal_id_fkey;
ALTER TABLE activities VALIDATE CONSTRAINT activities_related_task_id_fkey;
ALTER TABLE interaction_participants VALIDATE CONSTRAINT interaction_participants_organization_id_fkey;
ALTER TABLE opportunity_participants VALIDATE CONSTRAINT opportunity_participants_organization_id_fkey;
ALTER TABLE product_features VALIDATE CONSTRAINT product_features_created_by_fkey;

-- ============================================================================
-- STEP 3: Harden opportunity_participants RLS (DROP + REPLACE, not append)
--
-- Existing INSERT policy validates opportunity ownership but does NOT validate
-- organization_id. Since all policies are PERMISSIVE, adding a new policy
-- would OR with existing ones (useless). Must DROP and REPLACE.
-- ============================================================================

-- DROP existing INSERT policy
DROP POLICY IF EXISTS opportunity_participants_insert_owner ON opportunity_participants;

-- REPLACE with version that validates organization exists and is active
CREATE POLICY opportunity_participants_insert_validated ON opportunity_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Organization must exist and be active
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = opportunity_participants.organization_id
      AND deleted_at IS NULL
    )
    -- AND original authorization checks preserved
    AND (
      (created_by = current_sales_id())
      OR (SELECT private.is_admin_or_manager())
      OR EXISTS (
        SELECT 1 FROM opportunities o
        WHERE o.id = opportunity_participants.opportunity_id
        AND (
          o.created_by = current_sales_id()
          OR o.opportunity_owner_id = current_sales_id()
          OR o.account_manager_id = current_sales_id()
        )
      )
    )
  );

-- DROP existing UPDATE policy
DROP POLICY IF EXISTS opportunity_participants_update_policy ON opportunity_participants;

-- REPLACE with version that validates organization on change
CREATE POLICY opportunity_participants_update_validated ON opportunity_participants
  FOR UPDATE TO authenticated
  USING (
    created_by = current_sales_id()
    OR owns_opportunity(opportunity_id)
    OR is_manager_or_admin()
  )
  WITH CHECK (
    -- Organization must remain valid on update
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = opportunity_participants.organization_id
      AND deleted_at IS NULL
    )
    AND (
      created_by = current_sales_id()
      OR owns_opportunity(opportunity_id)
      OR is_manager_or_admin()
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================================================
-- 1. Verify all 5 FKs exist:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conrelid IN (
--      'public.products'::regclass,
--      'public.activities'::regclass,
--      'public.interaction_participants'::regclass,
--      'public.opportunity_participants'::regclass,
--      'public.product_features'::regclass
--    )
--    AND contype = 'f'
--    ORDER BY conrelid::text, conname;
--
-- 2. Verify RLS policies replaced:
--    SELECT policyname, cmd, with_check
--    FROM pg_policies
--    WHERE tablename = 'opportunity_participants'
--    AND cmd IN ('INSERT', 'UPDATE');
-- ============================================================================
