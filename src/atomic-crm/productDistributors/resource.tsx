import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductDistributorListLazy = React.lazy(() => import("./ProductDistributorList"));
const ProductDistributorEditLazy = React.lazy(() => import("./ProductDistributorEdit"));
const ProductDistributorCreateLazy = React.lazy(() => import("./ProductDistributorCreate"));
const ProductDistributorShowLazy = React.lazy(() => import("./ProductDistributorShow"));

export const ProductDistributorListView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="list">
    <ProductDistributorListLazy />
  </ResourceErrorBoundary>
);

export const ProductDistributorCreateView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="create">
    <ProductDistributorCreateLazy />
  </ResourceErrorBoundary>
);

export const ProductDistributorEditView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="edit">
    <ProductDistributorEditLazy />
  </ResourceErrorBoundary>
);

export const ProductDistributorShowView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="show">
    <ProductDistributorShowLazy />
  </ResourceErrorBoundary>
);

export {
  ProductDistributorListView as ProductDistributorList,
  ProductDistributorEditView as ProductDistributorEdit,
  ProductDistributorCreateView as ProductDistributorCreate,
  ProductDistributorShowView as ProductDistributorShow,
};
