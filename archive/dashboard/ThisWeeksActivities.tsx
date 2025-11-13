import { useGetList } from "ra-core";
import { useMemo } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import { Activity } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";

/**
 * ThisWeeksActivities Widget
 *
 * Displays count of activities logged this week (Monday-Sunday).
 * Week starts on Monday per ISO 8601 standard.
 *
 * Includes all activity types.
 */
export const ThisWeeksActivities = () => {
  // Calculate current week boundaries (Monday-Sunday)
  const { startOfWeekISO, endOfWeekISO } = useMemo(() => {
    const now = new Date();
    // weekStartsOn: 1 = Monday (ISO 8601)
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    return {
      startOfWeekISO: start.toISOString().split("T")[0],
      endOfWeekISO: end.toISOString().split("T")[0],
    };
  }, []);

  const {
    data: activities,
    isPending,
    error,
    refetch,
  } = useGetList("activities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      "deleted_at@is": null,
      "activity_date@gte": startOfWeekISO,
      "activity_date@lte": endOfWeekISO,
    },
  });

  const count = activities?.length || 0;

  return (
    <DashboardWidget
      title="This Week's Activities"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      icon={<Activity className="h-6 w-6 md:h-8 md:h-8" />}
    >
      <div className="flex flex-col items-center justify-center w-full">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tabular-nums text-foreground">
          {count}
        </div>
        <div className="text-sm md:text-base text-muted-foreground mt-2">
          {count === 0
            ? "No activities this week"
            : count === 1
              ? "activity this week"
              : "activities this week"}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default ThisWeeksActivities;
