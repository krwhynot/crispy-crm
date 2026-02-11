import { useState, useMemo, useCallback } from "react";
import { useGetList } from "ra-core";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Activity, AlertCircle, Clock } from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";
import { ChartWrapper } from "../components/ChartWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { TabFilterBar } from "../components/TabFilterBar";
import { AppliedFiltersBar, EmptyState } from "../components";
import { useReportData } from "../hooks";
import { PipelineChart } from "../charts/PipelineChart";
import { ActivityTrendChart } from "../charts/ActivityTrendChart";
import { TopPrincipalsChart } from "../charts/TopPrincipalsChart";
import { RepPerformanceChart } from "../charts/RepPerformanceChart";
import { OPPORTUNITY_STAGE_CHOICES, STAGE, CLOSED_STAGES } from "../../opportunities/constants";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import "../charts/chartSetup";
import type { Sale } from "../types";
import {
  isOpportunityStale,
  countStaleOpportunities,
  STAGE_STALE_THRESHOLDS,
} from "@/atomic-crm/utils/stalenessCalculation";
import { parseDateSafely } from "@/lib/date-utils";

/** Pipeline opportunity for overview reporting */
interface Opportunity {
  id: number;
  stage: string;
  opportunity_owner_id: number;
  principal_organization_id: number | null;
  principal_organization_name?: string;
  last_activity_at?: string;
  deleted_at?: string;
}

/** Minimal activity record for trend calculations */
interface ActivityRecord {
  id: number;
  created_at: string;
  created_by: number;
}

