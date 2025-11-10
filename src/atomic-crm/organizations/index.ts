import * as React from "react";

const OrganizationList = React.lazy(() => import("./OrganizationList"));
const OrganizationCreate = React.lazy(() => import("./OrganizationCreate"));
const OrganizationShow = React.lazy(() => import("./OrganizationShow"));
const OrganizationEdit = React.lazy(() => import("./OrganizationEdit"));

// Hierarchy components
export { HierarchyBreadcrumb } from "./HierarchyBreadcrumb";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";
export { ParentOrganizationInput } from "./ParentOrganizationInput";

export default {
  list: OrganizationList,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  show: OrganizationShow,
};
