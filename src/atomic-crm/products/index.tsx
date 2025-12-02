import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductListLazy = React.lazy(() => import("./ProductList"));
const ProductCreateLazy = React.lazy(() => import("./ProductCreate"));
const ProductEditLazy = React.lazy(() => import("./ProductEdit"));

// Wrap lazy components with resource-specific error boundaries
const ProductList = () => (
  <ResourceErrorBoundary resource="products" page="list">
    <ProductListLazy />
  </ResourceErrorBoundary>
);

const ProductCreate = () => (
  <ResourceErrorBoundary resource="products" page="create">
    <ProductCreateLazy />
  </ResourceErrorBoundary>
);

const ProductEdit = () => (
  <ResourceErrorBoundary resource="products" page="edit">
    <ProductEditLazy />
  </ResourceErrorBoundary>
);

export default {
  list: ProductList,
  create: ProductCreate,
  edit: ProductEdit,
  recordRepresentation: (record: { name?: string; sku?: string }) =>
    record?.name || record?.sku || "Product",
};
