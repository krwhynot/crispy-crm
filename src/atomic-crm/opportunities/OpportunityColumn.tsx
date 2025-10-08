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
  return (
    <div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {getOpportunityStageLabel(stage)}
        </h3>
      </div>
      <div className="flex flex-col rounded-2xl mt-2 gap-2">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
          />
        ))}
      </div>
    </div>
  );
};
