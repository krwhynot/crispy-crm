import React from "react";
import { useRecordContext } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { OpportunityCardActions } from "./OpportunityCardActions";
import { StageStatusDot } from "./StageStatusDot";
import { getStageStatus } from "../constants/stageThresholds";
import type { Opportunity } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface OpportunityCardProps {
  index: number;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  onDelete?: (opportunityId: number) => void;
}

/**
 * OpportunityCard - Principal-centric Kanban card
 *
 * PRD Reference: Pipeline PRD "Opportunity Card Design"
 *
 * Layout (no expand/collapse):
 * ┌────────────────────────────────────┐
 * │ ████ McCRUM                     ⋯ │  ← Principal + color stripe + actions
 * │ Sysco Foods                       │  ← Distributor
 * │ Chili's Corporate                 │  ← Operator (customer)
 * │ 🔴 12 days                        │  ← Days in stage + status dot
 * └────────────────────────────────────┘
 */
export const OpportunityCard = React.memo(function OpportunityCard({
  index,
  openSlideOver,
  onDelete,
}: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open slide-over if not clicking on action buttons or drag handle
    if (
      (e.target as HTMLElement).closest("[data-action-button]") ||
      (e.target as HTMLElement).closest("[data-drag-handle]")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openSlideOver(record.id as number, "view");
  };

  // Stage status calculation
  const daysInStage = record.days_in_stage || 0;
  const expectedCloseDate = record.estimated_close_date
    ? parseDateSafely(record.estimated_close_date)
    : null;
  const stageStatus = getStageStatus(record.stage, daysInStage, expectedCloseDate);

  // Principal color stripe
  const principalSlug = record.principal_organization_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
            bg-card rounded-lg border border-border border-l-4
            p-3 space-y-1
            hover:shadow-md
            cursor-pointer
            ${snapshot.isDragging ? "opacity-50" : "opacity-100"}
          `}
          style={{
            // Custom styles FIRST, library styles LAST (required for drag positioning)
            borderLeftColor: principalSlug
              ? `var(--principal-${principalSlug}, var(--muted))`
              : 'var(--muted)',
            ...provided.draggableProps.style,
          }}
          data-testid="opportunity-card"
          data-tutorial="opp-card"
        >
          {/* Row 1: Drag Handle + Principal + Actions */}
          <div className="flex items-center gap-1.5">
            {/* Drag handle - 44px touch target (WCAG AA) */}
            <div
              {...provided.dragHandleProps}
              data-testid="drag-handle"
              data-drag-handle
              aria-label="Drag to reorder"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-grab active:cursor-grabbing transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 -ml-1"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Principal name (primary identifier) */}
            <h3 className="font-semibold text-base text-foreground flex-1 min-w-0 truncate">
              {record.principal_organization_name || "No Principal"}
            </h3>

            {/* Actions menu */}
            <OpportunityCardActions opportunityId={record.id as number} onDelete={onDelete} />
          </div>

          {/* Row 2: Distributor */}
          <p className="text-sm text-muted-foreground truncate pl-10">
            {record.distributor_organization_name || "No Distributor"}
          </p>

          {/* Row 3: Operator (Customer) */}
          <p className="text-sm text-muted-foreground truncate pl-10">
            {record.customer_organization_name || "No Operator"}
          </p>

          {/* Row 4: Stage Status (days + dot) */}
          <div className="pl-10">
            <StageStatusDot status={stageStatus} daysInStage={daysInStage} />
          </div>
        </div>
      )}
    </Draggable>
  );
});
