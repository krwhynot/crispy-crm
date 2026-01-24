import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { startOfWeek, endOfWeek, subWeeks, startOfDay } from "date-fns";
import { useCurrentSale } from "./useCurrentSale";
import { CLOSED_STAGES } from "@/atomic-crm/opportunities/constants";

/**
 * My Performance Metrics for Dashboard Widget (PRD v1.18)
 *
 * Fetches user-specific performance metrics with week-over-week trends:
 * 1. Activities This Week - count logged by current user
 * 2. Deals Moved - opportunities with stage changes this week
 * 3. Tasks Completed - count completed by current user this week
 * 4. Open Opportunities - count owned by current user
 *
 * Trends calculated by comparing current week to previous week.
 * Uses Promise.allSettled for resilient parallel fetching.
 */

export interface PerformanceMetric {
  /** Current period value */
  value: number;
  /** Previous period value for trend calculation */
  previousValue: number;
  /** Percentage change from previous period */
  trend: number;
  /** Direction indicator for styling */
  direction: "up" | "down" | "flat";
}

export interface MyPerformanceMetrics {
  activitiesThisWeek: PerformanceMetric;
  dealsMoved: PerformanceMetric;
  tasksCompleted: PerformanceMetric;
  openOpportunities: PerformanceMetric;
}

