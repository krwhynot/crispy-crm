/**
 * FilterableBadge - Click-to-filter wrapper for badge/chip elements
 *
 * Wraps existing badge components to add filter-on-click functionality.
 * Follows Airtable/Notion UX pattern: click a badge value to filter the list.
 *
 * Features:
 * - Click badge → filters list by that value
 * - Click active badge → clears that filter
 * - Hover effect with ring highlight
 * - Active state indicator when filter is applied
 * - Prevents row click propagation (stopPropagation)
 * - Touch-friendly for iPad (no minimum size change - relies on badge padding)
 *
 * @example
 * // Wrap existing badge components
 * <FilterableBadge source="organization_type" value={record.organization_type}>
 *   <OrganizationTypeBadge type={record.organization_type} />
 * </FilterableBadge>
 *
 * @see OrganizationBadges.tsx - Existing badge components
 * @see ContactBadges.tsx - Existing badge components
 */

import type { ReactNode, MouseEvent } from "react";
import { useListContext } from "react-admin";
import { cn } from "@/lib/utils";

interface FilterableBadgeProps {
  /** Filter field name in the data source (e.g., "organization_type", "status") */
  source: string;
  /** The value to filter by when clicked */
  value: string | null | undefined;
  /** The badge component to render (existing badge components) */
  children: ReactNode;
  /** Additional CSS classes for the wrapper button */
  className?: string;
  /** Custom label for accessibility (defaults to value) */
  label?: string;
  /** Disable filter functionality (badge still renders but isn't clickable) */
  disabled?: boolean;
}

export function FilterableBadge({
  source,
  value,
  children,
  className,
  label,
  disabled = false,
}: FilterableBadgeProps) {
  const { filterValues, setFilters, displayedFilters } = useListContext();

  // Don't render filter functionality for null/undefined values
  if (value == null || disabled) {
    return <>{children}</>;
  }

  const isActive = filterValues?.[source] === value;

  const handleClick = (e: MouseEvent) => {
    // CRITICAL: Prevent row click navigation
    e.stopPropagation();
    e.preventDefault();

    if (isActive) {
      // Click again to clear this specific filter
      const newFilters = { ...filterValues };
      delete newFilters[source];
      setFilters(newFilters, displayedFilters);
    } else {
      // Set filter to this value
      setFilters({ ...filterValues, [source]: value }, displayedFilters);
    }
  };

  const displayLabel = label || value;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        // Reset button styles
        "appearance-none bg-transparent border-none p-0 m-0",
        // Interactive cursor
        "cursor-pointer",
        // Hover effect: subtle ring
        "rounded-md transition-all duration-150 ease-in-out",
        "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1",
        // Focus states for accessibility
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
        // Active state when this filter is applied
        isActive && "ring-2 ring-primary ring-offset-1 shadow-sm",
        className
      )}
      title={isActive ? `Clear filter: ${displayLabel}` : `Filter by: ${displayLabel}`}
      aria-pressed={isActive}
      aria-label={
        isActive
          ? `Active filter: ${displayLabel}. Click to clear.`
          : `Filter list by ${displayLabel}`
      }
    >
      {children}
    </button>
  );
}

export default FilterableBadge;
