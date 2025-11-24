import { Link } from "react-router-dom";

import type { RaRecord } from "ra-core";
import { RelativeDate } from "../misc/RelativeDate";
import type { ActivityOpportunityCreated } from "../types";
import { useActivityLogContext } from "./ActivityLogContext";

interface ActivityLogOpportunityCreatedProps {
  activity: RaRecord & ActivityOpportunityCreated;
}

export function ActivityLogOpportunityCreated({ activity }: ActivityLogOpportunityCreatedProps) {
  const context = useActivityLogContext();
  const { opportunity } = activity;
  return (
    <div className="p-0">
      <div className="flex flex-row space-x-1 items-center w-full">
        <div className="w-5 h-5 bg-loading-pulse rounded-full" />
        <div className="text-sm text-muted-foreground flex-grow">
          <span className="text-muted-foreground text-sm">Sales ID: {activity.sales_id}</span> added
          opportunity <Link to={`/opportunities/${opportunity.id}/show`}>{opportunity.name}</Link>{" "}
          {context !== "company" && (
            <>
              to organization {activity.customer_organization_id}{" "}
              <RelativeDate date={activity.date} />
            </>
          )}
        </div>
        {context === "company" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={activity.date} />
          </span>
        )}
      </div>
    </div>
  );
}
