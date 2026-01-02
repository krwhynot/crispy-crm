import { useState } from "react";
import { Plus } from "lucide-react";
import { useGetList } from "ra-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import { QuickLogActivityDialog, ActivityTimelineEntry } from "../activities";
import type { ActivityRecord } from "../types";
import { ACTIVITY_PAGE_SIZE } from "../activities/constants";

interface ActivitiesTabProps {
  contactId: string | number;
}

export const ActivitiesTab = ({ contactId }: ActivitiesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isPending, error, refetch } = useGetList<ActivityRecord>("activities", {
    filter: { contact_id: contactId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: ACTIVITY_PAGE_SIZE },
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
        <SidepaneEmptyState
          title={EMPTY_STATE_CONTENT.activities.title}
          description={EMPTY_STATE_CONTENT.activities.description}
        />
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

export default ActivitiesTab;
