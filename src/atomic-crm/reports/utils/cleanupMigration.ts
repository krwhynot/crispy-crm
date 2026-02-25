/**
 * Store migration utility for report filter state.
 *
 * Handles two migration generations:
 * - v2: Cleanup of pre-tabbed-interface localStorage keys
 * - v3: Migration from per-tab stores (reports.overview, reports.opportunities)
 *       to the unified GlobalReportFilterState store (reports.global)
 *
 * This function is idempotent -- it checks `reports.migration.completed` before
 * running and marks completion to avoid redundant work.
 *
 * Returns the migrated GlobalReportFilterState if old data was found, or null
 * if no migration was needed. Callers can use the returned state to seed the
 * new store on first load.
 */

import { devLog } from "@/lib/devLogger";
import { GLOBAL_DEFAULTS, type GlobalReportFilterState } from "../hooks/useReportFilterState";

const MIGRATION_VERSION = "v3";

/**
 * Migrate report stores from legacy per-tab format to unified global format.
 *
 * @returns Migrated GlobalReportFilterState if old data found, null otherwise.
 */
export function migrateReportStores(): GlobalReportFilterState | null {
  // Skip if migration already completed at current version
  if (localStorage.getItem("reports.migration.completed") === MIGRATION_VERSION) {
    return null;
  }

  // v2 cleanup keys (still relevant for users who skipped v2)
  const oldKeys = [
    "reports.opportunities.filters",
    "reports.weekly.filters",
    "reports.campaign.filters",
    "report-view-preference",
    "crm-report-sidebar-collapsed",
  ];

  // v3 migration: extract values from old per-tab stores
  let migrated: GlobalReportFilterState | null = null;

  try {
    const overviewRaw = localStorage.getItem("reports.overview");
    const opportunitiesRaw = localStorage.getItem("reports.opportunities");

    if (overviewRaw || opportunitiesRaw) {
      const overviewState = overviewRaw ? (JSON.parse(overviewRaw) as Record<string, unknown>) : {};
      const opportunitiesState = opportunitiesRaw
        ? (JSON.parse(opportunitiesRaw) as Record<string, unknown>)
        : {};

      migrated = {
        ...GLOBAL_DEFAULTS,
        // Extract periodPreset from overview.datePreset
        ...(typeof overviewState.datePreset === "string"
          ? { periodPreset: overviewState.datePreset }
          : {}),
        // Extract ownerId from overview.salesRepId
        ...(typeof overviewState.salesRepId === "number"
          ? { ownerId: overviewState.salesRepId }
          : {}),
        // Extract principalId from opportunities.principal_organization_id
        ...(typeof opportunitiesState.principal_organization_id === "number"
          ? { principalId: opportunitiesState.principal_organization_id }
          : {}),
      };

      if (import.meta.env.DEV) {
        devLog("Reports Migration", "Migrated v3 state from old stores", migrated);
      }
    }
  } catch {
    // If parsing fails, skip migration data extraction -- still clean up below
    if (import.meta.env.DEV) {
      devLog("Reports Migration", "Failed to parse old store data, skipping extraction");
    }
  }

  // Clean up all old keys (v2 + v3 source keys)
  const allOldKeys = [
    ...oldKeys,
    // v3 source keys
    "reports.overview",
    "reports.weekly",
  ];

  allOldKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Mark migration as complete
  localStorage.setItem("reports.migration.completed", MIGRATION_VERSION);

  if (import.meta.env.DEV) {
    devLog("Reports Migration", "Completed v3 migration, cleaned up old localStorage keys");
  }

  return migrated;
}

/**
 * Legacy alias for backward compatibility during migration.
 * @deprecated Use migrateReportStores() instead
 */
export function cleanupOldReportKeys(): void {
  migrateReportStores();
}
