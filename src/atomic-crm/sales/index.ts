import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";

const SalesList = React.lazy(() => import("./SalesList"));
const SalesEdit = React.lazy(() => import("./SalesEdit"));
const SalesCreate = React.lazy(() => import("./SalesCreate"));

export default {
  list: SalesList,
  edit: SalesEdit,
  create: SalesCreate,
  recordRepresentation: (record: Sale) => formatName(record?.first_name, record?.last_name),
};
