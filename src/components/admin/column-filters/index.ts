/**
 * Column Filter Components
 *
 * Excel-style column header filters for React Admin datagrids.
 * All components use useListContext for filter state management,
 * ensuring automatic sync with FilterChipBar and sidebar filters.
 *
 * @example
 * // In a custom datagrid header
 * import { FilterableColumnHeader, ORGANIZATION_TYPE_CHOICES } from "@/components/admin/column-filters";
 *
 * <FilterableColumnHeader
 *   source="name"
 *   label="Organization Name"
 *   filterType="text"
 * />
 *
 * <FilterableColumnHeader
 *   source="organization_type"
 *   label="Type"
 *   filterType="checkbox"
 *   choices={ORGANIZATION_TYPE_CHOICES}
 * />
 */

export { TextColumnFilter, type TextColumnFilterProps } from "./TextColumnFilter";

export {
  CheckboxColumnFilter,
  type CheckboxColumnFilterProps,
  type FilterChoice,
} from "./CheckboxColumnFilter";

export {
  FilterableColumnHeader,
  type FilterableColumnHeaderProps,
  type FilterType,
} from "./FilterableColumnHeader";
