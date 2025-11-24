import * as React from "react";

const ProductList = React.lazy(() => import("./ProductList"));
const ProductCreate = React.lazy(() => import("./ProductCreate"));
const ProductEdit = React.lazy(() => import("./ProductEdit"));

export default {
  list: ProductList,
  create: ProductCreate,
  edit: ProductEdit,
  recordRepresentation: (record: { name?: string; sku?: string }) =>
    record?.name || record?.sku || "Product",
};
