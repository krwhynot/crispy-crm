/**
 * Tests for transformOrFilter() helper function
 * Validates MongoDB-style $or/$and/$not filters are properly converted to PostgREST format
 *
 * PostgREST expects: or=(field.eq.val,field.eq.val) as query parameter
 * Output format: { "or": "(field.eq.val,field.eq.val)" }
 */

import { describe, it, expect } from "vitest";
import { transformOrFilter } from "./dataProviderUtils";

describe("transformOrFilter", () => {
  describe("$or transformations", () => {
    it("should transform $or array to PostgREST or string format", () => {
      const input = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(stage.eq.qualified,stage.eq.proposal)",
      });
    });

    it("should transform $or with different fields", () => {
      const input = {
        $or: [{ status: "active" }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(status.eq.active,priority.eq.high)",
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
        or: "(status.eq.active,priority.eq.high)",
        name: "test",
        created_by: 123,
      });
    });

    it("should handle numeric values", () => {
      const input = {
        $or: [{ customer_id: 1 }, { principal_id: 2 }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(customer_id.eq.1,principal_id.eq.2)",
      });
    });

    it("should handle boolean values", () => {
      const input = {
        $or: [{ completed: true }, { archived: false }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(completed.eq.true,archived.eq.false)",
      });
    });

    it("should skip null/undefined values", () => {
      const input = {
        $or: [{ status: "active" }, { priority: null }, { level: undefined }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(status.eq.active)",
      });
    });
  });

  describe("$and transformations", () => {
    it("should transform $and array to PostgREST and string format", () => {
      const input = {
        $and: [{ status: "active" }, { priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        and: "(status.eq.active,priority.eq.high)",
      });
    });
  });

  describe("$not transformations", () => {
    it("should transform $not object to PostgREST not string format", () => {
      const input = {
        $not: { status: "archived" },
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        not: "(status.eq.archived)",
      });
    });

    it("should handle $not with multiple fields", () => {
      const input = {
        $not: { status: "archived", deleted: true },
      };

      const result = transformOrFilter(input);

      expect(result["not"]).toContain("status.eq.archived");
      expect(result["not"]).toContain("deleted.eq.true");
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

    it("should return filter unchanged if no logical operators", () => {
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

    it("should return filter without or if $or is empty array", () => {
      const input = {
        $or: [],
        status: "active",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        status: "active",
      });
      expect(result).not.toHaveProperty("or");
      expect(result).not.toHaveProperty("$or");
    });

    it("should handle $or with objects containing multiple fields", () => {
      const input = {
        $or: [{ status: "active", priority: "high" }],
      };

      const result = transformOrFilter(input);

      expect(result["or"]).toContain("status.eq.active");
      expect(result["or"]).toContain("priority.eq.high");
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
        or: "(customer_organization_id.eq.123,principal_organization_id.eq.123,distributor_organization_id.eq.123)",
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
        or: "(principal_organization_id.eq.456,customer_organization_id.eq.789)",
        account_manager_id: 123,
        status: "active",
      });
    });

    it("should handle combined $or and $and operators", () => {
      const input = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
        $and: [{ status: "active" }, { assigned: true }],
        name: "test",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        or: "(stage.eq.qualified,stage.eq.proposal)",
        and: "(status.eq.active,assigned.eq.true)",
        name: "test",
      });
    });
  });
});
