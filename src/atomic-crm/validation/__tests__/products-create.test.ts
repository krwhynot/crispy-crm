/**
 * Create operation tests for products.ts validation
 * Tests: validateProductForm, productCreateWithDistributorsSchema
 *
 * Following Engineering Constitution: Zod validation at API boundary
 */

import { describe, it, expect } from "vitest";
import {
  productSchema,
  productCreateWithDistributorsSchema,
  validateProductForm,
  validateProductFormWithDistributors,
} from "../products";

describe("Product Create Validation", () => {
  describe("validateProductForm", () => {
    const validProduct = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
    };

    it("should resolve successfully for valid data", async () => {
      await expect(validateProductForm(validProduct)).resolves.toBeUndefined();
    });

    it("should throw React Admin formatted error on validation failure", async () => {
      const invalidData = { principal_id: 1, category: "beverages" };

      try {
        await validateProductForm(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Validation failed");
        expect(error).toHaveProperty("body");
        expect((error as { body: { errors: Record<string, string> } }).body).toHaveProperty(
          "errors"
        );
        expect((error as { body: { errors: Record<string, string> } }).body.errors).toHaveProperty(
          "name"
        );
      }
    });

    it("should format nested path errors correctly", async () => {
      const invalidData = {
        name: "",
        principal_id: -1,
        category: "",
      };

      try {
        await validateProductForm(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const errors = (error as { body: { errors: Record<string, string> } }).body.errors;
        expect(Object.keys(errors).length).toBeGreaterThan(0);
      }
    });
  });

  describe("productCreateWithDistributorsSchema", () => {
    const validProductWithDistributors = {
      name: "Product with Distributors",
      principal_id: 1,
      category: "beverages",
      status: "active" as const,
      distributor_ids: [1, 2, 3],
      product_distributors: {
        "1": { vendor_item_number: "VIN-001" },
        "2": { vendor_item_number: null },
      },
    };

    describe("base product fields", () => {
      it("should accept valid product data", () => {
        const data = {
          name: "Test Product",
          principal_id: 1,
          category: "beverages",
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should require name field", () => {
        const data = { principal_id: 1, category: "beverages" };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should require principal_id field", () => {
        const data = { name: "Test", category: "beverages" };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should apply default category", () => {
        const data = { name: "Test", principal_id: 1 };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.category).toBe("beverages");
        }
      });

      it("should apply default status", () => {
        const data = { name: "Test", principal_id: 1, category: "dairy" };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe("active");
        }
      });
    });

    describe("distributor_ids field", () => {
      it("should accept array of distributor IDs", () => {
        const result = productCreateWithDistributorsSchema.safeParse(validProductWithDistributors);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.distributor_ids).toEqual([1, 2, 3]);
        }
      });

      it("should accept empty distributor_ids array", () => {
        const data = { ...validProductWithDistributors, distributor_ids: [] };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.distributor_ids).toEqual([]);
        }
      });

      it("should accept undefined distributor_ids", () => {
        const { distributor_ids: _distributor_ids, ...dataWithoutDistributors } =
          validProductWithDistributors;
        const result = productCreateWithDistributorsSchema.safeParse(dataWithoutDistributors);
        expect(result.success).toBe(true);
      });

      it("should coerce string IDs to numbers", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          distributor_ids: ["1", "2", "3"],
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.distributor_ids).toEqual([1, 2, 3]);
        }
      });

      it("should reject negative distributor IDs", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          distributor_ids: [-1, 2],
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject zero distributor ID", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          distributor_ids: [0, 1],
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("product_distributors field", () => {
      it("should accept valid product_distributors record", () => {
        const result = productCreateWithDistributorsSchema.safeParse(validProductWithDistributors);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_distributors).toEqual({
            "1": { vendor_item_number: "VIN-001" },
            "2": { vendor_item_number: null },
          });
        }
      });

      it("should accept empty product_distributors", () => {
        const data = { ...validProductWithDistributors, product_distributors: {} };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept undefined product_distributors", () => {
        const { product_distributors: _product_distributors, ...dataWithout } =
          validProductWithDistributors;
        const result = productCreateWithDistributorsSchema.safeParse(dataWithout);
        expect(result.success).toBe(true);
      });

      it("should reject vendor_item_number exceeding 50 characters", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          product_distributors: {
            "1": { vendor_item_number: "a".repeat(51) },
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should accept vendor_item_number at 50 character limit", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          product_distributors: {
            "1": { vendor_item_number: "a".repeat(50) },
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("nutritional_info with union schema", () => {
      it("should accept nutritional_info with string values", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {
            calories: "100",
            protein: "5g",
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nutritional_info).toEqual({
            calories: "100",
            protein: "5g",
          });
        }
      });

      it("should accept nutritional_info with number values", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {
            calories: 100,
            fat: 5,
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nutritional_info).toEqual({
            calories: 100,
            fat: 5,
          });
        }
      });

      it("should accept nutritional_info with mixed string and number values", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {
            calories: 100,
            protein: "5g",
            fat: 10,
            sodium: "200mg",
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept null for nutritional_info", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: null,
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept empty object for nutritional_info", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {},
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject nutritional_info key exceeding 50 characters", () => {
        const longKey = "a".repeat(51);
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {
            [longKey]: "100",
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject nutritional_info string value exceeding 100 characters", () => {
        const data = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          nutritional_info: {
            calories: "a".repeat(101),
          },
        };
        const result = productCreateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("z.strictObject security", () => {
      it("should reject unrecognized keys", () => {
        const dataWithExtra = {
          name: "Test",
          principal_id: 1,
          category: "beverages",
          malicious_field: "attack",
        };
        expect(() => productCreateWithDistributorsSchema.parse(dataWithExtra)).toThrow();
      });

      it("should reject id field on create (prevent ID injection)", () => {
        const dataWithId = {
          id: 999,
          name: "Test",
          principal_id: 1,
          category: "beverages",
        };
        expect(() => productCreateWithDistributorsSchema.parse(dataWithId)).toThrow();
      });
    });
  });

  describe("validateProductFormWithDistributors", () => {
    const validData = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
      distributor_ids: [1, 2],
    };

    it("should resolve successfully for valid data", async () => {
      await expect(validateProductFormWithDistributors(validData)).resolves.toBeUndefined();
    });

    it("should throw React Admin formatted error on validation failure", async () => {
      const invalidData = { principal_id: 1, category: "beverages" };

      try {
        await validateProductFormWithDistributors(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Validation failed");
        expect(error).toHaveProperty("body");
        expect((error as { body: { errors: Record<string, string> } }).body).toHaveProperty(
          "errors"
        );
      }
    });
  });

  describe("Integration with React Hook Form", () => {
    it("should work with partial().parse({}) pattern for form defaults", () => {
      const formDefaults = productSchema.partial().parse({
        status: "active" as const,
        category: "beverages",
      });

      expect(formDefaults.status).toBe("active");
      expect(formDefaults.category).toBe("beverages");
    });

    it("should validate form submission with full schema", () => {
      const formData = {
        name: "Product from form",
        principal_id: 1,
        category: "dairy",
        description: "From React Hook Form",
      };

      const result = productSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });
  });
});
