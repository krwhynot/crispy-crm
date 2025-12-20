import { useMemo } from "react";
import type { Opportunity } from "../types";
import { getStageStatus } from "../constants/stageThresholds";
import { parseDateSafely } from "@/lib/date-utils";

export interface StageMetrics {
  count: number;
  avgDaysInStage: number;
  stuckCount: number; // Opportunities with status "rotting" or "expired"
}

/**
 * Calculate stage metrics using per-stage thresholds
 *
 * CHANGED: stuckCount now uses per-stage thresholds via getStageStatus()
 * instead of the old fixed STUCK_THRESHOLD_DAYS = 14.
 * This means different stages have different thresholds:
 * - new_lead: 7 days
 * - initial_outreach: 10 days
 * - sample_visit_offered: 14 days
 * - feedback_logged: 7 days
 * - demo_scheduled: 5 days
 */
export function calculateStageMetrics(opportunities: Opportunity[]): StageMetrics {
  if (opportunities.length === 0) {
    return { count: 0, avgDaysInStage: 0, stuckCount: 0 };
  }

  const totalDays = opportunities.reduce((sum, opp) => sum + (opp.days_in_stage || 0), 0);
  const avgDays = Math.round(totalDays / opportunities.length);

  // Count opportunities that are "rotting" or "expired" based on per-stage thresholds
  const stuck = opportunities.filter((opp) => {
    const closeDate = opp.estimated_close_date
      ? parseDateSafely(opp.estimated_close_date)
      : null;
    const status = getStageStatus(opp.stage, opp.days_in_stage || 0, closeDate);
    return status === "rotting" || status === "expired";
  }).length;

  return {
    count: opportunities.length,
    avgDaysInStage: avgDays,
    stuckCount: stuck,
  };
}

export function useStageMetrics(opportunities: Opportunity[]): StageMetrics {
  return useMemo(() => calculateStageMetrics(opportunities), [opportunities]);
}
