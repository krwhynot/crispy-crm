import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { subDays } from "date-fns";
import { getWeekBoundaries } from "@/atomic-crm/utils/dateUtils";
import { useCurrentSale } from "./useCurrentSale";
import {
  STAGE_STALE_THRESHOLDS,
  isOpportunityStale,
} from "@/atomic-crm/utils/stalenessCalculation";
import { CLOSED_STAGES } from "@/atomic-crm/opportunities/constants";
import { calculateTrend } from "@/atomic-crm/utils/trendCalculation";

// Re-export for backward compatibility
export { STAGE_STALE_THRESHOLDS };

/**
 * KPI Metrics for Dashboard Summary Header (PRD v1.9)
 *
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * 1. Uses server-side `total` from pagination for simple counts
 * 2. Only fetches full data when client-side calculation needed (stale deals)
 * 3. AbortController prevents state updates on unmounted components
 * 4. Uses cached salesId from CurrentSaleProvider context
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
  openOpportunitiesCount: number | null;
  overdueTasksCount: number | null;
  activitiesThisWeek: number | null;
  staleDealsCount: number | null;
  recentActivityCount: number | null;
}

export interface KPITrend {
  value: number;
  direction: "up" | "down" | "neutral";
}

export interface KPITrends {
  activitiesThisWeek: KPITrend | null;
}

interface UseKPIMetricsReturn {
  metrics: KPIMetrics;
  trends: KPITrends;
  loading: boolean;
  error: Error | null;
  errorMessage: string | null;
  hasPartialFailure: boolean;
  refetch: () => void;
}

// Stable default metrics to avoid new reference on each render
// G1 guardrail: null = unknown/not-yet-loaded, 0 = confirmed zero
const DEFAULT_METRICS: KPIMetrics = {
  openOpportunitiesCount: null,
  overdueTasksCount: null,
  activitiesThisWeek: null,
  staleDealsCount: null,
  recentActivityCount: null,
};

const DEFAULT_TRENDS: KPITrends = {
  activitiesThisWeek: null,
};

export function useKPIMetrics(): UseKPIMetricsReturn {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [metrics, setMetrics] = useState<KPIMetrics>(DEFAULT_METRICS);
  const [trends, setTrends] = useState<KPITrends>(DEFAULT_TRENDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPartialFailure, setHasPartialFailure] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Track previous salesId to avoid unnecessary fetches
  const prevSalesIdRef = useRef<number | null>(null);

  useEffect(() => {
    // AbortController for cleanup - prevents state updates on unmounted component
    const abortController = new AbortController();
    let isMounted = true;

    const fetchMetrics = async () => {
      // Wait for sales data to load
      if (salesLoading) {
        return;
      }

      if (!salesId) {
        // No user - show empty metrics
        if (prevSalesIdRef.current !== null && isMounted) {
          setMetrics(DEFAULT_METRICS);
          prevSalesIdRef.current = null;
        }
        if (isMounted) setLoading(false);
        return;
      }

      prevSalesIdRef.current = salesId;

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Check if aborted before making requests
        if (abortController.signal.aborted) return;

        const {
          today,
          thisWeekStart: weekStart,
          thisWeekEnd: weekEnd,
          lastWeekStart,
          lastWeekEnd,
        } = getWeekBoundaries();

        // OPTIMIZATION: Use server-side total for simple counts
        // Only fetch full data for stale deals which requires client-side calculation
        // Maximum stale threshold is 21 days, so we only need opportunities with
        // last_activity_date older than 21 days ago (potential stale candidates)
        const staleThresholdDate = subDays(today, 21);
        const recentActivityCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

        // Fetch all metrics in parallel using Promise.allSettled
        // This ensures partial failures don't break the entire dashboard
        const [
          openCountResult,
          staleOpportunitiesResult,
          tasksResult,
          activitiesResult,
          lastWeekActivitiesResult,
          recentActivitiesResult,
        ] = await Promise.allSettled([
          // 1. Open opportunities COUNT ONLY (server-side total)
          // OPTIMIZATION: perPage: 1 uses server-side count, avoiding full data transfer
          dataProvider.getList("opportunities", {
            filter: {
              "stage@not_in": [...CLOSED_STAGES],
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Server-side count only
          }),

          // 2. Potentially stale opportunities (for client-side staleness calculation)
          // OPTIMIZATION: Only fetch opportunities that MIGHT be stale (no activity in 21+ days)
          // This reduces data transfer from ~1000 rows to ~50-100 rows typically
          dataProvider.getList("opportunities", {
            filter: {
              "stage@not_in": [...CLOSED_STAGES],
              "last_activity_date@lt": staleThresholdDate.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 500 }, // Only stale candidates
          }),

          // 3. Overdue tasks COUNT ONLY (server-side total)
          dataProvider.getList("tasks", {
            filter: {
              sales_id: salesId,
              completed: false,
              "due_date@lt": today.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Server-side count only
          }),

          // 4. Activities this week COUNT ONLY (server-side total)
          dataProvider.getList("activities", {
            filter: {
              "activity_date@gte": weekStart.toISOString(),
              "activity_date@lte": weekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Server-side count only
          }),

          // 5. Activities LAST week COUNT ONLY (for trend calculation)
          dataProvider.getList("activities", {
            filter: {
              "activity_date@gte": lastWeekStart.toISOString(),
              "activity_date@lte": lastWeekEnd.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Server-side count only
          }),

          // 6. Recent activities COUNT ONLY (last 1 hour, for KPI alert subtitle)
          dataProvider.getList("activities", {
            filter: {
              "activity_date@gte": recentActivityCutoff.toISOString(),
            },
            sort: { field: "id", order: "ASC" },
            pagination: { page: 1, perPage: 1 }, // Server-side count only
          }),
        ]);

        // Check if aborted before processing results
        if (abortController.signal.aborted || !isMounted) return;

        // G1 guardrail: null = query failed (unknown), never silently default to 0
        let openOpportunitiesCount: number | null = null;
        let staleDealsCount: number | null = null;
        let overdueTasksCount: number | null = null;
        let activitiesThisWeek: number | null = null;
        let recentActivityCount: number | null = null;

        // Accumulate errors from rejected results
        const errors: string[] = [];

        // Use server-side total for open opportunities count
        if (openCountResult.status === "fulfilled") {
          openOpportunitiesCount = openCountResult.value.total || 0;
        } else {
          const reason =
            openCountResult.reason instanceof Error
              ? openCountResult.reason.message
              : String(openCountResult.reason);
          errors.push(`Open opportunities: ${reason}`);
          logger.error("Failed to fetch open opportunities count", openCountResult.reason, {
            feature: "useKPIMetrics",
          });
        }

        // Calculate stale deals from potentially stale candidates
        if (staleOpportunitiesResult.status === "fulfilled") {
          const potentiallyStale = staleOpportunitiesResult.value.data;
          // Apply per-stage threshold logic to filter actual stale deals
          staleDealsCount = potentiallyStale.filter(
            (opp: { stage: string; last_activity_date?: string | null }) =>
              isOpportunityStale(opp.stage, opp.last_activity_date ?? null, today)
          ).length;
        } else {
          const reason =
            staleOpportunitiesResult.reason instanceof Error
              ? staleOpportunitiesResult.reason.message
              : String(staleOpportunitiesResult.reason);
          errors.push(`Stale opportunities: ${reason}`);
          logger.error("Failed to fetch stale opportunities", staleOpportunitiesResult.reason, {
            feature: "useKPIMetrics",
          });
        }

        if (tasksResult.status === "fulfilled") {
          overdueTasksCount = tasksResult.value.total || 0;
        } else {
          const reason =
            tasksResult.reason instanceof Error
              ? tasksResult.reason.message
              : String(tasksResult.reason);
          errors.push(`Overdue tasks: ${reason}`);
          logger.error("Failed to fetch tasks", tasksResult.reason, { feature: "useKPIMetrics" });
        }

        if (activitiesResult.status === "fulfilled") {
          activitiesThisWeek = activitiesResult.value.total || 0;
        } else {
          const reason =
            activitiesResult.reason instanceof Error
              ? activitiesResult.reason.message
              : String(activitiesResult.reason);
          errors.push(`Activities: ${reason}`);
          logger.error("Failed to fetch activities", activitiesResult.reason, {
            feature: "useKPIMetrics",
          });
        }

        // Recent activity count (last 1 hour) for KPI alert subtitle
        if (recentActivitiesResult.status === "fulfilled") {
          recentActivityCount = recentActivitiesResult.value.total || 0;
        } else {
          // Non-critical — don't add to errors array, just log
          logger.error("Failed to fetch recent activities count", recentActivitiesResult.reason, {
            feature: "useKPIMetrics",
          });
        }

        // Calculate trends from previous-period data
        let activitiesTrend: KPITrend | null = null;
        if (lastWeekActivitiesResult.status === "fulfilled" && activitiesThisWeek !== null) {
          const lastWeekCount = lastWeekActivitiesResult.value.total || 0;
          const result = calculateTrend(activitiesThisWeek, lastWeekCount);
          activitiesTrend = {
            value: Math.abs(result.trend),
            direction: result.direction === "flat" ? "neutral" : result.direction,
          };
        } else if (lastWeekActivitiesResult.status === "rejected") {
          logger.error(
            "Failed to fetch last week activities for trend",
            lastWeekActivitiesResult.reason,
            { feature: "useKPIMetrics" }
          );
        }

        if (isMounted) {
          setMetrics({
            openOpportunitiesCount,
            overdueTasksCount,
            activitiesThisWeek,
            staleDealsCount,
            recentActivityCount,
          });
          setTrends({
            activitiesThisWeek: activitiesTrend,
          });
          // Set error state based on accumulated errors
          setErrorMessage(errors.length > 0 ? errors.join("; ") : null);
          setHasPartialFailure(errors.length > 0 && errors.length < 4);
        }
      } catch (error: unknown) {
        // Don't log or set error if aborted
        if (abortController.signal.aborted) return;
        logger.error("Failed to fetch KPI metrics", error, { feature: "useKPIMetrics" });
        if (isMounted) setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();

    // Cleanup function - abort and mark unmounted
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [dataProvider, salesId, salesLoading, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { metrics, trends, loading, error, errorMessage, hasPartialFailure, refetch };
}
