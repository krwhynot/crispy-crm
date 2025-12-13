/**
 * Unit tests for staleness calculation utilities
 * Tests per-stage stale thresholds as defined in PRD Section 6.3
 */

import { describe, it, expect } from "vitest";
import {
  STAGE_STALE_THRESHOLDS,
  ACTIVE_PIPELINE_STAGES,
  CLOSED_STAGES,
  isOpportunityStale,
  isClosedStage,
  isActivePipelineStage,
  getStaleThreshold,
  getDaysSinceActivity,
  countStaleOpportunities,
  filterStaleOpportunities,
  StageStaleThresholdsSchema,
} from "../stalenessCalculation";

describe("STAGE_STALE_THRESHOLDS", () => {
  it("should have correct thresholds per PRD Section 6.3", () => {
    // PRD-defined thresholds: 7/14/14/21/14
    expect(STAGE_STALE_THRESHOLDS.new_lead).toBe(7);
    expect(STAGE_STALE_THRESHOLDS.initial_outreach).toBe(14);
    expect(STAGE_STALE_THRESHOLDS.sample_visit_offered).toBe(14);
    expect(STAGE_STALE_THRESHOLDS.feedback_logged).toBe(21);
    expect(STAGE_STALE_THRESHOLDS.demo_scheduled).toBe(14);
  });

  it("should not include closed stages", () => {
    expect(STAGE_STALE_THRESHOLDS).not.toHaveProperty("closed_won");
    expect(STAGE_STALE_THRESHOLDS).not.toHaveProperty("closed_lost");
  });

  it("should have exactly 5 active stages", () => {
    expect(Object.keys(STAGE_STALE_THRESHOLDS)).toHaveLength(5);
  });
});

describe("ACTIVE_PIPELINE_STAGES", () => {
  it("should list all 5 active stages", () => {
    expect(ACTIVE_PIPELINE_STAGES).toHaveLength(5);
    expect(ACTIVE_PIPELINE_STAGES).toContain("new_lead");
    expect(ACTIVE_PIPELINE_STAGES).toContain("initial_outreach");
    expect(ACTIVE_PIPELINE_STAGES).toContain("sample_visit_offered");
    expect(ACTIVE_PIPELINE_STAGES).toContain("feedback_logged");
    expect(ACTIVE_PIPELINE_STAGES).toContain("demo_scheduled");
  });
});

describe("CLOSED_STAGES", () => {
  it("should list closed_won and closed_lost", () => {
    expect(CLOSED_STAGES).toHaveLength(2);
    expect(CLOSED_STAGES).toContain("closed_won");
    expect(CLOSED_STAGES).toContain("closed_lost");
  });
});

describe("isClosedStage", () => {
  it("should return true for closed stages", () => {
    expect(isClosedStage("closed_won")).toBe(true);
    expect(isClosedStage("closed_lost")).toBe(true);
  });

  it("should return false for active stages", () => {
    expect(isClosedStage("new_lead")).toBe(false);
    expect(isClosedStage("initial_outreach")).toBe(false);
    expect(isClosedStage("demo_scheduled")).toBe(false);
  });

  it("should return false for unknown stages", () => {
    expect(isClosedStage("unknown_stage")).toBe(false);
  });
});

describe("isActivePipelineStage", () => {
  it("should return true for active stages", () => {
    expect(isActivePipelineStage("new_lead")).toBe(true);
    expect(isActivePipelineStage("initial_outreach")).toBe(true);
    expect(isActivePipelineStage("sample_visit_offered")).toBe(true);
    expect(isActivePipelineStage("feedback_logged")).toBe(true);
    expect(isActivePipelineStage("demo_scheduled")).toBe(true);
  });

  it("should return false for closed stages", () => {
    expect(isActivePipelineStage("closed_won")).toBe(false);
    expect(isActivePipelineStage("closed_lost")).toBe(false);
  });
});

describe("getStaleThreshold", () => {
  it("should return correct thresholds for active stages", () => {
    expect(getStaleThreshold("new_lead")).toBe(7);
    expect(getStaleThreshold("initial_outreach")).toBe(14);
    expect(getStaleThreshold("sample_visit_offered")).toBe(14);
    expect(getStaleThreshold("feedback_logged")).toBe(21);
    expect(getStaleThreshold("demo_scheduled")).toBe(14);
  });

  it("should return undefined for closed stages", () => {
    expect(getStaleThreshold("closed_won")).toBeUndefined();
    expect(getStaleThreshold("closed_lost")).toBeUndefined();
  });

  it("should return undefined for unknown stages", () => {
    expect(getStaleThreshold("unknown")).toBeUndefined();
  });
});

