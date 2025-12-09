import { KPICard } from "./KPICard";
import { useKPIMetrics } from "../hooks/useKPIMetrics";

/**
 * KPISummaryRow - Dashboard KPI metrics header row (PRD v1.9 Section 9.2.1)
 *
 * Displays four key metrics in a horizontal row above the main dashboard grid:
 * 1. Open Opportunities - count (not $ value per Decision #5)
 * 2. Overdue Tasks - count (red accent if > 0)
 * 3. Activities This Week - count
 * 4. Stale Deals - count (amber/warning if > 0, per-stage thresholds)
 *
 * Layout (desktop-first):
 * - Desktop (≥1024px): 4-column horizontal row
 * - Tablet/Mobile (<1024px): 2x2 grid
 *
 * Behavior:
 * - Click on any metric → navigate to filtered list view
 * - Loading skeleton while fetching
 * - Uses useKPIMetrics hook for single aggregated query
 */
export function KPISummaryRow() {
  const { metrics, loading } = useKPIMetrics();

  return (
    <section
      aria-label="Key Performance Indicators"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      data-tutorial="dashboard-kpi-row"
    >
      {/* KPI #1: Open Opportunities (count, not $ value) */}
      <KPICard
        type="openOpportunities"
        value={metrics.openOpportunitiesCount}
        loading={loading}
        data-tutorial="dashboard-kpi-open-opportunities"
      />

      {/* KPI #2: Overdue Tasks (red accent when > 0) */}
      <KPICard
        type="overdueTasks"
        value={metrics.overdueTasksCount}
        loading={loading}
        data-tutorial="dashboard-kpi-overdue-tasks"
      />

      {/* KPI #3: Activities This Week */}
      <KPICard
        type="activitiesThisWeek"
        value={metrics.activitiesThisWeek}
        loading={loading}
        data-tutorial="dashboard-kpi-activities"
      />

      {/* KPI #4: Stale Deals (amber/warning when > 0) */}
      <KPICard
        type="staleDeals"
        value={metrics.staleDealsCount}
        loading={loading}
        data-tutorial="dashboard-kpi-stale-deals"
      />
    </section>
  );
}