export default function OverviewTab() {
  const navigate = useNavigate();

  // Local filter state (replaces GlobalFilterContext)
  const [dateRange, setDateRange] = useState({
    preset: "last30",
    start: null as string | null,
    end: null as string | null,
  });
  const [salesRepId, setSalesRepId] = useState<number | null>(null);

  const hasActiveFilters = dateRange.preset !== "last30" || salesRepId !== null;

  const handleReset = useCallback(() => {
    setDateRange({ preset: "last30", start: null, end: null });
    setSalesRepId(null);
  }, []);

  // Fetch sales reps for filter display and rep performance
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
  });

  // Build filters array for AppliedFiltersBar
  const appliedFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = [];

    // Date range filter (only show if not default)
    if (dateRange.preset !== "last30") {
      const dateLabels: Record<string, string> = {
        last7: "Last 7 Days",
        last30: "Last 30 Days",
        last90: "Last 90 Days",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        thisQuarter: "This Quarter",
        thisYear: "This Year",
      };
      filters.push({
        label: "Date Range",
        value: dateLabels[dateRange.preset] || dateRange.preset,
        onRemove: () => setDateRange({ preset: "last30", start: null, end: null }),
      });
    }

    // Sales rep filter (only show if selected)
    if (salesRepId) {
      const rep = salesReps.find((r) => r.id === salesRepId);
      const repName = rep ? `${rep.first_name} ${rep.last_name}` : `Rep ${salesRepId}`;
      filters.push({
        label: "Sales Rep",
        value: repName,
        onRemove: () => setSalesRepId(null),
      });
    }

    return filters;
  }, [dateRange.preset, salesRepId, salesReps]);

  // KPI click handlers - navigate to filtered list views (PRD Section 9.2.1)
  const handleTotalOpportunitiesClick = useCallback(() => {
    // Navigate to opportunities list showing all active opportunities
    const params = new URLSearchParams();
    params.set("filter", JSON.stringify({ "deleted_at@is": null }));
    navigate(`/opportunities?${params.toString()}`);
  }, [navigate]);

  const handleActivitiesClick = useCallback(() => {
    // Navigate to Reports page for weekly activity analysis
    // PRD Section 9.2.1: Activities KPI links to weekly report view
    navigate("/reports");
  }, [navigate]);

  const handleStaleLeadsClick = useCallback(() => {
    // Navigate to opportunities filtered to new_lead stage (stale leads)
    const params = new URLSearchParams();
    params.set(
      "filter",
      JSON.stringify({
        stage: STAGE.NEW_LEAD,
        "deleted_at@is": null,
      })
    );
    params.set("stale", "true"); // Custom flag for stale filtering
    navigate(`/opportunities?${params.toString()}`);
  }, [navigate]);

  const handleStaleDealsClick = useCallback(() => {
    // Navigate to opportunities showing all stale deals (exceeding stage thresholds)
    const params = new URLSearchParams();
    params.set("filter", JSON.stringify({ "deleted_at@is": null }));
    params.set("stale", "true"); // Custom flag for stale filtering
    navigate(`/opportunities?${params.toString()}`);
  }, [navigate]);

  // Memoize opportunity filters to prevent infinite re-render loops in useReportData
  // Note: We use additionalFilters for salesRepId because useReportData uses 'sales_id',
  // but opportunities use 'opportunity_owner_id' as the owner field
  const opportunityFilters = useMemo(
    () => ({
      "deleted_at@is": null,
      ...(salesRepId && { opportunity_owner_id: salesRepId }),
    }),
    [salesRepId]
  );

  // Fetch opportunities via useReportData (centralizes through unifiedDataProvider)
  const {
    data: opportunities,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
  } = useReportData<Opportunity>("opportunities", {
    additionalFilters: opportunityFilters,
  });

  // Activity date range: always 60 days for trend comparison (KPI calculations)
  // This is independent of UI date range filters - we need historical data for trends
  const activityDateRange = useMemo(
    () => ({
      start: subDays(new Date(), 60),
      end: new Date(),
    }),
    []
  );

  // Memoize activity filters - activities use 'created_by' not 'sales_id'
  const activityFilters = useMemo(
    () => (salesRepId ? { created_by: salesRepId } : {}),
    [salesRepId]
  );

  // Fetch activities via useReportData
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useReportData<ActivityRecord>("activities", {
    dateRange: activityDateRange,
    additionalFilters: activityFilters,
    dateField: "created_at",
  });

  const salesMap = useMemo(
    () => new Map(salesReps.map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Calculate KPIs with real trend percentages
  // Use nullish coalescing for safety during initial render when data is loading
  const kpis = useMemo(() => {
    const opps = opportunities ?? [];
    const acts = activities ?? [];
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);
    const thirtyDaysAgoDate = subDays(now, 30);
    const sixtyDaysAgoDate = subDays(now, 60);

    // Current week activities
    const currentWeekActivities = acts.filter((a) => {
      const date = parseDateSafely(a.created_at);
      return date && date >= weekAgo;
    }).length;

    // Previous week activities (for comparison)
    const previousWeekActivities = acts.filter((a) => {
      const date = parseDateSafely(a.created_at);
      return date && date >= twoWeeksAgo && date < weekAgo;
    }).length;

    // Calculate activity trend
    let activityTrend: "up" | "down" | "neutral" = "neutral";
    let activityChange = 0;
    if (previousWeekActivities > 0) {
      activityChange = Math.round(
        ((currentWeekActivities - previousWeekActivities) / previousWeekActivities) * 100
      );
      activityTrend = activityChange > 0 ? "up" : activityChange < 0 ? "down" : "neutral";
    } else if (currentWeekActivities > 0) {
      activityChange = 100;
      activityTrend = "up";
    }

    // Current period opportunities - exclude closed stages to align with D-KPI-1 (Dashboard "Open Opportunities")
    // B3: Both R-OV-1 and D-KPI-1 now use the same CLOSED_STAGES exclusion filter
    const currentOpportunities = opps.filter(
      (opp) => !CLOSED_STAGES.includes(opp.stage as (typeof CLOSED_STAGES)[number])
    ).length;

    // Calculate opportunity trend (compare to nothing since we can't see historical counts)
    // For now, we'll base trend on activity in last 30 days
    const recentActiveOpps = opps.filter((opp) => {
      if (!opp.last_activity_at) return false;
      const activityDate = parseDateSafely(opp.last_activity_at);
      return activityDate && activityDate >= thirtyDaysAgoDate;
    }).length;

    const olderActiveOpps = opps.filter((opp) => {
      if (!opp.last_activity_at) return false;
      const activityDate = parseDateSafely(opp.last_activity_at);
      return activityDate && activityDate >= sixtyDaysAgoDate && activityDate < thirtyDaysAgoDate;
    }).length;

    let opportunityTrend: "up" | "down" | "neutral" = "neutral";
    let opportunityChange = 0;
    if (olderActiveOpps > 0) {
      opportunityChange = Math.round(
        ((recentActiveOpps - olderActiveOpps) / olderActiveOpps) * 100
      );
      opportunityTrend = opportunityChange > 0 ? "up" : opportunityChange < 0 ? "down" : "neutral";
    }

    // Stale Leads - uses STAGE_STALE_THRESHOLDS.new_lead (7 days) per PRD Section 6.3
    const staleLeads = opps.filter((opp) => {
      const isLead = opp.stage === STAGE.NEW_LEAD;
      if (!isLead) return false;
      return isOpportunityStale(opp.stage, opp.last_activity_at ?? null, now);
    }).length;

    // Stale Deals - all opportunities exceeding STAGE_STALE_THRESHOLDS (PRD Section 9.2.1 KPI #4)
    // Per-stage thresholds from STAGE_STALE_THRESHOLDS: new_lead=7d, initial_outreach=14d,
    // sample_visit_offered=14d, feedback_logged=21d, demo_scheduled=14d
    const staleDeals = countStaleOpportunities(opps, now);

    return {
      totalOpportunities: currentOpportunities,
      weekActivities: currentWeekActivities,
      staleLeads,
      staleDeals,
      activityChange: Math.abs(activityChange),
      activityTrend,
      opportunityChange: Math.abs(opportunityChange),
      opportunityTrend,
    };
  }, [opportunities, activities]);

  // Prepare pipeline data for chart
  const pipelineData = useMemo(() => {
    const opps = opportunities ?? [];
    const stageCounts = OPPORTUNITY_STAGE_CHOICES.map((stage) => ({
      stage: stage.name,
      count: opps.filter((o) => o.stage === stage.id).length,
    }));
    return stageCounts.filter((s) => s.count > 0);
  }, [opportunities]);

  // Prepare activity trend data (last 14 days)
  const activityTrendData = useMemo(() => {
    const acts = activities ?? [];
    const now = new Date();
    const fourteenDaysAgo = subDays(now, 13); // 14 days including today

    const days = eachDayOfInterval({ start: startOfDay(fourteenDaysAgo), end: startOfDay(now) });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = acts.filter((a) => {
        const activityDate = parseDateSafely(a.created_at);
        return activityDate && format(activityDate, "yyyy-MM-dd") === dayStr;
      }).length;

      return {
        date: format(day, "MMM d"),
        count,
      };
    });
  }, [activities]);

  // Prepare top principals data
  const topPrincipalsData = useMemo(() => {
    const opps = opportunities ?? [];
    const principalCounts = new Map<string, { name: string; count: number }>();

    opps.forEach((opp) => {
      const principalName = opp.principal_organization_name || "No Principal";
      const key = opp.principal_organization_id?.toString() || "none";

      if (!principalCounts.has(key)) {
        principalCounts.set(key, { name: principalName, count: 0 });
      }
      principalCounts.get(key)!.count += 1;
    });

    return Array.from(principalCounts.values()).filter((p) => p.name !== "No Principal");
  }, [opportunities]);

  // Prepare rep performance data
  const repPerformanceData = useMemo(() => {
    const opps = opportunities ?? [];
    const acts = activities ?? [];
    const repStats = new Map<number, { name: string; activities: number; opportunities: number }>();

    // Count activities per rep
    acts.forEach((activity) => {
      if (!activity.created_by) return;
      if (!repStats.has(activity.created_by)) {
        repStats.set(activity.created_by, {
          name: salesMap.get(activity.created_by) || `Rep ${activity.created_by}`,
          activities: 0,
          opportunities: 0,
        });
      }
      repStats.get(activity.created_by)!.activities += 1;
    });

    // Count opportunities per rep
    opps.forEach((opp) => {
      if (!opp.opportunity_owner_id) return;
      if (!repStats.has(opp.opportunity_owner_id)) {
        repStats.set(opp.opportunity_owner_id, {
          name: salesMap.get(opp.opportunity_owner_id) || `Rep ${opp.opportunity_owner_id}`,
          activities: 0,
          opportunities: 0,
        });
      }
      repStats.get(opp.opportunity_owner_id)!.opportunities += 1;
    });

    return Array.from(repStats.values());
  }, [activities, opportunities, salesMap]);

  const isLoading = opportunitiesLoading || activitiesLoading;

  // Compute whether we have any data to show
  const hasData = (opportunities?.length ?? 0) > 0 || (activities?.length ?? 0) > 0;

  return (
    <div className="space-y-section">
      <TabFilterBar
        showDateRange
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showSalesRep
        salesRepId={salesRepId}
        onSalesRepChange={setSalesRepId}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
      />

      {/* Show applied filters bar when filters are active */}
      <AppliedFiltersBar
        filters={appliedFilters}
        onResetAll={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error display (fail-fast principle) */}
      {(opportunitiesError || activitiesError) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load report data</p>
          <p className="text-sm">{opportunitiesError?.message || activitiesError?.message}</p>
        </div>
      )}

      {/* Empty state when no data matches filters */}
      {!isLoading && !hasData && !opportunitiesError && !activitiesError && (
        <EmptyState
          title="No Data Found"
          description="Try adjusting your filters or create a new opportunity to get started."
          icon={TrendingUp}
          action={{
            label: "Create Opportunity",
            onClick: () => navigate("/opportunities/create"),
          }}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          <KPICard
            title="Open Opportunities"
            value={kpis.totalOpportunities}
            trend={{ value: kpis.opportunityChange, direction: kpis.opportunityTrend }}
            icon={TrendingUp}
            subtitle="Non-closed opportunities in pipeline"
            onClick={handleTotalOpportunitiesClick}
          />
          <KPICard
            title="Team Activities"
            value={kpis.weekActivities}
            trend={{ value: kpis.activityChange, direction: kpis.activityTrend }}
            icon={Activity}
            subtitle="Calls, emails, meetings logged"
            onClick={handleActivitiesClick}
          />
          <KPICard
            title="Stale Leads"
            value={kpis.staleLeads}
            trend={{ value: 0, direction: "neutral" }}
            icon={AlertCircle}
            subtitle={`New leads with no activity in ${STAGE_STALE_THRESHOLDS.new_lead}+ days`}
            onClick={handleStaleLeadsClick}
          />
          {/* KPI #4: Stale Deals with amber/warning styling (PRD Section 9.2.1) */}
          <KPICard
            title="Stale Deals"
            value={kpis.staleDeals}
            trend={{ value: 0, direction: "neutral" }}
            icon={Clock}
            subtitle="Deals exceeding stage thresholds"
            variant={kpis.staleDeals > 0 ? "warning" : "default"}
            onClick={handleStaleDealsClick}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        <ChartWrapper title="Pipeline by Stage" isLoading={isLoading}>
          <PipelineChart data={pipelineData} />
        </ChartWrapper>

        <ChartWrapper title="Activity Trend (14 Days)" isLoading={isLoading}>
          <ActivityTrendChart data={activityTrendData} />
        </ChartWrapper>

        <ChartWrapper title="Top Principals by Opportunities" isLoading={isLoading}>
          <TopPrincipalsChart data={topPrincipalsData} />
        </ChartWrapper>

        <ChartWrapper title="Rep Performance" isLoading={isLoading}>
          <RepPerformanceChart data={repPerformanceData} />
        </ChartWrapper>
      </div>
    </div>
  );
}
