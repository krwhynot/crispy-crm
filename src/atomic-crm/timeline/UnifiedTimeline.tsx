/**
 * UnifiedTimeline - Combines activities and tasks in chronological feed
 *
 * Usage:
 * <UnifiedTimeline contactId={123} />
 * <UnifiedTimeline organizationId={456} />
 */

import { useState } from "react";
import { Plus, RefreshCw, Building } from "lucide-react";
import { useGetList } from "ra-core";
import { ReferenceField, TextField } from "react-admin";
import { AdminButton } from "@/components/admin/AdminButton";
import { Skeleton } from "@/components/ui/skeleton";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import { QuickLogActivityDialog } from "../activities";
import { TimelineEntry } from "./TimelineEntry";

interface UnifiedTimelineProps {
  contactId?: number;
  organizationId?: number;
  opportunityId?: number;
  /** Number of items to fetch (default 50) */
  pageSize?: number;
}

interface TimelineEntryData {
  id: number;
  entry_type: "activity" | "task";
  subtype: string;
  title: string;
  description?: string;
  entry_date: string;
  contact_id?: number;
  organization_id?: number;
  opportunity_id?: number;
  created_by?: number;
  sales_id?: number;
  created_at: string;
}

export const UnifiedTimeline = ({
  contactId,
  organizationId,
  opportunityId,
  pageSize = 50,
}: UnifiedTimelineProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filter: Record<string, number> = {};
  if (contactId) filter.contact_id = contactId;
  if (organizationId) filter.organization_id = organizationId;
  if (opportunityId) filter.opportunity_id = opportunityId;

  const { data, isPending, error, refetch } = useGetList<TimelineEntryData>(
    "entity_timeline",
    {
      filter,
      sort: { field: "entry_date", order: "DESC" },
      pagination: { page: 1, perPage: pageSize },
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

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
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-destructive mb-3">Failed to load timeline</p>
        <AdminButton onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="size-4" aria-hidden="true" />
          Try Again
        </AdminButton>
      </div>
    );
  }

  const entries = data || [];

  return (
    <div className="space-y-4">
      {/* Header: Organization breadcrumb + Action buttons */}
      <div className="flex items-center justify-between">
        {/* Organization context breadcrumb - only in contact view */}
        {contactId && organizationId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>Organization:</span>
            <ReferenceField
              source="organization_id"
              reference="organizations"
              record={{ organization_id: organizationId }}
              link="show"
              className="font-medium hover:text-foreground transition-colors"
            >
              <TextField source="name" />
            </ReferenceField>
          </div>
        )}

        {/* Action buttons - maintain existing right alignment */}
        <div className="flex justify-end gap-2 ml-auto">
          <AdminButton
            variant="outline"
            className="h-11 gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Log Activity
          </AdminButton>
        </div>
      </div>

      {/* Timeline entries */}
      {entries.length === 0 ? (
        <SidepaneEmptyState
          title={EMPTY_STATE_CONTENT.activities.title}
          description={EMPTY_STATE_CONTENT.activities.description}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <TimelineEntry key={`${entry.entry_type}-${entry.id}`} entry={entry} />
          ))}
        </div>
      )}

      {/* Activity logging dialog */}
      <QuickLogActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entityContext={{
          contactId: contactId,
          organizationId: organizationId,
        }}
        config={{
          enableDraftPersistence: false,
          showSaveAndNew: false,
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default UnifiedTimeline;
