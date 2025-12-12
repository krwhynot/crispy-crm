import { Check, Mail, Phone, Users, FileText, Target } from "lucide-react";
import { RecordContextProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReferenceField } from "@/components/admin/reference-field";
import type { ActivityRecord } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface ActivityTimelineEntryProps {
  activity: ActivityRecord;
}

export const ActivityTimelineEntry = ({ activity }: ActivityTimelineEntryProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <RecordContextProvider value={activity}>
      <div className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-shrink-0 mt-1">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1).replace("_", " ")}
              </span>
              {activity.created_by && (
                <span className="text-sm text-muted-foreground">
                  by <ReferenceField source="created_by" reference="sales" link={false} />
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {format(
                parseDateSafely(activity.activity_date || activity.created_at) ?? new Date(),
                "MMM d, yyyy h:mm a"
              )}
            </span>
          </div>

          {activity.subject && <div className="text-sm font-medium mb-1">{activity.subject}</div>}
          {activity.description && (
            <div className="text-sm text-foreground whitespace-pre-line">
              {activity.description}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 -ml-2">
            {(activity as ActivityRecord & { related_task_id?: string | number })
              .related_task_id && (
              <RouterLink
                to={`/tasks/${(activity as ActivityRecord & { related_task_id?: string | number }).related_task_id}`}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs text-primary hover:underline hover:bg-muted/50 rounded-md transition-colors"
              >
                <Check className="h-4 w-4" />
                Related Task
              </RouterLink>
            )}
            {activity.opportunity_id && (
              <RouterLink
                to={`/opportunities/${activity.opportunity_id}/show`}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs text-primary hover:underline hover:bg-muted/50 rounded-md transition-colors"
              >
                <Target className="h-4 w-4" />
                View Opportunity
              </RouterLink>
            )}
            {activity.organization_id && (
              <RouterLink
                to={`/organizations/${activity.organization_id}/show`}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs text-primary hover:underline hover:bg-muted/50 rounded-md transition-colors"
              >
                <FileText className="h-4 w-4" />
                View Organization
              </RouterLink>
            )}
          </div>

          {(activity.sentiment || activity.follow_up_required) && (
            <div className="flex items-center gap-2 mt-2">
              {activity.sentiment && (
                <Badge
                  variant="outline"
                  className={
                    activity.sentiment === "positive"
                      ? "border-success text-success"
                      : activity.sentiment === "negative"
                        ? "border-error text-error"
                        : ""
                  }
                >
                  {activity.sentiment}
                </Badge>
              )}
              {activity.follow_up_required && (
                <Badge variant="outline" className="border-warning text-warning">
                  Follow-up Required
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </RecordContextProvider>
  );
};
