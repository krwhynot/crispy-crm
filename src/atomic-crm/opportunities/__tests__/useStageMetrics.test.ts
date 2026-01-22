import { describe, it, expect } from "vitest";
import { calculateStageMetrics } from "../useStageMetrics";
import type { Opportunity } from "../../types";

/**
 * Per-stage thresholds reference (from stageThresholds.ts):
 * - new_lead: 7 days
 * - initial_outreach: 10 days
 * - sample_visit_offered: 14 days
 * - feedback_logged: 7 days
 * - demo_scheduled: 5 days
 * - closed_won/closed_lost: null (never rotting)
 */

const createOpportunity = (
  id: number,
  stage: string,
  daysInStage: number,
  estimatedCloseDate?: string
): Partial<Opportunity> => ({
  id,
  stage,
  days_in_stage: daysInStage,
  estimated_close_date: estimatedCloseDate,
});

describe("calculateStageMetrics", () => {
  it("calculates count and average days in stage", () => {
    const opportunities = [
      createOpportunity(1, "new_lead", 5),
      createOpportunity(2, "initial_outreach", 10),
      createOpportunity(3, "sample_visit_offered", 15), // 15 > 14, so rotting
    ];

    const metrics = calculateStageMetrics(opportunities as Opportunity[]);

    expect(metrics.count).toBe(3);
    expect(metrics.avgDaysInStage).toBe(10);
    expect(metrics.stuckCount).toBe(1); // Only sample_visit_offered at 15 days is stuck
  });

  it("uses per-stage thresholds for stuckCount", () => {
    // new_lead threshold is 7 days - 8 days should be rotting
    // sample_visit_offered threshold is 14 days - 8 days should be healthy
    const opportunities = [
      createOpportunity(1, "new_lead", 8), // rotting (8 > 7)
      createOpportunity(2, "sample_visit_offered", 8), // healthy (8 < 14)
    ];

    const metrics = calculateStageMetrics(opportunities as Opportunity[]);

    expect(metrics.stuckCount).toBe(1); // Only new_lead is stuck
  });

  it("counts expired close dates as stuck", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const opportunities = [
      createOpportunity(1, "new_lead", 3, yesterday.toISOString()), // expired close date
      createOpportunity(2, "initial_outreach", 5), // healthy
    ];

    const metrics = calculateStageMetrics(opportunities as Opportunity[]);

    expect(metrics.stuckCount).toBe(1); // Expired close date counts as stuck
  });

  it("never counts closed stages as stuck", () => {
    const opportunities = [
      createOpportunity(1, "closed_won", 100), // closed - never rotting
      createOpportunity(2, "closed_lost", 200), // closed - never rotting
    ];

    const metrics = calculateStageMetrics(opportunities as Opportunity[]);

    expect(metrics.stuckCount).toBe(0); // Closed stages can't be stuck
  });

  it("handles empty array", () => {
    const metrics = calculateStageMetrics([]);

    expect(metrics.count).toBe(0);
    expect(metrics.avgDaysInStage).toBe(0);
    expect(metrics.stuckCount).toBe(0);
  });
});
