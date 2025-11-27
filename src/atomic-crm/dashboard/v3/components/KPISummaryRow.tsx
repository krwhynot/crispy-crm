import { KPICard } from "./KPICard";
import { useKPIMetrics } from "../hooks/useKPIMetrics";

/**
 * KPISummaryRow - Dashboard KPI metrics header row
 *
 * Displays four key metrics in a horizontal row above the main dashboard grid:
 * 1. Total Pipeline Value - sum of open opportunities
 * 2. Overdue Tasks - count (red accent if > 0)
 * 3. Activities This Week - count
 * 4. Open Opportunities - count
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
    >
      {/* 1. Total Pipeline Value */}
      <KPICard
        type="totalPipeline"
        value={metrics.totalPipelineValue}
        loading={loading}
      />

      {/* 2. Overdue Tasks (red accent when > 0) */}
      <KPICard
        type="overdueTasks"
        value={metrics.overdueTasksCount}
        loading={loading}
      />

      {/* 3. Activities This Week */}
      <KPICard
        type="activitiesThisWeek"
        value={metrics.activitiesThisWeek}
        loading={loading}
      />

      {/* 4. Open Opportunities */}
      <KPICard
        type="openOpportunities"
        value={metrics.openOpportunitiesCount}
        loading={loading}
      />
    </section>
  );
}
