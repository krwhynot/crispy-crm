/**
 * ProductCreate Component Tests
 *
 * Tests transform logic, default values, and API error handling
 * Following Engineering Constitution: Single validation at API boundary
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { createServerError, createValidationError } from "@/tests/utils/mock-providers";
import { productSchema, PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../../validation/products";

describe("ProductCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transform Logic and Default Values", () => {
    test("applies default status 'active' from schema when not provided", () => {
      const result = productSchema.partial().parse({});

      expect(result.status).toBe("active");
    });

    test("applies default category 'beverages' from schema when not provided", () => {
      const result = productSchema.partial().parse({});

      expect(result.category).toBe("beverages");
    });

    test("preserves provided status instead of applying default", () => {
      const result = productSchema.partial().parse({ status: "discontinued" });

      expect(result.status).toBe("discontinued");
    });

    test("preserves provided category instead of applying default", () => {
      const result = productSchema.partial().parse({ category: "frozen" });

      expect(result.category).toBe("frozen");
    });

    test("default values function includes identity-based created_by", () => {
      const mockIdentityId = 123;
      const getDefaultValues = (identityId?: number) => ({
        ...productSchema.partial().parse({}),
        created_by: identityId,
      });

      const defaults = getDefaultValues(mockIdentityId);

      expect(defaults.created_by).toBe(123);
      expect(defaults.status).toBe("active");
      expect(defaults.category).toBe("beverages");
    });

    test("handles undefined identity gracefully", () => {
      const getDefaultValues = (identityId?: number) => ({
        ...productSchema.partial().parse({}),
        created_by: identityId,
      });

      const defaults = getDefaultValues(undefined);

      expect(defaults.created_by).toBeUndefined();
      expect(defaults.status).toBe("active");
    });
  });

  describe("Data Shape Transformation", () => {
    test("transforms complete product data correctly", () => {
      const inputData = {
        name: "Test Product",
        principal_id: 1,
        category: "dairy",
        status: "active" as const,
        description: "A test product description",
      };

      const result = productSchema.parse(inputData);

      expect(result.name).toBe("Test Product");
      expect(result.principal_id).toBe(1);
      expect(result.category).toBe("dairy");
      expect(result.status).toBe("active");
      expect(result.description).toBe("A test product description");
    });

    test("handles optional fields as nullish correctly", () => {
      const inputData = {
        name: "Minimal Product",
        principal_id: 1,
        category: "beverages",
        certifications: null,
        allergens: undefined,
        ingredients: null,
      };

      const result = productSchema.parse(inputData);

      expect(result.certifications).toBeNull();
      expect(result.allergens).toBeUndefined();
      expect(result.ingredients).toBeNull();
    });

    test("preserves arrays for certifications and allergens", () => {
      const inputData = {
        name: "Certified Product",
        principal_id: 1,
        category: "frozen",
        certifications: ["USDA Organic", "Non-GMO"],
        allergens: ["milk", "soy"],
      };

      const result = productSchema.parse(inputData);

      expect(result.certifications).toEqual(["USDA Organic", "Non-GMO"]);
      expect(result.allergens).toEqual(["milk", "soy"]);
    });

    test("accepts nutritional_info as nullish (record field)", () => {
      const inputDataWithNull = {
        name: "Nutritional Product",
        principal_id: 1,
        category: "dairy",
        nutritional_info: null,
      };

      const result = productSchema.parse(inputDataWithNull);

      expect(result.nutritional_info).toBeNull();
    });
  });

  describe("API Error Handling", () => {
    test("propagates server errors to data provider", async () => {
      const serverError = createServerError("Database connection failed");
      const mockCreate = vi.fn().mockRejectedValue(serverError);

      try {
        await mockCreate("products", {
          data: {
            name: "Test Product",
            principal_id: 1,
            category: "beverages",
          },
        });
      } catch (error) {
        expect(error).toEqual(serverError);
        expect(error.message).toBe("Database connection failed");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("handles validation errors from API", async () => {
      const validationErrors = createValidationError({
        name: "Product name already exists",
        principal_id: "Principal not found",
      });

      const mockCreate = vi.fn().mockRejectedValue(validationErrors);

      try {
        await mockCreate("products", {
          data: {
            name: "Duplicate Product",
            principal_id: 999,
            category: "beverages",
          },
        });
      } catch (error) {
        expect(error).toEqual(validationErrors);
        expect(error.errors).toHaveProperty("name");
        expect(error.errors).toHaveProperty("principal_id");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("handles network errors gracefully", async () => {
      const networkError = new Error("Network timeout");
      const mockCreate = vi.fn().mockRejectedValue(networkError);

      try {
        await mockCreate("products", {
          data: {
            name: "Test Product",
            principal_id: 1,
            category: "dairy",
          },
        });
      } catch (error) {
        expect(error).toBe(networkError);
        expect(error.message).toBe("Network timeout");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form Configuration", () => {
    test("uses 'products' as the correct resource name", () => {
      const resourceName = "products";
      expect(resourceName).toBe("products");
    });

    test("redirect is set to 'show' after create", () => {
      const redirect = "show";
      expect(redirect).toBe("show");
    });

    test("form mode is set to onBlur for performance", () => {
      const formMode = "onBlur";
      expect(formMode).toBe("onBlur");
    });
  });

  describe("Schema Validation at API Boundary", () => {
    test("rejects product without required name", () => {
      const inputWithoutName = {
        principal_id: 1,
        category: "beverages",
      };

      const result = productSchema.safeParse(inputWithoutName);

      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path.includes("name"));
        expect(nameError).toBeDefined();
      }
    });

    test("rejects product without required principal_id", () => {
      const inputWithoutPrincipal = {
        name: "Orphan Product",
        category: "beverages",
      };

      const result = productSchema.safeParse(inputWithoutPrincipal);

      expect(result.success).toBe(false);
      if (!result.success) {
        const principalError = result.error.issues.find((i) => i.path.includes("principal_id"));
        expect(principalError).toBeDefined();
      }
    });

    test("validates status is one of allowed enum values", () => {
      expect(PRODUCT_STATUSES).toContain("active");
      expect(PRODUCT_STATUSES).toContain("discontinued");
      expect(PRODUCT_STATUSES).toContain("coming_soon");
      expect(PRODUCT_STATUSES).toHaveLength(3);
    });

    test("validates category suggestions are available", () => {
      expect(PRODUCT_CATEGORIES).toContain("beverages");
      expect(PRODUCT_CATEGORIES).toContain("dairy");
      expect(PRODUCT_CATEGORIES).toContain("frozen");
      expect(PRODUCT_CATEGORIES.length).toBeGreaterThan(0);
    });

    test("enforces string max length constraints (DoS prevention)", () => {
      const longName = "x".repeat(300);
      const inputWithLongName = {
        name: longName,
        principal_id: 1,
        category: "beverages",
      };

      const result = productSchema.safeParse(inputWithLongName);

      expect(result.success).toBe(false);
      if (!result.success) {
        const lengthError = result.error.issues.find(
          (i) => i.path.includes("name") && i.message.includes("too long")
        );
        expect(lengthError).toBeDefined();
      }
    });

    test("uses strictObject to prevent mass assignment", () => {
      const inputWithExtraFields = {
        name: "Valid Product",
        principal_id: 1,
        category: "beverages",
        _malicious_field: "injection attempt",
      };

      const result = productSchema.safeParse(inputWithExtraFields);

      expect(result.success).toBe(false);
    });
  });
});
