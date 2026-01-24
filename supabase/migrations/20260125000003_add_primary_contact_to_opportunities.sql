-- Batch 4, Q18: Simplify to 1 primary contact per opportunity
-- Decision: Consolidate opportunity_contacts + opportunity_participants → single primary_contact_id
-- Rationale: Most opportunities have 1 decision maker. Junction tables add complexity for rare multi-contact scenarios.

-- ====================
-- STEP 1: Add primary_contact_id Column
-- ====================
ALTER TABLE opportunities
ADD COLUMN primary_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;

COMMENT ON COLUMN opportunities.primary_contact_id IS
'Primary contact (decision maker) for this opportunity.
Replaces many-to-many junction tables per Batch 4 Q18 decision.
Additional stakeholders can be tracked in activities/notes.';

-- ====================
-- STEP 2: Backfill from opportunity_contacts Junction
-- ====================
-- Take the first contact by creation date from opportunity_contacts table
UPDATE opportunities o
SET primary_contact_id = (
  SELECT contact_id
  FROM opportunity_contacts oc
  WHERE oc.opportunity_id = o.id
    AND oc.deleted_at IS NULL
  ORDER BY oc.created_at ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM opportunity_contacts oc
  WHERE oc.opportunity_id = o.id AND oc.deleted_at IS NULL
);

-- ====================
-- STEP 3: Add Index for FK Lookups
-- ====================
CREATE INDEX idx_opportunities_primary_contact_id
ON opportunities(primary_contact_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_opportunities_primary_contact_id IS
'Performance: Filter opportunities by primary contact efficiently';

-- ====================
-- STEP 4: Update opportunities_summary View
-- ====================
-- Recreate view to include primary_contact_id and primary_contact_name
DROP VIEW IF EXISTS opportunities_summary CASCADE;

CREATE VIEW opportunities_summary AS
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
      LEFT JOIN products p ON op.product_id_reference = p.id
      LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
      WHERE op.opportunity_id = o.id
    ),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id
LEFT JOIN contacts primary_contact ON o.primary_contact_id = primary_contact.id;

COMMENT ON VIEW opportunities_summary IS 
'Denormalized opportunity view with organization names, primary contact, and products array for efficient reads.
Updated 2026-01-25: Added primary_contact_id and primary_contact_name fields.';

GRANT SELECT ON opportunities_summary TO authenticated, anon;

-- ====================
-- STEP 5: Deprecate Junction Tables (Do NOT Delete)
-- ====================
-- Keep tables for historical data, mark as deprecated
COMMENT ON TABLE opportunity_contacts IS
'DEPRECATED 2026-01-25: Replaced by opportunities.primary_contact_id.
Junction retained for historical data only. New code should use primary_contact_id.
Use activities/notes to track additional stakeholders.';

COMMENT ON TABLE opportunity_participants IS
'DEPRECATED 2026-01-25: Consolidated with opportunity_contacts into opportunities.primary_contact_id.
Junction retained for historical data. Track additional stakeholders in notes/activities.';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration simplifies opportunity-contact relationship:
-- 1. Added opportunities.primary_contact_id column (nullable FK to contacts)
-- 2. Backfilled from opportunity_contacts junction (first contact by creation date)
-- 3. Added index for query performance
-- 4. Updated opportunities_summary view to include primary contact name
-- 5. Deprecated junction tables (kept for historical data)
--
-- Breaking Changes: None - column is nullable, junctions still exist
-- Application Impact: Medium - UI should migrate to use primary_contact_id
--
-- Rollback: If needed, drop column and restore view without primary_contact fields:
--   ALTER TABLE opportunities DROP COLUMN primary_contact_id;
--   -- Recreate view without primary_contact fields
