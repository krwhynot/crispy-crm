/**
 * useReportFilterResets — Pure functions for cascading filter resets.
 *
 * These functions compute partial state updates for global report filters,
 * handling dependent field resets (e.g., clearing product when principal changes)
 * and chip-removal logic.
 *
 * Pure functions (no hooks) so they can be tested without React context.
 */

import type { GlobalReportFilterState } from "./useReportFilterState";
import { GLOBAL_DEFAULTS } from "./useReportFilterState";

/**
 * Compute cascading field updates when a global filter value changes.
 * Returns a partial update to merge into the current state.
 */
export function applyGlobalFilterCascades(
  field: keyof GlobalReportFilterState,
  newValue: GlobalReportFilterState[keyof GlobalReportFilterState],
  currentState: GlobalReportFilterState,
  defaults: GlobalReportFilterState = GLOBAL_DEFAULTS
): Partial<GlobalReportFilterState> {
  const updates: Partial<GlobalReportFilterState> = {};

  // Changing principal clears product (product is scoped to principal)
  if (field === "principalId" && currentState.productId !== null) {
    updates.productId = null;
  }

  // Changing period preset away from "custom" clears custom date fields
  if (field === "periodPreset" && newValue !== "custom") {
    updates.customStart = null;
    updates.customEnd = null;
  }

  // Clearing customStart while customEnd is also null and preset is "custom"
  // reverts preset to default (no half-empty custom range)
  if (
    field === "customStart" &&
    newValue === null &&
    currentState.customEnd === null &&
    currentState.periodPreset === "custom"
  ) {
    updates.periodPreset = defaults.periodPreset;
  }

  // Clearing customEnd while customStart is also null and preset is "custom"
  // reverts preset to default (no half-empty custom range)
  if (
    field === "customEnd" &&
    newValue === null &&
    currentState.customStart === null &&
    currentState.periodPreset === "custom"
  ) {
    updates.periodPreset = defaults.periodPreset;
  }

  return updates;
}

/**
 * Compute the update to apply when removing a filter via chip removal.
 * Delegates to applyGlobalFilterCascades with the default value.
 */
export function buildChipRemovalUpdate(
  field: keyof GlobalReportFilterState,
  currentState: GlobalReportFilterState,
  defaults: GlobalReportFilterState = GLOBAL_DEFAULTS
): Partial<GlobalReportFilterState> {
  return applyGlobalFilterCascades(field, defaults[field], currentState, defaults);
}
