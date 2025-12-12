-- Migration: Create dashboard_snapshots table for historical KPI tracking
-- Priority: P1 (PERF-02 + FUNC-01)
-- Issue: Week-over-week trends currently simplified to current count (inaccurate)
-- Solution: Store daily snapshots of key metrics for accurate trend calculations

-- Step 1: Create dashboard_snapshots table
CREATE TABLE IF NOT EXISTS public.dashboard_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  sales_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,

  -- Performance metrics (matching useMyPerformance hook)
  activities_count INTEGER NOT NULL DEFAULT 0,
  tasks_completed_count INTEGER NOT NULL DEFAULT 0,
  deals_moved_count INTEGER NOT NULL DEFAULT 0,
  open_opportunities_count INTEGER NOT NULL DEFAULT 0,

  -- KPI metrics (matching useKPIMetrics hook)
  total_opportunities_count INTEGER NOT NULL DEFAULT 0,
  overdue_tasks_count INTEGER NOT NULL DEFAULT 0,
  activities_this_week_count INTEGER NOT NULL DEFAULT 0,
  stale_deals_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one snapshot per user per date
  CONSTRAINT unique_snapshot_per_user_per_date UNIQUE (sales_id, snapshot_date)
);

-- Step 2: Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_sales_date
  ON public.dashboard_snapshots (sales_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_date
  ON public.dashboard_snapshots (snapshot_date DESC);

-- Step 3: Enable RLS
ALTER TABLE public.dashboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Users can only read their own snapshots (or all if admin/manager)
CREATE POLICY authenticated_select_dashboard_snapshots
  ON public.dashboard_snapshots
  FOR SELECT
  TO authenticated
  USING (
    sales_id = public.current_sales_id()
    OR public.is_manager_or_admin()
  );

-- Only backend/Edge Functions can insert (service_role)
-- No UPDATE or DELETE policies - snapshots are immutable once created

-- Step 5: Add table comment
COMMENT ON TABLE public.dashboard_snapshots IS
  'Historical snapshots of dashboard metrics for week-over-week trend calculations. Populated daily by Edge Function.';

COMMENT ON COLUMN public.dashboard_snapshots.snapshot_date IS
  'Date of snapshot (stored as date, not timestamp, for easy weekly aggregation)';

COMMENT ON COLUMN public.dashboard_snapshots.activities_count IS
  'Number of activities logged by user during the week ending on snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.tasks_completed_count IS
  'Number of tasks completed by user during the week ending on snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.deals_moved_count IS
  'Number of opportunities with stage changes during the week ending on snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.open_opportunities_count IS
  'Count of open opportunities owned by user at snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.total_opportunities_count IS
  'Total count of all opportunities (for KPI dashboard) at snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.overdue_tasks_count IS
  'Count of overdue tasks for user at snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.activities_this_week_count IS
  'Activities logged in the current week (rolling 7-day window) at snapshot_date';

COMMENT ON COLUMN public.dashboard_snapshots.stale_deals_count IS
  'Count of stale deals based on stage-specific thresholds at snapshot_date';