describe("isOpportunityStale", () => {
  const referenceDate = new Date("2025-11-28T12:00:00Z");

  describe("new_lead (7 day threshold)", () => {
    it("should be stale if >7 days since activity", () => {
      const oldActivity = "2025-11-20T00:00:00Z"; // 8 days ago
      expect(isOpportunityStale("new_lead", oldActivity, referenceDate)).toBe(true);
    });

    it("should NOT be stale if ≤7 days since activity", () => {
      const recentActivity = "2025-11-22T00:00:00Z"; // 6 days ago
      expect(isOpportunityStale("new_lead", recentActivity, referenceDate)).toBe(false);
    });

    it("should be stale with exactly 7 days (edge case)", () => {
      // 7 days exactly should NOT be stale (> threshold, not >=)
      const exactlySevenDays = "2025-11-21T12:00:00Z"; // exactly 7 days
      expect(isOpportunityStale("new_lead", exactlySevenDays, referenceDate)).toBe(false);
    });
  });

  describe("initial_outreach (14 day threshold)", () => {
    it("should be stale if >14 days since activity", () => {
      const oldActivity = "2025-11-13T00:00:00Z"; // 15 days ago
      expect(isOpportunityStale("initial_outreach", oldActivity, referenceDate)).toBe(true);
    });

    it("should NOT be stale if ≤14 days since activity", () => {
      const recentActivity = "2025-11-15T00:00:00Z"; // 13 days ago
      expect(isOpportunityStale("initial_outreach", recentActivity, referenceDate)).toBe(false);
    });
  });

  describe("feedback_logged (21 day threshold)", () => {
    it("should be stale if >21 days since activity", () => {
      const oldActivity = "2025-11-06T00:00:00Z"; // 22 days ago
      expect(isOpportunityStale("feedback_logged", oldActivity, referenceDate)).toBe(true);
    });

    it("should NOT be stale if ≤21 days since activity", () => {
      const recentActivity = "2025-11-10T00:00:00Z"; // 18 days ago
      expect(isOpportunityStale("feedback_logged", recentActivity, referenceDate)).toBe(false);
    });
  });

  describe("closed stages (N/A)", () => {
    it("closed_won should NEVER be stale", () => {
      expect(isOpportunityStale("closed_won", null, referenceDate)).toBe(false);
      expect(isOpportunityStale("closed_won", "2020-01-01T00:00:00Z", referenceDate)).toBe(false);
    });

    it("closed_lost should NEVER be stale", () => {
      expect(isOpportunityStale("closed_lost", null, referenceDate)).toBe(false);
      expect(isOpportunityStale("closed_lost", "2020-01-01T00:00:00Z", referenceDate)).toBe(false);
    });
  });

  describe("null activity date", () => {
    it("should be stale if no activity date (needs immediate attention)", () => {
      expect(isOpportunityStale("new_lead", null, referenceDate)).toBe(true);
      expect(isOpportunityStale("initial_outreach", null, referenceDate)).toBe(true);
      expect(isOpportunityStale("demo_scheduled", null, referenceDate)).toBe(true);
    });

    it("should NOT be stale for closed stages even with null activity", () => {
      expect(isOpportunityStale("closed_won", null, referenceDate)).toBe(false);
      expect(isOpportunityStale("closed_lost", null, referenceDate)).toBe(false);
    });
  });
});

describe("getDaysSinceActivity", () => {
  const referenceDate = new Date("2025-11-28T12:00:00Z");

  it("should return correct number of days", () => {
    expect(getDaysSinceActivity("2025-11-27T12:00:00Z", referenceDate)).toBe(1);
    expect(getDaysSinceActivity("2025-11-21T12:00:00Z", referenceDate)).toBe(7);
    expect(getDaysSinceActivity("2025-11-14T12:00:00Z", referenceDate)).toBe(14);
  });

  it("should return Infinity for null activity date", () => {
    expect(getDaysSinceActivity(null, referenceDate)).toBe(Infinity);
  });

  it("should return 0 for same day", () => {
    expect(getDaysSinceActivity("2025-11-28T00:00:00Z", referenceDate)).toBe(0);
  });
});

