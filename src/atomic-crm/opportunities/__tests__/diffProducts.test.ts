import { describe, it, expect } from "vitest";
import { diffProducts, productsAreDifferent, type Product } from "../diffProducts";

describe("productsAreDifferent", () => {
  it("should return false for identical products", () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Test notes",
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Test notes",
    };

    expect(productsAreDifferent(product1, product2)).toBe(false);
  });

  it("should return true when product_id_reference differs", () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Test notes",
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 101,
      notes: "Test notes",
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it("should return true when notes differ", () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Original notes",
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Updated notes",
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it("should treat undefined/null and empty string as equal for notes", () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: undefined,
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "",
    };

    expect(productsAreDifferent(product1, product2)).toBe(false);
  });

  it("should ignore whitespace differences in notes", () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "  Test notes  ",
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      notes: "Test notes",
    };

    expect(productsAreDifferent(product1, product2)).toBe(false);
  });
});

describe("diffProducts", () => {
  it("should identify all creates when all products are new", () => {
    const dbItems: Product[] = [];
    const formItems: Product[] = [
      { product_id_reference: 100, notes: "Product A" },
      { product_id_reference: 101, notes: "Product B" },
      { product_id_reference: 102, notes: "Product C" },
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(3);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(0);
    expect(result.creates).toEqual(formItems);
  });

  it("should identify updates only when products have changed", () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Original A" },
      { id: 2, product_id_reference: 101, notes: "Original B" },
      { id: 3, product_id_reference: 102, notes: "Original C" },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Original A" }, // No change
      { id: 2, product_id_reference: 101, notes: "Updated B" }, // Notes changed
      { id: 3, product_id_reference: 103, notes: "Original C" }, // Product changed
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(2);
    expect(result.deletes).toHaveLength(0);
    expect(result.updates).toContainEqual(formItems[1]);
    expect(result.updates).toContainEqual(formItems[2]);
  });

  it("should identify deletes only when products are removed", () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Product A" },
      { id: 2, product_id_reference: 101, notes: "Product B" },
      { id: 3, product_id_reference: 102, notes: "Product C" },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Product A" }, // Kept
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(2);
    expect(result.deletes).toContain(2);
    expect(result.deletes).toContain(3);
  });

  it("should handle mixed operations (creates, updates, deletes)", () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Product A" },
      { id: 2, product_id_reference: 101, notes: "Product B" },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Updated A" }, // Update
      { product_id_reference: 103, notes: "New Product C" }, // Create
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(1);
    expect(result.updates).toHaveLength(1);
    expect(result.deletes).toHaveLength(1);
    expect(result.creates[0].product_id_reference).toBe(103);
    expect(result.updates[0].id).toBe(1);
    expect(result.deletes[0]).toBe(2);
  });

  it("should return empty arrays when no changes", () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Product A" },
      { id: 2, product_id_reference: 101, notes: "Product B" },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, notes: "Product A" },
      { id: 2, product_id_reference: 101, notes: "Product B" },
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(0);
  });

  it("should handle empty arrays gracefully", () => {
    const result1 = diffProducts([], []);
    expect(result1.creates).toHaveLength(0);
    expect(result1.updates).toHaveLength(0);
    expect(result1.deletes).toHaveLength(0);

    const result2 = diffProducts(undefined, undefined);
    expect(result2.creates).toHaveLength(0);
    expect(result2.updates).toHaveLength(0);
    expect(result2.deletes).toHaveLength(0);
  });

  it("should treat products with no notes as valid", () => {
    const dbItems: Product[] = [];
    const formItems: Product[] = [
      { product_id_reference: 100 }, // No notes
      { product_id_reference: 101, notes: "" }, // Empty notes
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(2);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(0);
  });
});
