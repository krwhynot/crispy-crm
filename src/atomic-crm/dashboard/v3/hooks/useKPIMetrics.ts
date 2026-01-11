import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { startOfWeek, endOfWeek, startOfDay, subDays } from "date-fns";
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
  openOpportunitiesCount: number;
  overdueTasksCount: number;
  activitiesThisWeek: number;
  staleDealsCount: number;
}

interface UseKPIMetricsReturn {
  metrics: KPIMetrics;
  loading: boolean;
  error: Error | null;
  errorMessage: string | null;
  hasPartialFailure: boolean;
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

        const today = startOfDay(new Date());
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

        // OPTIMIZATION: Use server-side total for simple counts
        // Only fetch full data for stale deals which requires client-side calculation
        // Maximum stale threshold is 21 days, so we only need opportunities with
        // last_activity_date older than 21 days ago (potential stale candidates)
        const staleThresholdDate = subDays(today, 21);

        // Fetch all metrics in parallel using Promise.allSettled
        // This ensures partial failures don't break the entire dashboard
        const [openCountResult, staleOpportunitiesResult, tasksResult, activitiesResult] =
          await Promise.allSettled([
            // 1. Open opportunities COUNT ONLY (server-side total)
            // OPTIMIZATION: perPage: 1 uses server-side count, avoiding full data transfer
            dataProvider.getList("opportunities", {
              filter: {
                "stage@not_in": ["closed_won", "closed_lost"],
              },
              sort: { field: "id", order: "ASC" },
              pagination: { page: 1, perPage: 1 }, // Server-side count only
            }),

            // 2. Potentially stale opportunities (for client-side staleness calculation)
            // OPTIMIZATION: Only fetch opportunities that MIGHT be stale (no activity in 21+ days)
            // This reduces data transfer from ~1000 rows to ~50-100 rows typically
            dataProvider.getList("opportunities", {
              filter: {
                "stage@not_in": ["closed_won", "closed_lost"],
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
          ]);

        // Check if aborted before processing results
        if (abortController.signal.aborted || !isMounted) return;

        // Process results, using 0 for failed requests
        let openOpportunitiesCount = 0;
        let staleDealsCount = 0;
        let overdueTasksCount = 0;
        let activitiesThisWeek = 0;

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
          console.error("Failed to fetch open opportunities count:", openCountResult.reason);
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
          console.error("Failed to fetch stale opportunities:", staleOpportunitiesResult.reason);
        }

        if (tasksResult.status === "fulfilled") {
          overdueTasksCount = tasksResult.value.total || 0;
        } else {
          const reason =
            tasksResult.reason instanceof Error
              ? tasksResult.reason.message
              : String(tasksResult.reason);
          errors.push(`Overdue tasks: ${reason}`);
          console.error("Failed to fetch tasks:", tasksResult.reason);
        }

        if (activitiesResult.status === "fulfilled") {
          activitiesThisWeek = activitiesResult.value.total || 0;
        } else {
          const reason =
            activitiesResult.reason instanceof Error
              ? activitiesResult.reason.message
              : String(activitiesResult.reason);
          errors.push(`Activities: ${reason}`);
          console.error("Failed to fetch activities:", activitiesResult.reason);
        }

        if (isMounted) {
          setMetrics({
            openOpportunitiesCount,
            overdueTasksCount,
            activitiesThisWeek,
            staleDealsCount,
          });
          // Set error state based on accumulated errors
          setErrorMessage(errors.length > 0 ? errors.join("; ") : null);
          setHasPartialFailure(errors.length > 0 && errors.length < 4);
        }
      } catch (error: unknown) {
        // Don't log or set error if aborted
        if (abortController.signal.aborted) return;
        console.error(
          "Failed to fetch KPI metrics:",
          error instanceof Error ? error.message : String(error)
        );
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

  return { metrics, loading, error, refetch };
}