interface UseMyPerformanceReturn {
  metrics: MyPerformanceMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Calculate trend direction and percentage
 */
function calculateTrend(
  current: number,
  previous: number
): Pick<PerformanceMetric, "trend" | "direction"> {
  if (previous === 0) {
    // Avoid division by zero - show flat or positive if we have current activity
    return {
      trend: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "flat",
    };
  }

  const percentChange = ((current - previous) / previous) * 100;

  return {
    trend: Math.round(percentChange),
    direction: percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat",
  };
}

/**
 * Create a metric object with trend data
 */
function createMetric(current: number, previous: number): PerformanceMetric {
  const { trend, direction } = calculateTrend(current, previous);
  return {
    value: current,
    previousValue: previous,
    trend,
    direction,
  };
}

// Stable default metrics to avoid new reference on each render
const DEFAULT_METRICS: MyPerformanceMetrics = {
  activitiesThisWeek: { value: 0, previousValue: 0, trend: 0, direction: "flat" },
  dealsMoved: { value: 0, previousValue: 0, trend: 0, direction: "flat" },
  tasksCompleted: { value: 0, previousValue: 0, trend: 0, direction: "flat" },
  openOpportunities: { value: 0, previousValue: 0, trend: 0, direction: "flat" },
};

export function useMyPerformance(): UseMyPerformanceReturn {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [metrics, setMetrics] = useState<MyPerformanceMetrics>(DEFAULT_METRICS);
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
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        const lastWeekStart = subWeeks(thisWeekStart, 1);
        const lastWeekEnd = subWeeks(thisWeekEnd, 1);

        // Fetch all metrics in parallel using Promise.allSettled
        // This ensures partial failures don't break the entire widget
        const [
          // Current week data
          activitiesThisWeekResult,
          tasksCompletedThisWeekResult,
          dealsMovedThisWeekResult,
          openOpportunitiesResult,
          // Previous week data (for trends)
          activitiesLastWeekResult,
          tasksCompletedLastWeekResult,
          dealsMovedLastWeekResult,
          openOpportunitiesLastWeekResult,
        ] = await Promise.allSettled([
          // 1. Activities this week (by current user)
          // Note: activities table uses created_by, not sales_id
          dataProvider.getList("activities", {
            filter: {
              created_by: salesId,
              "activity_date@gte": thisWeekStart.toISOString(),
              "activity_date@lte": thisWeekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // 2. Tasks completed this week (by current user)
          dataProvider.getList("tasks", {
            filter: {
              sales_id: salesId,
              completed: true,
              "completed_at@gte": thisWeekStart.toISOString(),
              "completed_at@lte": thisWeekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // 3. Deals moved this week (stage changes by current user)
          // We check for opportunities updated this week that aren't closed
          // Note: opportunities table uses opportunity_owner_id, not sales_id
          dataProvider.getList("opportunities", {
            filter: {
              opportunity_owner_id: salesId,
              "updated_at@gte": thisWeekStart.toISOString(),
              "updated_at@lte": thisWeekEnd.toISOString(),
              "stage@not_in": [...CLOSED_STAGES],
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // 4. Open opportunities (by current user)
          // Note: opportunities table uses opportunity_owner_id, not sales_id
          dataProvider.getList("opportunities", {
            filter: {
              opportunity_owner_id: salesId,
              "stage@not_in": [...CLOSED_STAGES],
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // Previous week comparisons
          // 5. Activities last week
          // Note: activities table uses created_by, not sales_id
          dataProvider.getList("activities", {
            filter: {
              created_by: salesId,
              "activity_date@gte": lastWeekStart.toISOString(),
              "activity_date@lte": lastWeekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 },
          }),

          // 6. Tasks completed last week
          dataProvider.getList("tasks", {
            filter: {
              sales_id: salesId,
              completed: true,
              "completed_at@gte": lastWeekStart.toISOString(),
              "completed_at@lte": lastWeekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 },
          }),

          // 7. Deals moved last week
          // Note: opportunities table uses opportunity_owner_id, not sales_id
          dataProvider.getList("opportunities", {
            filter: {
              opportunity_owner_id: salesId,
              "updated_at@gte": lastWeekStart.toISOString(),
              "updated_at@lte": lastWeekEnd.toISOString(),
              "stage@not_in": [...CLOSED_STAGES],
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 },
          }),

          // 8. Historical snapshot from last week
          // Query dashboard_snapshots table for accurate week-over-week comparison
          dataProvider.getList("dashboard_snapshots", {
            filter: {
              sales_id: salesId,
              snapshot_date: lastWeekEnd.toISOString().split("T")[0], // Date only
            },
            sort: { field: "id", order: "DESC" },
            pagination: { page: 1, perPage: 1 },
          }),
        ]);

        // Extract counts from results, using 0 for failures
        const getCount = (result: PromiseSettledResult<{ total?: number }>): number => {
          if (result.status === "fulfilled") {
            return result.value.total || 0;
          }
          return 0;
        };

        const activitiesThisWeek = getCount(activitiesThisWeekResult);
        const activitiesLastWeek = getCount(activitiesLastWeekResult);
        const tasksCompletedThisWeek = getCount(tasksCompletedThisWeekResult);
        const tasksCompletedLastWeek = getCount(tasksCompletedLastWeekResult);
        const dealsMovedThisWeek = getCount(dealsMovedThisWeekResult);
        const dealsMovedLastWeek = getCount(dealsMovedLastWeekResult);
        const openOpportunities = getCount(openOpportunitiesResult);

        // Extract historical snapshot data for open opportunities
        let openOpportunitiesLastWeek = openOpportunities; // Fallback to current count
        if (openOpportunitiesLastWeekResult.status === "fulfilled") {
          const snapshot = openOpportunitiesLastWeekResult.value.data?.[0];
          if (snapshot && typeof snapshot.open_opportunities_count === "number") {
            openOpportunitiesLastWeek = snapshot.open_opportunities_count;
          }
        }

        // Log any failures for debugging
        [
          activitiesThisWeekResult,
          tasksCompletedThisWeekResult,
          dealsMovedThisWeekResult,
          openOpportunitiesResult,
        ].forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`Failed to fetch metric ${index}:`, result.reason);
          }
        });

        setMetrics({
          activitiesThisWeek: createMetric(activitiesThisWeek, activitiesLastWeek),
          tasksCompleted: createMetric(tasksCompletedThisWeek, tasksCompletedLastWeek),
          dealsMoved: createMetric(dealsMovedThisWeek, dealsMovedLastWeek),
          openOpportunities: createMetric(openOpportunities, openOpportunitiesLastWeek),
        });
      } catch (error: unknown) {
        console.error(
          "Failed to fetch performance metrics:",
          error instanceof Error ? error.message : String(error)
        );
        setError(error instanceof Error ? error : new Error(String(error)));
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
