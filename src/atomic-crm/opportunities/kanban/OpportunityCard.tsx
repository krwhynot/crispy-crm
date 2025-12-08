import React, { useState } from "react";
import { useRecordContext } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { format, differenceInDays } from "date-fns";
import { Trophy, XCircle, ChevronDown, ChevronUp, User, Calendar, Clock, CheckSquare, Package, GripVertical } from "lucide-react";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { STUCK_THRESHOLD_DAYS } from "../hooks/useStageMetrics";
import { OpportunityCardActions } from "./OpportunityCardActions";
import { ActivityPulseDot } from "./ActivityPulseDot";
import { WIN_REASONS, LOSS_REASONS } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface OpportunityCardProps {
  index: number;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  onDelete?: (opportunityId: number) => void;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive text-destructive-foreground",
} as const;

/**
 * OpportunityCard - Expandable draggable card for the Kanban board
 *
 * Collapsed: Activity pulse + name + expand toggle + actions
 * Expanded: Full details with visual cues
 */
export const OpportunityCard = React.memo(function OpportunityCard({
  index,
  openSlideOver,
  onDelete,
}: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();
  const [isExpanded, setIsExpanded] = useState(false);
  const { primaryContact, isLoading: contactsLoading } = useOpportunityContacts(
    record?.contact_ids || []
  );

  if (!record) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open slide-over if not clicking on action buttons, expand toggle, or drag handle
    if (
      (e.target as HTMLElement).closest("[data-action-button]") ||
      (e.target as HTMLElement).closest("[data-expand-toggle]") ||
      (e.target as HTMLElement).closest("[data-drag-handle]")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openSlideOver(record.id as number, "view");
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Computed values
  const daysInStage = record.days_in_stage || 0;
  const isStuck = daysInStage > STUCK_THRESHOLD_DAYS;
  const priority = record.priority || "medium";
  const priorityClass = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  // Close date formatting and urgency
  const closeDateParsed = record.estimated_close_date && parseDateSafely(record.estimated_close_date);
  const closeDate = closeDateParsed ? format(closeDateParsed, "MMM d, yyyy") : "No date set";
  const daysUntilClose = closeDateParsed ? differenceInDays(closeDateParsed, new Date()) : null;
  const closeDateUrgency = daysUntilClose !== null
    ? daysUntilClose < 0 ? "overdue" : daysUntilClose < 7 ? "soon" : "normal"
    : "normal";

  // Task counts
  const pendingTasks = record.pending_task_count || 0;
  const overdueTasks = record.overdue_task_count || 0;

  // Products count
  const productsCount = record.products?.length || 0;

  return (
    <Draggable draggableId={String(record.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(e as unknown as React.MouseEvent);
            }
          }}
          className={`
            bg-card rounded-lg border border-border
            p-3
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            cursor-pointer
            ${snapshot.isDragging ? "opacity-50 rotate-2" : "opacity-100"}
          `}
          data-testid="opportunity-card"
          data-tutorial="opp-card"
        >
          {/* Header: Drag Handle + Activity Pulse + Name + Expand + Actions (always visible) */}
          <div className="flex items-center gap-1.5">
            {/* Drag handle - 44px touch target (WCAG AA) but compact visual */}
            <div
              {...provided.dragHandleProps}
              data-testid="drag-handle"
              data-tutorial="opp-drag-handle"
              data-drag-handle
              aria-label="Drag to reorder"
              className="min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-grab active:cursor-grabbing transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 -ml-1"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <ActivityPulseDot daysSinceLastActivity={record.days_since_last_activity} />

            <h3 className={`
              font-semibold text-base text-foreground flex-1 min-w-0 leading-normal
              ${isExpanded ? "" : "line-clamp-3"}
            `}>
              {record.name}
            </h3>

            <button
              data-expand-toggle
              onClick={handleExpandClick}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse card" : "Expand card"}
              className="min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <OpportunityCardActions opportunityId={record.id as number} onDelete={onDelete} />
          </div>

          {/* Expandable Details Section */}
          <div className={`
            grid transition-[grid-template-rows] duration-200 ease-out
            ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
          `}>
            <div className="overflow-hidden">
              <div className="pt-3 mt-2 border-t border-border space-y-2">
                {/* Description */}
                {record.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {record.description}
                  </p>
                )}

                {/* Badges Row: Priority + Principal */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClass}`}>
                    {priorityLabel}
                  </span>
                  {record.principal_organization_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                      {record.principal_organization_name}
                    </span>
                  )}
                </div>

                {/* Primary Contact */}
                {contactsLoading ? (
                  <div className="h-4 bg-muted animate-pulse rounded" />
                ) : primaryContact ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {primaryContact.firstName} {primaryContact.lastName}
                    </span>
                  </div>
                ) : null}

                {/* Close Date with urgency color */}
                <div className={`flex items-center gap-2 text-xs ${
                  closeDateUrgency === "overdue" ? "text-destructive" :
                  closeDateUrgency === "soon" ? "text-warning" :
                  "text-muted-foreground"
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{closeDate}</span>
                  {closeDateUrgency === "overdue" && <span>(overdue)</span>}
                  {closeDateUrgency === "soon" && daysUntilClose !== null && (
                    <span>(in {daysUntilClose}d)</span>
                  )}
                </div>

                {/* Days in Stage */}
                <div className={`flex items-center gap-2 text-xs ${
                  isStuck ? "text-warning" : "text-muted-foreground"
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{daysInStage} days in stage</span>
                  {isStuck && <span className="text-warning">⚠️</span>}
                </div>

                {/* Tasks */}
                {pendingTasks > 0 && (
                  <div className={`flex items-center gap-2 text-xs ${
                    overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {pendingTasks} task{pendingTasks !== 1 ? "s" : ""}
                      {overdueTasks > 0 && ` (${overdueTasks} overdue)`}
                    </span>
                  </div>
                )}

                {/* Products */}
                {productsCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{productsCount} product{productsCount !== 1 ? "s" : ""}</span>
                  </div>
                )}

                {/* Win/Loss Reason Badge - for closed opportunities */}
                {record.stage === "closed_won" && record.win_reason && (
                  <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-success/10 text-success">
                    <Trophy className="w-3 h-3" />
                    <span>
                      {WIN_REASONS.find((r) => r.id === record.win_reason)?.name || record.win_reason}
                    </span>
                  </div>
                )}
                {record.stage === "closed_lost" && record.loss_reason && (
                  <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                    <XCircle className="w-3 h-3" />
                    <span>
                      {LOSS_REASONS.find((r) => r.id === record.loss_reason)?.name || record.loss_reason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});
