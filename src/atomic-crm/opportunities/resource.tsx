import * as React from "react";
import { useRedirect } from "ra-core";
import type { Opportunity } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OpportunityListLazy = React.lazy(() => import("./OpportunityList"));
const OpportunityEditLazy = React.lazy(() => import("./OpportunityEdit"));

// Quick Add is now the entry point - redirect /opportunities/create to list
const OpportunityCreateRedirect = () => {
  const redirect = useRedirect();
  React.useEffect(() => {
    redirect("list", "opportunities");
  }, [redirect]);
  return null;
};

export const OpportunityListView = () => (
  <ResourceErrorBoundary resource="opportunities" page="list">
    <OpportunityListLazy />
  </ResourceErrorBoundary>
);

export const OpportunityCreateView = () => <OpportunityCreateRedirect />;

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
