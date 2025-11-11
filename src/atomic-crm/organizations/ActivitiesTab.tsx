import { Check, Calendar, Mail, Phone, Users, FileText, Target } from "lucide-react";
import { useGetList, RecordContextProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferenceField } from "@/components/admin/reference-field";
import type { ActivityRecord } from "../types";

interface ActivitiesTabProps {
  organizationId: string | number;
}

export const ActivitiesTab = ({ organizationId }: ActivitiesTabProps) => {
  const { data, isPending, error } = useGetList<ActivityRecord>("activities", {
    filter: { organization_id: organizationId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 50 },
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-[color:var(--border)] rounded-lg">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[color:var(--destructive)]">
        Failed to load activities
      </div>
    );
  }

  const activities = data || [];

  return (
    <div className="space-y-4">
      {/* Quick Log Activity button - placeholder for now */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          + Log Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-[color:var(--muted-foreground)]">
          No activities recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityTimelineEntry key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityTimelineEntry = ({ activity }: { activity: ActivityRecord }) => {
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
      <div className="flex gap-4 p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)]/50 transition-colors">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1).replace("_", " ")}
              </span>
              {activity.created_by && (
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  by <ReferenceField source="created_by" reference="sales" link={false} />
                </span>
              )}
            </div>
            <span className="text-xs text-[color:var(--muted-foreground)] ml-2">
              {format(new Date(activity.activity_date || activity.created_at), "MMM d, yyyy h:mm a")}
            </span>
          </div>

        {/* Subject/Description */}
        {activity.subject && (
          <div className="text-sm font-medium mb-1">{activity.subject}</div>
        )}
        {activity.description && (
          <div className="text-sm text-[color:var(--foreground)] whitespace-pre-line">
            {activity.description}
          </div>
        )}

        {/* Related Links */}
        <div className="flex items-center gap-4 mt-2">
          {activity.related_task_id && (
            <RouterLink
              to={`/tasks/${activity.related_task_id}`}
              className="flex items-center gap-1 text-xs text-[color:var(--primary)] hover:underline"
            >
              <Check className="h-3 w-3" />
              Related Task
            </RouterLink>
          )}
          {activity.opportunity_id && (
            <RouterLink
              to={`/opportunities/${activity.opportunity_id}/show`}
              className="flex items-center gap-1 text-xs text-[color:var(--primary)] hover:underline"
            >
              <Target className="h-3 w-3" />
              View Opportunity
            </RouterLink>
          )}
        </div>

        {/* Tags */}
        {(activity.sentiment || activity.follow_up_required) && (
          <div className="flex items-center gap-2 mt-2">
            {activity.sentiment && (
              <Badge
                variant="outline"
                className={
                  activity.sentiment === "positive"
                    ? "border-green-500 text-green-700"
                    : activity.sentiment === "negative"
                      ? "border-red-500 text-red-700"
                      : ""
                }
              >
                {activity.sentiment}
              </Badge>
            )}
            {activity.follow_up_required && (
              <Badge variant="outline" className="border-orange-500 text-orange-700">
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

export default ActivitiesTab;