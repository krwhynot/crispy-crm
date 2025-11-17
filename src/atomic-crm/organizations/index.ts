import * as React from "react";

const OrganizationList = React.lazy(() => import("./OrganizationList"));
const OrganizationCreate = React.lazy(() => import("./OrganizationCreate"));
const OrganizationEdit = React.lazy(() => import("./OrganizationEdit"));

// Export parent input component (branch components removed)
export { ParentOrganizationInput } from "./ParentOrganizationInput";

export default {
  list: OrganizationList,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  recordRepresentation: (record: any) => record?.name || "Organization",
};
