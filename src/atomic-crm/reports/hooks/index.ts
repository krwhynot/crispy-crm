/**
 * Reports Hooks Barrel Export
 *
 * Centralizes hook exports for the reports module.
 * Import from this file rather than individual hook files.
 */

export { useReportData } from "./useReportData";
export { useChartTheme, type ChartTheme } from "./useChartTheme";
export { useScrollFadeRight } from "./useScrollFadeRight";
export {
  useReportFilterState,
  buildReportShareUrl,
  GLOBAL_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
  type GlobalReportFilterState,
  type CampaignFilterState,
  type OpportunitiesFilterState,
} from "./useReportFilterState";
export { applyGlobalFilterCascades, buildChipRemovalUpdate } from "./useReportFilterResets";
export { countReportActiveFilters } from "./useReportFilterCount";
export {
  useProductFilteredOpportunityIds,
  ProductTruncationAlert,
  type ProductFilterResult,
} from "./useProductFilteredOpportunityIds";
