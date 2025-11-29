/**
 * Unit tests for Levenshtein distance utility
 *
 * Tests the fuzzy string matching algorithm used to detect similar
 * opportunity names during creation.
 */

import { describe, it, expect } from "vitest";
import {
  levenshteinDistance,
  findSimilarOpportunities,
  hasSimilarOpportunity,
} from "../levenshtein";

describe("levenshteinDistance", () => {
  describe("basic operations", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
      expect(levenshteinDistance("ABC Corp", "ABC Corp")).toBe(0);
    });

    it("handles empty strings", () => {
      expect(levenshteinDistance("", "")).toBe(0);
      expect(levenshteinDistance("hello", "")).toBe(5);
      expect(levenshteinDistance("", "world")).toBe(5);
    });

    it("calculates single character insertion", () => {
      expect(levenshteinDistance("hello", "hellos")).toBe(1);
      expect(levenshteinDistance("cat", "cats")).toBe(1);
    });

    it("calculates single character deletion", () => {
      expect(levenshteinDistance("hellos", "hello")).toBe(1);
      expect(levenshteinDistance("cats", "cat")).toBe(1);
    });

    it("calculates single character substitution", () => {
      expect(levenshteinDistance("hello", "hallo")).toBe(1);
      expect(levenshteinDistance("cat", "bat")).toBe(1);
    });

    it("handles classic example: kitten -> sitting", () => {
      // kitten -> sitten (k→s) -> sittin (e→i) -> sitting (+g) = 3
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });
  });

  describe("case insensitivity", () => {
    it("treats uppercase and lowercase as equal", () => {
      expect(levenshteinDistance("Hello", "hello")).toBe(0);
      expect(levenshteinDistance("ABC CORP", "abc corp")).toBe(0);
      expect(levenshteinDistance("MixedCase", "MIXEDCASE")).toBe(0);
    });
  });

  describe("whitespace handling", () => {
    it("trims leading and trailing whitespace", () => {
      expect(levenshteinDistance("  hello  ", "hello")).toBe(0);
      expect(levenshteinDistance("hello", "  hello  ")).toBe(0);
    });
  });

  describe("real-world opportunity name scenarios", () => {
    it("detects typos in company names", () => {
      // "Corp" → "Crop" requires 2 edits: transposition isn't a single operation
      // in standard Levenshtein (delete 'o' at position 4, insert 'o' at position 5)
      expect(levenshteinDistance("ABC Corp", "ABC Crop")).toBe(2);
      expect(levenshteinDistance("Sysco Foods", "Sysco Food")).toBe(1);
    });

    it("detects plural variations", () => {
      expect(levenshteinDistance("Widget", "Widgets")).toBe(1);
      expect(levenshteinDistance("Product Sample", "Products Sample")).toBe(1);
    });

    it("detects minor naming differences", () => {
      expect(levenshteinDistance("ABC Corp - Q1", "ABC Corp - Q2")).toBe(1);
      expect(levenshteinDistance("ABC Corp - 2024", "ABC Corp - 2025")).toBe(1);
    });

    it("correctly identifies significantly different names", () => {
      // These should have distance > 3 (above threshold)
      expect(levenshteinDistance("ABC Corp", "XYZ Industries")).toBeGreaterThan(3);
      expect(levenshteinDistance("Widget Deal", "Gadget Partnership")).toBeGreaterThan(3);
    });
  });
});

