import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredStagePreferences,
  saveStagePreferences,
  getDefaultVisibleStages,
  getInitialStageFilter,
} from "../opportunityStagePreferences";

describe("opportunityStagePreferences", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("getDefaultVisibleStages", () => {
    it("returns default visible stages excluding closed_won and closed_lost", () => {
      const stages = getDefaultVisibleStages();
      expect(stages).not.toContain("closed_won");
      expect(stages).not.toContain("closed_lost");
      expect(stages.length).toBeGreaterThan(0);
    });

    it("returns consistent results across multiple calls", () => {
      const stages1 = getDefaultVisibleStages();
      const stages2 = getDefaultVisibleStages();
      expect(stages1).toEqual(stages2);
    });
  });

  describe("getStoredStagePreferences", () => {
    it("returns default visible stages when no preferences stored", () => {
      const stages = getStoredStagePreferences();
      expect(stages).not.toContain("closed_won");
      expect(stages).not.toContain("closed_lost");
      expect(stages.length).toBeGreaterThan(0);
    });

    it("retrieves saved preferences from sessionStorage", () => {
      const testStages = ["new_lead", "qualified", "proposal"];
      sessionStorage.setItem("filter.opportunity_stages", JSON.stringify(testStages));

      const retrieved = getStoredStagePreferences();
      expect(retrieved).toEqual(testStages);
    });

    it("handles invalid JSON gracefully and returns defaults", () => {
      sessionStorage.setItem("filter.opportunity_stages", "{invalid json}");
      const stages = getStoredStagePreferences();
      expect(stages).toEqual(getDefaultVisibleStages());
    });

    it("handles corrupted sessionStorage gracefully", () => {
      sessionStorage.setItem("filter.opportunity_stages", "null");
      const stages = getStoredStagePreferences();
      expect(stages).toEqual(getDefaultVisibleStages());
    });
  });

  describe("saveStagePreferences", () => {
    it("saves stage preferences to sessionStorage", () => {
      const testStages = ["new_lead", "qualified", "proposal"];
      saveStagePreferences(testStages);

      const stored = sessionStorage.getItem("filter.opportunity_stages");
      expect(stored).toBe(JSON.stringify(testStages));
    });

    it("does not save empty array", () => {
      saveStagePreferences([]);
      expect(sessionStorage.getItem("filter.opportunity_stages")).toBeNull();
    });

    it("overwrites existing preferences", () => {
      const initialStages = ["new_lead", "qualified"];
      const updatedStages = ["proposal", "demo_scheduled"];

      saveStagePreferences(initialStages);
      saveStagePreferences(updatedStages);

      const stored = sessionStorage.getItem("filter.opportunity_stages");
      expect(JSON.parse(stored!)).toEqual(updatedStages);
    });

    it("handles save errors gracefully", () => {
      // Mock sessionStorage to throw an error
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = () => {
        throw new Error("Quota exceeded");
      };

      // Should not throw
      expect(() => saveStagePreferences(["new_lead"])).not.toThrow();

      // Restore
      sessionStorage.setItem = originalSetItem;
    });
  });

  describe("getInitialStageFilter", () => {
    it("returns sessionStorage preferences when no URL params", () => {
      const testStages = ["new_lead", "qualified"];
      sessionStorage.setItem("filter.opportunity_stages", JSON.stringify(testStages));

      const result = getInitialStageFilter();
      expect(result).toEqual(testStages);
    });

    it("returns default stages when no preferences or URL params", () => {
      const result = getInitialStageFilter();
      expect(result).toEqual(getDefaultVisibleStages());
    });

    // Note: Cannot easily test URL parameter precedence in unit tests
    // as window.location.search is read-only in JSDOM
    // This should be covered by integration tests
  });
});
