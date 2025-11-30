-- Performance indexes for dashboard KPI queries
-- From KPI Query Performance Audit (2025-11-29)
--
-- These indexes optimize the most common dashboard queries:
-- 1. Activities by date range (for weekly activity counts)
-- 2. Tasks by due date for incomplete tasks (for overdue counts)
-- 3. Open opportunities by stage (for pipeline counts)
-- 4. Principal organizations (for pipeline summary view)

-- ============================================================================
-- ACTIVITIES INDEXES
-- ============================================================================

-- Index for date range queries on activities (used by useKPIMetrics, useTeamActivities)
-- Filters: activity_date BETWEEN weekStart AND weekEnd, deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_activities_activity_date_active
ON activities(activity_date)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_activities_activity_date_active IS
'Performance index for dashboard activity counts by date range. Excludes soft-deleted records.';

-- ============================================================================
-- TASKS INDEXES
-- ============================================================================

-- Composite index for task due date filtering (used by useMyTasks, useKPIMetrics)
-- Filters: sales_id = X, completed = false, due_date < today (overdue)
CREATE INDEX IF NOT EXISTS idx_tasks_sales_due_date_incomplete
ON tasks(sales_id, due_date)
WHERE completed = false;

COMMENT ON INDEX idx_tasks_sales_due_date_incomplete IS
'Performance index for incomplete tasks by sales rep with due date ordering. Used by Kanban and KPI overdue counts.';

-- ============================================================================
-- OPPORTUNITIES INDEXES
-- ============================================================================

-- Partial index for active (non-closed) opportunities (used by useKPIMetrics)
-- Filters: stage NOT IN (closed_won, closed_lost), deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_active
ON opportunities(stage)
WHERE deleted_at IS NULL
  AND stage NOT IN ('closed_won', 'closed_lost');

COMMENT ON INDEX idx_opportunities_stage_active IS
'Performance index for open opportunities count. Excludes closed and soft-deleted records.';

-- Index for opportunity staleness calculation (updated_at used as last activity proxy)
-- Used by KPI stale deals count - opportunities table tracks activity via updated_at
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_at_active
ON opportunities(updated_at)
WHERE deleted_at IS NULL
  AND stage NOT IN ('closed_won', 'closed_lost');

COMMENT ON INDEX idx_opportunities_updated_at_active IS
'Performance index for stale deal detection based on updated_at (last activity proxy).';

-- ============================================================================
-- ORGANIZATIONS INDEXES
-- ============================================================================

-- Partial index for principal organizations (used by principal_pipeline_summary view)
-- Filters: organization_type = 'principal', deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_organizations_principal
ON organizations(id, name)
WHERE organization_type = 'principal' AND deleted_at IS NULL;

COMMENT ON INDEX idx_organizations_principal IS
'Performance index for principal pipeline view. Covers id and name for JOIN operations.';

-- ============================================================================
-- SALES INDEXES
-- ============================================================================

-- Index for user_id lookup (used by useCurrentSale)
-- Filters: user_id = auth.uid() OR email = user.email
CREATE INDEX IF NOT EXISTS idx_sales_user_id
ON sales(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_sales_user_id IS
'Performance index for sales record lookup by Supabase auth user_id.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify all indexes were created
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_activities_activity_date_active',
      'idx_tasks_sales_due_date_incomplete',
      'idx_opportunities_stage_active',
      'idx_opportunities_updated_at_active',
      'idx_organizations_principal',
      'idx_sales_user_id'
    );

  IF idx_count < 6 THEN
    RAISE WARNING 'Expected 6 performance indexes, found %', idx_count;
  ELSE
    RAISE NOTICE 'All 6 performance indexes created successfully';
  END IF;
END $$;
