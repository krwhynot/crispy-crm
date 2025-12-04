import { useState } from "react";
import { Check, Mail, Phone, Users, FileText, Target, Plus } from "lucide-react";
import { useGetList, RecordContextProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferenceField } from "@/components/admin/reference-field";
import { QuickLogActivityDialog } from "../activities";
import type { ActivityRecord } from "../types";
import { parseDateSafely } from "@/lib/date-utils";

interface ActivitiesTabProps {
  contactId: string | number;
}

export const ActivitiesTab = ({ contactId }: ActivitiesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isPending, error, refetch } = useGetList<ActivityRecord>("activities", {
    filter: { contact_id: contactId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 50 },
  });

  // Convert contactId to number for the dialog (handles both string and number)
  const numericContactId = typeof contactId === "string" ? parseInt(contactId, 10) : contactId;

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Failed to load activities</div>;
  }

  const activities = data || [];

  return (
    <div className="space-y-4">
      {/* Log Activity button - opens QuickLogActivityDialog pre-filled with contact */}
      <div className="flex justify-end">
        <Button variant="outline" className="h-11 gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No activities recorded yet</div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityTimelineEntry key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Activity logging dialog - pre-fills contact */}
      <QuickLogActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entityContext={{ contactId: numericContactId }}
        config={{
          enableDraftPersistence: false, // No drafts for slide-over context
          showSaveAndNew: false, // Single activity at a time
        }}
        onSuccess={() => {
          refetch(); // Refresh the activity list
        }}
      />
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
      <div className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
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

          {/* Subject/Description */}
          {activity.subject && <div className="text-sm font-medium mb-1">{activity.subject}</div>}
          {activity.description && (
            <div className="text-sm text-foreground whitespace-pre-line">
              {activity.description}
            </div>
          )}

          {/* Related Links - min-h-11 for 44px touch targets (WCAG AA) */}
          <div className="flex items-center gap-2 mt-2 -ml-2">
            {activity.related_task_id && (
              <RouterLink
                to={`/tasks/${activity.related_task_id}`}
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

          {/* Tags */}
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

export default ActivitiesTab;
