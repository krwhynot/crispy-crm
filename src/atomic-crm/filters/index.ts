/**
 * Filter system exports
 * Central export point for all filter-related utilities and components
 */

// Components
export { FilterChip } from "./FilterChip";
export { FilterChipBar } from "./FilterChipBar";
export { FilterChipsPanel } from "./FilterChipsPanel";
export { FilterSidebar } from "./FilterSidebar";
export { FilterCategory } from "./FilterCategory";

// Hooks
export { useFilterChipBar } from "./useFilterChipBar";
export { useFilterManagement } from "./useFilterManagement";
export { useOrganizationNames } from "./useOrganizationNames";
export { useSalesNames } from "./useSalesNames";
export { useTagNames } from "./useTagNames";
export { useSegmentNames } from "./useSegmentNames";
export { useCategoryNames } from "./useCategoryNames";
// NOTE: Per-feature filter chip hooks (useOrganizationFilterChips, etc.) have been replaced
// by the unified useFilterChipBar hook and FilterChipBar component.

// Schema & Validation
export { validateFilterConfig } from "./filterConfigSchema";
export type { ChipFilterConfig, FilterChoice } from "./filterConfigSchema";
// NOTE: ChipFilterConfig renamed to avoid collision with existing FilterConfig in types.ts

// Hook types
export type { ChipData, UseFilterChipBarReturn } from "./useFilterChipBar";

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
