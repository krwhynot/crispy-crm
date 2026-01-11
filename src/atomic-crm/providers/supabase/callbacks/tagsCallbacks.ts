/**
 * Tags Resource Lifecycle Callbacks
 *
 * Callbacks for tags resource:
 * - Uses hard delete (tags are simple entities truly removed from database)
 * - NO computed fields
 * - Standard validation via withValidation wrapper
 *
 * Engineering Constitution: Simple entity pattern for reference data
 */

import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";

/**
 * Tags lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Tags are simple entities with:
 * - Hard delete (truly removed from database)
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
});
