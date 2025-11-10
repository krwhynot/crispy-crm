import type { Opportunity } from "../types";

export interface StageMetrics {
  count: number;
  avgDaysInStage: number;
  stuckCount: number; // >14 days
}

export function calculateStageMetrics(
  opportunities: Opportunity[]
): StageMetrics {
  if (opportunities.length === 0) {
    return { count: 0, avgDaysInStage: 0, stuckCount: 0 };
  }

  const totalDays = opportunities.reduce(
    (sum, opp) => sum + (opp.days_in_stage || 0),
    0
  );
  const avgDays = Math.round(totalDays / opportunities.length);
  const stuck = opportunities.filter((opp) => (opp.days_in_stage || 0) > 14).length;

  return {
    count: opportunities.length,
    avgDaysInStage: avgDays,
    stuckCount: stuck,
  };
}

export function useStageMetrics(opportunities: Opportunity[]): StageMetrics {
  return calculateStageMetrics(opportunities);
}
