import { useRecordContext } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { STUCK_THRESHOLD_DAYS } from "../hooks/useStageMetrics";
import { OpportunityCardActions } from "./OpportunityCardActions";
import type { Opportunity } from "../../types";

interface OpportunityCardProps {
  index: number;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive text-destructive-foreground",
} as const;

export function OpportunityCard({ index, openSlideOver }: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();
  const { primaryContact, isLoading: contactsLoading } = useOpportunityContacts(
    record?.contact_ids || []
  );

  if (!record) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open slide-over if not clicking on action buttons
    if ((e.target as HTMLElement).closest("[data-action-button]")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openSlideOver(record.id as number, "view");
  };

  const closeDate = record.estimated_close_date
    ? format(new Date(record.estimated_close_date), "MMM d, yyyy")
    : "No date set";

  const daysInStage = record.days_in_stage || 0;
  const isStuck = daysInStage > STUCK_THRESHOLD_DAYS;

  // Safely handle priority with fallback
  const priority = record.priority || "medium";
  const priorityClass =
    priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <Draggable draggableId={String(record.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
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
            p-[var(--spacing-widget-padding)]
            mb-[var(--spacing-content)]
            transition-all duration-200
            hover:shadow-md hover:-translate-y-1
            cursor-pointer
            ${snapshot.isDragging ? "opacity-50 rotate-2" : "opacity-100"}
          `}
          data-testid="opportunity-card"
        >
          {/* Header: Name + Priority + Actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
              {record.name}
            </h3>
            <div className="flex items-center gap-1">
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full whitespace-nowrap
                  ${priorityClass}
                `}
              >
                {priorityLabel}
              </span>
              <OpportunityCardActions opportunityId={record.id as number} />
            </div>
          </div>

          {/* Primary Contact */}
          {contactsLoading ? (
            <div className="h-4 bg-muted animate-pulse rounded mb-2" />
          ) : primaryContact ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>
                {primaryContact.firstName} {primaryContact.lastName}
              </span>
            </div>
          ) : null}

          {/* Close Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{closeDate}</span>
          </div>

          {/* Days in Stage Badge */}
          {daysInStage > 0 && (
            <div
              className={`
                inline-flex items-center gap-1 text-xs px-2 py-1 rounded
                ${isStuck ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}
              `}
            >
              {isStuck && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{daysInStage} days in stage</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
