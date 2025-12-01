import { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { useCurrentSale } from "./useCurrentSale";
import type { PrincipalPipelineRow, PipelineSummaryRow } from "../types";

// Stable empty array to avoid new reference creation on each render
const EMPTY_PIPELINE: PrincipalPipelineRow[] = [];

export function usePrincipalPipeline(filters?: { myPrincipalsOnly?: boolean }) {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesIdLoading } = useCurrentSale();
  const [data, setData] = useState<PrincipalPipelineRow[]>(EMPTY_PIPELINE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track previous filter state to avoid unnecessary resets
  const prevFilterStateRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for salesId to load if "my principals only" filter is active
      if (filters?.myPrincipalsOnly && salesIdLoading) {
        setLoading((prev) => (prev ? prev : true));
        return;
      }

      // If "my principals only" but no salesId, show empty
      const currentFilterState = filters?.myPrincipalsOnly && !salesId ? "empty" : null;
      if (currentFilterState === "empty") {
        // Only update if filter state changed
        if (prevFilterStateRef.current !== "empty") {
          setData(EMPTY_PIPELINE);
          prevFilterStateRef.current = "empty";
        }
        setLoading(false);
        return;
      }
      prevFilterStateRef.current = null;

      try {
        setLoading(true);

        const queryFilter: Record<string, any> = {};

        // Apply sales_id filter if "my principals only" is enabled
        if (filters?.myPrincipalsOnly && salesId) {
          queryFilter.sales_id = salesId;

          // Debug logging for B1 filtering investigation
          if (import.meta.env.DEV) {
            console.log("[usePrincipalPipeline] Filtering by sales_id:", salesId);
          }
        }

        const { data: summary } = await dataProvider.getList("principal_pipeline_summary", {
          filter: queryFilter,
          sort: { field: "active_this_week", order: "DESC" },
          pagination: { page: 1, perPage: 100 },
        });

        // Debug logging for B1 filtering investigation
        if (import.meta.env.DEV && filters?.myPrincipalsOnly) {
          console.log("[usePrincipalPipeline] Filter results:", {
            salesId,
            resultCount: summary.length,
            firstFewSalesIds: summary.slice(0, 5).map((r: PipelineSummaryRow) => r.sales_id),
          });
        }

        setData(
          summary.map((row: PipelineSummaryRow) => ({
            id: row.principal_id,
            name: row.principal_name,
            totalPipeline: row.total_pipeline,
            activeThisWeek: row.active_this_week,
            activeLastWeek: row.active_last_week,
            momentum: row.momentum as PrincipalPipelineRow["momentum"],
            nextAction: row.next_action_summary,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch principal pipeline:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataProvider, salesId, salesIdLoading, filters?.myPrincipalsOnly]);

  return { data, loading, error };
}
