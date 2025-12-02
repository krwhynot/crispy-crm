import { useState, useMemo, useCallback } from "react";
import { useGetList } from "ra-core";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Activity, AlertCircle, Clock } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { ChartWrapper } from "../components/ChartWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { TabFilterBar } from "../components/TabFilterBar";
import { PipelineChart } from "../charts/PipelineChart";
import { ActivityTrendChart } from "../charts/ActivityTrendChart";
import { TopPrincipalsChart } from "../charts/TopPrincipalsChart";
import { RepPerformanceChart } from "../charts/RepPerformanceChart";
import { OPPORTUNITY_STAGE_CHOICES } from "../../opportunities/constants/stageConstants";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import "../charts/chartSetup";
import type { Sale } from "../types";
import {
  isOpportunityStale,
  countStaleOpportunities,
  STAGE_STALE_THRESHOLDS,
} from "@/atomic-crm/utils/stalenessCalculation";

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
        stage: "new_lead",
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

  // Fetch opportunities
  const { data: opportunities = [], isPending: opportunitiesPending } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "deleted_at@is": null,
        ...(salesRepId && { opportunity_owner_id: salesRepId }),
      },
    }
  );

  // Fetch activities for the date range (last 30 days for trends)
  // IMPORTANT: All dates must be memoized to prevent infinite re-render loops
  // Creating new Date().toISOString() on each render causes useGetList to re-fetch infinitely
  const now = useMemo(() => new Date().toISOString(), []);
  const _thirtyDaysAgo = useMemo(() => subDays(new Date(), 30).toISOString(), []); // Kept for future use
  const sixtyDaysAgo = useMemo(() => subDays(new Date(), 60).toISOString(), []);

  const { data: activities = [], isPending: activitiesPending } = useGetList<ActivityRecord>(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "created_at@gte": sixtyDaysAgo, // Get 60 days for comparison
        "created_at@lte": now,
        ...(salesRepId && { created_by: salesRepId }),
      },
    }
  );

  // Fetch sales reps for rep performance
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
  });

  const salesMap = useMemo(
    () => new Map(salesReps.map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Calculate KPIs with real trend percentages
  const kpis = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);
    const thirtyDaysAgoDate = subDays(now, 30);
    const sixtyDaysAgoDate = subDays(now, 60);

    // Current week activities
    const currentWeekActivities = activities.filter((a) => {
      const date = new Date(a.created_at);
      return date >= weekAgo;
    }).length;

    // Previous week activities (for comparison)
    const previousWeekActivities = activities.filter((a) => {
      const date = new Date(a.created_at);
      return date >= twoWeeksAgo && date < weekAgo;
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

    // Current period opportunities (last 30 days)
    const currentOpportunities = opportunities.length;

    // Calculate opportunity trend (compare to nothing since we can't see historical counts)
    // For now, we'll base trend on activity in last 30 days
    const recentActiveOpps = opportunities.filter((opp) => {
      if (!opp.last_activity_at) return false;
      const activityDate = new Date(opp.last_activity_at);
      return activityDate >= thirtyDaysAgoDate;
    }).length;

    const olderActiveOpps = opportunities.filter((opp) => {
      if (!opp.last_activity_at) return false;
      const activityDate = new Date(opp.last_activity_at);
      return activityDate >= sixtyDaysAgoDate && activityDate < thirtyDaysAgoDate;
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
    const staleLeads = opportunities.filter((opp) => {
      const isLead = opp.stage === "Lead" || opp.stage === "new_lead";
      if (!isLead) return false;
      return isOpportunityStale(opp.stage, opp.last_activity_at ?? null, now);
    }).length;

    // Stale Deals - all opportunities exceeding STAGE_STALE_THRESHOLDS (PRD Section 9.2.1 KPI #4)
    // Per-stage thresholds from STAGE_STALE_THRESHOLDS: new_lead=7d, initial_outreach=14d,
    // sample_visit_offered=14d, feedback_logged=21d, demo_scheduled=14d
    const staleDeals = countStaleOpportunities(opportunities, now);

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
    const stageCounts = OPPORTUNITY_STAGE_CHOICES.map((stage) => ({
      stage: stage.name,
      count: opportunities.filter((o) => o.stage === stage.id).length,
    }));
    return stageCounts.filter((s) => s.count > 0);
  }, [opportunities]);

  // Prepare activity trend data (last 14 days)
  const activityTrendData = useMemo(() => {
    const now = new Date();
    const fourteenDaysAgo = subDays(now, 13); // 14 days including today

    const days = eachDayOfInterval({ start: startOfDay(fourteenDaysAgo), end: startOfDay(now) });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = activities.filter((a) => {
        const activityDate = format(new Date(a.created_at), "yyyy-MM-dd");
        return activityDate === dayStr;
      }).length;

      return {
        date: format(day, "MMM d"),
        count,
      };
    });
  }, [activities]);

  // Prepare top principals data
  const topPrincipalsData = useMemo(() => {
    const principalCounts = new Map<string, { name: string; count: number }>();

    opportunities.forEach((opp) => {
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
    const repStats = new Map<number, { name: string; activities: number; opportunities: number }>();

    // Count activities per rep
    activities.forEach((activity) => {
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
    opportunities.forEach((opp) => {
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

  const isLoading = opportunitiesPending || activitiesPending;

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

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          <KPICard
            title="Total Opportunities"
            value={kpis.totalOpportunities}
            change={kpis.opportunityChange}
            trend={kpis.opportunityTrend}
            icon={TrendingUp}
            subtitle="Active opportunities in pipeline"
            onClick={handleTotalOpportunitiesClick}
          />
          <KPICard
            title="Activities This Week"
            value={kpis.weekActivities}
            change={kpis.activityChange}
            trend={kpis.activityTrend}
            icon={Activity}
            subtitle="Calls, emails, meetings logged"
            onClick={handleActivitiesClick}
          />
          <KPICard
            title="Stale Leads"
            value={kpis.staleLeads}
            change={0}
            trend="neutral"
            icon={AlertCircle}
            subtitle={`New leads with no activity in ${STAGE_STALE_THRESHOLDS.new_lead}+ days`}
            onClick={handleStaleLeadsClick}
          />
          {/* KPI #4: Stale Deals with amber/warning styling (PRD Section 9.2.1) */}
          <KPICard
            title="Stale Deals"
            value={kpis.staleDeals}
            change={0}
            trend="neutral"
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
