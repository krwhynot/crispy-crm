import * as React from "react";
import type { Opportunity } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OpportunityListLazy = React.lazy(() => import("./OpportunityList"));
// Wizard is now the default create experience (19 tests pass)
// Old tabbed form preserved in OpportunityCreate.tsx for reference
const OpportunityCreateLazy = React.lazy(() => import("./OpportunityCreateWizard"));
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
