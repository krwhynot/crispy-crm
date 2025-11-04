import { useGetList } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useMemo } from "react";
import type { Opportunity } from "../types";
import { DashboardWidget } from "./DashboardWidget";

interface PrincipalCount {
  principalId: string | null;
  principalName: string;
  count: number;
}

/**
 * OpportunitiesByPrincipal Widget
 *
 * ⭐ HIGHEST PRIORITY WIDGET - Principal tracking is the #1 feature of this CRM
 *
 * Displays count of active opportunities grouped by principal organization.
 * Shows as a list with principal name and count, sorted by count (descending).
 * Clicking a principal navigates to opportunities filtered by that principal.
 *
 * Features:
 * - Groups active opportunities by principal
 * - Sorted by count (most opportunities first)
 * - Shows "Other" category for opportunities without a principal
 * - Star icon indicates importance
 * - Click navigates to filtered opportunities list
 */
export const OpportunitiesByPrincipal = () => {
  const navigate = useNavigate();

  const {
    data: opportunities,
    isPending,
    error,
    refetch,
  } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      status: "active",
      "deleted_at@is": null,
    },
  });

  // Group opportunities by principal and sort by count
  const principalCounts = useMemo(() => {
    if (!opportunities) return [];

    // Group by principal_organization_id
    const countMap = new Map<string | null, PrincipalCount>();

    opportunities.forEach((opp) => {
      const principalId = opp.principal_organization_id?.toString() || null;
      const principalName = opp.principal_organization_name || "Other";

      if (countMap.has(principalId)) {
        const existing = countMap.get(principalId)!;
        existing.count += 1;
      } else {
        countMap.set(principalId, {
          principalId,
          principalName,
          count: 1,
        });
      }
    });

    // Convert to array and sort by count (descending)
    return Array.from(countMap.values()).sort((a, b) => b.count - a.count);
  }, [opportunities]);

  const totalCount = opportunities?.length || 0;

  const handlePrincipalClick = (principalId: string | null) => {
    // Navigate to opportunities list with principal filter applied
    const filter =
      principalId === null
        ? {
            status: "active",
            "principal_organization_id@is": null,
          }
        : {
            status: "active",
            principal_organization_id: principalId,
          };

    navigate(`/opportunities?filter=${encodeURIComponent(JSON.stringify(filter))}`);
  };

  return (
    <DashboardWidget
      title="Opportunities by Principal"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      icon={<Star className="h-6 w-6 md:h-8 md:h-8 text-primary fill-primary" />}
    >
      {principalCounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            No active opportunities
          </p>
        </div>
      ) : (
        <div className="w-full space-y-1 max-h-[300px] overflow-y-auto">
          {principalCounts.map((principal) => (
            <button
              key={principal.principalId || "other"}
              onClick={() => handlePrincipalClick(principal.principalId)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left group"
              data-testid={`principal-${principal.principalId || "other"}`}
            >
              <span className="font-medium text-sm md:text-base truncate flex-1 min-w-0">
                {principal.principalName}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground group-hover:text-accent-foreground ml-2 flex-shrink-0">
                {principal.count} {principal.count === 1 ? "opportunity" : "opportunities"}
              </span>
            </button>
          ))}
          {principalCounts.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                {totalCount} total {totalCount === 1 ? "opportunity" : "opportunities"}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default OpportunitiesByPrincipal;
