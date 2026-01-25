import type { OpportunityStage } from "./constants";
import { getOpportunityStageLabel } from "./constants";

export type { OpportunityStage } from "./constants";

export const findOpportunityLabel = (
  opportunityStages: OpportunityStage[],
  opportunityValue: string
) => {
  // Use centralized stage label lookup instead of array search
  return getOpportunityStageLabel(opportunityValue);
};

export { findOpportunityLabel as legacyFindOpportunityLabel } from "./constants";
