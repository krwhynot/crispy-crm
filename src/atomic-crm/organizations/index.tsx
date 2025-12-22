/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */

// Standard feature exports
export { OrganizationList } from './OrganizationList';
export { OrganizationCreate } from './OrganizationCreate';
export { OrganizationEdit } from './OrganizationEdit';
export { OrganizationShow } from './OrganizationShow';

// Export hierarchy components
export { ParentOrganizationInput } from "./ParentOrganizationInput";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";

// Export badge components for reuse across views
export { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
export type { OrganizationType, PriorityLevel } from "./OrganizationBadges";
