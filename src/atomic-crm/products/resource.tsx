import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const ProductListLazy = React.lazy(() => import("./ProductList"));
const ProductCreateLazy = React.lazy(() => import("./ProductCreate"));
const ProductEditLazy = React.lazy(() => import("./ProductEdit"));
const ProductShowLazy = React.lazy(() => import("./ProductShow"));

// Wrap lazy components with resource-specific error boundaries
export const ProductListView = () => (
  <ResourceErrorBoundary resource="products" page="list">
    <React.Suspense fallback={<Loading />}>
      <ProductListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductCreateView = () => (
  <ResourceErrorBoundary resource="products" page="create">
    <React.Suspense fallback={<Loading />}>
      <ProductCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductEditView = () => (
  <ResourceErrorBoundary resource="products" page="edit">
    <React.Suspense fallback={<Loading />}>
      <ProductEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductShowView = () => (
  <ResourceErrorBoundary resource="products" page="show">
    <React.Suspense fallback={<Loading />}>
      <ProductShowLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const productRecordRepresentation = (record: { name?: string }) => record?.name || "Product";

export default {
  list: ProductListView,
  create: ProductCreateView,
  edit: ProductEditView,
  show: ProductShowView,
  recordRepresentation: productRecordRepresentation,
};
