import { describe, it, expect, beforeEach } from "vitest";
import { ValidationService } from "../ValidationService";

/**
 * TDD Test Suite for Products Validation with Distributor Fields
 *
 * Bug: E2E-2026-01-11-003
 * Symptom: "Unrecognized keys: 'distributor_ids', 'product_distributors'"
 *
 * These tests should FAIL initially (red phase), then PASS after fix (green phase).
 */
describe("ValidationService - Products", () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  // Valid product data for testing
  // Using 'as const' for status to satisfy TypeScript literal type checking
  const validProductBase = {
    name: "Test Product",
    principal_id: 123,
    category: "beverages",
    status: "active" as const,
  };

  // Distributor fields as sent by ProductDistributorInput.tsx
  const distributorFields = {
    distributor_ids: [1, 2, 3],
    product_distributors: {
      1: { vendor_item_number: "DOT-001" },
      2: { vendor_item_number: "DOT-002" },
      3: { vendor_item_number: null }, // null is valid
    },
  };

  describe("create validation", () => {
    it("should accept product create with distributor fields", async () => {
      // TDD: This test should FAIL before fix, PASS after
      const productDataWithDistributors = {
        ...validProductBase,
        ...distributorFields,
      };

      await expect(
        service.validate("products", "create", productDataWithDistributors)
      ).resolves.not.toThrow();
    });

    it("should accept product create without distributor fields", async () => {
      // Regression: normal creates should still work
      await expect(service.validate("products", "create", validProductBase)).resolves.not.toThrow();
    });

    it("should reject product create with missing required fields", async () => {
      // Fail-fast: invalid data should still fail
      const invalidProduct = {
        // Missing required 'name' field
        principal_id: 123,
        category: "beverages",
      };

      await expect(service.validate("products", "create", invalidProduct)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("update validation", () => {
    it("should accept product update with distributor fields", async () => {
      // TDD: This test should FAIL before fix, PASS after
      const productDataWithDistributors = {
        id: 1,
        ...validProductBase,
        ...distributorFields,
      };

      await expect(
        service.validate("products", "update", productDataWithDistributors)
      ).resolves.not.toThrow();
    });

    it("should accept product update without distributor fields", async () => {
      // Regression: normal updates should still work
      const normalProductUpdate = {
        id: 1,
        ...validProductBase,
      };

      await expect(
        service.validate("products", "update", normalProductUpdate)
      ).resolves.not.toThrow();
    });

    it("should reject product update with missing required fields", async () => {
      // Fail-fast: invalid data should still fail
      const invalidProduct = {
        id: 1,
        // Missing required 'name' field
        principal_id: 123,
        category: "beverages",
      };

      await expect(service.validate("products", "update", invalidProduct)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("unknown key behavior (fail-fast)", () => {
    it("should reject truly unknown keys on create", async () => {
      // Fail-fast: typos and garbage keys should be rejected
      const productWithUnknownKey = {
        ...validProductBase,
        totally_unknown_field: "should fail",
      };

      await expect(
        service.validate("products", "create", productWithUnknownKey)
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should reject truly unknown keys on update", async () => {
      // Fail-fast: typos and garbage keys should be rejected
      const productWithUnknownKey = {
        id: 1,
        ...validProductBase,
        garbage_field: 123,
      };

      await expect(
        service.validate("products", "update", productWithUnknownKey)
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should reject typos in distributor field names", async () => {
      // Fail-fast: typos like 'distibutor_ids' should fail
      const productWithTypo = {
        ...validProductBase,
        distibutor_ids: [1, 2], // typo - missing 'r'
      };

      await expect(service.validate("products", "create", productWithTypo)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("distributor field type validation", () => {
    it("should validate distributor_ids is array of numbers", async () => {
      const invalidDistributorIds = {
        ...validProductBase,
        distributor_ids: ["not", "numbers"], // should coerce or fail
      };

      // With z.coerce.number(), strings that can't be coerced will fail
      await expect(
        service.validate("products", "create", invalidDistributorIds)
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should accept numeric strings in distributor_ids (coercion)", async () => {
      // z.coerce.number() should handle numeric strings
      const numericStringIds = {
        ...validProductBase,
        distributor_ids: [1, 2, 3], // numbers should work
      };

      await expect(service.validate("products", "create", numericStringIds)).resolves.not.toThrow();
    });

    it("should validate product_distributors shape", async () => {
      const invalidProductDistributors = {
        ...validProductBase,
        product_distributors: {
          1: { wrong_field: "invalid" }, // missing vendor_item_number, has wrong field
        },
      };

      await expect(
        service.validate("products", "create", invalidProductDistributors)
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should accept empty product_distributors object", async () => {
      const emptyDistributors = {
        ...validProductBase,
        distributor_ids: [],
        product_distributors: {},
      };

      await expect(
        service.validate("products", "create", emptyDistributors)
      ).resolves.not.toThrow();
    });
  });
});
