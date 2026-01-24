/**
 * Tests for resourceTypes.ts display name extractors
 *
 * These extractors format resource display names for filters and UI elements.
 * The sales extractor includes ID-based fallback for data quality visibility.
 */

import { describe, it, expect } from "vitest";
import { resourceExtractors, type FetchedResource } from "../resourceTypes";
import type { Sales } from "../../../validation/sales";
import type { Organization } from "../../../validation/organizations";
import type { Tag } from "../../../validation/tags";

describe("resourceExtractors", () => {
  describe("sales extractor", () => {
    // Helper to create a minimal Sales record for testing
    const createSalesRecord = (
      overrides: Partial<FetchedResource<Sales>>
    ): FetchedResource<Sales> => ({
      id: 42,
      first_name: "",
      last_name: "",
      email: "test@example.com",
      role: "rep",
      disabled: false,
      digest_opt_in: true,
      timezone: "America/Chicago",
      ...overrides,
    });

    it("should return full name when both parts exist", () => {
      const sales = createSalesRecord({
        first_name: "John",
        last_name: "Doe",
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("John Doe");
    });

    it("should return first name only when last name is null", () => {
      const sales = createSalesRecord({
        first_name: "John",
        last_name: null as unknown as string,
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("John");
    });

    it("should return last name only when first name is null", () => {
      const sales = createSalesRecord({
        first_name: null as unknown as string,
        last_name: "Doe",
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Doe");
    });

    it("should return ID-based identifier when both names are null", () => {
      const sales = createSalesRecord({
        id: 42,
        first_name: null as unknown as string,
        last_name: null as unknown as string,
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Sales #42 (missing name)");
    });

    it("should handle empty strings same as null for first name", () => {
      const sales = createSalesRecord({
        id: 99,
        first_name: "",
        last_name: "Smith",
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Smith");
    });

    it("should handle empty strings same as null for last name", () => {
      const sales = createSalesRecord({
        id: 99,
        first_name: "Jane",
        last_name: "",
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Jane");
    });

    it("should return ID-based identifier when both names are empty strings", () => {
      const sales = createSalesRecord({
        id: 123,
        first_name: "",
        last_name: "",
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Sales #123 (missing name)");
    });

    it("should handle whitespace-only names", () => {
      const sales = createSalesRecord({
        id: 456,
        first_name: "   ",
        last_name: "   ",
      });

      const result = resourceExtractors.sales(sales);

      // trim() handles whitespace, resulting in empty strings
      expect(result).toBe("Sales #456 (missing name)");
    });

    it("should work with string IDs", () => {
      const sales = createSalesRecord({
        id: "uuid-abc-123" as unknown as number,
        first_name: null as unknown as string,
        last_name: null as unknown as string,
      });

      const result = resourceExtractors.sales(sales);

      expect(result).toBe("Sales #uuid-abc-123 (missing name)");
    });
  });

  describe("organizations extractor", () => {
    it("should return organization name", () => {
      const org: FetchedResource<Organization> = {
        id: 1,
        name: "Acme Corp",
      };

      const result = resourceExtractors.organizations(org);

      expect(result).toBe("Acme Corp");
    });
  });

  describe("tags extractor", () => {
    it("should return tag name", () => {
      const tag: FetchedResource<Tag> = {
        id: 1,
        name: "Important",
      };

      const result = resourceExtractors.tags(tag);

      expect(result).toBe("Important");
    });
  });
});
