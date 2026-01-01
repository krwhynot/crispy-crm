import { useListContext, RecordContextProvider, useGetIdentity } from "ra-core";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditButton } from "@/components/admin/edit-button";
import { formatDistance, format } from "date-fns";
import { Building2, X } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel, getOpportunityStageColor } from "./constants/stageConstants";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { parseDateSafely } from "@/lib/date-utils";
import { NextTaskBadge } from "./components/NextTaskBadge";
import { getOpportunityRowClassName } from "./utils/rowStyling";

interface OpportunityRowListViewProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}

export const OpportunityRowListView = ({
  openSlideOver,
  isSlideOverOpen,
}: OpportunityRowListViewProps) => {
  const {
    data: opportunities,
    error,
    isPending,
    onToggleItem,
    selectedIds,
    onSelect,
    onUnselectItems,
  } = useListContext<Opportunity>();

  const { isManagerOrAdmin } = useUserRole();
  const { data: identity } = useGetIdentity();
  const currentSalesId = identity?.id;

  // Keyboard navigation for list rows
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  if (isPending) {
    return <Skeleton className="w-full h-9" />;
  }

  if (error) {
    return (
      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <p className="text-center text-destructive">
          Error loading opportunities. Please try refreshing the page.
        </p>
      </Card>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <p className="text-center text-muted-foreground">No opportunities to display</p>
      </Card>
    );
  }

  const allSelected = selectedIds.length === opportunities.length && opportunities.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < opportunities.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onUnselectItems();
    } else {
      onSelect(opportunities.map((opp) => opp.id));
    }
  };

  return (
    <>
      {/* Bulk selection controls - shown when items are selected */}
      {selectedIds.length > 0 && (
        <div className="space-y-3">
          {/* Selection summary bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all opportunities"
              />
              <span className="text-sm font-medium">
                {selectedIds.length} opportunit{selectedIds.length === 1 ? "y" : "ies"} selected
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={onUnselectItems}
              className="h-11 gap-1.5 touch-manipulation"
            >
              <X className="h-4 w-4" />
              Clear selection
            </Button>
          </div>

          {/* Bulk actions toolbar */}
          <BulkActionsToolbar
            selectedIds={selectedIds}
            opportunities={opportunities}
            onUnselectItems={onUnselectItems}
          />
        </div>
      )}

      <Card className="bg-card border border-border shadow-sm rounded-xl p-2">
        <div className="space-y-2">
          {opportunities.map((opportunity, index) => {
            const canEdit =
              isManagerOrAdmin ||
              (currentSalesId != null &&
                (Number(opportunity.opportunity_owner_id) === Number(currentSalesId) ||
                  Number(opportunity.account_manager_id) === Number(currentSalesId)));
            return (
              <RecordContextProvider key={opportunity.id} value={opportunity}>
                <div
                  className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg border bg-card px-3 py-2 sm:py-1.5 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${getOpportunityRowClassName(opportunity)} ${
                    focusedIndex === index
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-transparent"
                  }`}
                >
                  {/* Left cluster: Checkbox + Main Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                    <Checkbox
                      checked={selectedIds.includes(opportunity.id)}
                      onCheckedChange={() => onToggleItem(opportunity.id)}
                      aria-label={`Select ${opportunity.name}`}
                      className="relative z-10 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Opportunity name as the semantic link - clicks open slide-over */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openSlideOver(opportunity.id as number, "view");
                        }}
                        className="font-medium text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 block truncate text-left w-full"
                      >
                        {opportunity.name}
                        {/* Stretched link overlay: makes entire card clickable */}
                        <span className="absolute inset-0" aria-hidden="true" />
                      </button>

                      {/* Second line: Customer → Principal relationship */}
                      <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap mt-0.5">
                        {opportunity.customer_organization_id && (
                          <>
                            <ReferenceField
                              source="customer_organization_id"
                              reference="organizations"
                              link={false}
                            >
                              <TextField source="name" className="font-medium" />
                            </ReferenceField>
                            <span className="opacity-60">→</span>
                          </>
                        )}
                        {opportunity.principal_organization_id && (
                          <ReferenceField
                            source="principal_organization_id"
                            reference="organizations"
                            link="show"
                          >
                            <div className="flex items-center gap-1 relative z-10">
                              <Building2 className="size-3 text-primary/80" />
                              <TextField
                                source="name"
                                className="font-bold text-primary hover:underline cursor-pointer"
                              />
                            </div>
                          </ReferenceField>
                        )}

                        {/* Interaction metrics */}
                        {opportunity.nb_interactions !== undefined &&
                          opportunity.nb_interactions > 0 && (
                            <>
                              <span className="opacity-50 mx-0.5">·</span>
                              <span className="font-medium">
                                {opportunity.nb_interactions} interaction
                                {opportunity.nb_interactions !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        {opportunity.last_interaction_date &&
                          parseDateSafely(opportunity.last_interaction_date) && (
                            <>
                              <span className="opacity-50 mx-0.5">·</span>
                              <span className="opacity-75">
                                Last{" "}
                                {formatDistance(
                                  parseDateSafely(opportunity.last_interaction_date)!,
                                  new Date(),
                                  { addSuffix: true }
                                )}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right cluster: Stage, Priority, Close Date, Owner, Edit */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
                    {/* Stage Badge */}
                    <Badge
                      className="border-0 text-xs relative z-10"
                      style={{ backgroundColor: getOpportunityStageColor(opportunity.stage) }}
                    >
                      {getOpportunityStageLabel(opportunity.stage)}
                    </Badge>

                    {/* Next Task - Hidden on mobile, shown on lg+ */}
                    <div className="hidden lg:flex relative z-10">
                      <NextTaskBadge
                        taskId={opportunity.next_task_id}
                        title={opportunity.next_task_title}
                        dueDate={opportunity.next_task_due_date}
                        priority={opportunity.next_task_priority}
                        onClick={() => {
                          // TODO: Open task slide-over when task panel is implemented
                        }}
                      />
                    </div>

                    {/* Priority - Hidden on mobile, shown on md+ */}
                    {opportunity.priority && (
                      <Badge
                        variant={
                          opportunity.priority === "critical"
                            ? "destructive"
                            : opportunity.priority === "high"
                              ? "default"
                              : opportunity.priority === "medium"
                                ? "secondary"
                                : "outline"
                        }
                        className="hidden md:inline-flex text-xs relative z-10"
                      >
                        {opportunity.priority}
                      </Badge>
                    )}

                    {/* Close Date - Hidden on mobile, shown on sm+ */}
                    {opportunity.estimated_close_date &&
                      parseDateSafely(opportunity.estimated_close_date) && (
                        <div className="hidden sm:block text-xs text-muted-foreground relative z-10">
                          <span className="opacity-75">Close:</span>{" "}
                          <span className="font-medium">
                            {format(
                              parseDateSafely(opportunity.estimated_close_date)!,
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      )}

                    {/* Owner - Hidden on mobile, shown on md+ */}
                    {opportunity.opportunity_owner_id && (
                      <div className="hidden md:block text-xs text-muted-foreground relative z-10">
                        <ReferenceField
                          source="opportunity_owner_id"
                          reference="sales"
                          link={false}
                        >
                          <span>
                            <TextField source="first_name" /> <TextField source="last_name" />
                          </span>
                        </ReferenceField>
                      </div>
                    )}

                    {/* Edit Button - positioned above stretched link overlay (hidden for non-owners) */}
                    {canEdit && (
                      <div className="relative z-10">
                        <EditButton resource="opportunities" />
                      </div>
                    )}
                  </div>
                </div>
              </RecordContextProvider>
            );
          })}
        </div>
      </Card>
    </>
  );
};
