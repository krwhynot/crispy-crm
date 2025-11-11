/**
 * Filter system exports
 * Central export point for all filter-related utilities and components
 */

// Components
export { FilterChip } from "./FilterChip";
export { FilterChipsPanel } from "./FilterChipsPanel";

// Hooks
export { useFilterManagement } from "./useFilterManagement";
export { useOrganizationNames } from "./useOrganizationNames";
export { useSalesNames } from "./useSalesNames";
export { useTagNames } from "./useTagNames";
export { useOpportunityFilters } from "./useOpportunityFilters";

// Utilities
export * from "./filterFormatters";
export * from "./filterPrecedence";
export {
  getStoredStagePreferences,
  saveStagePreferences,
  getDefaultVisibleStages,
  getInitialStageFilter,
} from "./opportunityStagePreferences";

// Types
export * from "./types";
