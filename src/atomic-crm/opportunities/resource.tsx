import * as React from "react";
import type { Opportunity } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OpportunityListLazy = React.lazy(() => import("./OpportunityList"));
const OpportunityCreateLazy = React.lazy(() => import("./OpportunityCreate"));
const OpportunityEditLazy = React.lazy(() => import("./OpportunityEdit"));

export const OpportunityListView = () => (
  <ResourceErrorBoundary resource="opportunities" page="list">
    <OpportunityListLazy />
  </ResourceErrorBoundary>
);

export const OpportunityCreateView = () => (
  <ResourceErrorBoundary resource="opportunities" page="create">
    <OpportunityCreateLazy />
  </ResourceErrorBoundary>
);

export const OpportunityEditView = () => (
  <ResourceErrorBoundary resource="opportunities" page="edit">
    <OpportunityEditLazy />
  </ResourceErrorBoundary>
);

const opportunityRecordRepresentation = (record: Opportunity) => record?.name || "Opportunity";

// React Admin resource config
export default {
  list: OpportunityListView,
  create: OpportunityCreateView,
  edit: OpportunityEditView,
  recordRepresentation: opportunityRecordRepresentation,
};
