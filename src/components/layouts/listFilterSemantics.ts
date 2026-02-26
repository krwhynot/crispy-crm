export const LIST_SYSTEM_FILTER_KEYS = new Set(["deleted_at", "deleted_at@is", "$or"]);

function hasMeaningfulValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

export function getActiveUserFilterKeys(
  filterValues: Record<string, unknown> | undefined
): string[] {
  if (!filterValues) {
    return [];
  }

  return Object.entries(filterValues)
    .filter(([key, value]) => !LIST_SYSTEM_FILTER_KEYS.has(key) && hasMeaningfulValue(value))
    .map(([key]) => key);
}

export function countActiveUserFilters(filterValues: Record<string, unknown> | undefined): number {
  return getActiveUserFilterKeys(filterValues).length;
}

export function hasActiveUserFilters(filterValues: Record<string, unknown> | undefined): boolean {
  return countActiveUserFilters(filterValues) > 0;
}

export function countActiveUserFiltersWithOrSource(
  filterValues: Record<string, unknown> | undefined,
  orSource: "preset" | "owner" | null
): number {
  const base = countActiveUserFilters(filterValues);
  const hasOr = Array.isArray(filterValues?.$or) && (filterValues.$or as unknown[]).length > 0;
  const orBonus = orSource === "preset" && hasOr ? 1 : 0;
  return base + orBonus;
}

export function hasActiveUserFiltersWithOrSource(
  filterValues: Record<string, unknown> | undefined,
  orSource: "preset" | "owner" | null
): boolean {
  return countActiveUserFiltersWithOrSource(filterValues, orSource) > 0;
}
