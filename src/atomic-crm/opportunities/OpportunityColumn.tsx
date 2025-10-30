import { Droppable } from "@hello-pangea/dnd";
import type { Opportunity } from "../types";
import { OpportunityCard } from "./OpportunityCard";
import {
  getOpportunityStageLabel,
  getOpportunityStageColor,
  getOpportunityStageElevation
} from "./stageConstants";

export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  // Map elevation levels to semantic shadow tokens
  const elevation = getOpportunityStageElevation(stage);
  const shadowConfig = {
    1: {
      rest: 'shadow-[var(--shadow-card-1)]',
      hover: 'hover:shadow-[var(--shadow-card-1-hover)]'
    },
    2: {
      rest: 'shadow-[var(--shadow-card-2)]',
      hover: 'hover:shadow-[var(--shadow-card-2-hover)]'
    },
    3: {
      rest: 'shadow-[var(--shadow-card-3)]',
      hover: 'hover:shadow-[var(--shadow-card-3-hover)]'
    }
  }[elevation];

  return (
    <div className={`flex-1 pb-8 min-w-[240px] max-w-[280px] bg-card border border-[var(--border)] rounded-2xl shadow-[var(--shadow-col-inner)] ${shadowConfig.rest} ${shadowConfig.hover} transition-[box-shadow,border-color] duration-200 ease-in-out px-3`}>
      <div className="flex flex-col items-center">
        <h3
          className="px-3 py-2 text-sm font-bold uppercase tracking-wider bg-accent shadow-[inset_0_-1px_0_var(--border)] w-full text-center"
          style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
        >
          {getOpportunityStageLabel(stage)}
          <span className="text-[11px] text-[color:var(--text-subtle)] ml-1 font-normal">
            ({opportunities.length})
          </span>
        </h3>
      </div>
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col rounded-2xl mt-2 gap-2 pb-3 min-h-[100px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-[var(--accent)]' : ''
            }`}
          >
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
