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
 *
 * Engineering Constitution: Resource-specific logic extracted for single responsibility
 */

import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";

/**
 * Computed fields from products_summary view (must be stripped before save)
 * - principal_name: Joined from organizations table on principal_id
 */
export const COMPUTED_FIELDS = ["principal_name"] as const;

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
});
