import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { getWeekBoundaries } from "@/atomic-crm/utils/dateUtils";
import { useCurrentSale } from "./useCurrentSale";
import { CLOSED_STAGES } from "@/atomic-crm/opportunities/constants";
import { calculateTrend } from "@/atomic-crm/utils/trendCalculation";

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

// calculateTrend imported from @/atomic-crm/utils/trendCalculation

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

        const { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd } = getWeekBoundaries();

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

          // 3. Deals moved this week (actual stage transitions, not just any update)
          // Uses opportunity_stage_changes view which tracks real stage changes
          // Excludes initial creates (from_stage IS NULL) per audit decision Q3-P3=A
          dataProvider.getList("opportunity_stage_changes", {
            filter: {
              changed_by: salesId,
              "changed_at@gte": thisWeekStart.toISOString(),
              "changed_at@lte": thisWeekEnd.toISOString(),
              "from_stage@neq": null, // Exclude initial creates
            },
            sort: { field: "audit_id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Only need count
          }),

          // 4. Open opportunities (by current user - primary or secondary)
          // Note: opportunities table uses opportunity_owner_id and account_manager_id
          dataProvider.getList("opportunities", {
            filter: {
              $or: [{ opportunity_owner_id: salesId }, { account_manager_id: salesId }],
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

          // 7. Deals moved last week (actual stage transitions)
          dataProvider.getList("opportunity_stage_changes", {
            filter: {
              changed_by: salesId,
              "changed_at@gte": lastWeekStart.toISOString(),
              "changed_at@lte": lastWeekEnd.toISOString(),
              "from_stage@neq": null, // Exclude initial creates
            },
            sort: { field: "audit_id", order: "ASC" },
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
        const metricNames = ["activities", "tasksCompleted", "dealsMoved", "openOpportunities"];
        [
          activitiesThisWeekResult,
          tasksCompletedThisWeekResult,
          dealsMovedThisWeekResult,
          openOpportunitiesResult,
        ].forEach((result, index) => {
          if (result.status === "rejected") {
            logger.error(
              `Failed to fetch performance metric: ${metricNames[index]}`,
              result.reason,
              {
                feature: "useMyPerformance",
                metricIndex: index,
              }
            );
          }
        });

        setMetrics({
          activitiesThisWeek: createMetric(activitiesThisWeek, activitiesLastWeek),
          tasksCompleted: createMetric(tasksCompletedThisWeek, tasksCompletedLastWeek),
          dealsMoved: createMetric(dealsMovedThisWeek, dealsMovedLastWeek),
          openOpportunities: createMetric(openOpportunities, openOpportunitiesLastWeek),
        });
      } catch (error: unknown) {
        logger.error("Failed to fetch performance metrics", error, { feature: "useMyPerformance" });
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
