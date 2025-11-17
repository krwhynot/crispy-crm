import * as React from "react";

const OrganizationList = React.lazy(() => import("./OrganizationList"));
const OrganizationCreate = React.lazy(() => import("./OrganizationCreate"));
const OrganizationEdit = React.lazy(() => import("./OrganizationEdit"));

export default {
  list: OrganizationList,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  recordRepresentation: (record: any) => record?.name || "Organization",
};
