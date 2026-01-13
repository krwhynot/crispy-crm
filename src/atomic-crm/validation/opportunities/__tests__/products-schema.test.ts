import { describe, it, expect } from "vitest";
import { opportunityProductSchema } from "../opportunities-core";

describe("opportunityProductSchema", () => {
  it("validates valid product array from JSONB", () => {
    const validProducts = [
      {
        id: 1,
        product_id_reference: 42,
        product_name: "Widget A",
        product_category: "samples",
        principal_name: "ACME Corp",
        notes: "Sample notes",
      },
      {
        id: 2,
        product_id_reference: 43,
        product_name: "Widget B",
        product_category: "equipment",
        notes: null,
      },
    ];

    const result = opportunityProductSchema.safeParse(validProducts);
    expect(result.success).toBe(true);
  });

  it("accepts null for no products", () => {
    const result = opportunityProductSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts empty array", () => {
    const result = opportunityProductSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("rejects invalid product structure (missing id)", () => {
    const invalidProducts = [{ product_name: "Widget" }];
    const result = opportunityProductSchema.safeParse(invalidProducts);
    expect(result.success).toBe(false);
  });

  it("accepts products with extra fields (passthrough)", () => {
    const productsWithExtras = [
      {
        id: 1,
        product_name: "Widget",
        product_category: "samples",
        customField: "legacy",
      },
    ];
    const result = opportunityProductSchema.safeParse(productsWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.[0]).toHaveProperty("customField", "legacy");
    }
  });

  it("handles real JSONB data from database view", () => {
    const realJsonbData = [
      {
        id: 42,
        product_id_reference: 100,
        product_name: "Sample Kit A",
        product_category: "samples",
        principal_name: "MFB Industries",
        notes: "Follow-up required",
      },
    ];
    const result = opportunityProductSchema.safeParse(realJsonbData);
    expect(result.success).toBe(true);
  });

  it("accepts products with null optional fields", () => {
    const productsWithNulls = [
      {
        id: 1,
        product_id_reference: null,
        product_name: null,
        product_category: null,
        principal_name: null,
        notes: null,
      },
    ];
    const result = opportunityProductSchema.safeParse(productsWithNulls);
    expect(result.success).toBe(true);
  });

  it("accepts products without optional fields", () => {
    const minimalProduct = [{ id: 1 }];
    const result = opportunityProductSchema.safeParse(minimalProduct);
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric id", () => {
    const invalidId = [{ id: "not-a-number", product_name: "Widget" }];
    const result = opportunityProductSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
  });
});
