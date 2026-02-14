-- WG-003: Convenience view for opportunity stage transitions
-- ==========================================================
-- Purpose: Provides a clean, typed interface for querying stage changes
-- from the audit_trail table. Useful for dashboards, reports, and analytics.
--
-- Data Source: Filters audit_trail where table_name='opportunities' AND field_name='stage'
-- Security: RLS is NOT directly applicable to views in Postgres. The view
-- inherits security through the underlying audit_trail table's GRANT permissions.
--
-- Usage:
--   SELECT * FROM opportunity_stage_changes WHERE opportunity_id = 123;
--   SELECT * FROM opportunity_stage_changes WHERE to_stage = 'closed_won';

CREATE OR REPLACE VIEW opportunity_stage_changes AS
SELECT
  at.audit_id,
  at.record_id AS opportunity_id,
  at.old_value AS from_stage,
  at.new_value AS to_stage,
  at.changed_by,
  at.changed_at,
  o.name AS opportunity_name,
  o.stage AS current_stage,
  s.first_name || ' ' || s.last_name AS changed_by_name
FROM audit_trail at
LEFT JOIN opportunities o ON at.record_id = o.id
LEFT JOIN sales s ON at.changed_by = s.id
WHERE at.table_name = 'opportunities'
  AND at.field_name = 'stage';

-- Note: ORDER BY is removed from view definition for better query optimization
-- Consumers should specify their own ORDER BY clause

-- Grant SELECT to authenticated users (same as audit_trail)
GRANT SELECT ON opportunity_stage_changes TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW opportunity_stage_changes IS
  'WG-003: Convenience view for querying opportunity stage transitions.
   Filters audit_trail to stage field changes only.
   Join to opportunities and sales for context.';

-- Create index hint comment (index already exists on audit_trail)
COMMENT ON COLUMN opportunity_stage_changes.opportunity_id IS
  'References opportunities.id - use for filtering stage history of a specific opportunity';
