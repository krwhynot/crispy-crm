import { describe, it, expect } from 'vitest';
import { diffProducts, productsAreDifferent, type Product } from './diffProducts';

describe('productsAreDifferent', () => {
  it('should return false for identical products', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 10.50,
      notes: 'Test notes',
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 10.50,
      notes: 'Test notes',
    };

    expect(productsAreDifferent(product1, product2)).toBe(false);
  });

  it('should return true when product_id_reference differs', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 10.50,
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 101,
      quantity: 5,
      unit_price: 10.50,
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it('should return true when quantity differs', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 10.50,
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 10,
      unit_price: 10.50,
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it('should return true when unit_price differs', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 10.50,
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 5,
      unit_price: 12.00,
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it('should return true when notes differ', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      notes: 'Original notes',
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      notes: 'Updated notes',
    };

    expect(productsAreDifferent(product1, product2)).toBe(true);
  });

  it('should treat undefined and 0 as equal for quantity', () => {
    const product1: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: undefined,
    };
    const product2: Product = {
      id: 1,
      product_id_reference: 100,
      quantity: 0,
    };

    expect(productsAreDifferent(product1, product2)).toBe(false);
  });
});

describe('diffProducts', () => {
  it('should identify all creates when all products are new', () => {
    const dbItems: Product[] = [];
    const formItems: Product[] = [
      { product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { product_id_reference: 101, quantity: 3, unit_price: 15.00 },
      { product_id_reference: 102, quantity: 10, unit_price: 5.25 },
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(3);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(0);
    expect(result.creates).toEqual(formItems);
  });

  it('should identify updates only when products have changed', () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { id: 2, product_id_reference: 101, quantity: 3, unit_price: 15.00 },
      { id: 3, product_id_reference: 102, quantity: 10, unit_price: 5.25 },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 }, // No change
      { id: 2, product_id_reference: 101, quantity: 5, unit_price: 15.00 }, // Quantity changed
      { id: 3, product_id_reference: 102, quantity: 10, unit_price: 6.00 }, // Price changed
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(2);
    expect(result.deletes).toHaveLength(0);
    expect(result.updates).toContainEqual(formItems[1]);
    expect(result.updates).toContainEqual(formItems[2]);
  });

  it('should identify deletes only when products are removed', () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { id: 2, product_id_reference: 101, quantity: 3, unit_price: 15.00 },
      { id: 3, product_id_reference: 102, quantity: 10, unit_price: 5.25 },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 }, // Kept
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(2);
    expect(result.deletes).toContain(2);
    expect(result.deletes).toContain(3);
  });

  it('should handle mixed operations (creates, updates, deletes)', () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { id: 2, product_id_reference: 101, quantity: 3, unit_price: 15.00 },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 7, unit_price: 10.50 }, // Update
      { product_id_reference: 103, quantity: 2, unit_price: 20.00 }, // Create
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(1);
    expect(result.updates).toHaveLength(1);
    expect(result.deletes).toHaveLength(1);
    expect(result.creates[0].product_id_reference).toBe(103);
    expect(result.updates[0].id).toBe(1);
    expect(result.deletes[0]).toBe(2);
  });

  it('should return empty arrays when no changes', () => {
    const dbItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { id: 2, product_id_reference: 101, quantity: 3, unit_price: 15.00 },
    ];
    const formItems: Product[] = [
      { id: 1, product_id_reference: 100, quantity: 5, unit_price: 10.50 },
      { id: 2, product_id_reference: 101, quantity: 3, unit_price: 15.00 },
    ];

    const result = diffProducts(dbItems, formItems);

    expect(result.creates).toHaveLength(0);
    expect(result.updates).toHaveLength(0);
    expect(result.deletes).toHaveLength(0);
  });

  it('should handle empty arrays gracefully', () => {
    const result1 = diffProducts([], []);
    expect(result1.creates).toHaveLength(0);
    expect(result1.updates).toHaveLength(0);
    expect(result1.deletes).toHaveLength(0);

    const result2 = diffProducts(undefined, undefined);
    expect(result2.creates).toHaveLength(0);
    expect(result2.updates).toHaveLength(0);
    expect(result2.deletes).toHaveLength(0);
  });
});
