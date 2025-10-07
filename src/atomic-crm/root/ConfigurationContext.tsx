/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
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

export interface ConfigurationProviderProps extends ConfigurationContextValue {
  children: ReactNode;
}

// Create context with default value
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

export const ConfigurationProvider = ({
  children,
  dealCategories,
  dealPipelineStatuses,
  dealStages,
  opportunityCategories,
  opportunityStages,
  darkModeLogo,
  lightModeLogo,
  noteStatuses,
  taskTypes,
  title,
  contactGender,
}: ConfigurationProviderProps) => (
  <ConfigurationContext.Provider
    value={{
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
    }}
  >
    {children}
  </ConfigurationContext.Provider>
);

export const useConfigurationContext = () => useContext(ConfigurationContext);