describe("countStaleOpportunities", () => {
  const referenceDate = new Date("2025-11-28T12:00:00Z");

  const opportunities = [
    { stage: "new_lead", last_activity_date: "2025-11-20T00:00:00Z" }, // 8 days - STALE
    { stage: "new_lead", last_activity_date: "2025-11-25T00:00:00Z" }, // 3 days - NOT stale
    { stage: "initial_outreach", last_activity_date: null }, // null - STALE
    { stage: "demo_scheduled", last_activity_date: "2025-11-10T00:00:00Z" }, // 18 days - STALE
    { stage: "closed_won", last_activity_date: null }, // closed - NOT stale
    { stage: "feedback_logged", last_activity_date: "2025-11-20T00:00:00Z" }, // 8 days (threshold 21) - NOT stale
  ];

  it("should count correct number of stale opportunities", () => {
    expect(countStaleOpportunities(opportunities, referenceDate)).toBe(3);
  });

  it("should support last_activity_at field name", () => {
    const oppsWithAlternateField = [
      { stage: "new_lead", last_activity_at: "2025-11-20T00:00:00Z" }, // STALE
      { stage: "new_lead", last_activity_at: "2025-11-25T00:00:00Z" }, // NOT stale
    ];
    expect(countStaleOpportunities(oppsWithAlternateField, referenceDate)).toBe(1);
  });

  it("should return 0 for empty array", () => {
    expect(countStaleOpportunities([], referenceDate)).toBe(0);
  });
});

describe("filterStaleOpportunities", () => {
  const referenceDate = new Date("2025-11-28T12:00:00Z");

  const opportunities = [
    { id: 1, stage: "new_lead", last_activity_date: "2025-11-20T00:00:00Z" }, // STALE
    { id: 2, stage: "new_lead", last_activity_date: "2025-11-25T00:00:00Z" }, // NOT stale
    { id: 3, stage: "closed_won", last_activity_date: null }, // closed - NOT stale
  ];

  it("should return only stale opportunities", () => {
    const stale = filterStaleOpportunities(opportunities, referenceDate);
    expect(stale).toHaveLength(1);
    expect(stale[0].id).toBe(1);
  });

  it("should preserve original object properties", () => {
    const stale = filterStaleOpportunities(opportunities, referenceDate);
    expect(stale[0]).toEqual({
      id: 1,
      stage: "new_lead",
      last_activity_date: "2025-11-20T00:00:00Z",
    });
  });
});

describe("StageStaleThresholdsSchema", () => {
  it("should validate correct threshold configuration", () => {
    const config = {
      new_lead: 7,
      initial_outreach: 14,
      sample_visit_offered: 14,
      feedback_logged: 21,
      demo_scheduled: 14,
    };
    expect(() => StageStaleThresholdsSchema.parse(config)).not.toThrow();
  });

  it("should provide defaults for missing values", () => {
    const result = StageStaleThresholdsSchema.parse({});
    expect(result.new_lead).toBe(7);
    expect(result.initial_outreach).toBe(14);
    expect(result.feedback_logged).toBe(21);
  });

  it("should reject non-positive integers", () => {
    expect(() => StageStaleThresholdsSchema.parse({ new_lead: 0 })).toThrow();
    expect(() => StageStaleThresholdsSchema.parse({ new_lead: -1 })).toThrow();
  });
});

