import * as React from "react";
import type { Opportunity } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OpportunityListLazy = React.lazy(() => import("./OpportunityList"));
const OpportunityCreateLazy = React.lazy(() => import("./OpportunityCreate"));
const OpportunityEditLazy = React.lazy(() => import("./OpportunityEdit"));

// Wrap lazy components with resource-specific error boundaries
const OpportunityList = () => (
  <ResourceErrorBoundary resource="opportunities" page="list">
    <OpportunityListLazy />
  </ResourceErrorBoundary>
);

const OpportunityCreate = () => (
  <ResourceErrorBoundary resource="opportunities" page="create">
    <OpportunityCreateLazy />
  </ResourceErrorBoundary>
);

const OpportunityEdit = () => (
  <ResourceErrorBoundary resource="opportunities" page="edit">
    <OpportunityEditLazy />
  </ResourceErrorBoundary>
);

export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  recordRepresentation: (record: Opportunity) => record?.name || "Opportunity",
};
