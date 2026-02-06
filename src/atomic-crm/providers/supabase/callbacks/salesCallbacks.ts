/**
 * Sales Resource Lifecycle Callbacks
 *
 * Callbacks for sales (salespeople/users) resource:
 * - Soft delete enabled (disabled users remain for historical data)
 * - Computed fields stripped (administrator is a computed column)
 * - Read-heavy operations (most operations are read, writes are admin-only)
 *
 * Note: q-search is handled centrally by applySearchParams via SEARCHABLE_RESOURCES.
 *
 * Engineering Constitution: Resource-specific logic extracted for single responsibility
 */

import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";

/**
 * Computed fields from sales view (must be stripped before save)
 * - administrator: computed from role field via database function
 */
export const COMPUTED_FIELDS = ["administrator"] as const;

/**
 * Sales lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Features:
 * - Soft delete enabled (users are disabled, not removed)
 * - Computed fields stripped before save
 *
 * Note: q-search is handled centrally by applySearchParams via SEARCHABLE_RESOURCES.
 * Note: Write operations are restricted by RLS to admin users only.
 * The handler doesn't need to enforce this - the database does.
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { salesCallbacks } from './callbacks/salesCallbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   salesCallbacks,
 * ]);
 * ```
 */
export const salesCallbacks: ResourceCallbacks = createResourceCallbacks({
  resource: "sales",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
});
