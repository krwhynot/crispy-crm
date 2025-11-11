import { useMemo } from "react";
import type { Opportunity } from "../types";

export const STUCK_THRESHOLD_DAYS = 14;

export interface StageMetrics {
  count: number;
  avgDaysInStage: number;
  stuckCount: number; // >STUCK_THRESHOLD_DAYS days
}

export function calculateStageMetrics(opportunities: Opportunity[]): StageMetrics {
  if (opportunities.length === 0) {
    return { count: 0, avgDaysInStage: 0, stuckCount: 0 };
  }

  const totalDays = opportunities.reduce((sum, opp) => sum + (opp.days_in_stage || 0), 0);
  const avgDays = Math.round(totalDays / opportunities.length);
  const stuck = opportunities.filter(
    (opp) => (opp.days_in_stage || 0) > STUCK_THRESHOLD_DAYS
  ).length;

  return {
    count: opportunities.length,
    avgDaysInStage: avgDays,
    stuckCount: stuck,
  };
}

export function useStageMetrics(opportunities: Opportunity[]): StageMetrics {
  return useMemo(() => calculateStageMetrics(opportunities), [opportunities]);
}
