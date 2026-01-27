"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Option for FilterSelectUI
 */
export interface FilterOption {
  id: string;
  label: string;
}

/**
 * Props for FilterSelectUI component
 */
export interface FilterSelectUIProps {
  /** Available filter options */
  options: FilterOption[];
  /** Currently selected values (always array for filters) */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;

  /** Display label for the filter trigger (e.g., "Stage", "Priority") */
  label: string;
  /** Placeholder for search input */
  placeholder?: string;

  /** Whether options are loading */
  isLoading?: boolean;
  /** Whether the filter is disabled */
  isDisabled?: boolean;

  /** Enable search when options > 10 (default: true) */
  searchable?: boolean;

  /** Show clear button when has selection (default: true) */
  showClearButton?: boolean;
  /** Badge display variant: 'count' shows "3", 'none' hides badge */
  badgeVariant?: "count" | "none";

  /** Additional CSS classes for the trigger button */
  className?: string;
}

/**
 * FilterSelectUI - Compact multi-select for list filters
 *
 * Pattern G component for React Admin list filtering.
 * Optimized for filter use cases with:
 * - WCAG 2.1 AA compliant touch targets (h-11 = 44px)
 * - Badge showing selected count
 * - Clear button always visible when has selection
 * - Multi-select toggle behavior with checkboxes
 *
 * @example
 * ```tsx
 * import { useListContext } from 'react-admin';
 *
 * function StageFilter() {
 *   const { filterValues, setFilters } = useListContext();
 *   const currentValue = filterValues.stage || [];
 *
 *   const handleChange = (newValue: string[]) => {
 *     setFilters({ ...filterValues, stage: newValue.length > 0 ? newValue : undefined });
 *   };
 *
 *   return (
 *     <FilterSelectUI
 *       options={STAGE_OPTIONS}
 *       value={currentValue}
 *       onChange={handleChange}
 *       label="Stage"
 *     />
 *   );
 * }
 * ```
 */
export function FilterSelectUI({
  options,
  value,
  onChange,
  label,
  placeholder,
  isLoading = false,
  isDisabled = false,
  searchable = true,
  showClearButton = true,
  badgeVariant = "count",
  className,
}: FilterSelectUIProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const selectedCount = value.length;
  const hasSelection = selectedCount > 0;

  // Only show search when searchable AND options > 10
  const showSearch = searchable && options.length > 10;

  const handleToggle = React.useCallback(
    (optionId: string) => {
      const newValue = value.includes(optionId)
        ? value.filter((v) => v !== optionId)
        : [...value, optionId];
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={cn("h-11 gap-1", className)}>
        <span className="text-sm font-medium">{label}</span>
        <span className="h-4 w-4 animate-pulse rounded-full bg-muted" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            // TODO: Add aria-controls={popoverId} linking to PopoverContent id for screen readers
            aria-label={`Filter by ${label}`}
            className={cn(
              "h-11 justify-between gap-1",
              hasSelection && "border-primary",
              className
            )}
            disabled={isDisabled}
          >
            <span className="text-sm font-medium">{label}</span>
            {hasSelection && badgeVariant === "count" && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <Command>
            {showSearch && (
              <CommandInput placeholder={placeholder ?? `Search ${label.toLowerCase()}...`} />
            )}
            <CommandList className="max-h-60">
              <CommandEmpty>No options found</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => handleToggle(option.id)}
                      className="h-11 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showClearButton && hasSelection && (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0"
          onClick={handleClear}
          aria-label={`Clear ${label} filter`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
