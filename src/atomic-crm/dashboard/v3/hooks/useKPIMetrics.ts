import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { startOfWeek, endOfWeek, isBefore, startOfDay } from "date-fns";
import { useCurrentSale } from "./useCurrentSale";

/**
 * KPI Metrics for Dashboard Summary Header
 *
 * Fetches aggregated metrics in parallel for:
 * 1. Total Pipeline Value - sum of open opportunities (not closed_won/closed_lost)
 * 2. Overdue Tasks - count of incomplete tasks past due date
 * 3. Activities This Week - count of activities in current week
 * 4. Open Opportunities - count of non-closed opportunities
 *
 * Design decisions:
 * - Uses Promise.allSettled for resilient parallel fetching
 * - Individual metric errors don't fail entire dashboard
 * - Optimistic empty state while loading
 */

export interface KPIMetrics {
  totalPipelineValue: number;
  overdueTasksCount: number;
  activitiesThisWeek: number;
  openOpportunitiesCount: number;
}

interface UseKPIMetricsReturn {
  metrics: KPIMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Stable default metrics to avoid new reference on each render
const DEFAULT_METRICS: KPIMetrics = {
  totalPipelineValue: 0,
  overdueTasksCount: 0,
  activitiesThisWeek: 0,
  openOpportunitiesCount: 0,
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
        let totalPipelineValue = 0;
        let openOpportunitiesCount = 0;
        let overdueTasksCount = 0;
        let activitiesThisWeek = 0;

        if (opportunitiesResult.status === "fulfilled") {
          const opportunities = opportunitiesResult.value.data;
          openOpportunitiesCount = opportunities.length;
          totalPipelineValue = opportunities.reduce(
            (sum: number, opp: { amount?: number }) => sum + (opp.amount || 0),
            0
          );
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
          totalPipelineValue,
          overdueTasksCount,
          activitiesThisWeek,
          openOpportunitiesCount,
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
