/* eslint-disable react-refresh/only-export-components */
/**
 * ConfigurationContext - Combined configuration provider
 *
 * This module provides backward-compatible access to app configuration
 * while internally using focused contexts to prevent unnecessary re-renders.
 *
 * NEW PATTERN: Use the focused hooks directly for better performance:
 * - useAppBranding() - for title, logos
 * - usePipelineConfig() - for stages, categories
 * - useFormOptions() - for note statuses, task types, contact gender
 *
 * The combined useConfigurationContext() is kept for backward compatibility
 * but will cause re-renders when ANY config value changes.
 */
import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import type { ContactGender, DealStage, NoteStatus } from "../types";
import {
  defaultContactGender,
  defaultDarkModeLogo,
  defaultDealCategories,
  defaultDealPipelineStatuses,
  defaultDealStages,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultOpportunityCategories,
  defaultOpportunityStages,
  defaultTaskTypes,
  defaultTitle,
} from "./defaultConfiguration";
import { AppBrandingProvider, useAppBranding } from "../contexts/AppBrandingContext";
import { PipelineConfigProvider, usePipelineConfig } from "../contexts/PipelineConfigContext";
import { FormOptionsProvider, useFormOptions } from "../contexts/FormOptionsContext";

// Define types for the context value
export interface ConfigurationContextValue {
  dealCategories: string[];
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  opportunityCategories: string[];
  opportunityStages: { value: string; label: string }[];
  noteStatuses: NoteStatus[];
  taskTypes: string[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
  contactGender: ContactGender[];
}

export interface ConfigurationProviderProps extends Partial<ConfigurationContextValue> {
  children: ReactNode;
}

/**
 * @deprecated Use focused contexts instead for better performance:
 * - AppBrandingContext for title/logos
 * - PipelineConfigContext for stages/categories
 * - FormOptionsContext for note statuses/task types
 */
export const ConfigurationContext = createContext<ConfigurationContextValue>({
  dealCategories: defaultDealCategories,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealStages: defaultDealStages,
  opportunityCategories: defaultOpportunityCategories,
  opportunityStages: defaultOpportunityStages,
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
  contactGender: defaultContactGender,
});

/**
 * Combined configuration provider that wraps all focused contexts
 *
 * This provides backward compatibility while enabling focused context usage.
 * Components using useConfigurationContext() will work unchanged, but new
 * components should use the focused hooks for better performance.
 */
export const ConfigurationProvider = ({
  children,
  dealCategories = defaultDealCategories,
  dealPipelineStatuses = defaultDealPipelineStatuses,
  dealStages = defaultDealStages,
  opportunityCategories = defaultOpportunityCategories,
  opportunityStages = defaultOpportunityStages,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  contactGender = defaultContactGender,
}: ConfigurationProviderProps) => {
  // Combined value for backward compatibility
  const contextValue = useMemo(
    () => ({
      dealCategories,
      dealPipelineStatuses,
      dealStages,
      opportunityCategories,
      opportunityStages,
      darkModeLogo,
      lightModeLogo,
      noteStatuses,
      title,
      taskTypes,
      contactGender,
    }),
    [
      dealCategories,
      dealPipelineStatuses,
      dealStages,
      opportunityCategories,
      opportunityStages,
      darkModeLogo,
      lightModeLogo,
      noteStatuses,
      title,
      taskTypes,
      contactGender,
    ]
  );

  return (
    <AppBrandingProvider title={title} darkModeLogo={darkModeLogo} lightModeLogo={lightModeLogo}>
      <PipelineConfigProvider
        dealStages={dealStages}
        dealPipelineStatuses={dealPipelineStatuses}
        dealCategories={dealCategories}
        opportunityStages={opportunityStages}
        opportunityCategories={opportunityCategories}
      >
        <FormOptionsProvider
          noteStatuses={noteStatuses}
          taskTypes={taskTypes}
          contactGender={contactGender}
        >
          <ConfigurationContext.Provider value={contextValue}>
            {children}
          </ConfigurationContext.Provider>
        </FormOptionsProvider>
      </PipelineConfigProvider>
    </AppBrandingProvider>
  );
};

/**
 * @deprecated Use focused hooks for better performance:
 * - useAppBranding() for title, logos
 * - usePipelineConfig() for stages, categories
 * - useFormOptions() for note statuses, task types
 *
 * This combined hook causes re-renders when ANY config value changes.
 */
export const useConfigurationContext = () => useContext(ConfigurationContext);

// Re-export focused hooks for easy access
export { useAppBranding, usePipelineConfig, useFormOptions };
