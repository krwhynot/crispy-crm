/**
 * Base schema tests for products.ts validation
 * Tests: productCategorySchema, productStatusSchema, productSchema
 *
 * Following Engineering Constitution: Zod validation at API boundary
 */

import { describe, it, expect } from "vitest";
import {
  productSchema,
  productCategorySchema,
  productStatusSchema,
  PRODUCT_STATUSES,
} from "../products";

describe("Product Base Schemas", () => {
  describe("productCategorySchema", () => {
    it("should accept valid category strings", () => {
      const validCategories = ["beverages", "dairy", "custom_category", "My Category"];

      validCategories.forEach((category) => {
        const result = productCategorySchema.safeParse(category);
        expect(result.success).toBe(true);
      });
    });

    it("should reject empty string", () => {
      const result = productCategorySchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Category is required");
      }
    });

    it("should reject category exceeding 100 characters", () => {
      const longCategory = "a".repeat(101);
      const result = productCategorySchema.safeParse(longCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Category too long");
      }
    });

    it("should accept category at 100 character limit", () => {
      const maxCategory = "a".repeat(100);
      const result = productCategorySchema.safeParse(maxCategory);
      expect(result.success).toBe(true);
    });

    it("should default to beverages when not provided", () => {
      const result = productCategorySchema.parse(undefined);
      expect(result).toBe("beverages");
    });
  });

  describe("productStatusSchema", () => {
    it("should accept all valid status values", () => {
      const validStatuses = ["active", "discontinued", "coming_soon"];

      validStatuses.forEach((status) => {
        const result = productStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status values", () => {
      const invalidStatuses = [
        "Active",
        "ACTIVE",
        "inactive",
        "seasonal",
        "limited_availability",
        "",
        "pending",
      ];

      invalidStatuses.forEach((status) => {
        const result = productStatusSchema.safeParse(status);
        expect(result.success).toBe(false);
      });
    });

    it("should expose enum options via PRODUCT_STATUSES", () => {
      expect(PRODUCT_STATUSES).toEqual(["active", "discontinued", "coming_soon"]);
    });
  });

  describe("productSchema", () => {
    // Note: nutritional_info excluded from base object due to Zod v4 z.record(z.any()) issue
    // The schema field works with null but not with actual record values
    const validProduct = {
      name: "Artisan Coffee Blend",
      principal_id: 1,
      category: "beverages",
      status: "active" as const,
      description: "Premium roasted coffee",
      certifications: ["organic", "fair-trade"],
      allergens: ["none"],
      ingredients: "100% Arabica coffee beans",
      marketing_description: "Our finest roast",
      created_by: 1,
      updated_by: 1,
    };

    describe("required fields", () => {
      it("should require name field", () => {
        const data = { principal_id: 1, category: "beverages" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameError = result.error.issues.find((i) => i.path.includes("name"));
          expect(nameError).toBeDefined();
        }
      });

      it("should require principal_id field", () => {
        const data = { name: "Test Product", category: "beverages" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const principalError = result.error.issues.find((i) => i.path.includes("principal_id"));
          expect(principalError).toBeDefined();
        }
      });

      it("should apply default for category when not provided", () => {
        // productCategorySchema has default("beverages") so category is not strictly required
        const data = { name: "Test Product", principal_id: 1 };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.category).toBe("beverages");
        }
      });
    });

    describe("name validation", () => {
      it("should accept valid product name", () => {
        const result = productSchema.safeParse(validProduct);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("Artisan Coffee Blend");
        }
      });

      it("should reject empty name", () => {
        const data = { ...validProduct, name: "" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Product name is required");
        }
      });

      it("should reject name exceeding 255 characters", () => {
        const longName = "a".repeat(256);
        const data = { ...validProduct, name: longName };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Product name too long");
        }
      });

      it("should accept name at 255 character limit", () => {
        const maxName = "a".repeat(255);
        const data = { ...validProduct, name: maxName };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should trim whitespace from name", () => {
        const data = { ...validProduct, name: "  Trimmed Name  " };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("Trimmed Name");
        }
      });
    });

    describe("principal_id validation", () => {
      it("should accept positive integer principal_id", () => {
        const result = productSchema.safeParse(validProduct);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.principal_id).toBe(1);
        }
      });

      it("should reject zero principal_id", () => {
        const data = { ...validProduct, principal_id: 0 };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject negative principal_id", () => {
        const data = { ...validProduct, principal_id: -1 };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-integer principal_id", () => {
        const data = { ...validProduct, principal_id: 1.5 };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("status validation", () => {
      it("should default status to active", () => {
        const minimalProduct = {
          name: "Test Product",
          principal_id: 1,
          category: "beverages",
        };
        const result = productSchema.safeParse(minimalProduct);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe("active");
        }
      });

      it("should accept valid status values", () => {
        const statuses = ["active", "discontinued", "coming_soon"] as const;

        statuses.forEach((status) => {
          const data = { ...validProduct, status };
          const result = productSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(status);
          }
        });
      });

      it("should reject invalid status values", () => {
        const data = { ...validProduct, status: "invalid_status" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("description validation", () => {
      it("should accept valid description", () => {
        const data = { ...validProduct, description: "A fine product" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe("A fine product");
        }
      });

      it("should accept undefined description", () => {
        const { description: _description, ...productWithoutDesc } = validProduct;
        const result = productSchema.safeParse(productWithoutDesc);
        expect(result.success).toBe(true);
      });

      it("should reject description exceeding 2000 characters", () => {
        const longDescription = "a".repeat(2001);
        const data = { ...validProduct, description: longDescription };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should accept description at 2000 character limit", () => {
        const maxDescription = "a".repeat(2000);
        const data = { ...validProduct, description: maxDescription };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("certifications and allergens (nullish handling)", () => {
      it("should accept array of certifications", () => {
        const data = { ...validProduct, certifications: ["organic", "kosher", "halal"] };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.certifications).toEqual(["organic", "kosher", "halal"]);
        }
      });

      it("should accept null for certifications", () => {
        const data = { ...validProduct, certifications: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.certifications).toBeNull();
        }
      });

      it("should accept undefined for certifications", () => {
        const { certifications: _certifications, ...productWithoutCerts } = validProduct;
        const result = productSchema.safeParse(productWithoutCerts);
        expect(result.success).toBe(true);
      });

      it("should reject certifications exceeding 50 items", () => {
        const manyCerts = Array(51).fill("cert");
        const data = { ...validProduct, certifications: manyCerts };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject certification string exceeding 100 characters", () => {
        const longCert = "a".repeat(101);
        const data = { ...validProduct, certifications: [longCert] };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should accept null for allergens", () => {
        const data = { ...validProduct, allergens: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.allergens).toBeNull();
        }
      });

      it("should accept undefined for allergens", () => {
        const { allergens: _allergens, ...productWithoutAllergens } = validProduct;
        const result = productSchema.safeParse(productWithoutAllergens);
        expect(result.success).toBe(true);
      });

      it("should accept array of allergens", () => {
        const data = { ...validProduct, allergens: ["nuts", "dairy", "gluten"] };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.allergens).toEqual(["nuts", "dairy", "gluten"]);
        }
      });

      it("should reject allergens exceeding 50 items", () => {
        const manyAllergens = Array(51).fill("allergen");
        const data = { ...validProduct, allergens: manyAllergens };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("ingredients validation", () => {
      it("should accept valid ingredients string", () => {
        const data = { ...validProduct, ingredients: "Water, sugar, natural flavors" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept null for ingredients", () => {
        const data = { ...validProduct, ingredients: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ingredients).toBeNull();
        }
      });

      it("should reject ingredients exceeding 5000 characters", () => {
        const longIngredients = "a".repeat(5001);
        const data = { ...validProduct, ingredients: longIngredients };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("marketing_description validation", () => {
      it("should accept valid marketing description", () => {
        const data = { ...validProduct, marketing_description: "The finest quality you can find" };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept null for marketing_description", () => {
        const data = { ...validProduct, marketing_description: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject marketing_description exceeding 2000 characters", () => {
        const longMarketing = "a".repeat(2001);
        const data = { ...validProduct, marketing_description: longMarketing };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("nutritional_info validation", () => {
      // Note: z.record(z.any()) has a bug in Zod v4 where parsing actual record values fails
      // with "Cannot read properties of undefined (reading '_zod')"
      // These tests document the expected behavior once the schema is fixed

      it("should accept null for nutritional_info", () => {
        const data = { ...validProduct, nutritional_info: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept undefined for nutritional_info (nullish)", () => {
        const { ...productWithoutNutritional } = validProduct;
        const result = productSchema.safeParse(productWithoutNutritional);
        expect(result.success).toBe(true);
      });

      it("should accept valid record for nutritional_info", () => {
        const data = { ...validProduct, nutritional_info: { calories: 100, protein: "5g" } };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept empty object for nutritional_info", () => {
        const data = { ...validProduct, nutritional_info: {} };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("system fields", () => {
      it("should accept nullish created_by", () => {
        const data = { ...validProduct, created_by: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept nullish updated_by", () => {
        const data = { ...validProduct, updated_by: null };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept integer created_by", () => {
        const data = { ...validProduct, created_by: 123 };
        const result = productSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.created_by).toBe(123);
        }
      });
    });

    describe("z.strictObject security", () => {
      it("should reject unrecognized keys (mass assignment prevention)", () => {
        const dataWithExtraField = {
          ...validProduct,
          malicious_field: "attack",
        };
        expect(() => productSchema.parse(dataWithExtraField)).toThrow();
      });

      it("should reject id field (prevent ID injection)", () => {
        const dataWithId = {
          ...validProduct,
          id: 999,
        };
        expect(() => productSchema.parse(dataWithId)).toThrow();
      });

      it("should reject created_at field", () => {
        const dataWithTimestamp = {
          ...validProduct,
          created_at: "2025-01-01T00:00:00Z",
        };
        expect(() => productSchema.parse(dataWithTimestamp)).toThrow();
      });
    });
  });
});
