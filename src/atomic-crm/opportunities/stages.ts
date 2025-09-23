import type { Opportunity } from "../types";

export type OpportunitiesByStage = Record<Opportunity["stage"], Opportunity[]>;

export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages: { value: string; label: string }[],
) => {
  if (!opportunityStages) return {};
  const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> = unorderedOpportunities.reduce(
    (acc, opportunity) => {
      acc[opportunity.stage].push(opportunity);
      return acc;
    },
    opportunityStages.reduce(
      (obj, stage) => ({ ...obj, [stage.value]: [] }),
      {} as Record<Opportunity["stage"], Opportunity[]>,
    ),
  );
  // order each column by index
  opportunityStages.forEach((stage) => {
    opportunitiesByStage[stage.value] = opportunitiesByStage[stage.value].sort(
      (recordA: Opportunity, recordB: Opportunity) => recordA.index - recordB.index,
    );
  });
  return opportunitiesByStage;
};