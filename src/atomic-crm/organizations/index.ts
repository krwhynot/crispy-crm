import * as React from "react";

const OrganizationList = React.lazy(() => import("./OrganizationList"));
const OrganizationCreate = React.lazy(() => import("./OrganizationCreate"));
const OrganizationEdit = React.lazy(() => import("./OrganizationEdit"));

// Export hierarchy components
export { ParentOrganizationInput } from "./ParentOrganizationInput";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { HierarchyBreadcrumb } from "./HierarchyBreadcrumb";
export { ParentOrganizationSection } from "./ParentOrganizationSection";
export { OrganizationHierarchyTab } from "./OrganizationHierarchyTab";

export default {
  list: OrganizationList,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  recordRepresentation: (record: any) => record?.name || "Organization",
};
