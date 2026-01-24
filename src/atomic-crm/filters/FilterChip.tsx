/**
 * FilterChip Component
 *
 * Individual filter chip component with remove functionality.
 * ENHANCED: 44px minimum touch targets for iPad accessibility.
 *
 * @module filters/FilterChip
 */

import React from "react";
import { X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  /** Display text for the chip */
  label: string;
  /** Callback when the chip's remove button is clicked */
  onRemove: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual filter chip component with remove functionality.
 *
 * Design decisions:
 * - 44px minimum height for touch accessibility (iPad requirement)
 * - Truncated label with max-width to prevent layout issues
 * - Semantic colors from Tailwind v4 design system
 * - ARIA label for screen reader accessibility
 * - Memoized to prevent unnecessary re-renders when parent re-renders
 *
 * @example
 * ```tsx
 * <FilterChip
 *   label="Active"
 *   onRemove={() => removeFilter("status", "active")}
 * />
 * ```
 */
export const FilterChip = React.memo<React.FC<FilterChipProps>>(
  ({ label, onRemove, className }) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
    };

    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 pl-3 pr-1 text-sm rounded-full",
          "bg-muted hover:bg-muted/90 transition-colors",
          "min-h-[2.75rem]", // 44px touch target height
          className
        )}
      >
        <span className="truncate max-w-[150px]">{label}</span>
        <AdminButton
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full hover:bg-accent/50",
            "h-11 w-11", // 44px button for iPad touch target
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          onClick={handleRemove}
          aria-label={`Remove ${label} filter`}
        >
          <X className="size-4" aria-hidden="true" />
        </AdminButton>
      </div>
    );
  }
);