describe("Edge Cases (Additional)", () => {
  const referenceDate = new Date("2025-11-28T12:00:00Z");

  describe("boundary conditions", () => {
    it("should correctly handle exactly at threshold boundary (>= vs >)", () => {
      // Exactly 7 days ago should NOT be stale (threshold is > 7, not >= 7)
      expect(isOpportunityStale("new_lead", "2025-11-21T12:00:00Z", referenceDate)).toBe(false);
      // 7 days and 1 ms should NOT be stale (still exactly 7 days in Math.floor)
      expect(isOpportunityStale("new_lead", "2025-11-21T11:59:59Z", referenceDate)).toBe(false);
    });

    it("should correctly handle day boundary crossings", () => {
      // 8 full days (should be stale)
      const eightDaysAgo = new Date(referenceDate.getTime() - 8 * 24 * 60 * 60 * 1000);
      expect(isOpportunityStale("new_lead", eightDaysAgo.toISOString(), referenceDate)).toBe(true);
    });
  });

  describe("unknown stage handling", () => {
    it("should treat unknown stages like closed (not stale)", () => {
      expect(isOpportunityStale("unknown_stage", null, referenceDate)).toBe(false);
      expect(isOpportunityStale("invalid", "2020-01-01T00:00:00Z", referenceDate)).toBe(false);
      expect(isOpportunityStale("prospect", null, referenceDate)).toBe(false);
      expect(isOpportunityStale("qualified", null, referenceDate)).toBe(false);
    });
  });

  describe("timezone robustness", () => {
    it("should handle different timezone offsets in ISO strings", () => {
      // These represent the same moment in time
      const utcTime = "2025-11-20T00:00:00Z";
      const offsetTime = "2025-11-19T19:00:00-05:00"; // Same as UTC midnight Nov 20

      expect(isOpportunityStale("new_lead", utcTime, referenceDate)).toBe(true);
      expect(isOpportunityStale("new_lead", offsetTime, referenceDate)).toBe(true);
    });
  });

  describe("sample_visit_offered (14 day threshold)", () => {
    it("should use 14-day threshold correctly", () => {
      const thirteenDaysAgo = "2025-11-15T12:00:00Z"; // 13 days
      const fifteenDaysAgo = "2025-11-13T12:00:00Z"; // 15 days

      expect(isOpportunityStale("sample_visit_offered", thirteenDaysAgo, referenceDate)).toBe(
        false
      );
      expect(isOpportunityStale("sample_visit_offered", fifteenDaysAgo, referenceDate)).toBe(true);
    });
  });

  describe("demo_scheduled (14 day threshold)", () => {
    it("should use 14-day threshold correctly", () => {
      const thirteenDaysAgo = "2025-11-15T12:00:00Z"; // 13 days
      const fifteenDaysAgo = "2025-11-13T12:00:00Z"; // 15 days

      expect(isOpportunityStale("demo_scheduled", thirteenDaysAgo, referenceDate)).toBe(false);
      expect(isOpportunityStale("demo_scheduled", fifteenDaysAgo, referenceDate)).toBe(true);
    });
  });

  describe("empty string handling", () => {
    it("should treat empty string activity date as null (stale for active stages)", () => {
      // Empty string parses to Invalid Date, which should be treated as no activity
      expect(isOpportunityStale("new_lead", "", referenceDate)).toBe(true);
    });
  });

  describe("invalid date string handling", () => {
    it("should handle invalid date strings gracefully (treated as no activity = stale)", () => {
      // Invalid date parses to Invalid Date, which is treated as no recent activity
      // This is safe behavior - invalid dates are flagged as stale (fail-fast principle)
      // Production code should ensure dates are validated at input time
      expect(isOpportunityStale("new_lead", "not-a-date", referenceDate)).toBe(true);
      expect(isOpportunityStale("new_lead", "invalid", referenceDate)).toBe(true);
    });
  });

  describe("far future reference date", () => {
    it("should handle opportunities from distant past", () => {
      const futureRef = new Date("2030-01-01T00:00:00Z");
      const oldActivity = "2025-11-28T00:00:00Z"; // About 4+ years ago

      expect(isOpportunityStale("new_lead", oldActivity, futureRef)).toBe(true);
    });
  });

  describe("getDaysSinceActivity edge cases", () => {
    it("should handle future dates (negative days)", () => {
      const futureDate = "2025-11-30T00:00:00Z"; // 2 days in the future
      // Math.floor of negative = more negative, but behavior is undefined
      // The utility should still work (return negative or 0)
      const days = getDaysSinceActivity(futureDate, referenceDate);
      expect(days).toBeLessThanOrEqual(0);
    });
  });

  describe("countStaleOpportunities with mixed field names", () => {
    it("should prefer last_activity_date over last_activity_at", () => {
      const opps = [
        {
          stage: "new_lead",
          last_activity_date: "2025-11-25T00:00:00Z", // 3 days - NOT stale
          last_activity_at: "2025-11-10T00:00:00Z", // Would be stale if used
        },
      ];
      // Should use last_activity_date (3 days, not stale)
      expect(countStaleOpportunities(opps, referenceDate)).toBe(0);
    });
  });
});
