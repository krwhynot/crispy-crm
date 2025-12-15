import * as React from "react";
import { Package } from "lucide-react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductDistributorListLazy = React.lazy(() => import("./ProductDistributorList"));
const ProductDistributorEditLazy = React.lazy(() => import("./ProductDistributorEdit"));
const ProductDistributorCreateLazy = React.lazy(() => import("./ProductDistributorCreate"));

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

const productDistributors = {
  list: ProductDistributorListView,
  edit: ProductDistributorEditView,
  create: ProductDistributorCreateView,
  icon: Package,
  options: { label: "DOT Numbers" },
};

export default productDistributors;
export { ProductDistributorListView as ProductDistributorList, ProductDistributorEditView as ProductDistributorEdit, ProductDistributorCreateView as ProductDistributorCreate };
