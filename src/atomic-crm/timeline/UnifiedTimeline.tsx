/**
 * UnifiedTimeline - Combines activities and tasks in chronological feed
 *
 * Usage:
 * <UnifiedTimeline contactId={123} />
 * <UnifiedTimeline organizationId={456} />
 * <UnifiedTimeline filters={{ entry_type: 'activity' }} />
 */

import { useState, useEffect } from "react";
import { RefreshCw, Building, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetList } from "ra-core";
import { ReferenceField, TextField } from "react-admin";
import { AdminButton } from "@/components/admin/AdminButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import { logger } from "@/lib/logger";
import { TimelineEntry } from "./TimelineEntry";

interface UnifiedTimelineProps {
  contactId?: number;
  organizationId?: number;
  opportunityId?: number;
  /** Number of items to fetch per page (default 50) */
  pageSize?: number;
  /** External filters to merge with entity filters */
  filters?: Record<string, unknown>;
}

interface TimelineEntryData {
  id: number;
  entry_type: "activity" | "task" | "note";
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
  filters: externalFilters,
}: UnifiedTimelineProps) => {
  const [page, setPage] = useState(1);

  // Serialize external filters for dependency comparison
  const externalFiltersKey = JSON.stringify(externalFilters);

  // Reset page when external filters change
  useEffect(() => {
    setPage(1);
  }, [externalFiltersKey]);

  // Build OR conditions for entity filtering
  // Timeline entries should match ANY of: contact, organization, or opportunity
  // FIX: BUG-5 - Previously used AND logic which excluded records with null organization_id
  const orConditions: Array<Record<string, number>> = [];
  if (contactId) orConditions.push({ contact_id: contactId });
  if (organizationId) orConditions.push({ organization_id: organizationId });
  if (opportunityId) orConditions.push({ opportunity_id: opportunityId });

  // Use $or for multiple conditions, single condition for one, empty for none
  // $or is transformed by dataProviderUtils.transformOrFilter() to @or format
  const entityFilter: Record<string, unknown> =
    orConditions.length > 1
      ? { $or: orConditions }
      : orConditions.length === 1
        ? orConditions[0]
        : {};

  // Merge entity filters with external filters (external takes precedence)
  const mergedFilters = {
    ...entityFilter,
    ...externalFilters,
  };

  const { data, total, isPending, error, refetch } = useGetList<TimelineEntryData>(
    "entity_timeline",
    {
      filter: mergedFilters,
      sort: { field: "entry_date", order: "DESC" },
      pagination: { page, perPage: pageSize },
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  const totalPages = total ? Math.ceil(total / pageSize) : 1;

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

  // Gate 8: Detect stage change duplicates (observability metric)
  // Group stage changes by opportunity + truncated timestamp (same minute)
  const stageChanges = entries.filter((e) => e.subtype === "stage_change" && e.opportunity_id);
  const duplicateGroups = new Map<string, TimelineEntryData[]>();
  stageChanges.forEach((entry) => {
    const minute = entry.entry_date?.slice(0, 16); // YYYY-MM-DDTHH:mm
    const key = `${entry.opportunity_id}-${entry.title}-${minute}`;
    const group = duplicateGroups.get(key) || [];
    group.push(entry);
    duplicateGroups.set(key, group);
  });
  duplicateGroups.forEach((group, _key) => {
    if (group.length > 1) {
      logger.error("Stage change duplicate detected", {
        opportunityId: group[0].opportunity_id,
        title: group[0].title,
        duplicateCount: group.length,
        entryIds: group.map((e) => e.id),
        metric: "timeline.stage_change_duplicate",
      });
    }
  });

  return (
    <div className="space-y-4" data-testid="unified-timeline">
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
            <TimelineEntry
              key={`${entry.entry_type}-${entry.id}`}
              entry={entry}
              currentContactId={contactId}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav
          role="navigation"
          aria-label="Timeline pagination"
          className="flex items-center justify-center gap-2 pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Go to previous page"
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Go to next page"
            className="gap-1"
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
};

export default UnifiedTimeline;
