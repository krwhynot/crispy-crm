/**
 * Centralized choice constants for select inputs
 * Single source of truth for static dropdown options
 */

export const US_TIMEZONES = [
  { id: "America/New_York", name: "Eastern Time (ET)" },
  { id: "America/Chicago", name: "Central Time (CT)" },
  { id: "America/Denver", name: "Mountain Time (MT)" },
  { id: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { id: "America/Phoenix", name: "Arizona (no DST)" },
  { id: "America/Anchorage", name: "Alaska Time (AKT)" },
  { id: "Pacific/Honolulu", name: "Hawaii Time (HST)" },
  { id: "UTC", name: "UTC" },
] as const;

export type USTimezone = (typeof US_TIMEZONES)[number]["id"];

// Re-export from existing locations (maintain single source of truth)
export { US_STATES } from "@/atomic-crm/organizations/constants";
export { LEAD_SOURCE_CHOICES } from "@/atomic-crm/opportunities/constants";
