import { useGetList, useGetIdentity } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import type { Opportunity } from "../types";
import { DashboardWidget } from "./DashboardWidget";

/**
 * MyOpenOpportunities Widget
 *
 * Displays count of opportunities where:
 * - opportunity_owner_id = current user's ID
 * - status = 'active'
 *
 * Click navigates to opportunities list with pre-applied filter.
 */
export const MyOpenOpportunities = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();

  const {
    data: opportunities,
    isPending,
    error,
    refetch,
  } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      opportunity_owner_id: identity?.id,
      status: "active",
    },
  });

  const count = opportunities?.length || 0;

  const handleClick = () => {
    // Navigate to opportunities list with "My Opportunities" filter applied
    navigate(
      `/opportunities?filter=${encodeURIComponent(JSON.stringify({ opportunity_owner_id: identity?.id, status: "active" }))}`
    );
  };

  return (
    <DashboardWidget
      title="My Open Opportunities"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      onClick={handleClick}
      icon={<Briefcase className="h-4 w-4" />}
    >
      <div className="flex items-center justify-center gap-2 w-full">
        <div className="text-2xl md:text-3xl font-bold tabular-nums text-foreground">{count}</div>
        <div className="text-[10px] md:text-xs text-muted-foreground">
          {count === 1 ? "opportunity" : "opportunities"}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default MyOpenOpportunities;
