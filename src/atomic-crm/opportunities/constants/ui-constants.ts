/**
 * UI constants and filter configuration
 * Depends on: stage-enums, stage-config
 */

import { addDays } from "date-fns";
import { CLOSED_STAGES, STAGE } from "./stage-enums";
import { OPPORTUNITY_STAGE_CHOICES } from "./stage-config";

// ============================================================================
// UI CONSTANTS
// ============================================================================

/** Minimum width for detail field columns (150px) */
export const DETAIL_FIELD_MIN_WIDTH = "min-w-[150px]";

/** Touch target minimum height - WCAG AA compliant (44px) */
export const TOUCH_TARGET_MIN_HEIGHT = "min-h-[44px]";

/** Standard action button height (44px) */
export const ACTION_BUTTON_HEIGHT = "h-11";

// ============================================================================
// LEAD SOURCE CHOICES
// ============================================================================

/**
 * Lead source choices
 * Extracted from LeadSourceInput.tsx to support Fast Refresh
 */
export const LEAD_SOURCE_CHOICES = [
  { id: "referral", name: "Referral" },
  { id: "trade_show", name: "Trade Show" },
  { id: "website", name: "Website" },
  { id: "cold_call", name: "Cold Call" },
  { id: "email_campaign", name: "Email Campaign" },
  { id: "social_media", name: "Social Media" },
  { id: "partner", name: "Partner" },
  { id: "existing_customer", name: "Existing Customer" },
];

// ============================================================================
// PRIORITY CHOICES
// ============================================================================

/**
 * Priority choice definitions for opportunities
 * Centralized to maintain single source of truth
 */
export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

export type PriorityLevel = "low" | "medium" | "high" | "critical";

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

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
  const closedStagesArray = [...CLOSED_STAGES] as string[];
  return OPPORTUNITY_STAGE_CHOICES.filter((stage) => !closedStagesArray.includes(stage.id)).map(
    (stage) => stage.id
  );
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
export const formatFilterValue = (filterKey: string, value: string | number | boolean): string => {
  const choice = getFilterChoice(filterKey, String(value));
  return choice?.name || String(value);
};

// ============================================================================
// FILTER PRESETS
// ============================================================================

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  icon?: string; // lucide-react icon name
  filters: Record<string, unknown>;
}

/**
 * Get filter preset configurations
 * @param userId - Current user ID for "My Opportunities" filter
 */
export const getFilterPresets = (userId?: string): FilterPreset[] => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  return [
    {
      id: "my-opportunities",
      label: "My Opportunities",
      description: "Opportunities I manage",
      icon: "User",
      filters: {
        opportunity_owner_id: userId,
      },
    },
    {
      id: "closing-this-month",
      label: "Closing This Month",
      description: "Opportunities with expected close date within 30 days",
      icon: "Calendar",
      filters: {
        estimated_close_date_gte: today.toISOString().split("T")[0],
        estimated_close_date_lte: thirtyDaysFromNow.toISOString().split("T")[0],
      },
    },
    {
      id: "high-priority",
      label: "High Priority",
      description: "Critical and high priority opportunities",
      icon: "AlertCircle",
      filters: {
        priority: ["high", "critical"],
      },
    },
    {
      id: "needs-action",
      label: "Needs Action",
      description: "Opportunities with overdue or upcoming actions",
      icon: "Flag",
      filters: {
        next_action_date_lte: today.toISOString().split("T")[0],
      },
    },
    {
      id: "recent-wins",
      label: "Recent Wins",
      description: "Opportunities closed won in the last 30 days",
      icon: "Trophy",
      filters: {
        stage: STAGE.CLOSED_WON,
        updated_at_gte: addDays(today, -30).toISOString().split("T")[0],
      },
    },
  ];
};

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * Re-export for convenience (aliased names for backward compatibility)
 */
export { OPPORTUNITY_STAGE_CHOICES as stageChoices };
