/**
 * OrganizationDatagridHeader
 *
 * Provides filterable column header labels for the Organizations datagrid.
 * Uses FilterableColumnHeader components that integrate with React Admin's
 * filter state via useListContext.
 *
 * Column Configuration:
 * - Name: Text filter (debounced search)
 * - Type: Checkbox filter (multi-select from ORGANIZATION_TYPE_CHOICES)
 * - Priority: Checkbox filter (multi-select from PRIORITY_CHOICES)
 * - Parent, Contacts, Opportunities: No filter (reference/computed fields)
 *
 * @example
 * ```tsx
 * <TextField
 *   source="name"
 *   label={<OrganizationNameHeader />}
 *   sortable
 * />
 * ```
 */

import { FilterableColumnHeader } from "@/components/admin/column-filters";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";

/**
 * Filterable header for Organization Name column
 * Uses text filter with debounced search
 */
export function OrganizationNameHeader() {
  return (
    <FilterableColumnHeader
      source="name"
      label="Organization Name"
      filterType="text"
      placeholder="Search by name..."
      debounceMs={300}
    />
  );
}

/**
 * Filterable header for Organization Type column
 * Uses checkbox filter with multi-select
 */
export function OrganizationTypeHeader() {
  return (
    <FilterableColumnHeader
      source="organization_type"
      label="Type"
      filterType="checkbox"
      choices={[...ORGANIZATION_TYPE_CHOICES]}
    />
  );
}

/**
 * Filterable header for Priority column
 * Uses checkbox filter with multi-select
 */
export function OrganizationPriorityHeader() {
  return (
    <FilterableColumnHeader
      source="priority"
      label="Priority"
      filterType="checkbox"
      choices={[...PRIORITY_CHOICES]}
    />
  );
}

