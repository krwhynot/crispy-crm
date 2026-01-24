import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const ProductDistributorListLazy = React.lazy(() => import("./ProductDistributorList"));
const ProductDistributorEditLazy = React.lazy(() => import("./ProductDistributorEdit"));
const ProductDistributorCreateLazy = React.lazy(() => import("./ProductDistributorCreate"));
const ProductDistributorShowLazy = React.lazy(() => import("./ProductDistributorShow"));

export const ProductDistributorListView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="list">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorCreateView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="create">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorEditView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="edit">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorShowView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="show">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorShowLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export {
  ProductDistributorListView as ProductDistributorList,
  ProductDistributorEditView as ProductDistributorEdit,
  ProductDistributorCreateView as ProductDistributorCreate,
  ProductDistributorShowView as ProductDistributorShow,
};
