import { useMemo } from "react";
import { useGetList } from "react-admin";
import { useCurrentSale } from "./useCurrentSale";
import type { PrincipalPipelineRow, PipelineSummaryRow } from "./types";
import { devLog } from "@/lib/devLogger";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants/appConstants";

// Stable empty array to avoid new reference creation on each render
const EMPTY_PIPELINE: PrincipalPipelineRow[] = [];

export function usePrincipalPipeline(filters?: { myPrincipalsOnly?: boolean }) {
  const { salesId, loading: salesIdLoading } = useCurrentSale();

  // Build query filter
  const queryFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (filters?.myPrincipalsOnly && salesId) {
      filter.sales_id = salesId;

      // Debug logging for B1 filtering investigation
      if (import.meta.env.DEV) {
        devLog("usePrincipalPipeline", "Filtering by sales_id", salesId);
      }
    }
    return filter;
  }, [filters?.myPrincipalsOnly, salesId]);

  // Determine if query should be enabled
  // Wait for salesId to load if "my principals only" filter is active
  // If "my principals only" but no salesId, disable query (show empty)
  const enabled = !salesIdLoading && (!filters?.myPrincipalsOnly || !!salesId);

  // Fetch principal pipeline summary with React Admin's useGetList
  const {
    data: rawSummary = [],
    isPending: loading,
    error: queryError,
  } = useGetList<PipelineSummaryRow>(
    "principal_pipeline_summary",
    {
      filter: queryFilter,
      sort: { field: "active_this_week", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    {
      enabled,
      staleTime: SHORT_STALE_TIME_MS, // 30 seconds for dashboard data
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // Transform data to PrincipalPipelineRow format
  const data = useMemo(() => {
    // If "my principals only" but no salesId, show empty
    if (filters?.myPrincipalsOnly && !salesId) {
      return EMPTY_PIPELINE;
    }

    // Debug logging for B1 filtering investigation
    if (import.meta.env.DEV && filters?.myPrincipalsOnly) {
      devLog("usePrincipalPipeline", "Filter results", {
        salesId,
        resultCount: rawSummary.length,
        firstFewSalesIds: rawSummary.slice(0, 5).map((r) => r.sales_id),
      });
    }

    return rawSummary.map((row) => ({
      id: row.principal_id,
      name: row.principal_name,
      totalPipeline: row.total_pipeline,
      activeThisWeek: row.active_this_week,
      activeLastWeek: row.active_last_week,
      momentum: row.momentum as PrincipalPipelineRow["momentum"],
      nextAction: row.next_action_summary,
    }));
  }, [rawSummary, salesId, filters?.myPrincipalsOnly]);

  // Convert error to Error type for consistent interface
  const error = queryError ? new Error(String(queryError)) : null;

  return { data, loading, error };
}
