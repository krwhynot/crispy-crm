import { useCallback } from "react";
import { useListFilterContext } from "ra-core";
import { useOptionalFilterSidebarContext } from "@/components/layouts/FilterSidebarContext";
import { useFilterLayoutMode } from "./FilterLayoutModeContext";

interface PresetFilter {
  [key: string]: unknown;
}

interface UsePresetFilterResult {
  /** Check if a preset's filters are currently active */
  isPresetActive: (preset: PresetFilter) => boolean;
  /** Toggle a preset on/off. Sets orSource="preset" for $or. Auto-closes sheet on tablet. */
  handlePresetClick: (preset: PresetFilter) => void;
}

/**
 * Shared hook for quick-filter preset toggle behavior.
 * Extracts the duplicated isPresetActive/handlePresetClick pattern
 * from OpportunityListFilter and OrganizationSavedQueries.
 *
 * Sets orSource="preset" on FilterSidebarContext when applying $or presets,
 * and orSource=null when toggling OFF a $or preset.
 * Auto-closes the filter sheet on tablet when a preset is clicked.
 */
export function usePresetFilter(): UsePresetFilterResult {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const mode = useFilterLayoutMode();
  const sidebarContext = useOptionalFilterSidebarContext();
  const setOrSource = sidebarContext?.setOrSource;
  const setSheetOpen = sidebarContext?.setSheetOpen;

  const isPresetActive = useCallback(
    (preset: PresetFilter): boolean => {
      return Object.entries(preset).every(([key, value]) => {
        const currentValue = filterValues[key];
        if (Array.isArray(value)) {
          return JSON.stringify(currentValue) === JSON.stringify(value);
        }
        return currentValue === value;
      });
    },
    [filterValues]
  );

  const handlePresetClick = useCallback(
    (preset: PresetFilter) => {
      const hasOrKey = "$or" in preset;

      if (isPresetActive(preset)) {
        // Toggle OFF: remove preset keys from current filters
        const newFilters = { ...filterValues };
        for (const key of Object.keys(preset)) {
          delete newFilters[key];
        }
        setFilters(newFilters, displayedFilters);
        if (hasOrKey) setOrSource?.(null);
      } else {
        // Toggle ON: merge preset into current filters
        setFilters({ ...filterValues, ...preset }, displayedFilters);
        if (hasOrKey) setOrSource?.("preset");
      }

      // Auto-close sheet on tablet
      if (mode === "sheet") {
        setSheetOpen?.(false);
      }
    },
    [filterValues, displayedFilters, setFilters, isPresetActive, mode, setOrSource, setSheetOpen]
  );

  return { isPresetActive, handlePresetClick };
}
