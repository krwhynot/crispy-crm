import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChip } from "./FilterChip";

interface FilterItem {
  label: string;
  value: string;
  onRemove: () => void;
}

interface AppliedFiltersBarProps {
  filters: FilterItem[];
  onResetAll: () => void;
  hasActiveFilters: boolean;
}

export const AppliedFiltersBar = ({
  filters,
  onResetAll,
  hasActiveFilters,
}: AppliedFiltersBarProps) => {
  if (!hasActiveFilters || filters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-3">
      <div role="list" className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Applied:</span>
        {filters.map((filter) => (
          <FilterChip
            key={filter.label}
            label={filter.label}
            value={filter.value}
            onRemove={filter.onRemove}
          />
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={onResetAll} className="h-11 shrink-0">
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset All
      </Button>
    </div>
  );
};
