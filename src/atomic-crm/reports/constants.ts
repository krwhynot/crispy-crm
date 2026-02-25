/**
 * Shared constants for report filter presets.
 *
 * Extracted from TabFilterBar and CampaignActivityReport so that
 * sidebar filter components can reference the same presets without
 * importing the now-deleted toolbar component.
 */

export interface DatePresetOption {
  value: string;
  label: string;
}

/** Unified superset of all report date presets */
export const REPORT_DATE_PRESETS: DatePresetOption[] = [
  { value: "allTime", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

/** Standard date presets used by Overview and other tabs (compatibility export) */
export const DATE_PRESETS: DatePresetOption[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

/** Campaign-specific date presets (compatibility export) */
export const CAMPAIGN_DATE_PRESETS: DatePresetOption[] = [
  { value: "allTime", label: "All time" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "custom", label: "Custom range" },
];
