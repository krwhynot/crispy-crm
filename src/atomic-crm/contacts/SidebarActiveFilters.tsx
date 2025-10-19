import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactFilterChips } from "./useContactFilterChips";

export const SidebarActiveFilters = () => {
  const { chips, removeFilterValue, clearAllFilters, hasActiveFilters } =
    useContactFilterChips();

  // Auto-hide when no filters
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header with count and Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[color:var(--text-body)]">
          Active Filters ({chips.length})
        </h3>
        <button
          onClick={clearAllFilters}
          className="text-xs text-[color:var(--text-subtle)] hover:text-[color:var(--text-body)] transition-colors"
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
              "bg-[color:var(--background-subtle)] border border-[color:var(--border)]",
              "group hover:border-[color:var(--border-hover)] transition-colors"
            )}
            title={`${chip.category}: ${chip.label}`} // Tooltip for truncated text
          >
            <div className="flex-1 min-w-0 text-xs">
              <span className="text-[color:var(--text-subtle)] font-medium">
                {chip.category}:
              </span>{" "}
              <span className="text-[color:var(--text-body)] truncate block">
                {chip.label}
              </span>
            </div>
            <button
              onClick={() => removeFilterValue(chip.key, chip.value)}
              className="shrink-0 p-0.5 rounded-sm hover:bg-[color:var(--background)] transition-colors"
              aria-label={`Remove ${chip.category} filter`}
            >
              <X className="h-3 w-3 text-[color:var(--text-subtle)] group-hover:text-[color:var(--text-body)]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
