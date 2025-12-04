/**
 * FilterChipBar Component
 *
 * Horizontal bar displaying active filters as removable chips.
 * Placed ABOVE the datagrid for maximum visibility.
 *
 * @module filters/FilterChipBar
 */

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChipFilterConfig } from "./filterConfigSchema";
import { useFilterChipBar } from "./useFilterChipBar";
import { FilterChip } from "./FilterChip";

interface FilterChipBarProps {
  /** Filter configuration defining how to display each filter type */
  filterConfig: ChipFilterConfig[];
  /** Optional context for dynamic choices (e.g., ConfigurationContext) */
  context?: unknown;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal bar displaying active filters as removable chips.
 *
 * Features:
 * - Renders above datagrid for visibility
 * - Shows "Clear all" when 2+ filters active
 * - Keyboard navigation between chips
 * - ARIA roles for accessibility
 * - 44px touch targets for iPad
 *
 * @example
 * ```tsx
 * <StandardListLayout filterComponent={<MyFilter />}>
 *   <FilterChipBar filterConfig={MY_FILTER_CONFIG} />
 *   <PremiumDatagrid>...</PremiumDatagrid>
 * </StandardListLayout>
 * ```
 */
export function FilterChipBar({ filterConfig, context, className }: FilterChipBarProps) {
  const chipBarRef = useRef<HTMLDivElement>(null);

  // Fail-fast: config required
  if (!filterConfig || filterConfig.length === 0) {
    throw new Error(
      "FilterChipBar requires a non-empty filterConfig. " +
        "Check that the feature has defined its filter configuration."
    );
  }

  const { chips, removeFilter, clearAllFilters, hasActiveFilters, activeCount } =
    useFilterChipBar(filterConfig, context);

  /**
   * Keyboard navigation handler for chip bar
   * Allows arrow key navigation between chips
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const buttons = chipBarRef.current?.querySelectorAll('button[aria-label^="Remove"]');
    if (!buttons?.length) return;

    const currentIndex = Array.from(buttons).findIndex(
      (btn) => btn === document.activeElement
    );

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        (buttons[(currentIndex + 1) % buttons.length] as HTMLElement).focus();
        break;
      case "ArrowLeft":
        e.preventDefault();
        (buttons[currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1] as HTMLElement).focus();
        break;
      case "Home":
        e.preventDefault();
        (buttons[0] as HTMLElement).focus();
        break;
      case "End":
        e.preventDefault();
        (buttons[buttons.length - 1] as HTMLElement).focus();
        break;
    }
  }, []);

  // Don't render if no active filters
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div
      ref={chipBarRef}
      role="toolbar"
      aria-label="Active filters"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-2 px-4 py-2 bg-muted/50 border-b overflow-x-auto",
        className
      )}
    >
      <span
        id="filter-chip-bar-label"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Active filters:
      </span>
      <div
        role="list"
        aria-labelledby="filter-chip-bar-label"
        className="flex items-center gap-1.5 flex-wrap"
      >
        {chips.map((chip) => (
          <div key={`${chip.key}-${chip.value}`} role="listitem">
            <FilterChip
              label={chip.label}
              onRemove={() => removeFilter(chip.key, chip.value)}
            />
          </div>
        ))}
      </div>
      {activeCount >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="ml-auto whitespace-nowrap text-muted-foreground hover:text-foreground"
          aria-label={`Clear all ${activeCount} filters`}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
