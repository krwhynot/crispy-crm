-- Migration: Fix opportunities_summary products subquery soft-delete consistency
-- Issue: The products subquery JOINs to organizations (prod_org) and products (p)
--        WITHOUT filtering deleted_at IS NULL, while all other JOINs in the view
--        correctly filter soft-deleted records. This allows deleted organizations
--        and deleted products to appear in the products JSONB array.
-- Fix: Add AND prod_org.deleted_at IS NULL to the prod_org JOIN
--      Add AND p.deleted_at IS NULL to the products JOIN
-- Date: 2026-02-01
-- Refs: 20260125190223_fix_opportunities_summary_soft_delete.sql (current view)

-- ============================================================================
-- GUARD: Ensure primary_contact_id column exists on opportunities table
-- Migration 20260125000003 should have added it, but may be a phantom entry
-- on the remote (recorded as applied but column missing due to schema drift).
-- ============================================================================
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS
  primary_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_primary_contact_id
  ON opportunities(primary_contact_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- RECREATE VIEW WITH SOFT-DELETE FIX ON PRODUCTS SUBQUERY
-- Only change: added deleted_at IS NULL filters to products and prod_org JOINs
-- ============================================================================

-- DROP required because CREATE OR REPLACE cannot remove/reorder columns.
-- Remote view may have different column set due to schema drift.
DROP VIEW IF EXISTS opportunities_summary CASCADE;

CREATE VIEW opportunities_summary WITH (security_invoker = on) AS
SELECT
  o.id,
  o.name,
  o.description,
  o.stage,
  o.status,
  o.priority,
  o.index,
  o.estimated_close_date,
  o.actual_close_date,
  o.customer_organization_id,
  o.principal_organization_id,
  o.distributor_organization_id,
  o.founding_interaction_id,
  o.stage_manual,
  o.status_manual,
  o.next_action,
  o.next_action_date,
  o.competition,
  o.decision_criteria,
  o.contact_ids,
  o.opportunity_owner_id,
  o.created_at,
  o.updated_at,
  o.created_by,
  o.deleted_at,
  o.search_tsv,
  o.tags,
  o.account_manager_id,
  o.lead_source,
  o.updated_by,
  o.campaign,
  o.related_opportunity_id,
  o.primary_contact_id,
  -- Computed fields
  cust_org.name AS customer_organization_name,
  prin_org.name AS principal_organization_name,
  dist_org.name AS distributor_organization_name,
  primary_contact.first_name || ' ' || primary_contact.last_name AS primary_contact_name,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'product_id_reference', op.product_id_reference,
          'product_name', op.product_name,
          'product_category', op.product_category,
          'principal_name', prod_org.name,
          'notes', op.notes
        )
        ORDER BY op.created_at
      )
      FROM opportunity_products op
      LEFT JOIN products p ON op.product_id_reference = p.id AND p.deleted_at IS NULL
      LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id AND prod_org.deleted_at IS NULL
      WHERE op.opportunity_id = o.id
        AND op.deleted_at IS NULL
    ),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id AND cust_org.deleted_at IS NULL
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id AND prin_org.deleted_at IS NULL
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id AND dist_org.deleted_at IS NULL
LEFT JOIN contacts primary_contact ON o.primary_contact_id = primary_contact.id AND primary_contact.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON opportunities_summary TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW opportunities_summary IS
'Denormalized opportunity view with organization names, primary contact, and products array for efficient reads.
Updated 2026-02-01 (20260201000006): Added soft-delete filtering to products subquery JOINs (products p, organizations prod_org).
Updated 2026-01-25 (20260125190223): Added soft-delete filtering to WHERE clause and all outer JOINs.
SECURITY: Filters deleted opportunities, organizations, contacts, and products at every JOIN.';
