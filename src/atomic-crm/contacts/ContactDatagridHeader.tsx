/**
 * ContactDatagridHeader
 *
 * Column headers for the Contacts datagrid with integrated filters.
 * Text and checkbox filters are embedded in column headers via FilterableColumnHeader.
 */

import { FilterableColumnHeader } from "@/components/ra-wrappers/column-filters";
import { CONTACT_STATUS_CHOICES } from "./constants";

export function ContactNameHeader() {
  return <FilterableColumnHeader source="first_name" label="Name" filterType="text" />;
}

export function ContactStatusHeader() {
  return (
    <FilterableColumnHeader
      source="status"
      label="Status"
      filterType="checkbox"
      choices={[...CONTACT_STATUS_CHOICES]}
    />
  );
}
