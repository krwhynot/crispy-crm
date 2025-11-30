import * as React from "react";
import type { Organization } from "../types";

const OrganizationList = React.lazy(() => import("./OrganizationList"));
const OrganizationShow = React.lazy(() => import("./OrganizationShow"));
const OrganizationCreate = React.lazy(() => import("./OrganizationCreate"));
const OrganizationEdit = React.lazy(() => import("./OrganizationEdit"));

// Export hierarchy components
export { ParentOrganizationInput } from "./ParentOrganizationInput";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";
// Export badge components for reuse across views
export { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
export type { OrganizationType, PriorityLevel } from "./OrganizationBadges";

export default {
  list: OrganizationList,
  show: OrganizationShow,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  recordRepresentation: (record: Organization) => record?.name || "Organization",
};
