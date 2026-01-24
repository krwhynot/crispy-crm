import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const SalesListLazy = React.lazy(() => import("./SalesList"));
const SalesEditLazy = React.lazy(() => import("./SalesEdit"));
const SalesCreateLazy = React.lazy(() => import("./SalesCreate"));
const SalesShowLazy = React.lazy(() => import("./SalesShow"));

const SalesListView = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <React.Suspense fallback={<Loading />}>
      <SalesListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const SalesEditView = () => (
  <ResourceErrorBoundary resource="sales" page="edit">
    <React.Suspense fallback={<Loading />}>
      <SalesEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const SalesCreateView = () => (
  <ResourceErrorBoundary resource="sales" page="create">
    <React.Suspense fallback={<Loading />}>
      <SalesCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const SalesShowView = () => (
  <ResourceErrorBoundary resource="sales" page="show">
    <React.Suspense fallback={<Loading />}>
      <SalesShowLazy />
    </React.Suspense>
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
