import type { Contact } from "../types";
import { formatName } from "../utils/formatName";
import { ContactCreate } from "./ContactCreate";
import { ContactEdit } from "./ContactEdit";
import { ContactList } from "./ContactList";

export default {
  list: ContactList,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) => formatName(record?.first_name, record?.last_name),
};
