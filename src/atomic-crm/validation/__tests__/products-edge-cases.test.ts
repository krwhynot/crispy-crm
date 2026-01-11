/**
 * Edge cases, async validation, and miscellaneous tests for products.ts
 * Tests: opportunityProductSchema, validateOpportunityProduct, exported constants, skipped tests
 *
 * Following Engineering Constitution: Zod validation at API boundary
 */

import { describe, it, expect } from "vitest";
import {
  opportunityProductSchema,
  validateOpportunityProduct,
  FB_CONSUMABLE_CATEGORIES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  type OpportunityProduct,
} from "../products";

describe("Product Edge Cases and Miscellaneous", () => {
  describe("opportunityProductSchema", () => {
    const validOpportunityProduct: OpportunityProduct = {
      product_id_reference: 1,
      product_name: "Test Product",
      product_category: "beverages",
      notes: "Sample notes",
    };

    it("should accept valid opportunity product", () => {
      const result = opportunityProductSchema.safeParse(validOpportunityProduct);
      expect(result.success).toBe(true);
    });

    it("should require product_id_reference", () => {
      const data = { product_name: "Test" };
      const result = opportunityProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should require product_name", () => {
      const data = { product_id_reference: 1 };
      const result = opportunityProductSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path.includes("product_name"));
        expect(nameError).toBeDefined();
      }
    });

    describe("product_id_reference coercion", () => {
      it("should coerce string to number", () => {
        const data = { ...validOpportunityProduct, product_id_reference: "42" };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_id_reference).toBe(42);
          expect(typeof result.data.product_id_reference).toBe("number");
        }
      });

      it("should accept number directly", () => {
        const data = { ...validOpportunityProduct, product_id_reference: 123 };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_id_reference).toBe(123);
        }
      });

      it("should reject zero product_id_reference", () => {
        const data = { ...validOpportunityProduct, product_id_reference: 0 };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject negative product_id_reference", () => {
        const data = { ...validOpportunityProduct, product_id_reference: -5 };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("notes validation", () => {
      it("should accept valid notes", () => {
        const data = { ...validOpportunityProduct, notes: "Important product notes" };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept undefined notes", () => {
        const { notes: _notes, ...dataWithoutNotes } = validOpportunityProduct;
        const result = opportunityProductSchema.safeParse(dataWithoutNotes);
        expect(result.success).toBe(true);
      });

      it("should reject notes exceeding 500 characters", () => {
        const longNotes = "a".repeat(501);
        const data = { ...validOpportunityProduct, notes: longNotes };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should accept notes at 500 character limit", () => {
        const maxNotes = "a".repeat(500);
        const data = { ...validOpportunityProduct, notes: maxNotes };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("product_name validation", () => {
      it("should reject empty product_name", () => {
        const data = { ...validOpportunityProduct, product_name: "" };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Product name is required");
        }
      });

      it("should reject product_name exceeding 255 characters", () => {
        const longName = "a".repeat(256);
        const data = { ...validOpportunityProduct, product_name: longName };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Product name too long");
        }
      });

      it("should trim whitespace from product_name", () => {
        const data = { ...validOpportunityProduct, product_name: "  Trimmed  " };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.product_name).toBe("Trimmed");
        }
      });
    });

    describe("id field", () => {
      it("should accept string id", () => {
        const data = { ...validOpportunityProduct, id: "abc-123" };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe("abc-123");
        }
      });

      it("should accept number id", () => {
        const data = { ...validOpportunityProduct, id: 456 };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(456);
        }
      });

      it("should accept undefined id (new record)", () => {
        const { id: _id, ...dataWithoutId } = { ...validOpportunityProduct, id: 1 };
        const result = opportunityProductSchema.safeParse(dataWithoutId);
        expect(result.success).toBe(true);
      });
    });

    describe("product_category validation", () => {
      it("should accept valid product_category", () => {
        const data = { ...validOpportunityProduct, product_category: "frozen" };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept undefined product_category", () => {
        const { product_category: _product_category, ...dataWithoutCategory } =
          validOpportunityProduct;
        const result = opportunityProductSchema.safeParse(dataWithoutCategory);
        expect(result.success).toBe(true);
      });

      it("should reject product_category exceeding 100 characters", () => {
        const longCategory = "a".repeat(101);
        const data = { ...validOpportunityProduct, product_category: longCategory };
        const result = opportunityProductSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("validateOpportunityProduct", () => {
    const validData = {
      product_id_reference: 1,
      product_name: "Test Product",
    };

    it("should resolve successfully for valid data", async () => {
      await expect(validateOpportunityProduct(validData)).resolves.toBeUndefined();
    });

    it("should throw React Admin formatted error on validation failure", async () => {
      const invalidData = { product_name: "" };

      try {
        await validateOpportunityProduct(invalidData);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        expect(error).toHaveProperty("message", "Product validation failed");
        expect(error).toHaveProperty("body");
        expect((error as { body: { errors: Record<string, string> } }).body).toHaveProperty(
          "errors"
        );
      }
    });

    it("should validate complete opportunity product data", async () => {
      const completeData = {
        id: 1,
        product_id_reference: 42,
        product_name: "Complete Product",
        product_category: "dairy",
        notes: "Complete notes",
      };
      await expect(validateOpportunityProduct(completeData)).resolves.toBeUndefined();
    });
  });

  describe("Exported constants", () => {
    it("should export FB_CONSUMABLE_CATEGORIES with all food categories", () => {
      expect(FB_CONSUMABLE_CATEGORIES).toContain("beverages");
      expect(FB_CONSUMABLE_CATEGORIES).toContain("dairy");
      expect(FB_CONSUMABLE_CATEGORIES).toContain("frozen");
      expect(FB_CONSUMABLE_CATEGORIES).toContain("fresh_produce");
      expect(FB_CONSUMABLE_CATEGORIES).toContain("other");
      expect(FB_CONSUMABLE_CATEGORIES.length).toBe(16);
    });

    it("should export PRODUCT_CATEGORIES as alias for FB_CONSUMABLE_CATEGORIES", () => {
      expect(PRODUCT_CATEGORIES).toEqual(FB_CONSUMABLE_CATEGORIES);
    });

    it("should export PRODUCT_STATUSES with valid status values", () => {
      expect(PRODUCT_STATUSES).toContain("active");
      expect(PRODUCT_STATUSES).toContain("discontinued");
      expect(PRODUCT_STATUSES).toContain("coming_soon");
      expect(PRODUCT_STATUSES.length).toBe(3);
    });

    it("should have all expected food categories in FB_CONSUMABLE_CATEGORIES", () => {
      const expectedCategories = [
        "beverages",
        "dairy",
        "frozen",
        "fresh_produce",
        "meat_poultry",
        "seafood",
        "dry_goods",
        "snacks",
        "condiments",
        "baking_supplies",
        "spices_seasonings",
        "canned_goods",
        "pasta_grains",
        "oils_vinegars",
        "sweeteners",
        "other",
      ];

      expectedCategories.forEach((category) => {
        expect(FB_CONSUMABLE_CATEGORIES).toContain(category);
      });
    });
  });

  describe("Type inference", () => {
    it("OpportunityProduct type should match schema inference", () => {
      const validData: OpportunityProduct = {
        product_id_reference: 1,
        product_name: "Typed Product",
        product_category: "beverages",
        notes: "Type test",
        id: "test-id",
      };

      const result = opportunityProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should enforce type constraints at compile time", () => {
      // This test validates that TypeScript types are properly inferred
      const minimalData: OpportunityProduct = {
        product_id_reference: 1,
        product_name: "Minimal",
      };

      const result = opportunityProductSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });
});
