import { Droppable } from "@hello-pangea/dnd";
import { RecordContextProvider } from "react-admin";
import type { Opportunity } from "../types";
import { OpportunityCard } from "./OpportunityCard";
import {
  getOpportunityStageLabel,
  getOpportunityStageColor,
  getOpportunityStageElevation,
} from "./constants/stageConstants";
import { useStageMetrics, STUCK_THRESHOLD_DAYS } from "./hooks/useStageMetrics";
import { QuickAddOpportunity } from "./QuickAddOpportunity";

export const OpportunityColumn = ({
  stage,
  opportunities,
  isCollapsed = false,
  onToggleCollapse,
  openSlideOver,
}: {
  stage: string;
  opportunities: Opportunity[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}) => {
  const metrics = useStageMetrics(opportunities);

  // Map elevation levels to semantic shadow tokens
  const elevation = getOpportunityStageElevation(stage);
  const shadowConfig = {
    1: {
      rest: "shadow-[var(--shadow-card-1)]",
      hover: "hover:shadow-[var(--shadow-card-1-hover)]",
    },
    2: {
      rest: "shadow-[var(--shadow-card-2)]",
      hover: "hover:shadow-[var(--shadow-card-2-hover)]",
    },
    3: {
      rest: "shadow-[var(--shadow-card-3)]",
      hover: "hover:shadow-[var(--shadow-card-3-hover)]",
    },
  }[elevation];

  return (
    <div
      className={`flex-1 pb-8 min-w-[240px] max-w-[280px] bg-card border border-border rounded-2xl shadow-[var(--shadow-col-inner)] ${shadowConfig.rest} ${shadowConfig.hover} transition-[box-shadow,border-color] duration-200 ease-in-out px-3`}
      data-testid="kanban-column"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isCollapsed ? "Expand column" : "Collapse column"}
              type="button"
            >
              {isCollapsed ? "▶" : "▼"}
            </button>
          )}
          <h2
            className="font-semibold text-base text-foreground"
            style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
          >
            {getOpportunityStageLabel(stage)}
          </h2>
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
          <div className="mb-3 px-3">
            <QuickAddOpportunity stage={stage} />
          </div>
          <Droppable droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex flex-col rounded-2xl mt-2 gap-2 pb-3 min-h-[100px] transition-colors ${
                  snapshot.isDraggingOver ? "bg-accent" : ""
                }`}
              >
                {opportunities.map((opportunity, index) => (
                  <RecordContextProvider key={opportunity.id} value={opportunity}>
                    <OpportunityCard index={index} openSlideOver={openSlideOver} />
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
};
