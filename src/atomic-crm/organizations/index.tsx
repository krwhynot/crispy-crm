/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */

/**
 * Organizations Module Entry Point
 *
 * Re-exports components for external use and provides error-boundary-wrapped
 * resource configuration via resource.tsx.
 *
 * Part of P2-13 fix: Add error boundaries to feature modules
 */

// Standard feature exports (raw components for testing/embedding)
export { OrganizationList } from "./OrganizationList";
export { OrganizationCreate } from "./OrganizationCreate";
export { OrganizationEdit } from "./OrganizationEdit";
export { OrganizationShow } from "./OrganizationShow";

// Export hierarchy components
export { ParentOrganizationInput } from "./ParentOrganizationInput";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";

// Export badge components for reuse across views
export { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
export type { OrganizationType, PriorityLevel } from "./OrganizationBadges";

// Export wrapped views (with error boundaries)
export {
  OrganizationListView,
  OrganizationCreateView,
  OrganizationEditView,
  OrganizationShowView,
} from "./resource";

// React Admin resource configuration (with error boundaries)
export { default } from "./resource";
