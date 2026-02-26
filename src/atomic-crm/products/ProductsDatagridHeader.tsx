/**
 * ProductsDatagridHeader
 *
 * Column headers for the Products datagrid with integrated filters.
 * Category uses dynamic choices from distinct_product_categories view.
 */

import { useGetList } from "react-admin";
import { FilterableColumnHeader } from "@/components/ra-wrappers/column-filters";
import { PRODUCT_STATUS_CHOICES } from "./constants";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

export function ProductNameHeader() {
  return <FilterableColumnHeader source="name" label="Product Name" filterType="text" />;
}

export function ProductCategoryHeader() {
  const { data, isPending, error } = useGetList(
    "distinct_product_categories",
    {
      pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  if (isPending || error || !data?.length) {
    return <FilterableColumnHeader source="category" label="Category" filterType="none" />;
  }

  return (
    <FilterableColumnHeader
      source="category"
      label="Category"
      filterType="checkbox"
      choices={data.map((c) => ({ id: String(c.id), name: c.name }))}
    />
  );
}

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
