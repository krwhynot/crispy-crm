import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityFilterChips } from "./useActivityFilterChips";

/**
 * SidebarActiveFilters Component for Activities
 *
 * Displays active filter chips in the sidebar filter panel.
 * Auto-hides when no filters are active.
 *
 * Features:
 * - Shows count of active filters
 * - Clear All button to reset all filters
 * - Individual filter removal via X button
 * - Touch-friendly targets (44px minimum)
 */
export const SidebarActiveFilters = () => {
  const { chips, removeFilterValue, clearAllFilters, hasActiveFilters } =
    useActivityFilterChips();

  // Auto-hide when no filters
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header with count and Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Active Filters ({chips.length})
        </h3>
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
        >
          Clear All
        </button>
      </div>

      {/* Vertically stacked filter chips */}
      <div className="flex flex-col gap-1.5">
        {chips.map((chip, index) => (
          <div
            key={`${chip.key}-${chip.value}-${index}`}
            className={cn(
              "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md",
              "bg-muted border border-border",
              "group hover:border-border transition-colors"
            )}
            title={`${chip.category}: ${chip.label}`}
          >
            <div className="flex-1 min-w-0 text-xs">
              <span className="text-muted-foreground font-medium">
                {chip.category}:
              </span>{" "}
              <span className="text-foreground truncate block">{chip.label}</span>
            </div>
            <button
              type="button"
              onClick={() => removeFilterValue(chip.key, chip.value)}
              className="shrink-0 h-11 w-11 flex items-center justify-center rounded-sm hover:bg-background transition-colors -mr-2"
              aria-label={`Remove ${chip.category} filter`}
            >
              <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
