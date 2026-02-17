/**
 * Cleanup migration utility for transitioning from old reports to tabbed interface
 * Removes localStorage keys used by the previous reports implementation
 *
 * This function is idempotent - it checks if migration was already performed
 * before cleaning up keys, avoiding unnecessary localStorage operations.
 */

import { devLog } from "@/lib/devLogger";

const MIGRATION_VERSION = "v2";

export function cleanupOldReportKeys(): void {
  // Skip if migration already completed at current version
  if (localStorage.getItem("reports.migration.completed") === MIGRATION_VERSION) {
    return;
  }

  const oldKeys = [
    "reports.opportunities.filters",
    "reports.weekly.filters",
    "reports.campaign.filters",
    "report-view-preference",
    // v2: sidebar collapse state orphaned after parameter bar migration
    "crm-report-sidebar-collapsed",
  ];

  oldKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Mark migration as complete
  localStorage.setItem("reports.migration.completed", MIGRATION_VERSION);

  if (process.env.NODE_ENV === "development") {
    devLog("Reports Migration", "Cleaned up old localStorage keys");
  }
}
