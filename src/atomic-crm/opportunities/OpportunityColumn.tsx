import { Droppable } from "@hello-pangea/dnd";

import type { Opportunity } from "../types";
import { findOpportunityLabel } from "./opportunity";
import { OpportunityCard } from "./OpportunityCard";

export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  const totalAmount = opportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0);

  const opportunityStages = [
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'needs_analysis', label: 'Needs Analysis' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
    { value: 'nurturing', label: 'Nurturing' }
  ];

  return (
    <div className="flex-1 pb-8">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {findOpportunityLabel(opportunityStages, stage)}
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
              <OpportunityCard key={opportunity.id} opportunity={opportunity} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};