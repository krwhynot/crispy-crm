/**
 * Resource Lifecycle Callbacks
 *
 * Resource-specific logic for React Admin's withLifecycleCallbacks pattern.
 * These callbacks are composed with the base DataProvider to add resource-specific behavior.
 *
 * Architecture:
 * - Factory pattern (createResourceCallbacks) for standard resources (activities, products, contacts, organizations)
 * - Inline callbacks for complex resources (opportunities with RPC-based cascading deletes)
 * - Shared transforms (commonTransforms) for reusable data transformations
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { contactsCallbacks, organizationsCallbacks } from './callbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   contactsCallbacks,
 *   organizationsCallbacks,
 *   // ... other resource callbacks
 * ]);
 * ```
 *
 * Engineering Constitution: Each callback module handles a single resource
 */

// Factory for creating standardized callbacks
export {
  createResourceCallbacks,
  type ResourceCallbacks,
  type ResourceCallbacksConfig,
  type CallbacksConfig,
} from "./createResourceCallbacks";

// Common reusable transforms
export {
  normalizeJsonbArrays,
  commonTransforms,
  type Transform,
} from "./commonTransforms";

// Contacts callbacks
export { contactsCallbacks } from "./contactsCallbacks";
export {
  stripComputedFields as stripContactComputedFields,
  COMPUTED_FIELDS as CONTACT_COMPUTED_FIELDS,
  JSONB_ARRAY_FIELDS,
} from "./contactsCallbacks";

// Organizations callbacks
export { organizationsCallbacks } from "./organizationsCallbacks";
export {
  stripComputedFields as stripOrgComputedFields,
  COMPUTED_FIELDS as ORG_COMPUTED_FIELDS,
} from "./organizationsCallbacks";

// Opportunities callbacks
export { opportunitiesCallbacks } from "./opportunitiesCallbacks";
export {
  stripComputedFields as stripOppComputedFields,
  mergeCreateDefaults as mergeOppCreateDefaults,
  COMPUTED_FIELDS as OPP_COMPUTED_FIELDS,
  CREATE_DEFAULTS as OPP_CREATE_DEFAULTS,
} from "./opportunitiesCallbacks";

// Activities callbacks
export { activitiesCallbacks } from "./activitiesCallbacks";
export { COMPUTED_FIELDS as ACTIVITIES_COMPUTED_FIELDS } from "./activitiesCallbacks";

// Products callbacks
export { productsCallbacks } from "./productsCallbacks";
