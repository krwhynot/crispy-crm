/**
 * countReportActiveFilters — Count the number of active (non-default) report filters.
 *
 * Handles both global and tab-local filter state with special period-group logic:
 * customStart/customEnd are not counted independently — they are part of the
 * period filter. A half-filled custom range (periodPreset === "custom" with
 * either date null) counts as 0.
 */

/**
 * Count the number of active (non-default) report filters across global and tab-local state.
 * Period group rule: customStart/customEnd are not counted independently — they are part of
 * the period filter. Half-filled custom (periodPreset === "custom" with either date null) = 0.
 */
export function countReportActiveFilters(
  globalState: Record<string, unknown>,
  globalDefaults: Record<string, unknown>,
  localState?: Record<string, unknown>,
  localDefaults?: Record<string, unknown>
): number {
  let count = 0;

  // Count global fields (skip customStart/customEnd -- handled by period group)
  for (const key of Object.keys(globalDefaults)) {
    if (key === "customStart" || key === "customEnd") continue;

    if (key === "periodPreset") {
      // Period group rule: count as 1 only if preset is not default AND
      // not a half-filled custom range
      const preset = globalState[key];
      const defaultPreset = globalDefaults[key];
      if (preset !== defaultPreset) {
        if (preset === "custom") {
          // Only count if both dates are filled
          if (globalState.customStart != null && globalState.customEnd != null) {
            count++;
          }
        } else {
          count++;
        }
      }
      continue;
    }

    if (!isEqual(globalState[key], globalDefaults[key])) {
      count++;
    }
  }

  // Count local fields
  if (localState && localDefaults) {
    for (const key of Object.keys(localDefaults)) {
      if (!isEqual(localState[key], localDefaults[key])) {
        count++;
      }
    }
  }

  return count;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  }
  return false;
}
