import { describe, it, expect } from "vitest";
import { calculateStageMetrics } from "../hooks/useStageMetrics";

describe("calculateStageMetrics", () => {
  it("calculates count and average days in stage", () => {
    const opportunities = [
      { id: 1, days_in_stage: 5 },
      { id: 2, days_in_stage: 10 },
      { id: 3, days_in_stage: 15 },
    ];

    const metrics = calculateStageMetrics(opportunities);

    expect(metrics.count).toBe(3);
    expect(metrics.avgDaysInStage).toBe(10);
    expect(metrics.stuckCount).toBe(1); // >14 days
  });

  it("handles empty array", () => {
    const metrics = calculateStageMetrics([]);

    expect(metrics.count).toBe(0);
    expect(metrics.avgDaysInStage).toBe(0);
    expect(metrics.stuckCount).toBe(0);
  });
});
