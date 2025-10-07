import type {
  OpportunityStage} from "./stageConstants";
import {
  getOpportunityStageLabel,
  findOpportunityLabel as legacyFindOpportunityLabel
} from "./stageConstants";

export type { OpportunityStage } from "./stageConstants";

export const findOpportunityLabel = (
  opportunityStages: OpportunityStage[],
  opportunityValue: string,
) => {
  // Use centralized stage label lookup instead of array search
  return getOpportunityStageLabel(opportunityValue);
};

// Legacy compatibility - use centralized lookup
export { findOpportunityLabel as legacyFindOpportunityLabel } from "./stageConstants";
