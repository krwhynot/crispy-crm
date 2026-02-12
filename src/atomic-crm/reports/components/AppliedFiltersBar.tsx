import { RotateCcw } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
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
    <div className="flex flex-wrap items-center justify-between gap-content rounded-lg bg-muted/50 p-compact md:p-content">
      <div role="list" className="flex flex-wrap items-center gap-compact">
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
      <AdminButton variant="ghost" size="sm" onClick={onResetAll} className="h-11 shrink-0">
        <RotateCcw className="mr-2 h-4 w-4" />
        Clear filters
      </AdminButton>
    </div>
  );
};
