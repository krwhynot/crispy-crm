import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductListLazy = React.lazy(() => import("./ProductList"));
const ProductCreateLazy = React.lazy(() => import("./ProductCreate"));
const ProductEditLazy = React.lazy(() => import("./ProductEdit"));

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

const productRecordRepresentation = (record: { name?: string; sku?: string }) =>
  record?.name || record?.sku || "Product";

export default {
  list: ProductListView,
  create: ProductCreateView,
  edit: ProductEditView,
  recordRepresentation: productRecordRepresentation,
};
