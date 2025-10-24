import type { Contact } from "../types";
import { ContactCreate } from "./ContactCreate";
import { ContactEdit } from "./ContactEdit";
import { ContactList } from "./ContactList";
import { ContactShow } from "./ContactShow";

export default {
  list: ContactList,
  show: ContactShow,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) => {
    const firstName = record?.first_name?.trim();
    const lastName = record?.last_name?.trim();

    // If both are missing, use double dash (industry standard)
    if (!firstName && !lastName) {
      return "--";
    }

    // If only one is present, return it without extra spaces
    if (!firstName) return lastName;
    if (!lastName) return firstName;

    // Both present, concatenate with space
    return `${firstName} ${lastName}`;
  },
};
