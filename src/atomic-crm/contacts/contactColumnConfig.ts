/**
 * Contact Column Configuration
 *
 * Maps column header components for use in ContactList.
 * Separated from ContactDatagridHeader.tsx to satisfy react-refresh/only-export-components
 * lint rule (files with React components should only export components).
 */

import { ContactNameHeader, ContactStatusHeader } from "./ContactDatagridHeader";

/**
 * All contact column headers exported for use in ContactList
 */
export const ContactColumnHeaders = {
  Name: ContactNameHeader,
  Status: ContactStatusHeader,
};
