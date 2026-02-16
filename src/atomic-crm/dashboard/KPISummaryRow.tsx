import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/ui/kpi-card";
import { useKPIMetrics } from "./useKPIMetrics";

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

/** Format a KPI value: null = query failed (show dash), number = real count */
function formatKPIValue(value: number | null): string {
  return value === null ? "\u2013" : value.toLocaleString();
}

/** Format recent activity count as a subtitle (e.g., "3 new in last hour") */
function formatRecentActivitySubtitle(count: number | null): string | undefined {
  if (count === null || count === 0) return undefined;
  return `${count} new in last hour`;
}

/**
 * KPISummaryRow - Dashboard KPI metrics header row (PRD v1.9 Section 9.2.1)
 *
 * Displays four key metrics in a horizontal row above the main dashboard grid:
 * 1. Open Opportunities - count (not $ value per Decision #5)
 * 2. Overdue Tasks - count (red accent if > 0)
 * 3. Team Activities - count (team-wide, all reps)
 * 4. Stale Deals - count (amber/warning if > 0, per-stage thresholds)
 *
 * G1 guardrail: null metrics render as "–" (en-dash), never as "0".
 */
export function KPISummaryRow() {
  const navigate = useNavigate();
  const { metrics, trends, loading } = useKPIMetrics();

  return (
    <div className="mb-3 border-t border-b border-[var(--divider-warm)] py-1 bg-transparent">
      <section
        aria-label="Key Performance Indicators"
        className="grid grid-cols-2 xl:grid-cols-4 gap-0"
        data-tutorial="dashboard-kpi-row"
      >
        {/* KPI #1: Open Opportunities (count, not $ value) */}
        <KPICard
          title="Open Opportunities"
          value={formatKPIValue(metrics.openOpportunitiesCount)}
          loading={loading}
          tone="neutral"
          emphasis="executiveBand"
          onClick={() => navigate(KPI_NAVIGATION.openOpportunities)}
          data-tutorial="dashboard-kpi-open-opportunities"
        />

        {/* KPI #2: Overdue Tasks (clay accent when > 0) */}
        <KPICard
          title="Overdue Tasks"
          value={formatKPIValue(metrics.overdueTasksCount)}
          loading={loading}
          tone={
            metrics.overdueTasksCount !== null && metrics.overdueTasksCount > 0
              ? "critical"
              : "neutral"
          }
          emphasis="executiveBand"
          className="border-l border-[var(--divider-warm)]/40"
          onClick={() => navigate(KPI_NAVIGATION.overdueTasks)}
          data-tutorial="dashboard-kpi-overdue-tasks"
        />

        {/* KPI #3: Team Activities This Week */}
        <KPICard
          title="Team Activities"
          value={formatKPIValue(metrics.activitiesThisWeek)}
          loading={loading}
          tone="neutral"
          emphasis="executiveBand"
          className="border-t xl:border-t-0 xl:border-l border-[var(--divider-warm)]/40"
          subtitle={formatRecentActivitySubtitle(metrics.recentActivityCount)}
          trend={trends.activitiesThisWeek ?? undefined}
          onClick={() => navigate(KPI_NAVIGATION.activitiesThisWeek)}
          data-tutorial="dashboard-kpi-activities"
        />

        {/* KPI #4: Stale Deals (warning when > 0) */}
        <KPICard
          title="Stale Deals"
          value={formatKPIValue(metrics.staleDealsCount)}
          loading={loading}
          tone={
            metrics.staleDealsCount !== null && metrics.staleDealsCount > 0 ? "warning" : "neutral"
          }
          emphasis="executiveBand"
          className="border-t border-l xl:border-t-0 border-[var(--divider-warm)]/40"
          onClick={() => navigate(KPI_NAVIGATION.staleDeals)}
          data-tutorial="dashboard-kpi-stale-deals"
        />
      </section>
    </div>
  );
}
