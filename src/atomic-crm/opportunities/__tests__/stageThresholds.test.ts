import { describe, it, expect } from "vitest";
import {
  STAGE_ROTTING_THRESHOLDS,
  isRotting,
  getWarningThreshold,
  getStageStatus,
} from "../constants";

describe("stageThresholds", () => {
  describe("STAGE_ROTTING_THRESHOLDS", () => {
    it("defines thresholds for all 7 pipeline stages", () => {
      const stages = [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
        "feedback_logged",
        "demo_scheduled",
        "closed_won",
        "closed_lost",
      ];
      stages.forEach((stage) => {
        expect(STAGE_ROTTING_THRESHOLDS).toHaveProperty(stage);
      });
    });

    it("returns null for closed stages", () => {
      expect(STAGE_ROTTING_THRESHOLDS.closed_won).toBeNull();
      expect(STAGE_ROTTING_THRESHOLDS.closed_lost).toBeNull();
    });

    it("has correct threshold for new_lead (7 days)", () => {
      expect(STAGE_ROTTING_THRESHOLDS.new_lead).toBe(7);
    });

    it("has correct threshold for demo_scheduled (5 days)", () => {
      expect(STAGE_ROTTING_THRESHOLDS.demo_scheduled).toBe(5);
    });
  });

  describe("isRotting", () => {
    it("returns true when days exceeds threshold", () => {
      expect(isRotting("new_lead", 8)).toBe(true);
      expect(isRotting("new_lead", 10)).toBe(true);
    });

    it("returns false when days equals threshold", () => {
      expect(isRotting("new_lead", 7)).toBe(false);
    });

    it("returns false when days below threshold", () => {
      expect(isRotting("new_lead", 5)).toBe(false);
    });

    it("returns false for closed stages", () => {
      expect(isRotting("closed_won", 100)).toBe(false);
      expect(isRotting("closed_lost", 100)).toBe(false);
    });
  });

  describe("getWarningThreshold", () => {
    it("returns 75% of rotting threshold", () => {
      expect(getWarningThreshold("new_lead")).toBe(5);
      expect(getWarningThreshold("sample_visit_offered")).toBe(10);
    });

    it("returns null for closed stages", () => {
      expect(getWarningThreshold("closed_won")).toBeNull();
      expect(getWarningThreshold("closed_lost")).toBeNull();
    });
  });

  describe("getStageStatus", () => {
    it("returns 'rotting' when over threshold", () => {
      expect(getStageStatus("new_lead", 8)).toBe("rotting");
    });

    it("returns 'expired' when close date passed", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getStageStatus("new_lead", 3, yesterday)).toBe("expired");
    });

    it("returns 'warning' when in warning zone", () => {
      expect(getStageStatus("new_lead", 6)).toBe("warning");
    });

    it("returns 'healthy' when below warning", () => {
      expect(getStageStatus("new_lead", 3)).toBe("healthy");
    });

    it("returns 'closed' for closed stages", () => {
      expect(getStageStatus("closed_won", 100)).toBe("closed");
      expect(getStageStatus("closed_lost", 50)).toBe("closed");
    });

    it("prioritizes expired over rotting", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getStageStatus("new_lead", 100, yesterday)).toBe("expired");
    });
  });
});
