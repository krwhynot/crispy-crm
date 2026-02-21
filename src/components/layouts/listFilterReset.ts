import { LIST_SYSTEM_FILTER_KEYS } from "./listFilterSemantics";

/**
 * Reset filters to default state. Preserves system filters and merges
 * with defaultFilters (e.g., { disabled: false } for Sales).
 */
export function resetListFilters(
  setFilters: (filters: Record<string, unknown>, displayedFilters?: unknown) => void,
  displayedFilters: unknown,
  defaultFilters?: Record<string, unknown>,
  currentFilterValues?: Record<string, unknown>
): void {
  const systemFilters = currentFilterValues
    ? Object.fromEntries(
        Object.entries(currentFilterValues).filter(([key]) => LIST_SYSTEM_FILTER_KEYS.has(key))
      )
    : {};

  setFilters({ ...systemFilters, ...defaultFilters }, displayedFilters);
}
