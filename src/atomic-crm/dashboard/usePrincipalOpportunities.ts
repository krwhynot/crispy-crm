import { useMemo } from "react";
import { useGetList } from "react-admin";
import type { OpportunityApiResponse } from "./types";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * Opportunity summary for drill-down display
 */
export interface OpportunitySummary {
  id: number;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  lastActivityDate: Date | null;
  expectedCloseDate: Date | null;
}

interface UsePrincipalOpportunitiesOptions {
  principalId: number | null;
  enabled?: boolean;
}

/**
 * Hook to fetch opportunities for a specific principal (organization)
 *
 * Used by the Pipeline Drill-Down feature to show opportunities
 * when clicking on a principal row in the pipeline table.
 */
export function usePrincipalOpportunities({
  principalId,
  enabled = true,
}: UsePrincipalOpportunitiesOptions) {
  // Fetch opportunities filtered by principal organization
  // Note: Uses opportunities_summary view (via getDatabaseResource)
  // - Filter: principal_organization_id (not organization_id)
  // - Sort: estimated_close_date (not expected_close_date)
  const {
    data: rawOpps = [],
    isPending: loading,
    error,
  } = useGetList<OpportunityApiResponse>(
    "opportunities",
    {
      filter: {
        principal_organization_id: principalId,
      },
      sort: { field: "estimated_close_date", order: "ASC" },
      pagination: { page: 1, perPage: 50 },
    },
    {
      enabled: enabled && !!principalId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // Map to summary format
  // Note: Database field is estimated_close_date (not expected_close_date)
  const opportunities = useMemo(
    () =>
      rawOpps.map((opp) => ({
        id: opp.id,
        name: opp.name || "Unnamed Opportunity",
        stage: opp.stage || "Unknown",
        amount: opp.amount || 0,
        probability: opp.probability || 0,
        lastActivityDate: parseDateSafely(opp.last_activity_date),
        expectedCloseDate: parseDateSafely(opp.estimated_close_date),
      })),
    [rawOpps]
  );

  return { opportunities, loading, error: error as Error | null };
}
