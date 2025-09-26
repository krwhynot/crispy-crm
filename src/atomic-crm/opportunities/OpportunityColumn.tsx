import { Droppable } from "@hello-pangea/dnd";

import type { Opportunity } from "../types";
import { OpportunityCard } from "./OpportunityCard";
import { getOpportunityStageLabel } from "./stageConstants";

export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  const totalAmount = opportunities.reduce(
    (sum, opportunity) => sum + opportunity.amount,
    0,
  );

  return (
    <div className="flex-1 pb-8">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {getOpportunityStageLabel(stage)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {totalAmount.toLocaleString("en-US", {
            notation: "compact",
            style: "currency",
            currency: "USD",
            currencyDisplay: "narrowSymbol",
            minimumSignificantDigits: 3,
          })}
        </p>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-2xl mt-2 gap-2 ${
              snapshot.isDraggingOver ? "bg-muted" : ""
            }`}
          >
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
              />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
