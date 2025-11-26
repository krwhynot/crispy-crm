/**
 * Tests for transformOrFilter() helper function
 *
 * IMPORTANT: ra-data-postgrest expects "@or" format with OBJECT value, not string!
 *
 * The library parses filter keys by splitting on "@" to determine the operator.
 * For "@or", it recursively processes the object value to build PostgREST queries.
 */

import { describe, it, expect } from "vitest";
import { transformOrFilter } from "./dataProviderUtils";

/*
 * Input:  { $or: [{ field1: val1 }, { field2: val2 }] }
 * Output: { "@or": { field1: val1, field2: val2 } }
 *
 * The library then converts this to: ?or=(field1.eq.val1,field2.eq.val2)
 */
describe("transformOrFilter", () => {
  describe("$or transformations", () => {
    it("should transform $or array to @or object format for ra-data-postgrest", () => {
      const input = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
      };

      const result = transformOrFilter(input);

      // Note: When same key appears twice, last value wins (object merge)
      // This is expected behavior - use different keys for true OR conditions
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

    it("should preserve other filter fields alongside @or", () => {
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

    it("should return filter with empty @or object if $or is empty array", () => {
      const input = {
        $or: [],
        status: "active",
      };

      const result = transformOrFilter(input);

      expect(result).toEqual({
        "@or": {},
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

      // ra-data-postgrest will convert this to:
      // ?or=(customer_organization_id.eq.123,principal_organization_id.eq.123,distributor_organization_id.eq.123)
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
