/**
 * Update operation tests for products.ts validation
 * Tests: productUpdateSchema, validateProductUpdate, productUpdateWithDistributorsSchema
 *
 * Following Engineering Constitution: Zod validation at API boundary
 */

import { describe, it, expect } from "vitest";
import {
  productUpdateSchema,
  productUpdateWithDistributorsSchema,
  validateProductUpdate,
  validateProductUpdateWithDistributors,
} from "../products";

describe("Product Update Validation", () => {
  describe("productUpdateSchema", () => {
    it("should allow all product fields (strip mode)", () => {
      const updateData = {
        name: "Updated Product Name",
        principal_id: 2,
        category: "dairy",
        status: "discontinued" as const,
      };
      const result = productUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should strip unrecognized keys instead of rejecting", () => {
      const dataWithExtra = {
        name: "Test",
        principal_id: 1,
        category: "beverages",
        extra_field: "should be stripped",
      };
      const result = productUpdateSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).extra_field).toBeUndefined();
      }
    });

    it("should accept valid update with all fields", () => {
      const fullUpdate = {
        name: "Full Update Product",
        principal_id: 5,
        category: "frozen",
        status: "coming_soon" as const,
        description: "Updated description",
        certifications: ["updated-cert"],
        allergens: ["updated-allergen"],
        ingredients: "Updated ingredients list",
        marketing_description: "Updated marketing copy",
        created_by: 1,
        updated_by: 2,
      };
      const result = productUpdateSchema.safeParse(fullUpdate);
      expect(result.success).toBe(true);
    });

    it("should apply defaults when fields not provided", () => {
      const minimalUpdate = {
        name: "Minimal Update",
        principal_id: 1,
      };
      const result = productUpdateSchema.safeParse(minimalUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("active");
        expect(result.data.category).toBe("beverages");
      }
    });
  });

  describe("validateProductUpdate", () => {
    const validUpdate = {
      name: "Updated Product",
      principal_id: 1,
      category: "dairy",
    };

    it("should resolve successfully for valid update data", async () => {
      await expect(validateProductUpdate(validUpdate)).resolves.toBeUndefined();
    });

    it("should throw React Admin formatted error on validation failure", async () => {
      const invalidData = { name: "", principal_id: 1, category: "beverages" };

      try {
        await validateProductUpdate(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Validation failed");
        expect(error).toHaveProperty("body");
      }
    });

    it("should reject negative principal_id", async () => {
      const invalidData = { name: "Test", principal_id: -1, category: "beverages" };

      try {
        await validateProductUpdate(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Validation failed");
      }
    });
  });

  describe("productUpdateWithDistributorsSchema", () => {
    const validUpdateWithDistributors = {
      id: 123,
      name: "Updated Product with Distributors",
      principal_id: 1,
      category: "beverages",
      status: "active" as const,
      distributor_ids: [1, 2, 3],
      product_distributors: {
        "1": { vendor_item_number: "VIN-001-UPDATED" },
        "2": { vendor_item_number: null },
      },
    };

    describe("id field handling", () => {
      it("should accept numeric id on update", () => {
        const result = productUpdateWithDistributorsSchema.safeParse(validUpdateWithDistributors);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(123);
        }
      });

      it("should accept string id on update", () => {
        const data = { ...validUpdateWithDistributors, id: "abc-123" };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe("abc-123");
        }
      });

      it("should accept undefined id", () => {
        const { id: _id, ...dataWithoutId } = validUpdateWithDistributors;
        const result = productUpdateWithDistributorsSchema.safeParse(dataWithoutId);
        expect(result.success).toBe(true);
      });
    });

    describe("base product fields", () => {
      it("should accept valid update data", () => {
        const result = productUpdateWithDistributorsSchema.safeParse(validUpdateWithDistributors);
        expect(result.success).toBe(true);
      });

      it("should require name field", () => {
        const { name: _name, ...dataWithoutName } = validUpdateWithDistributors;
        const result = productUpdateWithDistributorsSchema.safeParse(dataWithoutName);
        expect(result.success).toBe(false);
      });

      it("should require principal_id field", () => {
        const { principal_id: _principal_id, ...dataWithoutPrincipal } =
          validUpdateWithDistributors;
        const result = productUpdateWithDistributorsSchema.safeParse(dataWithoutPrincipal);
        expect(result.success).toBe(false);
      });
    });

    describe("distributor fields on update", () => {
      it("should accept updated distributor_ids", () => {
        const result = productUpdateWithDistributorsSchema.safeParse(validUpdateWithDistributors);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.distributor_ids).toEqual([1, 2, 3]);
        }
      });

      it("should accept updated product_distributors", () => {
        const result = productUpdateWithDistributorsSchema.safeParse(validUpdateWithDistributors);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_distributors).toEqual({
            "1": { vendor_item_number: "VIN-001-UPDATED" },
            "2": { vendor_item_number: null },
          });
        }
      });

      it("should allow clearing distributor_ids with empty array", () => {
        const data = { ...validUpdateWithDistributors, distributor_ids: [] };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.distributor_ids).toEqual([]);
        }
      });

      it("should allow clearing product_distributors with empty object", () => {
        const data = { ...validUpdateWithDistributors, product_distributors: {} };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_distributors).toEqual({});
        }
      });
    });

    describe("nutritional_info on update", () => {
      it("should accept updated nutritional_info with mixed values", () => {
        const data = {
          ...validUpdateWithDistributors,
          nutritional_info: {
            calories: 150,
            protein: "8g",
            updated_field: "new value",
          },
        };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should allow clearing nutritional_info with null", () => {
        const data = { ...validUpdateWithDistributors, nutritional_info: null };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nutritional_info).toBeNull();
        }
      });

      it("should allow clearing nutritional_info with empty object", () => {
        const data = { ...validUpdateWithDistributors, nutritional_info: {} };
        const result = productUpdateWithDistributorsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("z.strictObject security", () => {
      it("should reject unrecognized keys", () => {
        const dataWithExtra = {
          ...validUpdateWithDistributors,
          malicious_update_field: "attack",
        };
        expect(() => productUpdateWithDistributorsSchema.parse(dataWithExtra)).toThrow();
      });

      it("should ALLOW timestamp fields from view (stripped later by callbacks)", () => {
        // FIX (2025-01): Schema now allows timestamp fields because:
        // 1. EditBase populates defaultValues from products_summary view
        // 2. View includes created_at, updated_at, deleted_at, principal_name
        // 3. React Admin includes ALL defaultValues in update payload
        // 4. productsCallbacks.computedFields strips these before DB write
        // This prevents "Unrecognized key" validation errors
        const dataWithTimestamp = {
          ...validUpdateWithDistributors,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-15T00:00:00Z",
          deleted_at: null,
          principal_name: "Test Principal",
        };
        // Should NOT throw - these fields are allowed (but stripped before save)
        expect(() => productUpdateWithDistributorsSchema.parse(dataWithTimestamp)).not.toThrow();
      });
    });
  });

  describe("validateProductUpdateWithDistributors", () => {
    const validData = {
      id: 1,
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
      distributor_ids: [1, 2],
    };

    it("should resolve successfully for valid data", async () => {
      await expect(validateProductUpdateWithDistributors(validData)).resolves.toBeUndefined();
    });

    it("should throw React Admin formatted error on validation failure", async () => {
      const invalidData = { id: 1, principal_id: 1, category: "beverages" };

      try {
        await validateProductUpdateWithDistributors(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Validation failed");
        expect(error).toHaveProperty("body");
        expect((error as { body: { errors: Record<string, string> } }).body).toHaveProperty(
          "errors"
        );
      }
    });

    it("should accept data with id included", async () => {
      const dataWithId = {
        id: 999,
        name: "Product with ID",
        principal_id: 1,
        category: "dairy",
      };
      await expect(validateProductUpdateWithDistributors(dataWithId)).resolves.toBeUndefined();
    });
  });
});
