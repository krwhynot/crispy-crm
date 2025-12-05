import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { RecordContextProvider } from "react-admin";
import type { Opportunity } from "../../types";
import { OpportunityCard } from "./OpportunityCard";
import {
  getOpportunityStageLabel,
  getOpportunityStageColor,
  getOpportunityStageElevation,
  getOpportunityStageDescription,
  getOpportunityMfbPhase,
} from "../constants/stageConstants";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useStageMetrics, STUCK_THRESHOLD_DAYS } from "../hooks/useStageMetrics";
import { QuickAddOpportunity } from "./QuickAddOpportunity";

/**
 * Props interface for OpportunityColumn component
 * Extracted for use with React.memo comparison function
 */
interface OpportunityColumnProps {
  stage: string;
  opportunities: Opportunity[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  onDeleteOpportunity?: (opportunityId: number) => void;
}

/**
 * Custom comparison function for React.memo optimization
 * Compares props shallowly, with special handling for the opportunities array
 * to prevent unnecessary re-renders during drag-and-drop operations
 */
function arePropsEqual(
  prevProps: OpportunityColumnProps,
  nextProps: OpportunityColumnProps
): boolean {
  // Quick reference equality checks for primitives and stable callbacks
  if (prevProps.stage !== nextProps.stage) return false;
  if (prevProps.isCollapsed !== nextProps.isCollapsed) return false;
  if (prevProps.onToggleCollapse !== nextProps.onToggleCollapse) return false;
  if (prevProps.openSlideOver !== nextProps.openSlideOver) return false;
  if (prevProps.onDeleteOpportunity !== nextProps.onDeleteOpportunity) return false;

  // Deep comparison for opportunities array
  // Only re-render if the actual opportunity data changed
  const prevOpps = prevProps.opportunities;
  const nextOpps = nextProps.opportunities;

  if (prevOpps.length !== nextOpps.length) return false;

  // Compare opportunity IDs and ALL fields that affect card rendering
  // (both collapsed header AND expanded details section)
  for (let i = 0; i < prevOpps.length; i++) {
    const prev = prevOpps[i];
    const next = nextOpps[i];
    if (
      // Header (always visible)
      prev.id !== next.id ||
      prev.name !== next.name ||
      prev.stage !== next.stage ||
      prev.days_since_last_activity !== next.days_since_last_activity ||
      // Expanded details section
      prev.description !== next.description ||
      prev.priority !== next.priority ||
      prev.principal_organization_name !== next.principal_organization_name ||
      prev.estimated_close_date !== next.estimated_close_date ||
      prev.days_in_stage !== next.days_in_stage ||
      prev.pending_task_count !== next.pending_task_count ||
      prev.overdue_task_count !== next.overdue_task_count ||
      // Products count (compare array length, not deep equality)
      (prev.products?.length ?? 0) !== (next.products?.length ?? 0)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * OpportunityColumn - A Kanban column for displaying opportunities in a specific stage
 *
 * Performance: Wrapped with React.memo and custom comparison to prevent re-renders
 * when other columns are being interacted with during drag-and-drop operations.
 */
export const OpportunityColumn = React.memo(function OpportunityColumn({
  stage,
  opportunities,
  isCollapsed = false,
  onToggleCollapse,
  openSlideOver,
  onDeleteOpportunity,
}: OpportunityColumnProps) {
  const metrics = useStageMetrics(opportunities);

  // Map elevation levels to semantic shadow utilities (design system compliant)
  // Uses shadow-elevation-* utilities defined in index.css, which map to --elevation-* tokens
  const elevation = getOpportunityStageElevation(stage);
  const shadowConfig = {
    1: {
      rest: "shadow-elevation-1",
      hover: "hover:shadow-elevation-2",
    },
    2: {
      rest: "shadow-elevation-2",
      hover: "hover:shadow-elevation-3",
    },
    3: {
      rest: "shadow-elevation-3",
      hover: "hover:shadow-elevation-3",
    },
  }[elevation];

  return (
    <div
      className={`
  flex flex-col pb-4 bg-card border border-border rounded-xl shadow-col-inner
  ${shadowConfig.rest} ${shadowConfig.hover}
  transition-[box-shadow,border-color] duration-200 ease-in-out px-2
  min-w-[220px] max-w-[260px]
  md:min-w-[240px] md:max-w-[280px]
  lg:min-w-[260px] lg:max-w-[300px]
  h-full max-h-full overflow-hidden shrink-0
`}
      data-testid="kanban-column"
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border px-2 py-1.5">
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={isCollapsed ? "Expand column" : "Collapse column"}
              type="button"
            >
              {isCollapsed ? "▶" : "▼"}
            </button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <h2
                className="font-semibold text-base text-foreground cursor-help"
                style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
              >
                {getOpportunityStageLabel(stage)}
              </h2>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-[320px] bg-popover text-popover-foreground border border-border shadow-lg"
            >
              <div className="space-y-2 p-1">
                {/* Stage description */}
                <p className="text-sm leading-relaxed">{getOpportunityStageDescription(stage)}</p>
                {/* MFB Phase mapping (PRD Section 7.4) */}
                {getOpportunityMfbPhase(stage) && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-primary">
                      📋 MFB {getOpportunityMfbPhase(stage)?.phase}:{" "}
                      {getOpportunityMfbPhase(stage)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getOpportunityMfbPhase(stage)?.context}
                    </p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          <span className="text-sm text-muted-foreground">({metrics.count})</span>
        </div>

        {!isCollapsed && metrics.count > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span title="Average days in this stage">~{metrics.avgDaysInStage}d</span>
            {metrics.stuckCount > 0 && (
              <span
                className="text-warning"
                title={`Opportunities stuck >${STUCK_THRESHOLD_DAYS} days`}
              >
                ⚠ {metrics.stuckCount}
              </span>
            )}
          </div>
        )}
      </div>
      {!isCollapsed && (
        <>
          <div className="mb-2 px-1">
            <QuickAddOpportunity stage={stage} />
          </div>
          <Droppable droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex flex-col flex-1 rounded-xl mt-1 gap-1.5 pb-2 min-h-[80px] overflow-y-auto overflow-x-hidden transition-colors px-1 ${
                  snapshot.isDraggingOver ? "bg-accent" : ""
                }`}
              >
                {opportunities.map((opportunity, index) => (
                  <RecordContextProvider key={opportunity.id} value={opportunity}>
                    <OpportunityCard index={index} openSlideOver={openSlideOver} onDelete={onDeleteOpportunity} />
                  </RecordContextProvider>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </>
      )}
    </div>
  );
}, arePropsEqual);
