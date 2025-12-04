import { format } from "date-fns";
import { useListContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import type { ActivityRecord } from "../types";
import { parseDateSafely } from "@/lib/date-utils";

export const ActivitiesList = () => {
  const { data, isPending } = useListContext<ActivityRecord>();

  if (isPending) return <div>Loading activities...</div>;
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No activities recorded yet</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((activity) => (
        <div key={activity.id} className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">
                {activity.type.replace("_", " ")}
              </Badge>
              {activity.activity_type === "interaction" && (
                <Badge className="bg-primary text-primary-foreground">Interaction</Badge>
              )}
              {activity.sentiment && (
                <Badge
                  variant="outline"
                  className={
                    activity.sentiment === "positive"
                      ? "border-success text-success"
                      : activity.sentiment === "negative"
                        ? "border-destructive text-destructive"
                        : "border-muted text-muted-foreground"
                  }
                >
                  {activity.sentiment}
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {parseDateSafely(activity.activity_date) ? format(parseDateSafely(activity.activity_date)!, "MMM d, yyyy") : "No date"}
            </span>
          </div>

          <div className="text-sm font-medium">{activity.subject}</div>

          {activity.description && (
            <div className="text-sm text-muted-foreground">{activity.description}</div>
          )}

          {activity.duration_minutes && (
            <div className="text-xs text-muted-foreground">
              Duration: {activity.duration_minutes} minutes
            </div>
          )}

          {activity.follow_up_required && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-warning-subtle text-warning border-warning">
                Follow-up Required
              </Badge>
              {activity.follow_up_date && parseDateSafely(activity.follow_up_date) && (
                <span className="text-xs text-muted-foreground">
                  by {format(parseDateSafely(activity.follow_up_date)!, "MMM d, yyyy")}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
