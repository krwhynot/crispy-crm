/**
 * Chart Utility Functions
 *
 * Shared utilities for chart components to maintain DRY principle.
 */

import type { TooltipItem } from 'chart.js';

/**
 * Truncates a label to a maximum length, appending "..." if truncated.
 * Useful for chart axis labels that need to fit in limited space.
 */
export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
}

/**
 * Chart.js tooltip types re-exported for convenience.
 * Using official Chart.js types for better type safety and IDE support.
 */
export type TooltipContextY = TooltipItem<'line' | 'bar'>;
export type TooltipContextX = TooltipItem<'bar'>;
export type TooltipTitleContext = TooltipItem<'bar' | 'line' | 'doughnut'>;
