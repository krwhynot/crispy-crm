import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { SalesCreate } from "./SalesCreate";
import { SalesEdit } from "./SalesEdit";
import { SalesList } from "./SalesList";

export default {
  list: SalesList,
  create: SalesCreate,
  edit: SalesEdit,
  recordRepresentation: (record: Sale) => formatName(record.first_name, record.last_name),
};
