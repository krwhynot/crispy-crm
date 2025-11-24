/**
 * Resource Lifecycle Callbacks
 *
 * Resource-specific logic for React Admin's withLifecycleCallbacks pattern.
 * These callbacks are composed with the base DataProvider to add resource-specific behavior.
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { contactsCallbacks, opportunitiesCallbacks } from './callbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   contactsCallbacks,
 *   opportunitiesCallbacks,
 *   // ... other resource callbacks
 * ]);
 * ```
 *
 * Engineering Constitution: Each callback module handles a single resource
 */

export { contactsCallbacks } from "./contactsCallbacks";
export {
  normalizeJsonbArrays,
  stripComputedFields,
  COMPUTED_FIELDS,
  JSONB_ARRAY_FIELDS,
} from "./contactsCallbacks";
