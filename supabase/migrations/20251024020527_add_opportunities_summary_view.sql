-- Migration: Create opportunities_summary view with calculated fields
-- Purpose: Pre-compute interaction counts and days-in-stage for OpportunityCard

DROP VIEW IF EXISTS opportunities_summary;

CREATE VIEW opportunities_summary
WITH (security_invoker = true)  -- Use caller's permissions for RLS
AS
SELECT
  o.id,
  o.name,
  o.customer_organization_id,
  o.principal_organization_id,
  o.distributor_organization_id,
  o.contact_ids,
  o.stage,
  o.status,
  o.priority,
  o.description,
  o.estimated_close_date,
  o.actual_close_date,
  o.created_at,
  o.updated_at,
  o.deleted_at,
  o.opportunity_owner_id,
  o.account_manager_id,
  o.lead_source,
  o.index,
  o.founding_interaction_id,
  o.stage_manual,
  o.status_manual,
  o.next_action,
  o.next_action_date,
  o.competition,
  o.decision_criteria,
  o.stage_changed_at,
  o.created_by,
  o.search_tsv,
  o.tags,

  -- Calculated fields for OpportunityCard
  COUNT(a.id) FILTER (
    WHERE a.activity_type = 'interaction'
    AND a.deleted_at IS NULL
  ) AS nb_interactions,

  MAX(a.activity_date) FILTER (
    WHERE a.activity_type = 'interaction'
    AND a.deleted_at IS NULL
  ) AS last_interaction_date,

  -- Days in current stage (for attention flags)
  EXTRACT(DAY FROM NOW() - o.stage_changed_at)::INTEGER AS days_in_stage

FROM opportunities o
LEFT JOIN activities a ON (
  a.opportunity_id = o.id
  AND a.deleted_at IS NULL
)
WHERE o.deleted_at IS NULL  -- Only show non-deleted opportunities
GROUP BY o.id;

-- Grant permissions
GRANT SELECT ON opportunities_summary TO authenticated;

COMMENT ON VIEW opportunities_summary IS
  'Opportunities with pre-computed interaction counts and stage duration. Uses security_invoker to enforce RLS from base table.';
