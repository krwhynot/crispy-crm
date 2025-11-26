/**
 * Tests for transformOrFilter() helper function
 * Validates MongoDB-style $or filters are properly converted to PostgREST format
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
  });

  describe("pass-through behavior", () => {
    it("should return filter unchanged if no $or", () => {
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
        or: "()",
        status: "active",
      });
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
  });
});
