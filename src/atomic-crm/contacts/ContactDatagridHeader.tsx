/**
 * ContactDatagridHeader
 *
 * Provides filterable column header labels for the Contacts datagrid.
 * Uses FilterableColumnHeader components that integrate with React Admin's
 * filter state via useListContext.
 *
 * Column Configuration:
 * - Name: Text filter (debounced search on first_name)
 * - Status: Checkbox filter (multi-select from CONTACT_STATUS_CHOICES)
 * - Role, Organization, Avatar, Notes, Last Activity: No filter
 *
 * @example
 * ```tsx
 * <FunctionField
 *   label={<ContactNameHeader />}
 *   sortBy="first_name"
 *   render={(record) => formatFullName(record.first_name, record.last_name)}
 * />
 * ```
 */

import { FilterableColumnHeader } from "@/components/admin/column-filters";
import { CONTACT_STATUS_CHOICES } from "./constants";

/**
 * Filterable header for Contact Name column
 * Uses text filter with debounced search on first_name field
 */
export function ContactNameHeader() {
  return (
    <FilterableColumnHeader
      source="first_name"
      label="Name"
      filterType="text"
      placeholder="Search by name..."
      debounceMs={300}
    />
  );
}

/**
 * Filterable header for Contact Status column
 * Uses checkbox filter with multi-select for engagement status
 */
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

