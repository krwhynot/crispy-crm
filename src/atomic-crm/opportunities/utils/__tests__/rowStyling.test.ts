import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCloseDateStatus,
  isClosedStage,
  isHotLead,
  getOpportunityRowClassName,
  opportunityRowClassName,
} from "../rowStyling";

describe("rowStyling utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-16"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCloseDateStatus", () => {
    it("returns 'no-date' for null/undefined", () => {
      expect(getCloseDateStatus(null)).toBe("no-date");
      expect(getCloseDateStatus(undefined)).toBe("no-date");
    });

    it("returns 'overdue' for past dates", () => {
      expect(getCloseDateStatus("2025-12-10")).toBe("overdue");
      expect(getCloseDateStatus("2025-01-01")).toBe("overdue");
    });

    it("returns 'today' for current date", () => {
      expect(getCloseDateStatus("2025-12-16")).toBe("today");
    });

    it("returns 'soon' for dates within 7 days", () => {
      expect(getCloseDateStatus("2025-12-17")).toBe("soon");
      expect(getCloseDateStatus("2025-12-23")).toBe("soon");
    });

    it("returns 'normal' for dates more than 7 days away", () => {
      expect(getCloseDateStatus("2025-12-24")).toBe("normal");
      expect(getCloseDateStatus("2026-01-15")).toBe("normal");
    });

    it("returns 'no-date' for invalid date strings", () => {
      expect(getCloseDateStatus("invalid")).toBe("no-date");
      expect(getCloseDateStatus("")).toBe("no-date");
    });
  });

  describe("isClosedStage", () => {
    it("returns true for closed_won", () => {
      expect(isClosedStage("closed_won")).toBe(true);
    });

    it("returns true for closed_lost", () => {
      expect(isClosedStage("closed_lost")).toBe(true);
    });

    it("returns false for other stages", () => {
      expect(isClosedStage("new_lead")).toBe(false);
      expect(isClosedStage("demo_scheduled")).toBe(false);
      expect(isClosedStage(null)).toBe(false);
    });
  });

  describe("isHotLead", () => {
    it("returns true for new_lead stage", () => {
      expect(isHotLead("new_lead")).toBe(true);
    });

    it("returns false for other stages", () => {
      expect(isHotLead("initial_outreach")).toBe(false);
      expect(isHotLead("closed_won")).toBe(false);
      expect(isHotLead(null)).toBe(false);
    });
  });

  describe("getOpportunityRowClassName", () => {
    it("returns overdue styling for past close dates (non-closed)", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-10",
        stage: "demo_scheduled",
      });
      expect(result).toContain("bg-error-subtle");
    });

    it("returns hot lead styling for new_lead stage", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-20",
        stage: "new_lead",
      });
      expect(result).toContain("border-l-4");
      expect(result).toContain("border-l-primary");
    });

    it("combines overdue and hot lead styling", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-10",
        stage: "new_lead",
      });
      expect(result).toContain("bg-error-subtle");
      expect(result).toContain("border-l-primary");
    });

    it("returns closed_won styling (no overdue even if past date)", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-01",
        stage: "closed_won",
      });
      expect(result).toContain("bg-success-subtle");
      expect(result).toContain("opacity-75");
      expect(result).not.toContain("bg-error-subtle");
    });

    it("returns closed_lost styling (no overdue even if past date)", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-01",
        stage: "closed_lost",
      });
      expect(result).toContain("opacity-50");
      expect(result).not.toContain("bg-error-subtle");
    });

    it("returns empty string for normal opportunities", () => {
      const result = getOpportunityRowClassName({
        estimated_close_date: "2025-12-25",
        stage: "demo_scheduled",
      });
      expect(result.trim()).toBe("");
    });
  });

  describe("opportunityRowClassName (type-safe wrapper)", () => {
    it("handles null/undefined record gracefully", () => {
      expect(opportunityRowClassName(null, 0)).toBe("");
      expect(opportunityRowClassName(undefined, 0)).toBe("");
    });

    it("handles non-object record gracefully", () => {
      expect(opportunityRowClassName("string", 0)).toBe("");
      expect(opportunityRowClassName(123, 0)).toBe("");
    });

    it("processes valid opportunity record", () => {
      const result = opportunityRowClassName(
        { estimated_close_date: "2025-12-10", stage: "new_lead" },
        0
      );
      expect(result).toContain("bg-error-subtle");
      expect(result).toContain("border-l-primary");
    });
  });
});
