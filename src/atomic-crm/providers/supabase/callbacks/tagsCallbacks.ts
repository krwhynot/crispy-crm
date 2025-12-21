/**
 * Tags Resource Lifecycle Callbacks
 *
 * Callbacks for tags resource:
 * - Uses soft delete (aligned with SOFT_DELETE_RESOURCES config)
 * - NO computed fields
 * - Standard validation via withValidation wrapper
 *
 * Engineering Constitution: Soft delete pattern for data integrity
 */

import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";

/**
 * Tags lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Tags are simple entities with:
 * - Soft delete (via deleted_at column)
 * - No computed fields
 * - Standard validation via withValidation wrapper
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { tagsCallbacks } from './callbacks/tagsCallbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   tagsCallbacks,
 * ]);
 * ```
 */
export const tagsCallbacks: ResourceCallbacks = createResourceCallbacks({
  resource: "tags",
  supportsSoftDelete: true,
  // No computed fields or transforms
});
