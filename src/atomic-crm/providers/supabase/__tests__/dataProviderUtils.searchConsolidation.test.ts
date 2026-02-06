/**
 * TDD Tests for Search Consolidation
 *
 * Goal: Move all q-search logic to central SEARCHABLE_RESOURCES
 * - sales should be searchable via central config (not callback)
 * - contacts, organizations, opportunities, products should continue working
 *
 * Engineering Constitution: TDD - Write tests first, then implement
 */

import { describe, it, expect } from "vitest";
import { applySearchParams } from "../dataProviderUtils";
import { SEARCHABLE_RESOURCES } from "../resources";

describe("Search Consolidation - Central SEARCHABLE_RESOURCES", () => {
  describe("sales resource q-search", () => {
    it("should have sales configured in SEARCHABLE_RESOURCES", () => {
      // TDD: This test will FAIL until we add sales to SEARCHABLE_RESOURCES
      expect(SEARCHABLE_RESOURCES).toHaveProperty("sales");
      expect(SEARCHABLE_RESOURCES.sales).toEqual(
        expect.arrayContaining(["first_name", "last_name", "email"])
      );
    });

    it("should transform q parameter to or@ filter for sales", () => {
      // TDD: This test will FAIL until sales is in SEARCHABLE_RESOURCES
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "john" },
      };

      const result = applySearchParams("sales", params);

      // q should be removed and replaced with or@ filter
      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");

      // or@ should contain ILIKE patterns for searchable fields
      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("first_name.ilike.*john*");
      expect(orFilter).toContain("last_name.ilike.*john*");
      expect(orFilter).toContain("email.ilike.*john*");
    });

    it("should escape special characters in sales search", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "john.doe@example.com" },
      };

      const result = applySearchParams("sales", params);

      // Should escape special characters for PostgREST
      expect(result.filter).toHaveProperty("or@");
    });
  });

  describe("existing resources still work (regression)", () => {
    it("should transform q for contacts", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "smith" },
      };

      const result = applySearchParams("contacts", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");
    });

    it("should transform q for organizations", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "acme" },
      };

      const result = applySearchParams("organizations", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");
    });

    it("should transform q for opportunities", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "deal" },
      };

      const result = applySearchParams("opportunities", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");
    });

    it("should transform q for products", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "widget" },
      };

      const result = applySearchParams("products", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");
    });
  });

  describe("resources without central search config", () => {
    it("should strip q for resources not in SEARCHABLE_RESOURCES (no transformation)", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "test" },
      };

      // tags is not in SEARCHABLE_RESOURCES
      const result = applySearchParams("tags", params);

      // q should be stripped (not transformed to or@) for unconfigured resources
      // Central search only transforms resources in SEARCHABLE_RESOURCES
      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).not.toHaveProperty("or@");
    });
  });
});
