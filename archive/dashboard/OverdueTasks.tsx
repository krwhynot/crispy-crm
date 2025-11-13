import { useGetList } from "ra-core";
import { startOfToday } from "date-fns";
import { AlertTriangle } from "lucide-react";
import type { Task } from "../types";
import { DashboardWidget } from "./DashboardWidget";

/**
 * OverdueTasks Widget
 *
 * Displays count of tasks where:
 * - completed_at is null (not completed)
 * - due_date < today (overdue)
 *
 * Shows red text/badge when count > 0 to indicate urgency.
 */
export const OverdueTasks = () => {
  const startOfTodayISO = startOfToday().toISOString();

  const {
    data: tasks,
    isPending,
    error,
    refetch,
  } = useGetList<Task>("tasks", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      "completed_at@is": null,
      "due_date@lt": startOfTodayISO,
    },
  });

  const count = tasks?.length || 0;
  const hasOverdue = count > 0;

  return (
    <DashboardWidget
      title="Overdue Tasks"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      icon={
        <AlertTriangle
          className={`h-6 w-6 md:h-8 md:h-8 ${hasOverdue ? "text-destructive" : ""}`}
        />
      }
    >
      <div className="flex flex-col items-center justify-center w-full">
        <div
          className={`text-4xl md:text-5xl lg:text-6xl font-bold tabular-nums ${
            hasOverdue ? "text-destructive" : "text-foreground"
          }`}
        >
          {count}
        </div>
        <div className="text-sm md:text-base text-muted-foreground mt-2">
          {count === 0 ? "No overdue tasks" : count === 1 ? "overdue task" : "overdue tasks"}
        </div>
        {hasOverdue && (
          <div className="mt-3 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
            Action Required
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default OverdueTasks;
