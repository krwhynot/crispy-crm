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

/** Standard date presets used by Overview and other tabs */
export const DATE_PRESETS: DatePresetOption[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

/** Campaign-specific date presets (includes "All time" and "Custom range") */
export const CAMPAIGN_DATE_PRESETS: DatePresetOption[] = [
  { value: "allTime", label: "All time" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "custom", label: "Custom range" },
];
