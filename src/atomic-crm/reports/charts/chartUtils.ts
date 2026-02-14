/**
 * Chart Utility Functions
 *
 * Shared utilities for chart components to maintain DRY principle.
 */

import type { TooltipItem } from "chart.js";
import type { ChartTheme } from "../hooks/useChartTheme";

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

/** Base chart options shared by all chart components */
export function createBaseChartOptions(_colors: ChartTheme["colors"], _font: ChartTheme["font"]) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 12, right: 24, bottom: 12, left: 24 },
    },
    interaction: {
      mode: "nearest" as const,
      intersect: false,
    },
  };
}

/** Standard axis configuration with dashed gridlines and consistent font */
export function createAxisConfig(
  colors: ChartTheme["colors"],
  font: ChartTheme["font"],
  opts?: { beginAtZero?: boolean; display?: boolean; stepSize?: number }
) {
  return {
    ...(opts?.beginAtZero !== undefined && { beginAtZero: opts.beginAtZero }),
    grid: {
      display: opts?.display !== false,
      color: colors.gridline,
      borderDash: [4, 4],
      drawBorder: false,
    },
    ticks: {
      color: colors.axisText,
      font: {
        family: font.family,
        size: 11,
      },
      ...(opts?.stepSize !== undefined && { stepSize: opts.stepSize }),
    },
  };
}

/**
 * Chart.js tooltip types re-exported for convenience.
 * Using official Chart.js types for better type safety and IDE support.
 */
export type TooltipContextY = TooltipItem<"line" | "bar">;
export type TooltipContextX = TooltipItem<"bar">;
export type TooltipTitleContext = TooltipItem<"bar" | "line" | "doughnut">;
