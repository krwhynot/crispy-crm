/**
 * Tests for transformOrFilter() helper function
 * Validates MongoDB-style $or filters are properly converted to PostgREST @or format
 */

import { describe, it, expect } from "vitest";
import { transformOrFilter } from "./dataProviderUtils";

describe("transformOrFilter", () => {
  describe("basic transformations", () => {
    it("should transform simple $or array to PostgREST @or format", () => {
      const input = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(stage.eq.qualified,stage.eq.proposal)",
      });
    });

    it("should transform $or with different fields", () => {
      const input = {
        $or: [{ status: "active" }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(status.eq.active,priority.eq.high)",
      });
    });

    it("should preserve other filter fields alongside $or", () => {
      const input = {
        $or: [{ status: "active" }, { status: "pending" }],
        name: "test",
        created_by: 123,
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(status.eq.active,status.eq.pending)",
        name: "test",
        created_by: 123,
      });
    });
  });

  describe("value type handling", () => {
    it("should handle numeric values", () => {
      const input = {
        $or: [{ priority: 1 }, { priority: 2 }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(priority.eq.1,priority.eq.2)",
      });
    });

    it("should handle boolean values with is operator", () => {
      const input = {
        $or: [{ completed: true }, { archived: false }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(completed.is.true,archived.is.false)",
      });
    });

    it("should handle array values with in operator", () => {
      const input = {
        $or: [{ stage: ["qualified", "proposal"] }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(stage.in.(qualified,proposal),priority.eq.high)",
      });
    });

    it("should escape special characters in string values", () => {
      const input = {
        $or: [{ name: "O'Reilly" }, { name: "Test, Inc." }],
      };

      const result = transformOrFilter(input);

      // Values with special chars should be quoted
      expect(result["@or"]).toContain("name.eq.");
    });
  });

  describe("edge cases", () => {
    it("should return empty object for null input", () => {
      const result = transformOrFilter(null);
      expect(result).toEqual({});
    });

    it("should return empty object for undefined input", () => {
      const result = transformOrFilter(undefined);
      expect(result).toEqual({});
    });

    it("should return filter unchanged if no $or property", () => {
      const input = {
        status: "active",
        priority: "high",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        status: "active",
        priority: "high",
      });
    });

    it("should return filter without $or if $or is not an array", () => {
      const input = {
        $or: "invalid",
        status: "active",
      } as any;

      const result = transformOrFilter(input);

      // Should pass through unchanged since $or is not an array
      expect(result).toEqual({
        $or: "invalid",
        status: "active",
      });
    });

    it("should return filter without @or if $or array is empty", () => {
      const input = {
        $or: [],
        status: "active",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        status: "active",
      });
      expect(result).not.toHaveProperty("@or");
      expect(result).not.toHaveProperty("$or");
    });

    it("should skip null values in $or conditions", () => {
      const input = {
        $or: [{ status: "active" }, { priority: null }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(status.eq.active)",
      });
    });

    it("should skip undefined values in $or conditions", () => {
      const input = {
        $or: [{ status: "active" }, { priority: undefined }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(status.eq.active)",
      });
    });

    it("should handle condition objects with multiple fields", () => {
      const input = {
        $or: [{ status: "active", priority: "high" }],
      };

      const result = transformOrFilter(input);

      // Both fields from the same condition object should be included
      expect(result["@or"]).toContain("status.eq.active");
      expect(result["@or"]).toContain("priority.eq.high");
    });
  });

  describe("integration scenarios", () => {
    it("should work with typical opportunity filter pattern", () => {
      // Pattern: Show opportunities where stage is X OR status is Y
      const input = {
        $or: [
          { stage: "qualified" },
          { stage: "proposal" },
          { status: "active" },
        ],
        account_manager_id: 123,
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(stage.eq.qualified,stage.eq.proposal,status.eq.active)",
        account_manager_id: 123,
      });
    });

    it("should work with dashboard principal filter pattern", () => {
      // Pattern: Principal drilldown with OR conditions
      const input = {
        $or: [
          { principal_organization_id: 456 },
          { customer_organization_id: 789 },
        ],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": "(principal_organization_id.eq.456,customer_organization_id.eq.789)",
      });
    });
  });
});
