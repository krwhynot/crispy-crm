import * as React from "react";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ContactListLazy = React.lazy(() => import("./ContactList"));
const ContactEditLazy = React.lazy(() => import("./ContactEdit"));
const ContactCreateLazy = React.lazy(() => import("./ContactCreate"));

export const ContactListView = () => (
  <ResourceErrorBoundary resource="contacts" page="list">
    <ContactListLazy />
  </ResourceErrorBoundary>
);

export const ContactEditView = () => (
  <ResourceErrorBoundary resource="contacts" page="edit">
    <ContactEditLazy />
  </ResourceErrorBoundary>
);

export const ContactCreateView = () => (
  <ResourceErrorBoundary resource="contacts" page="create">
    <ContactCreateLazy />
  </ResourceErrorBoundary>
);

const contactRecordRepresentation = (record: Contact) =>
  formatName(record?.first_name, record?.last_name);

// React Admin resource config
export default {
  list: ContactListView,
  edit: ContactEditView,
  create: ContactCreateView,
  recordRepresentation: contactRecordRepresentation,
};
