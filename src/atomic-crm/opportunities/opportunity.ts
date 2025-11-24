import type { OpportunityStage } from "./constants/stageConstants";
import { getOpportunityStageLabel } from "./constants/stageConstants";

export type { OpportunityStage } from "./constants/stageConstants";

export const findOpportunityLabel = (
  opportunityStages: OpportunityStage[],
  opportunityValue: string
) => {
  // Use centralized stage label lookup instead of array search
  return getOpportunityStageLabel(opportunityValue);
};

// Legacy compatibility - use centralized lookup
export { findOpportunityLabel as legacyFindOpportunityLabel } from "./constants/stageConstants";
