-- ============================================================================
-- Migration: Add indexes for RLS-critical FK columns
-- ============================================================================
-- These created_by columns appear in RLS policy WHERE clauses (e.g.,
-- created_by = (SELECT current_sales_id())). Without indexes, RLS enforcement
-- on UPDATE/DELETE causes sequential scans.
--
-- Non-RLS audit columns (updated_by, etc.) are intentionally NOT indexed here
-- as they are not used in RLS policy evaluation. See pgTAP 050 exclusion list.
-- ============================================================================

-- activities.created_by: Used in activities_update_unified, activities_delete_unified
CREATE INDEX IF NOT EXISTS idx_activities_created_by
  ON activities (created_by) WHERE deleted_at IS NULL;

-- interaction_participants.created_by: Used in insert/update/delete policies
CREATE INDEX IF NOT EXISTS idx_interaction_participants_created_by
  ON interaction_participants (created_by) WHERE deleted_at IS NULL;

-- opportunity_participants.created_by: Used in insert/update/delete policies
CREATE INDEX IF NOT EXISTS idx_opportunity_participants_created_by
  ON opportunity_participants (created_by) WHERE deleted_at IS NULL;
