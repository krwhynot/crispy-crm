/**
 * Products Resource Lifecycle Callbacks
 *
 * Resource-specific logic for products using React Admin's withLifecycleCallbacks pattern.
 * Uses the createResourceCallbacks factory for standard soft-delete behavior.
 *
 * Key behaviors:
 * 1. Soft delete - Sets deleted_at instead of hard delete
 * 2. Filter cleaning - Adds soft delete filter by default
 * 3. Data transformation - Strips computed fields from products_summary view before save
 * 4. Array-to-record transform - Converts sparse arrays from form to record objects
 *
 * Engineering Constitution: Resource-specific logic extracted for single responsibility
 */

import { createResourceCallbacks, type ResourceCallbacks, type Transform } from "./createResourceCallbacks";
import type { RaRecord } from "react-admin";

/**
 * Computed fields from products_summary view (must be stripped before save)
 * - principal_name: Joined from organizations table on principal_id
 */
export const COMPUTED_FIELDS = ["principal_name"] as const;

/**
 * Transform: Convert product_distributors from sparse array to record object
 *
 * Root cause: ProductDistributorInput.tsx uses numeric IDs in form paths like:
 *   `product_distributors.${distributor.id}.vendor_item_number`
 *
 * When distributor.id is a large number (e.g., 10338), React Hook Form creates
 * a sparse array: Array[10338] with mostly null values instead of an object.
 *
 * The Zod schema expects z.record() (object), so we transform here before validation.
 *
 * Example:
 *   Input:  Array[10339] with { [10335]: { vendor_item_number: "DOT-1" }, [10338]: { vendor_item_number: "DOT-2" } }
 *   Output: { "10335": { vendor_item_number: "DOT-1" }, "10338": { vendor_item_number: "DOT-2" } }
 */
export const sparseArrayToRecordTransform: Transform = {
  name: "sparseArrayToRecord",
  description: "Converts product_distributors sparse array to record object for Zod validation",
  apply: (record: RaRecord): RaRecord => {
    const productDistributors = record.product_distributors;

    // If not present or already an object (not array), pass through
    if (!productDistributors || !Array.isArray(productDistributors)) {
      return record;
    }

    // Convert sparse array to record object
    // Filter out null/undefined entries and preserve the index as key
    const asRecord: Record<string, { vendor_item_number: string | null }> = {};

    for (let i = 0; i < productDistributors.length; i++) {
      const entry = productDistributors[i];
      if (entry && typeof entry === "object" && "vendor_item_number" in entry) {
        asRecord[String(i)] = entry as { vendor_item_number: string | null };
      }
    }

    return {
      ...record,
      product_distributors: Object.keys(asRecord).length > 0 ? asRecord : undefined,
    };
  },
};

/**
 * Products lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { productsCallbacks } from './callbacks/productsCallbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   productsCallbacks,
 * ]);
 * ```
 */
export const productsCallbacks: ResourceCallbacks = createResourceCallbacks({
  resource: "products",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
  writeTransforms: [sparseArrayToRecordTransform],
});
