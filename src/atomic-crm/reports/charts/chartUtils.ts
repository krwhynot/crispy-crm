/**
 * Chart Utility Functions
 *
 * Shared utilities for chart components to maintain DRY principle.
 */

/**
 * Truncates a label to a maximum length, appending "..." if truncated.
 * Useful for chart axis labels that need to fit in limited space.
 */
export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
}

/**
 * Chart.js tooltip context types for improved type safety
 */
export interface TooltipContextY {
  parsed: {
    y: number;
  };
  label?: string;
}

export interface TooltipContextX {
  parsed: {
    x: number;
  };
  label?: string;
}

export interface TooltipTitleContext {
  dataIndex: number;
}
