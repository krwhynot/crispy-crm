import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Identifier } from "ra-core";
import { useDataProvider } from "ra-core";

import { ActivitiesService } from "../services";
import { ActivityLogContext } from "./ActivityLogContext";
import { ActivityLogIterator } from "./ActivityLogIterator";
import { activityLogKeys } from "../queryKeys";

interface ActivityLogProps {
  organizationId?: Identifier;
  pageSize?: number;
  context?: "organization" | "contact" | "opportunity" | "all";
}

export function ActivityLog({ organizationId, pageSize = 20, context = "all" }: ActivityLogProps) {
  const dataProvider = useDataProvider();

  // Create service instance using the base data provider
  const activitiesService = new ActivitiesService(dataProvider);

  const { data, isPending, error } = useQuery({
    queryKey: ["activityLog", organizationId],
    queryFn: () => activitiesService.getActivityLog(organizationId),
  });

  if (isPending) {
    return (
      <div className="mt-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="space-y-2 mt-1" key={index}>
            <div className="flex flex-row space-x-2 items-center">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="w-full h-4" />
            </div>
            <Skeleton className="w-full h-12" />
            <Separator />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <Alert>Failed to load activity log</Alert>;
  }

  return (
    <div data-testid="activity-log">
      <ActivityLogContext.Provider value={context}>
        <ActivityLogIterator activities={data} pageSize={pageSize} />
      </ActivityLogContext.Provider>
    </div>
  );
}
