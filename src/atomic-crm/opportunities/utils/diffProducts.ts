/**
 * Product Diff Algorithm (Simplified)
 * Compares database products with form products to determine creates, updates, and deletes
 *
 * SIMPLIFIED: Only tracks product associations, no pricing/quantity
 * Compares: product_id_reference, notes
 */

import { type OpportunityProductSyncHandler } from "../../validation/opportunities";

/**
 * Product type alias - uses canonical schema type for consistency
 * Exported for backwards compatibility with existing code
 */
export type Product = OpportunityProductSyncHandler;

export interface ProductDiff {
  creates: Product[];
  updates: Product[];
  deletes: (string | number)[];
}

/**
 * Compare two products for differences in editable fields only
 * ONLY compares: product_id_reference, notes
 * Does NOT compare: id, product_name, product_category (denormalized)
 */
export function productsAreDifferent(dbProduct: Product, formProduct: Product): boolean {
  // Compare product_id_reference
  if (String(dbProduct.product_id_reference) !== String(formProduct.product_id_reference)) {
    return true;
  }

  // Compare notes (treat undefined/null as empty string)
  const dbNotes = (dbProduct.notes ?? "").trim();
  const formNotes = (formProduct.notes ?? "").trim();
  if (dbNotes !== formNotes) {
    return true;
  }

  return false;
}

/**
 * Diff products between database state and form state
 * Returns creates, updates, and deletes for sync_opportunity_with_products RPC
 *
 * @param dbItems - Current products from database (with IDs)
 * @param formItems - Products from form (may or may not have IDs)
 * @returns ProductDiff with creates, updates, and deletes arrays
 */
export function diffProducts(dbItems: Product[] = [], formItems: Product[] = []): ProductDiff {
  const creates: Product[] = [];
  const updates: Product[] = [];
  const deletes: (string | number)[] = [];

  // Create a Map of database products by ID for O(1) lookup
  const dbMap = new Map<string | number, Product>();
  dbItems.forEach((item) => {
    if (item.id !== undefined && item.id !== null) {
      dbMap.set(item.id, item);
    }
  });

  // Create a Set of form product IDs for tracking
  const formIds = new Set<string | number>();

  // Process form items: identify creates and updates
  formItems.forEach((formItem) => {
    if (formItem.id !== undefined && formItem.id !== null) {
      // Has ID - potential update
      formIds.add(formItem.id);
      const dbItem = dbMap.get(formItem.id);

      if (dbItem) {
        // Compare and add to updates if different
        if (productsAreDifferent(dbItem, formItem)) {
          updates.push(formItem);
        }
        // else: No change, skip
      } else {
        // ID exists but not in DB - treat as create
        creates.push(formItem);
      }
    } else {
      // No ID - new product
      creates.push(formItem);
    }
  });

  // Identify deletes: DB items not in form
  dbItems.forEach((dbItem) => {
    if (dbItem.id !== undefined && dbItem.id !== null) {
      if (!formIds.has(dbItem.id)) {
        deletes.push(dbItem.id);
      }
    }
  });

  return { creates, updates, deletes };
}
