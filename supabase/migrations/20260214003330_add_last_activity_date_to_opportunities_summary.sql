-- Migration: Add last_activity_date to opportunities_summary view
-- Audit Ref: D1 (Phase 3 Reporting Audit — Tier D: DB/View changes)
-- Purpose: Enable D-KPI-4 (Stale Deals) to compute staleness from real activity data.
--          Currently last_activity_date is absent from the view, so useKPIMetrics.ts
--          and stalenessCalculation.ts cannot determine deal freshness.
-- Approach: Surgical LEFT JOIN to a subquery on activities table.
--           Does NOT reintroduce full CTE complexity (task_stats, next_tasks, days_in_stage)
--           that was intentionally removed in 20260125190223.
-- Date: 2026-02-11

-- ============================================================================
-- RECREATE VIEW WITH last_activity_date
-- Only change vs 20260201000006: added activity_stats subquery + LEFT JOIN
-- ============================================================================

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
  -- D1: last activity date for staleness calculation
  activity_stats.last_activity_date,
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
LEFT JOIN (
  SELECT
    opportunity_id,
    MAX(activity_date) AS last_activity_date
  FROM activities
  WHERE deleted_at IS NULL
  GROUP BY opportunity_id
) activity_stats ON activity_stats.opportunity_id = o.id
WHERE o.deleted_at IS NULL;

-- ============================================================================
-- INDEX: Speed up the activity_stats subquery
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_opportunity_last_activity
  ON activities (opportunity_id, activity_date DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON opportunities_summary TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW opportunities_summary IS
'Denormalized opportunity view with organization names, primary contact, products array, and last_activity_date for efficient reads.
Updated 2026-02-11 (20260211000001): Added last_activity_date via LEFT JOIN to activities aggregate (D1 audit action).
Updated 2026-02-01 (20260201000006): Added soft-delete filtering to products subquery JOINs.
Updated 2026-01-25 (20260125190223): Added soft-delete filtering to WHERE clause and all outer JOINs.
SECURITY: Filters deleted opportunities, organizations, contacts, products, and activities at every JOIN.';
