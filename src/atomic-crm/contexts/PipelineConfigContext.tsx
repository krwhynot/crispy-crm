/**
 * PipelineConfigContext - Sales pipeline configuration
 *
 * This context holds pipeline-related configuration: stages, categories,
 * and pipeline statuses. These values define the sales process flow and
 * are used by opportunity and deal components.
 *
 * Part of P2-1 fix: ConfigurationContext split into focused contexts
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DealStage } from "../types";
import {
  defaultDealStages,
  defaultDealPipelineStatuses,
  defaultDealCategories,
  defaultOpportunityStages,
  defaultOpportunityCategories,
} from "../root/defaultConfiguration";

export interface PipelineConfig {
  /** Stages for legacy deal workflow */
  dealStages: DealStage[];
  /** Statuses indicating a deal is in the pipeline */
  dealPipelineStatuses: string[];
  /** Categories for deals */
  dealCategories: string[];
  /** Stages for opportunity workflow (MFB pipeline) */
  opportunityStages: { value: string; label: string }[];
  /** Categories for opportunities */
  opportunityCategories: string[];
}

const defaultPipelineConfig: PipelineConfig = {
  dealStages: defaultDealStages,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealCategories: defaultDealCategories,
  opportunityStages: defaultOpportunityStages,
  opportunityCategories: defaultOpportunityCategories,
};

export const PipelineConfigContext = createContext<PipelineConfig>(defaultPipelineConfig);

export interface PipelineConfigProviderProps extends Partial<PipelineConfig> {
  children: ReactNode;
}

export const PipelineConfigProvider = ({
  children,
  dealStages = defaultDealStages,
  dealPipelineStatuses = defaultDealPipelineStatuses,
  dealCategories = defaultDealCategories,
  opportunityStages = defaultOpportunityStages,
  opportunityCategories = defaultOpportunityCategories,
}: PipelineConfigProviderProps) => {
  const value = useMemo(
    () => ({
      dealStages,
      dealPipelineStatuses,
      dealCategories,
      opportunityStages,
      opportunityCategories,
    }),
    [dealStages, dealPipelineStatuses, dealCategories, opportunityStages, opportunityCategories]
  );

  return (
    <PipelineConfigContext.Provider value={value}>
      {children}
    </PipelineConfigContext.Provider>
  );
};

/**
 * Hook to access pipeline configuration (stages, categories)
 *
 * Use this when you need opportunity/deal stage info - prevents re-renders
 * when branding or form options change.
 */
export const usePipelineConfig = () => useContext(PipelineConfigContext);
