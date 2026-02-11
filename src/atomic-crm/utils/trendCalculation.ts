/**
 * Shared trend calculation utility
 *
 * Extracted from useMyPerformance.ts for reuse across
 * dashboard hooks (KPI metrics, performance metrics).
 */

export interface TrendResult {
  /** Percentage change (e.g., 25 for 25% increase) */
  trend: number;
  /** Direction for styling: "up" | "down" | "flat" */
  direction: "up" | "down" | "flat";
}

/**
 * Calculate trend direction and percentage from current vs previous values.
 *
 * - Division by zero: returns 100% up if current > 0, else flat
 * - Rounds to nearest integer percentage
 */
export function calculateTrend(current: number, previous: number): TrendResult {
  if (previous === 0) {
    // Avoid division by zero - show flat or positive if we have current activity
    return {
      trend: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "flat",
    };
  }

  const percentChange = ((current - previous) / previous) * 100;

  return {
    trend: Math.round(percentChange),
    direction: percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat",
  };
}
