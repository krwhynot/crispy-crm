import React, { useCallback, useMemo } from "react";
import { useListContext } from "react-admin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Choice option for checkbox filter
 */
export interface FilterChoice {
  /** Unique identifier / filter value */
  id: string;
  /** Display label */
  name: string;
}

/**
 * Props for CheckboxColumnFilter component
 */
export interface CheckboxColumnFilterProps {
  /** Field name to filter on (e.g., "organization_type") */
  source: string;
  /** Display label for the filter */
  label: string;
  /** Available filter choices */
  choices: FilterChoice[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Multi-select checkbox column filter with popover
 *
 * @pattern Pattern G - Column filter with checkbox popover (explicit multi-select affordance)
 *
 * Features:
 * - Popover with checkbox list for multi-select
 * - Array accumulation (selecting multiple values)
 * - Badge showing count when filters active
 * - Clear button in popover footer
 * - Syncs with useListContext for filter state management
 * - Touch targets: 44px minimum
 *
 * @example
 * <CheckboxColumnFilter
 *   source="organization_type"
 *   label="Type"
 *   choices={[{ id: "customer", name: "Customer" }, { id: "prospect", name: "Prospect" }]}
 * />
 */
export function CheckboxColumnFilter({
  source,
  label,
  choices,
  className,
}: CheckboxColumnFilterProps) {
  const { filterValues, setFilters } = useListContext();

  // Get current selected values as array
  const selectedValues = useMemo(() => {
    const currentFilter = filterValues?.[source];
    if (!currentFilter) return [];
    if (Array.isArray(currentFilter)) return currentFilter;
    return [currentFilter];
  }, [filterValues, source]);

  const hasActiveFilters = selectedValues.length > 0;

  // Toggle a single value in the filter array
  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      const currentFilters = filterValues || {};

      if (checked) {
        // Add value
        if (selectedValues.length === 0) {
          // First selection - set as single value
          setFilters({ ...currentFilters, [source]: value });
        } else {
          // Add to array
          setFilters({
            ...currentFilters,
            [source]: [...selectedValues, value],
          });
        }
      } else {
        // Remove value
        const newValues = selectedValues.filter((v) => v !== value);
        if (newValues.length === 0) {
          // Remove filter entirely
          const { [source]: _, ...rest } = currentFilters;
          setFilters(rest);
        } else if (newValues.length === 1) {
          // Single value - store as scalar
          setFilters({ ...currentFilters, [source]: newValues[0] });
        } else {
          // Multiple values - store as array
          setFilters({ ...currentFilters, [source]: newValues });
        }
      }
    },
    [filterValues, setFilters, source, selectedValues]
  );

  // Clear all selections for this filter
  const handleClearAll = useCallback(() => {
    const currentFilters = filterValues || {};
    const { [source]: _, ...rest } = currentFilters;
    setFilters(rest);
  }, [filterValues, setFilters, source]);

  // Select all choices
  const handleSelectAll = useCallback(() => {
    const currentFilters = filterValues || {};
    const allValues = choices.map((c) => c.id);
    setFilters({ ...currentFilters, [source]: allValues });
  }, [filterValues, setFilters, source, choices]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-11 w-11 p-0",
            "relative",
            hasActiveFilters
              ? "text-primary hover:text-primary"
              : "text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label={`Filter by ${label}`}
          aria-expanded="false"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span
              className={cn(
                "absolute -top-1 -right-1",
                "flex h-5 w-5 items-center justify-center",
                "rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
              )}
              aria-label={`${selectedValues.length} filters active`}
            >
              {selectedValues.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Checkbox list */}
        <div className="max-h-64 overflow-y-auto p-2">
          {choices.map((choice) => {
            const isChecked = selectedValues.includes(choice.id);
            const checkboxId = `filter-${source}-${choice.id}`;

            return (
              <label
                key={choice.id}
                htmlFor={checkboxId}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2.5",
                  "cursor-pointer",
                  "min-h-[44px]", // Touch target
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleToggle(choice.id, checked === true)
                  }
                />
                <span className="text-sm">{choice.name}</span>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedValues.length === choices.length}
            className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Select All
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedValues.length} of {choices.length}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
