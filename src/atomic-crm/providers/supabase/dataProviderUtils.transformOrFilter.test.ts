/**
 * Tests for transformOrFilter() helper function
 * Validates MongoDB-style $or filters are properly converted to ra-data-postgrest @or format
 *
 * IMPORTANT: ra-data-postgrest expects @or to be a nested object, NOT a formatted string.
 * The library's parseFilters() then converts this to PostgREST query string format.
 */

import { describe, it, expect } from "vitest";
import { transformOrFilter } from "./dataProviderUtils";

describe("transformOrFilter", () => {
  describe("basic transformations", () => {
    it("should transform simple $or array to @or object format", () => {
      const input = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
      };

      const result = transformOrFilter(input);

      // Note: When same field appears multiple times, later value overwrites
      // This is a known limitation - use @in operator for same-field OR
      expect(result).toEqual({
        "@or": { stage: "proposal" },
      });
    });

    it("should transform $or with different fields", () => {
      const input = {
        $or: [{ status: "active" }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { status: "active", priority: "high" },
      });
    });

    it("should preserve other filter fields alongside $or", () => {
      const input = {
        $or: [{ status: "active" }, { priority: "high" }],
        name: "test",
        created_by: 123,
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { status: "active", priority: "high" },
        name: "test",
        created_by: 123,
      });
    });
  });

  describe("value type handling", () => {
    it("should handle numeric values", () => {
      const input = {
        $or: [{ customer_id: 1 }, { principal_id: 2 }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { customer_id: 1, principal_id: 2 },
      });
    });

    it("should handle boolean values", () => {
      const input = {
        $or: [{ completed: true }, { archived: false }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { completed: true, archived: false },
      });
    });

    it("should handle array values (for @in operator)", () => {
      const input = {
        $or: [{ stage: ["qualified", "proposal"] }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { stage: ["qualified", "proposal"], priority: "high" },
      });
    });

    it("should preserve string values as-is (ra-data-postgrest handles escaping)", () => {
      const input = {
        $or: [{ name: "O'Reilly" }, { company: "Test, Inc." }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { name: "O'Reilly", company: "Test, Inc." },
      });
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

    it("should return filter unchanged if $or is not an array", () => {
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
        "@or": { status: "active" },
      });
    });

    it("should skip undefined values in $or conditions", () => {
      const input = {
        $or: [{ status: "active" }, { priority: undefined }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": { status: "active" },
      });
    });

    it("should handle condition objects with multiple fields", () => {
      const input = {
        $or: [{ status: "active", priority: "high" }],
      };

      const result = transformOrFilter(input);

      // Both fields from the same condition object should be included
      expect(result["@or"]).toHaveProperty("status", "active");
      expect(result["@or"]).toHaveProperty("priority", "high");
    });
  });

  describe("integration scenarios", () => {
    it("should work with organization opportunities filter pattern", () => {
      // Pattern: Show opportunities linked to this org via any of the three org fields
      const input = {
        $or: [
          { customer_organization_id: 123 },
          { principal_organization_id: 123 },
          { distributor_organization_id: 123 },
        ],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": {
          customer_organization_id: 123,
          principal_organization_id: 123,
          distributor_organization_id: 123,
        },
      });
    });

    it("should work with multi-field OR filter with additional constraints", () => {
      // Pattern: Principal drilldown with OR conditions + other filters
      const input = {
        $or: [
          { principal_organization_id: 456 },
          { customer_organization_id: 789 },
        ],
        account_manager_id: 123,
        status: "active",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": {
          principal_organization_id: 456,
          customer_organization_id: 789,
        },
        account_manager_id: 123,
        status: "active",
      });
    });
  });
});
