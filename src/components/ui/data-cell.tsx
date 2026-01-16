"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/atomic-crm/utils/formatters";

// =============================================================================
// DATA ROW
// =============================================================================
// RESPONSIVE HEIGHT APPROACH (not pseudo-element):
// - Desktop (hover: hover): 32px (h-8)
// - Touch (hover: none): 40px (h-10)
//
// Why not pseudo-element? Stacked rows cause z-index overlap conflicts
// where clicking Row A's bottom edge triggers Row B.
// =============================================================================

export interface DataRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Make row interactive with hover/focus states */
  interactive?: boolean;
}

const DataRow = React.forwardRef<HTMLTableRowElement, DataRowProps>(
  ({ className, interactive = true, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="data-row"
      className={cn(
        // ===========================================
        // RESPONSIVE HEIGHT (inline, no CSS utility)
        // Default: 32px, Touch devices: 40px
        // ===========================================
        "h-8",
        // Touch device override using arbitrary media query
        // @media (hover: none) targets touch devices
        "[@media(hover:none)]:h-10",

        // Border for grid appearance (Excel-like)
        "border-b border-border/40",

        // Interactive states
        interactive && [
          "cursor-pointer",
          "hover:bg-muted/50",
          "focus-visible:bg-muted/50",
          "focus-visible:outline-none",
          // Inset ring avoids clipping issues
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
        ],

        // Fast transition (≤75ms for data entry speed)
        "transition-colors duration-75",

        className
      )}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    />
  )
);
DataRow.displayName = "DataRow";

// =============================================================================
// DATA CELL
// =============================================================================
// INLINE STYLES for:
// - Compact 13px typography with tight line-height
// - Type-based numeric formatting
// - Z-index focus management (prevents clipped focus rings)
// =============================================================================

export interface DataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Cell data type for formatting:
   * - text: left-aligned (default)
   * - numeric: tabular-nums, right-aligned
   * - currency: tabular-nums + auto-formats numbers as USD
   * - date: tabular-nums for consistent digit width
   */
  type?: "text" | "numeric" | "currency" | "date";

  /** Truncate with ellipsis */
  truncate?: boolean;

  /** Max width for truncation (default: 200px) */
  maxWidth?: number;
}

const DataCell = React.forwardRef<HTMLTableCellElement, DataCellProps>(
  ({ className, type = "text", truncate = false, maxWidth = 200, children, ...props }, ref) => {
    // Currency formatting via centralized formatCurrency utility
    const formattedChildren = React.useMemo(() => {
      if (type === "currency" && typeof children === "number") {
        return formatCurrency(children);
      }
      return children;
    }, [type, children]);

    return (
      <td
        ref={ref}
        data-slot="data-cell"
        data-type={type}
        className={cn(
          // ===========================================
          // BASE CELL STYLES (inline, no CSS utility)
          // 13px font, tight line-height, compact padding
          // ===========================================
          "px-2 py-1.5",
          "text-[0.8125rem] leading-[1.35]", // 13px / 1.35 line-height

          // ===========================================
          // Z-INDEX FOCUS MANAGEMENT (inline)
          // Prevents focus ring clipping in overflow-hidden tables
          // ===========================================
          "relative",
          "focus-within:z-20",

          // ===========================================
          // TYPE-SPECIFIC FORMATTING
          // ===========================================
          // Numeric: tabular figures for column alignment
          type === "numeric" && "tabular-nums lining-nums text-right",

          // Currency: tabular + slashed-zero + right-aligned
          type === "currency" && "tabular-nums lining-nums slashed-zero text-right",

          // Date: tabular for consistent width
          type === "date" && "tabular-nums",

          // Text: explicit left alignment
          type === "text" && "text-left",

          // ===========================================
          // TRUNCATION
          // ===========================================
          truncate && "truncate",

          className
        )}
        style={{
          ...(truncate ? { maxWidth: `${maxWidth}px` } : {}),
        }}
        {...props}
      >
        {formattedChildren}
      </td>
    );
  }
);
DataCell.displayName = "DataCell";

// =============================================================================
// DATA HEADER CELL
// =============================================================================

export interface DataHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sticky position at top of scroll container */
  sticky?: boolean;

  /** Right-align for numeric columns */
  align?: "left" | "right";
}

const DataHeaderCell = React.forwardRef<HTMLTableCellElement, DataHeaderCellProps>(
  ({ className, sticky = false, align = "left", ...props }, ref) => (
    <th
      ref={ref}
      data-slot="data-header-cell"
      className={cn(
        // Base styles
        "px-2 py-2",
        "text-xs font-semibold uppercase tracking-wide",
        "text-muted-foreground",

        // Alignment
        align === "left" ? "text-left" : "text-right",

        // Background (needed for sticky)
        "bg-background",

        // Border
        "border-b border-border",

        // Sticky positioning
        sticky && "sticky top-0 z-10",

        className
      )}
      {...props}
    />
  )
);
DataHeaderCell.displayName = "DataHeaderCell";

// =============================================================================
// EXPORTS
// =============================================================================

export { DataRow, DataCell, DataHeaderCell };
