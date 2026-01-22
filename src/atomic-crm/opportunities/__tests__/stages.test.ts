import { describe, it, expect } from "vitest";
import { sortOpportunitiesByStatus } from "../constants";
import type { Opportunity } from "../../types";

describe("sortOpportunitiesByStatus", () => {
  const createOpp = (
    id: number,
    stage: string,
    daysInStage: number,
    estimatedCloseDate?: string
  ): Opportunity =>
    ({
      id,
      stage,
      days_in_stage: daysInStage,
      estimated_close_date: estimatedCloseDate,
      principal_organization_name: `Principal ${id}`,
    }) as Opportunity;

  it("sorts rotting opportunities to the top", () => {
    const opps = [
      createOpp(1, "new_lead", 3), // healthy
      createOpp(2, "new_lead", 10), // rotting (>7)
      createOpp(3, "new_lead", 5), // healthy
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Rotting first
  });

  it("sorts expired before rotting", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const opps = [
      createOpp(1, "new_lead", 10), // rotting
      createOpp(2, "new_lead", 3, yesterday.toISOString()), // expired
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Expired first
  });

  it("sorts warning after red (rotting/expired)", () => {
    const opps = [
      createOpp(1, "new_lead", 6), // warning (>5.25)
      createOpp(2, "new_lead", 10), // rotting
      createOpp(3, "new_lead", 2), // healthy
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Rotting first
    expect(sorted[1].id).toBe(1); // Warning second
    expect(sorted[2].id).toBe(3); // Healthy last
  });

  it("sorts by days_in_stage descending within same status", () => {
    const opps = [
      createOpp(1, "new_lead", 8), // rotting
      createOpp(2, "new_lead", 12), // rotting (more days)
      createOpp(3, "new_lead", 9), // rotting
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // 12 days
    expect(sorted[1].id).toBe(3); // 9 days
    expect(sorted[2].id).toBe(1); // 8 days
  });
});