describe("findSimilarOpportunities", () => {
  const mockOpportunities = [
    {
      id: "1",
      name: "ABC Corp - Widget Deal",
      stage: "new_lead",
      customer_organization_name: "ABC Corp",
      principal_organization_name: "Widget Inc",
    },
    {
      id: "2",
      name: "XYZ Industries - Gadget",
      stage: "initial_outreach",
      customer_organization_name: "XYZ Industries",
      principal_organization_name: "Gadget Co",
    },
    {
      id: "3",
      name: "ABC Corp - Widget Deal 2024",
      stage: "demo_scheduled",
      customer_organization_name: "ABC Corp",
      principal_organization_name: "Widget Inc",
    },
    {
      id: "4",
      name: "Completely Different Name",
      stage: "closed_won",
    },
  ];

  describe("similarity detection", () => {
    it("finds similar opportunities within threshold", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deals", // 1 character different from id 1
        threshold: 3,
      });

      expect(result.hasSimilar).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].name).toBe("ABC Corp - Widget Deal");
    });

    it("returns empty when no similar opportunities exist", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "Totally Unique Name 12345",
        threshold: 3,
      });

      expect(result.hasSimilar).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("excludes exact matches (distance 0)", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deal", // Exact match
        threshold: 3,
      });

      // Should not include the exact match, but might include similar ones
      const exactMatch = result.matches.find((m) => m.distance === 0);
      expect(exactMatch).toBeUndefined();
    });

    it("respects threshold parameter", () => {
      // With threshold 1, should find very close matches only
      const strictResult = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deals",
        threshold: 1,
      });

      // With threshold 5, should find more matches
      const looseResult = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deals",
        threshold: 5,
      });

      expect(looseResult.matches.length).toBeGreaterThanOrEqual(strictResult.matches.length);
    });
  });

  describe("excludeId option", () => {
    it("excludes specified opportunity from results", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deal",
        excludeId: "1",
        threshold: 5,
      });

      const excludedMatch = result.matches.find((m) => m.id === "1");
      expect(excludedMatch).toBeUndefined();
    });
  });

  describe("sorting", () => {
    it("sorts matches by distance (closest first)", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deal",
        threshold: 10, // High threshold to get multiple matches
      });

      if (result.matches.length > 1) {
        for (let i = 1; i < result.matches.length; i++) {
          expect(result.matches[i].distance).toBeGreaterThanOrEqual(
            result.matches[i - 1].distance
          );
        }
      }
    });
  });

  describe("edge cases", () => {
    it("handles empty name input", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "",
        threshold: 3,
      });

      expect(result.hasSimilar).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("handles whitespace-only name input", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "   ",
        threshold: 3,
      });

      expect(result.hasSimilar).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("handles empty opportunities array", () => {
      const result = findSimilarOpportunities([], {
        name: "Any Name",
        threshold: 3,
      });

      expect(result.hasSimilar).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("filters out opportunities with empty names", () => {
      const oppsWithEmpty = [
        ...mockOpportunities,
        { id: "5", name: "", stage: "new_lead" },
        { id: "6", name: "   ", stage: "new_lead" },
      ];

      const result = findSimilarOpportunities(oppsWithEmpty, {
        name: "ABC Corp - Widget Deal",
        threshold: 10,
      });

      // Should not include empty name opportunities
      const emptyNameMatch = result.matches.find((m) => !m.name || m.name.trim() === "");
      expect(emptyNameMatch).toBeUndefined();
    });
  });

  describe("metadata preservation", () => {
    it("includes organization names in results", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deals",
        threshold: 3,
      });

      if (result.matches.length > 0) {
        const match = result.matches[0];
        expect(match.customer_organization_name).toBeDefined();
        expect(match.principal_organization_name).toBeDefined();
      }
    });

    it("includes stage in results", () => {
      const result = findSimilarOpportunities(mockOpportunities, {
        name: "ABC Corp - Widget Deals",
        threshold: 3,
      });

      if (result.matches.length > 0) {
        expect(result.matches[0].stage).toBeDefined();
      }
    });
  });
});

describe("hasSimilarOpportunity", () => {
  const mockOpportunities = [
    { id: "1", name: "ABC Corp Deal", stage: "new_lead" },
    { id: "2", name: "XYZ Industries Deal", stage: "initial_outreach" },
  ];

  it("returns true when similar opportunity exists", () => {
    expect(hasSimilarOpportunity(mockOpportunities, "ABC Corp Deals", 3)).toBe(true);
  });

  it("returns false when no similar opportunity exists", () => {
    expect(hasSimilarOpportunity(mockOpportunities, "Completely Different Name", 3)).toBe(false);
  });

  it("uses default threshold of 3", () => {
    // This should be within default threshold of 3
    expect(hasSimilarOpportunity(mockOpportunities, "ABC Corp Deal!")).toBe(true);

    // This should be outside default threshold of 3
    expect(hasSimilarOpportunity(mockOpportunities, "ABCDEF Corp Deal!!!!")).toBe(false);
  });
});
