import * as React from "react";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";

const ContactList = React.lazy(() => import("./ContactList"));
const ContactEdit = React.lazy(() => import("./ContactEdit"));
const ContactCreate = React.lazy(() => import("./ContactCreate"));

export default {
  list: ContactList,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) => formatName(record?.first_name, record?.last_name),
};
