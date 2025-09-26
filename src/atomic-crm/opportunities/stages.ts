import type { Opportunity } from "../types";
import { OPPORTUNITY_STAGES } from "./stageConstants";

export type OpportunitiesByStage = Record<Opportunity["stage"], Opportunity[]>;

export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[],
) => {
  // Use centralized stages if no stages provided
  const stages =
    opportunityStages ||
    OPPORTUNITY_STAGES.map((stage) => ({
      value: stage.value,
      label: stage.label,
    }));

  if (!stages.length) return {};

  const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> =
    unorderedOpportunities.reduce(
      (acc, opportunity) => {
        if (acc[opportunity.stage]) {
          acc[opportunity.stage].push(opportunity);
        }
        return acc;
      },
      stages.reduce(
        (obj, stage) => ({ ...obj, [stage.value]: [] }),
        {} as Record<Opportunity["stage"], Opportunity[]>,
      ),
    );
  // order each column by index
  stages.forEach((stage) => {
    if (opportunitiesByStage[stage.value]) {
      opportunitiesByStage[stage.value] = opportunitiesByStage[
        stage.value
      ].sort(
        (recordA: Opportunity, recordB: Opportunity) =>
          recordA.index - recordB.index,
      );
    }
  });
  return opportunitiesByStage;
};
