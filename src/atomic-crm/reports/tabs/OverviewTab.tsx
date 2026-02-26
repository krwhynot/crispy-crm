import { useMemo, useCallback } from "react";
import { useGetList, useStore } from "ra-core";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Activity, AlertCircle, Clock } from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";
import { ChartWrapper } from "../components/ChartWrapper";
import { KeyInsightsStrip } from "../components/KeyInsightsStrip";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../components";
import {
  useReportData,
  GLOBAL_DEFAULTS,
  type GlobalReportFilterState,
  useProductFilteredOpportunityIds,
  ProductTruncationAlert,
} from "../hooks";
import { PipelineChart } from "../charts/PipelineChart";
import { ActivityTrendChart } from "../charts/ActivityTrendChart";
import { TopPrincipalsChart } from "../charts/TopPrincipalsChart";
import { RepPerformanceChart } from "../charts/RepPerformanceChart";
import { OPPORTUNITY_STAGE_CHOICES, STAGE, CLOSED_STAGES } from "../../opportunities/constants";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { resolvePreset } from "../utils/resolvePreset";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
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

  // Read global filter state from shared store
  const [globalFilters] = useStore<GlobalReportFilterState>("reports.global", GLOBAL_DEFAULTS);
  const { principalId, productId, ownerId, periodPreset, customStart, customEnd } = globalFilters;

  // Resolve date preset to concrete Date range for query filtering
  const resolvedDateRange = useMemo(
    () => resolvePreset(periodPreset, customStart, customEnd),
    [periodPreset, customStart, customEnd]
  );

  // Product filtering via junction table
  const { opportunityIds, isTruncated: productTruncated } =
    useProductFilteredOpportunityIds(productId);

  // Fetch sales reps for rep performance chart
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
  });

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
  const opportunityFilters = useMemo(
    () => ({
      "deleted_at@is": null,
      ...(ownerId && { opportunity_owner_id: ownerId }),
      ...(principalId && { principal_organization_id: principalId }),
      ...(opportunityIds != null && { "id@in": opportunityIds }),
      ...(resolvedDateRange && { "created_at@gte": resolvedDateRange.start.toISOString() }),
      ...(resolvedDateRange && { "created_at@lte": resolvedDateRange.end.toISOString() }),
    }),
    [ownerId, principalId, opportunityIds, resolvedDateRange]
  );

  // Fetch opportunities via useReportData (centralizes through unifiedDataProvider)
  const {
    data: opportunities,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
  } = useReportData<Opportunity>("opportunities", {
    additionalFilters: opportunityFilters,
  });

  // Activity date range: use resolved preset when available, fall back to 60 days
  // for KPI trend comparison (need at least 14 days for current/previous week comparison)
  const activityDateRange = useMemo(
    () => resolvedDateRange ?? { start: subDays(new Date(), 60), end: new Date() },
    [resolvedDateRange]
  );

  // Memoize activity filters - activities use 'created_by' not 'sales_id'
  const activityFilters = useMemo(
    () => ({
      ...(ownerId ? { created_by: ownerId } : {}),
      ...(principalId && { principal_organization_id: principalId }),
      ...(opportunityIds != null && { "opportunity_id@in": opportunityIds }),
    }),
    [ownerId, principalId, opportunityIds]
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

  // Prepare top principals data (includes id for drilldown navigation)
  const topPrincipalsData = useMemo(() => {
    const opps = opportunities ?? [];
    const principalCounts = new Map<
      string,
      { name: string; count: number; id: number | undefined }
    >();

    opps.forEach((opp) => {
      const principalName = opp.principal_organization_name || "No Principal";
      const key = opp.principal_organization_id?.toString() || "none";

      if (!principalCounts.has(key)) {
        principalCounts.set(key, {
          name: principalName,
          count: 0,
          id: opp.principal_organization_id ?? undefined,
        });
      }
      principalCounts.get(key)!.count += 1;
    });

    return Array.from(principalCounts.values()).filter((p) => p.name !== "No Principal");
  }, [opportunities]);

  // Prepare rep performance data (includes id for drilldown navigation)
  const repPerformanceData = useMemo(() => {
    const opps = opportunities ?? [];
    const acts = activities ?? [];
    const repStats = new Map<
      number,
      { name: string; activities: number; opportunities: number; id: number }
    >();

    // Count activities per rep
    acts.forEach((activity) => {
      if (!activity.created_by) return;
      if (!repStats.has(activity.created_by)) {
        repStats.set(activity.created_by, {
          name: salesMap.get(activity.created_by) || `Rep ${activity.created_by}`,
          activities: 0,
          opportunities: 0,
          id: activity.created_by,
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
          id: opp.opportunity_owner_id,
        });
      }
      repStats.get(opp.opportunity_owner_id)!.opportunities += 1;
    });

    return Array.from(repStats.values());
  }, [activities, opportunities, salesMap]);

  const isLoading = opportunitiesLoading || activitiesLoading;

  // Compute whether we have any data to show
  const hasData = (opportunities?.length ?? 0) > 0 || (activities?.length ?? 0) > 0;

  // Distinguish first load (no cached data) from background refresh (has cached data)
  const isFirstLoad = isLoading && !hasData;
  const isRefreshing = isLoading && hasData;

  return (
    <div className="space-y-widget">
      {isRefreshing && (
        <div className="text-xs text-muted-foreground animate-pulse" role="status">
          Updating...
        </div>
      )}

      <ProductTruncationAlert isTruncated={productTruncated} />

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

      {/* Key insights strip -- auto-generated contextual summaries */}
      <KeyInsightsStrip
        pipelineData={pipelineData}
        repPerformanceData={repPerformanceData}
        staleDeals={kpis.staleDeals}
        isLoading={isFirstLoad}
      />

      {isFirstLoad ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-content"
          data-testid="kpi-grid"
        >
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-content"
          data-testid="kpi-grid"
        >
          <KPICard
            title="Open Opportunities"
            value={kpis.totalOpportunities}
            trend={{ value: kpis.opportunityChange, direction: kpis.opportunityTrend }}
            icon={TrendingUp}
            subtitle="Non-closed opportunities in pipeline"
            comparisonLabel="vs prior 30d activity"
            infoTooltip="Open opportunities excluding Closed Won and Closed Lost stages"
            onClick={handleTotalOpportunitiesClick}
          />
          <KPICard
            title="Team Activities"
            value={kpis.weekActivities}
            trend={{ value: kpis.activityChange, direction: kpis.activityTrend }}
            icon={Activity}
            subtitle="Calls, emails, meetings logged"
            comparisonLabel={
              kpis.activityChange === 100 && kpis.activityTrend === "up"
                ? "No prior data"
                : "vs last week"
            }
            infoTooltip="Activities logged in the last 7 days compared to the prior 7 days"
            onClick={handleActivitiesClick}
          />
          <KPICard
            title="Stale Leads"
            value={kpis.staleLeads}
            trend={{ value: 0, direction: "neutral" }}
            icon={AlertCircle}
            subtitle={`New leads with no activity in ${STAGE_STALE_THRESHOLDS.new_lead}+ days`}
            infoTooltip={`New Lead stage opportunities with no activity for ${STAGE_STALE_THRESHOLDS.new_lead}+ days`}
            onClick={handleStaleLeadsClick}
          />
          {/* KPI #4: Stale Deals with amber/warning styling (PRD Section 9.2.1) */}
          <KPICard
            title="Stale Deals"
            value={kpis.staleDeals}
            trend={{ value: 0, direction: "neutral" }}
            icon={Clock}
            subtitle="Deals exceeding stage thresholds"
            infoTooltip="Opportunities exceeding per-stage inactivity thresholds (7-21 days depending on stage)"
            tone={kpis.staleDeals > 0 ? "warning" : "neutral"}
            onClick={handleStaleDealsClick}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-content md:gap-section">
        <ChartWrapper title="Pipeline by Stage" isLoading={isFirstLoad}>
          <PipelineChart
            data={pipelineData}
            onBarClick={(stage) => {
              const stageChoice = OPPORTUNITY_STAGE_CHOICES.find((s) => s.name === stage);
              if (stageChoice) {
                const params = new URLSearchParams();
                params.set(
                  "filter",
                  JSON.stringify({ stage: stageChoice.id, "deleted_at@is": null })
                );
                navigate(`/opportunities?${params.toString()}`);
              }
            }}
          />
        </ChartWrapper>

        <ChartWrapper title="Activity Trend (14 Days)" isLoading={isFirstLoad}>
          <ActivityTrendChart data={activityTrendData} />
        </ChartWrapper>

        <ChartWrapper title="Top Principals by Opportunities" isLoading={isFirstLoad}>
          <TopPrincipalsChart
            data={topPrincipalsData}
            onBarClick={(_name, principalId) => {
              if (principalId) {
                const params = new URLSearchParams();
                params.set(
                  "filter",
                  JSON.stringify({
                    principal_organization_id: principalId,
                    "deleted_at@is": null,
                  })
                );
                navigate(`/opportunities?${params.toString()}`);
              }
            }}
          />
        </ChartWrapper>

        <ChartWrapper title="Rep Performance" isLoading={isFirstLoad}>
          <RepPerformanceChart
            data={repPerformanceData}
            onBarClick={(_name, repId) => {
              if (repId) {
                const params = new URLSearchParams();
                params.set("filter", JSON.stringify({ created_by: repId }));
                navigate(`/activities?${params.toString()}`);
              }
            }}
          />
        </ChartWrapper>
      </div>
    </div>
  );
}
