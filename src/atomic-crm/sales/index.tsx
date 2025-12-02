import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const SalesListLazy = React.lazy(() => import("./SalesList"));
const SalesEditLazy = React.lazy(() => import("./SalesEdit"));
const SalesCreateLazy = React.lazy(() => import("./SalesCreate"));

// Wrap lazy components with resource-specific error boundaries
const SalesList = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <SalesListLazy />
  </ResourceErrorBoundary>
);

const SalesEdit = () => (
  <ResourceErrorBoundary resource="sales" page="edit">
    <SalesEditLazy />
  </ResourceErrorBoundary>
);

const SalesCreate = () => (
  <ResourceErrorBoundary resource="sales" page="create">
    <SalesCreateLazy />
  </ResourceErrorBoundary>
);

export default {
  list: SalesList,
  edit: SalesEdit,
  create: SalesCreate,
  recordRepresentation: (record: Sale) => formatName(record?.first_name, record?.last_name),
};
