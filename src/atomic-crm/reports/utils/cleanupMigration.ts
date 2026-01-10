/**
 * Cleanup migration utility for transitioning from old reports to tabbed interface
 * Removes localStorage keys used by the previous reports implementation
 *
 * This function is idempotent - it checks if migration was already performed
 * before cleaning up keys, avoiding unnecessary localStorage operations.
 */

import { devLog } from "@/lib/devLogger";

export function cleanupOldReportKeys(): void {
  // Skip if migration already completed
  if (localStorage.getItem("reports.migration.completed") === "true") {
    return;
  }

  const oldKeys = [
    "reports.opportunities.filters",
    "reports.weekly.filters",
    "reports.campaign.filters",
    "report-view-preference",
  ];

  oldKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Mark migration as complete
  localStorage.setItem("reports.migration.completed", "true");

  if (process.env.NODE_ENV === "development") {
    devLog("Reports Migration", "Cleaned up old localStorage keys");
  }
}
