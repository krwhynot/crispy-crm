import { useState } from "react";
import { Plus } from "lucide-react";
import { useGetList } from "ra-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickLogActivityDialog, ActivityTimelineEntry } from "../activities";
import type { ActivityRecord } from "../types";
import { ACTIVITY_PAGE_SIZE } from "../activities/constants";

interface ActivitiesTabProps {
  organizationId: string | number;
}

export const ActivitiesTab = ({ organizationId }: ActivitiesTabProps): JSX.Element => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isPending, error, refetch } = useGetList<ActivityRecord>(
    "activities",
    {
      filter: { organization_id: organizationId },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: ACTIVITY_PAGE_SIZE },
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  // Convert organizationId to number for the dialog (handles both string and number)
  const numericOrganizationId =
    typeof organizationId === "string" ? parseInt(organizationId, 10) : organizationId;

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
      {/* Log Activity button - opens QuickLogActivityDialog pre-filled with organization */}
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

      {/* Activity logging dialog - pre-fills organization */}
      <QuickLogActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entityContext={{ organizationId: numericOrganizationId }}
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

export default ActivitiesTab;
