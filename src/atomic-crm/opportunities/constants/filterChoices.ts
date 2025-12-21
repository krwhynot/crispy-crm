/**
 * Centralized filter choice definitions for opportunities
 * Single source of truth for all filter options
 */

import { OPPORTUNITY_STAGE_CHOICES } from "./stageConstants";
import { priorityChoices } from "./priorityChoices";

// Re-export for convenience
export { OPPORTUNITY_STAGE_CHOICES as stageChoices, priorityChoices };

/**
 * Filter configuration for opportunities
 * Defines available filters and their properties
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiselect" | "reference" | "search" | "toggle";
  choices?: Array<{ id: string; name: string }>;
  defaultValue?: string | number | boolean | string[];
  dynamicChoices?: boolean;
  reference?: string;
}

/**
 * Complete filter configuration for opportunities
 */
export const opportunityFilters: Record<string, FilterConfig> = {
  search: {
    key: "q",
    label: "Search",
    type: "search",
  },
  customer_organization: {
    key: "customer_organization_id",
    label: "Customer",
    type: "reference",
    reference: "organizations",
  },
  priority: {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: priorityChoices,
  },
  stage: {
    key: "stage",
    label: "Stage",
    type: "multiselect",
    choices: OPPORTUNITY_STAGE_CHOICES,
  },
  only_mine: {
    key: "only_mine",
    label: "Only Mine",
    type: "toggle",
    defaultValue: false,
  },
};

/**
 * Get default visible stages (excludes closed stages)
 */
export const getDefaultVisibleStages = (): string[] => {
  return OPPORTUNITY_STAGE_CHOICES.filter(
    (stage) => !["closed_won", "closed_lost"].includes(stage.id)
  ).map((stage) => stage.id);
};

/**
 * Get choice by ID for a specific filter
 */
export const getFilterChoice = (
  filterKey: string,
  choiceId: string
): { id: string; name: string } | undefined => {
  const filter = opportunityFilters[filterKey];
  if (!filter?.choices) {
    return undefined;
  }
  return filter.choices.find((choice) => choice.id === choiceId);
};

/**
 * Format filter value for display
 */
export const formatFilterValue = (filterKey: string, value: any): string => {
  const choice = getFilterChoice(filterKey, value);
  return choice?.name || String(value);
};
