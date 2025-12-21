import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const SalesListLazy = React.lazy(() => import("./SalesList"));
const SalesEditLazy = React.lazy(() => import("./SalesEdit"));
const SalesCreateLazy = React.lazy(() => import("./SalesCreate"));
const SalesShowLazy = React.lazy(() => import("./SalesShow"));

const SalesListView = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <SalesListLazy />
  </ResourceErrorBoundary>
);

const SalesEditView = () => (
  <ResourceErrorBoundary resource="sales" page="edit">
    <SalesEditLazy />
  </ResourceErrorBoundary>
);

const SalesCreateView = () => (
  <ResourceErrorBoundary resource="sales" page="create">
    <SalesCreateLazy />
  </ResourceErrorBoundary>
);

const SalesShowView = () => (
  <ResourceErrorBoundary resource="sales" page="show">
    <SalesShowLazy />
  </ResourceErrorBoundary>
);

export { SalesListView, SalesEditView, SalesCreateView, SalesShowView };

export default {
  list: SalesListView,
  edit: SalesEditView,
  create: SalesCreateView,
  show: SalesShowView,
  recordRepresentation: (record: Sale) => formatName(record?.first_name, record?.last_name),
};
