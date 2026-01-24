import React from "react";
import { useListContext } from "react-admin";
import { TextColumnFilter, type TextColumnFilterProps } from "./TextColumnFilter";
import {
  CheckboxColumnFilter,
  type CheckboxColumnFilterProps,
  type FilterChoice,
} from "./CheckboxColumnFilter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

/**
 * Filter type configuration
 */
export type FilterType = "text" | "checkbox" | "none";

/**
 * Props for FilterableColumnHeader component
 */
export interface FilterableColumnHeaderProps {
  /** Field name to filter on */
  source: string;
  /** Column header label */
  label: string;
  /** Type of filter to render */
  filterType: FilterType;
  /** Choices for checkbox filter (required when filterType="checkbox") */
  choices?: FilterChoice[];
  /** Placeholder for text filter */
  placeholder?: string;
  /** Debounce delay for text filter (default: 300ms) */
  debounceMs?: number;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Column header wrapper with integrated filter
 *
 * Combines column label with filter icon and appropriate filter component.
 * Filter icon changes color based on active filter state.
 *
 * Features:
 * - Text filter: Popover with debounced text input
 * - Checkbox filter: Popover with multi-select checkboxes
 * - Filter icon: muted when inactive, primary when active
 * - Badge showing active filter count (checkbox only)
 * - Touch targets: 44px minimum
 *
 * @example
 * // Text filter
 * <FilterableColumnHeader
 *   source="name"
 *   label="Organization Name"
 *   filterType="text"
 *   placeholder="Search..."
 * />
 *
 * // Checkbox filter
 * <FilterableColumnHeader
 *   source="organization_type"
 *   label="Type"
 *   filterType="checkbox"
 *   choices={ORGANIZATION_TYPE_CHOICES}
 * />
 */
export function FilterableColumnHeader({
  source,
  label,
  filterType,
  choices,
  placeholder,
  debounceMs,
  className,
}: FilterableColumnHeaderProps) {
  const { filterValues } = useListContext();

  // Determine if filter is active
  const isFilterActive = React.useMemo(() => {
    const filterValue = filterValues?.[source];
    if (filterValue === undefined || filterValue === null) return false;
    if (typeof filterValue === "string") return filterValue.trim() !== "";
    if (Array.isArray(filterValue)) return filterValue.length > 0;
    return true;
  }, [filterValues, source]);

  // Get active filter count for badge
  const activeFilterCount = React.useMemo(() => {
    const filterValue = filterValues?.[source];
    if (Array.isArray(filterValue)) return filterValue.length;
    if (filterValue !== undefined && filterValue !== null && filterValue !== "") return 1;
    return 0;
  }, [filterValues, source]);

  // Render nothing extra if no filter type
  if (filterType === "none") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="font-medium">{label}</span>
      </div>
    );
  }

  // For checkbox filter, use the CheckboxColumnFilter directly (it has its own popover)
  if (filterType === "checkbox") {
    if (!choices || choices.length === 0) {
      logger.warn(`Choices required for checkbox filter on "${source}"`, {
        feature: "FilterableColumnHeader",
        source,
      });
      return (
        <div className={cn("flex items-center gap-1", className)}>
          <span className="font-medium">{label}</span>
        </div>
      );
    }

    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="font-medium">{label}</span>
        <CheckboxColumnFilter source={source} label={label} choices={choices} />
      </div>
    );
  }

  // For text filter, wrap in a popover
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-medium">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-11 w-11 p-0",
              "relative",
              isFilterActive
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`Filter by ${label}`}
          >
            <Filter className="h-4 w-4" />
            {isFilterActive && (
              <span
                className={cn(
                  "absolute -top-1 -right-1",
                  "flex h-5 w-5 items-center justify-center",
                  "rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                )}
                aria-label="Filter active"
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 p-3"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <TextColumnFilter
              source={source}
              placeholder={placeholder || `Filter ${label.toLowerCase()}...`}
              debounceMs={debounceMs}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Re-export types for convenience
export type { FilterChoice, TextColumnFilterProps, CheckboxColumnFilterProps };
