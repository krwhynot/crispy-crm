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
    navigate(`/opportunities?filter=${encodeURIComponent(JSON.stringify({ opportunity_owner_id: identity?.id, status: "active" }))}`);
  };

  return (
    <DashboardWidget
      title="My Open Opportunities"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      onClick={handleClick}
      icon={<Briefcase className="h-6 w-6 md:h-8 md:h-8" />}
    >
      <div className="flex flex-col items-center justify-center w-full">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tabular-nums text-foreground">
          {count}
        </div>
        <div className="text-sm md:text-base text-muted-foreground mt-2">
          {count === 0 ? "No open opportunities" : count === 1 ? "active opportunity" : "active opportunities"}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default MyOpenOpportunities;
