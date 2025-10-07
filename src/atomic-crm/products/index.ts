import { lazy } from "react";
import type { ResourceProps } from "react-admin";
import { Package } from "lucide-react";

const ProductList = lazy(() =>
  import("./ProductList").then((module) => ({
    default: module.ProductList,
  }))
);

const ProductCreate = lazy(() =>
  import("./ProductCreate").then((module) => ({
    default: module.ProductCreate,
  }))
);

const ProductShow = lazy(() =>
  import("./ProductShow").then((module) => ({
    default: module.ProductShow,
  }))
);

const resource: ResourceProps = {
  name: "products",
  list: ProductList,
  create: ProductCreate,
  show: ProductShow,
  icon: Package,
  options: {
    label: "Products",
  },
};

export default resource;