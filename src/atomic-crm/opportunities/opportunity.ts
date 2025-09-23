export type OpportunityStage = {
  value: string;
  label: string;
};

export const findOpportunityLabel = (opportunityStages: OpportunityStage[], opportunityValue: string) => {
  return opportunityStages.find((opportunityStage) => opportunityStage.value === opportunityValue)?.label;
};