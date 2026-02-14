/**
 * Chart Utility Functions
 *
 * Shared utilities for chart components to maintain DRY principle.
 */

import type { TooltipItem } from "chart.js";

/**
 * Truncates a label to a maximum length, appending "..." if truncated.
 * Useful for chart axis labels that need to fit in limited space.
 */
export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
}

/**
 * Adds alpha transparency to an OKLCH color string.
 *
 * Canvas rendering (Chart.js) cannot use CSS var() references or
 * append hex alpha suffixes to OKLCH values. This helper produces
 * valid OKLCH syntax with an alpha channel.
 *
 * @example withOklchAlpha("oklch(55% 0.095 142)", 0.5) => "oklch(55% 0.095 142 / 0.5)"
 */
export function withOklchAlpha(oklchColor: string, alpha: number): string {
  const trimmed = oklchColor.trim();
  if (trimmed.startsWith("oklch(") && trimmed.endsWith(")")) {
    return `oklch(${trimmed.slice(6, -1)} / ${alpha})`;
  }
  return trimmed;
}

/**
 * Chart.js tooltip types re-exported for convenience.
 * Using official Chart.js types for better type safety and IDE support.
 */
export type TooltipContextY = TooltipItem<"line" | "bar">;
export type TooltipContextX = TooltipItem<"bar">;
export type TooltipTitleContext = TooltipItem<"bar" | "line" | "doughnut">;
