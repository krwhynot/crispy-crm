import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpportunityFilterChips } from "./useOpportunityFilterChips";

export const SidebarActiveFilters = () => {
  const { chips, removeFilterValue, clearAllFilters, hasActiveFilters } =
    useOpportunityFilterChips();

  // Auto-hide when no filters
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header with count and Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Active Filters ({chips.length})</h3>
        <button
          onClick={clearAllFilters}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
            title={chip.displayValue} // Tooltip for truncated text
          >
            <div className="flex-1 min-w-0 text-xs">
              <span className="text-foreground truncate block">{chip.displayValue}</span>
            </div>
            <button
              onClick={() => removeFilterValue(chip.key, chip.value)}
              className="shrink-0 h-11 w-11 -mr-2 flex items-center justify-center rounded-md hover:bg-background transition-colors"
              aria-label={`Remove ${chip.label} filter`}
            >
              <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
