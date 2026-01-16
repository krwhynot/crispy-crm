import { useNavigate } from "react-router-dom";
import { AlertCircle, Activity, Briefcase, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";
import { useKPIMetrics } from "../hooks/useKPIMetrics";

/**
 * KPI navigation URLs (preserved from original KPI_CONFIG)
 */
const KPI_NAVIGATION = {
  openOpportunities:
    "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
  overdueTasks: "/tasks?filter=%7B%22completed%22%3Afalse%2C%22due_date%40lt%22%3A%22today%22%7D",
  activitiesThisWeek: "/reports",
  staleDeals: "/opportunities?filter=%7B%22stale%22%3Atrue%7D",
} as const;

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
  const navigate = useNavigate();
  const { metrics, loading } = useKPIMetrics();

  return (
    <section
      aria-label="Key Performance Indicators"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      data-tutorial="dashboard-kpi-row"
    >
      {/* KPI #1: Open Opportunities (count, not $ value) */}
      <KPICard
        title="Open Opportunities"
        value={metrics.openOpportunitiesCount.toLocaleString()}
        icon={Briefcase}
        loading={loading}
        onClick={() => navigate(KPI_NAVIGATION.openOpportunities)}
        data-tutorial="dashboard-kpi-open-opportunities"
      />

      {/* KPI #2: Overdue Tasks (red accent when > 0) */}
      <KPICard
        title="Overdue Tasks"
        value={metrics.overdueTasksCount.toLocaleString()}
        icon={AlertCircle}
        loading={loading}
        variant={metrics.overdueTasksCount > 0 ? "destructive" : "default"}
        onClick={() => navigate(KPI_NAVIGATION.overdueTasks)}
        data-tutorial="dashboard-kpi-overdue-tasks"
      />

      {/* KPI #3: Activities This Week */}
      <KPICard
        title="Activities This Week"
        value={metrics.activitiesThisWeek.toLocaleString()}
        icon={Activity}
        loading={loading}
        onClick={() => navigate(KPI_NAVIGATION.activitiesThisWeek)}
        data-tutorial="dashboard-kpi-activities"
      />

      {/* KPI #4: Stale Deals (amber/warning when > 0) */}
      <KPICard
        title="Stale Deals"
        value={metrics.staleDealsCount.toLocaleString()}
        icon={AlertTriangle}
        loading={loading}
        variant={metrics.staleDealsCount > 0 ? "warning" : "default"}
        onClick={() => navigate(KPI_NAVIGATION.staleDeals)}
        data-tutorial="dashboard-kpi-stale-deals"
      />
    </section>
  );
}
