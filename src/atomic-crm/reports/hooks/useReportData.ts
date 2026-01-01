import { useState, useEffect, useMemo, useCallback } from "react";
import { useDataProvider, type RaRecord } from "react-admin";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface UseReportDataOptions {
  /** Date range for filtering records */
  dateRange?: DateRange;
  /** Filter by sales rep ID */
  salesRepId?: string | null;
  /** Additional filters to merge with date/rep filters */
  additionalFilters?: Record<string, unknown>;
  /** Field to use for date filtering (default: "created_at") */
  dateField?: string;
}

interface UseReportDataResult<T> {
  /** Fetched data array */
  data: T[];
  /** Loading state */
  isLoading: boolean;
  /** Error if request failed (fail-fast, no retry) */
  error: Error | null;
  /** Trigger a refetch */
  refetch: () => void;
}

/**
 * Custom hook for fetching report data through React Admin's data provider.
 *
 * Addresses audit finding A1: Centralizes data access instead of direct useGetList calls.
 * This ensures all report data flows through unifiedDataProvider for consistent
 * validation, error handling, and soft-delete filtering.
 *
 * Engineering Constitution Alignment:
 * - Single Entry Point: Uses useDataProvider (not direct Supabase)
 * - Fail-Fast: Errors surface immediately, no retry logic
 * - Type Safety: Generic constraint extends RaRecord
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReportData<Opportunity>("opportunities", {
 *   dateRange: { start: startDate, end: endDate },
 *   salesRepId: selectedRepId,
 *   additionalFilters: { "deleted_at@is": null },
 * });
 * ```
 */
export function useReportData<T extends RaRecord>(
  resource: string,
  options: UseReportDataOptions = {}
): UseReportDataResult<T> {
  const dataProvider = useDataProvider();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { dateRange, salesRepId, additionalFilters, dateField = "created_at" } = options;

  // Memoize filter object to prevent infinite re-render loops
  // This is critical - without memoization, a new filter object is created
  // on every render, causing useEffect to re-run infinitely
  const filter = useMemo(() => {
    const baseFilter: Record<string, unknown> = { ...additionalFilters };

    if (dateRange?.start) {
      baseFilter[`${dateField}@gte`] = dateRange.start.toISOString();
    }
    if (dateRange?.end) {
      baseFilter[`${dateField}@lte`] = dateRange.end.toISOString();
    }
    if (salesRepId) {
      baseFilter.sales_id = salesRepId;
    }

    return baseFilter;
  }, [
    dateRange?.start?.getTime(),
    dateRange?.end?.getTime(),
    salesRepId,
    dateField,
    // Stringify additionalFilters for stable comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(additionalFilters),
  ]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    dataProvider
      .getList<T>(resource, {
        /*
         * Technical Debt (A2): perPage: 10000 is unbounded pagination.
         *
         * Current scale: 6 reps, 9 principals, ~500 opportunities - acceptable.
         *
         * Future optimization needed when:
         * - Data exceeds 10K records
         * - Page load time exceeds 2 seconds
         *
         * Options for future:
         * 1. Edge Function for server-side aggregation
         * 2. Cursor-based pagination with client aggregation
         * 3. Materialized views for pre-computed metrics
         *
         * See: docs/reports-audit/04-component-spec.md for details
         */
        pagination: { page: 1, perPage: 10000 },
        sort: { field: "id", order: "DESC" },
        filter,
      })
      .then((result) => {
        if (!cancelled) {
          setData(result.data);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          // Fail-fast: surface error immediately, no retry logic
          // This aligns with CLAUDE.md principle: errors should be visible, not hidden
          setError(err);
          setIsLoading(false);
          console.error(`[useReportData] Failed to fetch ${resource}:`, err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dataProvider, resource, filter, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((n) => n + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
