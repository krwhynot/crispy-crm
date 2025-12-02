import * as React from "react";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ContactListLazy = React.lazy(() => import("./ContactList"));
const ContactEditLazy = React.lazy(() => import("./ContactEdit"));
const ContactCreateLazy = React.lazy(() => import("./ContactCreate"));

// Wrap lazy components with resource-specific error boundaries
const ContactList = () => (
  <ResourceErrorBoundary resource="contacts" page="list">
    <ContactListLazy />
  </ResourceErrorBoundary>
);

const ContactEdit = () => (
  <ResourceErrorBoundary resource="contacts" page="edit">
    <ContactEditLazy />
  </ResourceErrorBoundary>
);

const ContactCreate = () => (
  <ResourceErrorBoundary resource="contacts" page="create">
    <ContactCreateLazy />
  </ResourceErrorBoundary>
);

export default {
  list: ContactList,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) => formatName(record?.first_name, record?.last_name),
};
