import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { startOfWeek, endOfWeek, startOfDay } from "date-fns";
import { useCurrentSale } from "./useCurrentSale";
import {
  STAGE_STALE_THRESHOLDS,
  isOpportunityStale,
} from "@/atomic-crm/utils/stalenessCalculation";

// Re-export for backward compatibility
export { STAGE_STALE_THRESHOLDS };

/**
 * KPI Metrics for Dashboard Summary Header (PRD v1.9)
 *
 * Fetches aggregated metrics in parallel for:
 * 1. Open Opportunities - count of non-closed opportunities (not $ value per Decision #5)
 * 2. Overdue Tasks - count of incomplete tasks past due date
 * 3. Activities This Week - count of activities in current week
 * 4. Stale Deals - count of deals exceeding per-stage thresholds (PRD Section 6.3)
 *
 * Per-Stage Stale Thresholds (days without activity):
 * - new_lead: 7 days
 * - initial_outreach: 14 days
 * - sample_visit_offered: 14 days
 * - feedback_logged: 21 days
 * - demo_scheduled: 14 days
 * - closed_won/closed_lost: N/A (excluded)
 *
 * Design decisions:
 * - Uses Promise.allSettled for resilient parallel fetching
 * - Individual metric errors don't fail entire dashboard
 * - Optimistic empty state while loading
 * - Staleness calculation extracted to shared utility for reuse
 */

export interface KPIMetrics {
  openOpportunitiesCount: number;
  overdueTasksCount: number;
  activitiesThisWeek: number;
  staleDealsCount: number;
}

interface UseKPIMetricsReturn {
  metrics: KPIMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Stable default metrics to avoid new reference on each render
const DEFAULT_METRICS: KPIMetrics = {
  openOpportunitiesCount: 0,
  overdueTasksCount: 0,
  activitiesThisWeek: 0,
  staleDealsCount: 0,
};

export function useKPIMetrics(): UseKPIMetricsReturn {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [metrics, setMetrics] = useState<KPIMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Track previous salesId to avoid unnecessary fetches
  const prevSalesIdRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Wait for sales data to load
      if (salesLoading) {
        return;
      }

      if (!salesId) {
        // No user - show empty metrics
        if (prevSalesIdRef.current !== null) {
          setMetrics(DEFAULT_METRICS);
          prevSalesIdRef.current = null;
        }
        setLoading(false);
        return;
      }

      prevSalesIdRef.current = salesId;

      try {
        setLoading(true);
        setError(null);

        const today = startOfDay(new Date());
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

        // Fetch all metrics in parallel using Promise.allSettled
        // This ensures partial failures don't break the entire dashboard
        const [
          opportunitiesResult,
          tasksResult,
          activitiesResult,
        ] = await Promise.allSettled([
          // 1. Open opportunities with amounts
          dataProvider.getList("opportunities", {
            filter: {
              // Exclude closed stages
              "stage@not_in": ["closed_won", "closed_lost"],
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1000 }, // Get all for aggregation
          }),

          // 2. Overdue tasks (incomplete and past due)
          dataProvider.getList("tasks", {
            filter: {
              sales_id: salesId,
              completed: false,
              "due_date@lt": today.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // 3. Activities this week
          dataProvider.getList("activities", {
            filter: {
              "activity_date@gte": weekStart.toISOString(),
              "activity_date@lte": weekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),
        ]);

        // Process results, using 0 for failed requests
        let openOpportunitiesCount = 0;
        let staleDealsCount = 0;
        let overdueTasksCount = 0;
        let activitiesThisWeek = 0;

        if (opportunitiesResult.status === "fulfilled") {
          const opportunities = opportunitiesResult.value.data;
          openOpportunitiesCount = opportunities.length;

          // Calculate stale deals based on per-stage thresholds (PRD Section 6.3)
          staleDealsCount = opportunities.filter(
            (opp: { stage: string; last_activity_date?: string | null }) =>
              isOpportunityStale(opp.stage, opp.last_activity_date ?? null, today)
          ).length;
        } else {
          console.error("Failed to fetch opportunities:", opportunitiesResult.reason);
        }

        if (tasksResult.status === "fulfilled") {
          overdueTasksCount = tasksResult.value.total || 0;
        } else {
          console.error("Failed to fetch tasks:", tasksResult.reason);
        }

        if (activitiesResult.status === "fulfilled") {
          activitiesThisWeek = activitiesResult.value.total || 0;
        } else {
          console.error("Failed to fetch activities:", activitiesResult.reason);
        }

        setMetrics({
          openOpportunitiesCount,
          overdueTasksCount,
          activitiesThisWeek,
          staleDealsCount,
        });
      } catch (err) {
        console.error("Failed to fetch KPI metrics:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dataProvider, salesId, salesLoading, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { metrics, loading, error, refetch };
}
