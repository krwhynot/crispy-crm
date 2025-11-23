import { useState, useEffect } from "react";
import { useDataProvider } from "react-admin";

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
  const dataProvider = useDataProvider();
  const [opportunities, setOpportunities] = useState<OpportunitySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!enabled || !principalId) {
        setOpportunities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch opportunities filtered by principal organization
        // Note: Uses opportunities_summary view (via getDatabaseResource)
        // - Filter: principal_organization_id (not organization_id)
        // - Sort: estimated_close_date (not expected_close_date)
        const { data } = await dataProvider.getList("opportunities", {
          filter: {
            principal_organization_id: principalId,
          },
          sort: { field: "estimated_close_date", order: "ASC" },
          pagination: { page: 1, perPage: 50 },
        });

        // Map to summary format
        const mapped: OpportunitySummary[] = data.map((opp: any) => ({
          id: opp.id,
          name: opp.name || "Unnamed Opportunity",
          stage: opp.stage || "Unknown",
          amount: opp.amount || 0,
          probability: opp.probability || 0,
          lastActivityDate: opp.last_activity_date ? new Date(opp.last_activity_date) : null,
          expectedCloseDate: opp.expected_close_date ? new Date(opp.expected_close_date) : null,
        }));

        setOpportunities(mapped);
      } catch (err) {
        console.error("Failed to fetch principal opportunities:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [dataProvider, principalId, enabled]);

  return { opportunities, loading, error };
}
