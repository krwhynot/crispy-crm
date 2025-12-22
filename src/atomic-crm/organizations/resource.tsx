import * as React from "react";
import type { Organization } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

/**
 * Organizations Resource Configuration
 *
 * Provides lazy-loaded, error-boundary-wrapped views for the organizations module.
 * This follows the established resource.tsx pattern used by other modules.
 *
 * Part of P2-13 fix: Add error boundaries to feature modules
 */

const OrganizationListLazy = React.lazy(() =>
  import("./OrganizationList").then((module) => ({ default: module.OrganizationList }))
);
const OrganizationCreateLazy = React.lazy(() =>
  import("./OrganizationCreate").then((module) => ({ default: module.OrganizationCreate }))
);
const OrganizationEditLazy = React.lazy(() =>
  import("./OrganizationEdit").then((module) => ({ default: module.OrganizationEdit }))
);
const OrganizationShowLazy = React.lazy(() =>
  import("./OrganizationShow").then((module) => ({ default: module.OrganizationShow }))
);

// Wrap lazy components with resource-specific error boundaries
export const OrganizationListView = () => (
  <ResourceErrorBoundary resource="organizations" page="list">
    <OrganizationListLazy />
  </ResourceErrorBoundary>
);

export const OrganizationCreateView = () => (
  <ResourceErrorBoundary resource="organizations" page="create">
    <OrganizationCreateLazy />
  </ResourceErrorBoundary>
);

export const OrganizationEditView = () => (
  <ResourceErrorBoundary resource="organizations" page="edit">
    <OrganizationEditLazy />
  </ResourceErrorBoundary>
);

export const OrganizationShowView = () => (
  <ResourceErrorBoundary resource="organizations" page="show">
    <OrganizationShowLazy />
  </ResourceErrorBoundary>
);

const organizationRecordRepresentation = (record: Organization) =>
  record?.name || "Organization";

// React Admin resource configuration
export default {
  list: OrganizationListView,
  show: OrganizationShowView,
  create: OrganizationCreateView,
  edit: OrganizationEditView,
  recordRepresentation: organizationRecordRepresentation,
};
