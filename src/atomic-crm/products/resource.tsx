import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductListLazy = React.lazy(() => import("./ProductList"));
const ProductCreateLazy = React.lazy(() => import("./ProductCreate"));
const ProductEditLazy = React.lazy(() => import("./ProductEdit"));
const ProductShowLazy = React.lazy(() => import("./ProductShow"));

// Wrap lazy components with resource-specific error boundaries
export const ProductListView = () => (
  <ResourceErrorBoundary resource="products" page="list">
    <ProductListLazy />
  </ResourceErrorBoundary>
);

export const ProductCreateView = () => (
  <ResourceErrorBoundary resource="products" page="create">
    <ProductCreateLazy />
  </ResourceErrorBoundary>
);

export const ProductEditView = () => (
  <ResourceErrorBoundary resource="products" page="edit">
    <ProductEditLazy />
  </ResourceErrorBoundary>
);

export const ProductShowView = () => (
  <ResourceErrorBoundary resource="products" page="show">
    <ProductShowLazy />
  </ResourceErrorBoundary>
);

const productRecordRepresentation = (record: { name?: string }) =>
  record?.name || "Product";

export default {
  list: ProductListView,
  create: ProductCreateView,
  edit: ProductEditView,
  show: ProductShowView,
  recordRepresentation: productRecordRepresentation,
};
