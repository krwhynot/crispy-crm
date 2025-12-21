import * as React from "react";
import type { Organization } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OrganizationListLazy = React.lazy(() => import("./OrganizationList"));
const OrganizationShowLazy = React.lazy(() => import("./OrganizationShow"));
const OrganizationCreateLazy = React.lazy(() => import("./OrganizationCreate"));
const OrganizationEditLazy = React.lazy(() => import("./OrganizationEdit"));

// Wrap lazy components with resource-specific error boundaries
const OrganizationList = () => (
  <ResourceErrorBoundary resource="organizations" page="list">
    <OrganizationListLazy />
  </ResourceErrorBoundary>
);

const OrganizationShow = () => (
  <ResourceErrorBoundary resource="organizations" page="show">
    <OrganizationShowLazy />
  </ResourceErrorBoundary>
);

const OrganizationCreate = () => (
  <ResourceErrorBoundary resource="organizations" page="create">
    <OrganizationCreateLazy />
  </ResourceErrorBoundary>
);

const OrganizationEdit = () => (
  <ResourceErrorBoundary resource="organizations" page="edit">
    <OrganizationEditLazy />
  </ResourceErrorBoundary>
);

// Export wrapped view components for direct imports
export { OrganizationList, OrganizationShow, OrganizationCreate, OrganizationEdit };

// Export hierarchy components
export { ParentOrganizationInput } from "./ParentOrganizationInput";
export { BranchLocationsSection } from "./BranchLocationsSection";
export { ParentOrganizationSection } from "./ParentOrganizationSection";
// Export badge components for reuse across views
export { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
export type { OrganizationType, PriorityLevel } from "./OrganizationBadges";

// Resource configuration for React Admin
export const organizationResource = {
  name: "organizations",
  list: OrganizationList,
  show: OrganizationShow,
  create: OrganizationCreate,
  edit: OrganizationEdit,
};

export default {
  list: OrganizationList,
  show: OrganizationShow,
  create: OrganizationCreate,
  edit: OrganizationEdit,
  recordRepresentation: (record: Organization) => record?.name || "Organization",
};
