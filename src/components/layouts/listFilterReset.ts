import { LIST_SYSTEM_FILTER_KEYS } from "./listFilterSemantics";

/**
 * Reset filters to default state. Preserves system filters and merges
 * with defaultFilters (e.g., { disabled: false } for Sales).
 *
 * When orSource is "preset", the $or filter is cleared along with user filters.
 * When orSource is "owner" or null, $or is preserved as a system filter.
 */
export function resetListFilters(
  setFilters: (filters: Record<string, unknown>, displayedFilters?: unknown) => void,
  displayedFilters: unknown,
  defaultFilters?: Record<string, unknown>,
  currentFilterValues?: Record<string, unknown>,
  orSource?: "preset" | "owner" | null,
  setOrSource?: (source: null) => void
): void {
  const systemFilters = currentFilterValues
    ? Object.fromEntries(
        Object.entries(currentFilterValues).filter(([key]) => {
          if (key === "$or") return orSource !== "preset";
          return LIST_SYSTEM_FILTER_KEYS.has(key);
        })
      )
    : {};

  setFilters({ ...systemFilters, ...defaultFilters }, displayedFilters);
  if (orSource === "preset") setOrSource?.(null);
}
