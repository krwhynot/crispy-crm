/**
 * ProductsDatagridHeader
 *
 * Provides filterable column header labels for the Products datagrid.
 * Uses FilterableColumnHeader components that integrate with React Admin's
 * filter state via useListContext.
 *
 * Column Configuration:
 * - Name: Text filter (debounced search)
 * - Category: Checkbox filter (dynamic from distinct_product_categories view)
 * - Status: Checkbox filter (static choices: active, discontinued, coming_soon)
 * - Dist. Codes, Principal, Certifications: No filter (computed/reference fields)
 *
 * @example
 * ```tsx
 * <TextField
 *   source="name"
 *   label={<ProductNameHeader />}
 *   sortable
 * />
 * ```
 */

import { useGetList } from "ra-core";
import { FilterableColumnHeader, type FilterChoice } from "@/components/ra-wrappers/column-filters";
import { SEARCH_DEBOUNCE_MS } from "@/atomic-crm/constants";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

/**
 * Product status choices - matches ProductListFilter.tsx
 */
const PRODUCT_STATUS_CHOICES: FilterChoice[] = [
  { id: "active", name: "Active" },
  { id: "discontinued", name: "Discontinued" },
  { id: "coming_soon", name: "Coming Soon" },
];

/**
 * Filterable header for Product Name column
 * Uses text filter with debounced search
 */
export function ProductNameHeader() {
  return (
    <FilterableColumnHeader
      source="name"
      label="Product Name"
      filterType="text"
      placeholder="Search by name..."
      debounceMs={SEARCH_DEBOUNCE_MS}
    />
  );
}

/**
 * Filterable header for Category column
 * Uses checkbox filter with dynamic choices from distinct_product_categories view
 */
export function ProductCategoryHeader() {
  // Fetch unique categories from the database view
  const { data: categories } = useGetList<{ id: string; name: string }>(
    "distinct_product_categories",
    {
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Transform to FilterChoice format
  const categoryChoices: FilterChoice[] =
    categories?.map((cat) => ({ id: cat.id, name: cat.name })) ?? [];

  // Show a basic header if no categories loaded yet
  if (categoryChoices.length === 0) {
    return <FilterableColumnHeader source="category" label="Category" filterType="none" />;
  }

  return (
    <FilterableColumnHeader
      source="category"
      label="Category"
      filterType="checkbox"
      choices={categoryChoices}
    />
  );
}

/**
 * Filterable header for Status column
 * Uses checkbox filter with static choices
 */
export function ProductStatusHeader() {
  return (
    <FilterableColumnHeader
      source="status"
      label="Status"
      filterType="checkbox"
      choices={[...PRODUCT_STATUS_CHOICES]}
    />
  );
}
