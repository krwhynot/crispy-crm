/**
 * Tags Resource Lifecycle Callbacks
 *
 * Minimal callbacks for tags resource:
 * - NO soft delete (tags are truly deleted when removed)
 * - NO computed fields
 * - Only validation and error logging needed
 *
 * Engineering Constitution: Minimal complexity - tags are simple entities
 */

import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";

/**
 * Tags lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Tags are simple entities with:
 * - Hard delete (no soft delete)
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
  supportsSoftDelete: false, // Tags use hard delete
  // No computed fields or transforms
});
