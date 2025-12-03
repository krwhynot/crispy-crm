import { Package, Tag, Building2 } from "lucide-react";
import { FilterLiveForm, useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import type { Organization } from "../types";

// Interface for the data returned by our database view
interface Category {
  id: string;
  name: string;
}

export const ProductListFilter = () => {
  // Fetch principal organizations dynamically
  const { data: principals } = useGetList<Organization>(
    "organizations",
    {
      filter: { organization_type: "principal" },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    },
    {
      // Categories and principals don't change often - cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch unique categories directly from the database view
  // This is much more efficient than fetching all products
  const { data: categories, isLoading: isLoadingCategories } = useGetList<Category>(
    "distinct_product_categories",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    },
    {
      // Categories change infrequently, so we can cache for longer
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const productStatuses = [
    { id: "active", name: "Active" },
    { id: "discontinued", name: "Discontinued" },
    { id: "coming_soon", name: "Coming Soon" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search products..." />
      </FilterLiveForm>

      <FilterCategory icon={<Tag className="h-4 w-4" />} label="Product Status">
        {productStatuses.map((status) => (
          <ToggleFilterButton
            key={status.id}
            className="w-full justify-between"
            label={status.name}
            value={{ status: status.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Package className="h-4 w-4" />} label="Category">
        {isLoadingCategories ? (
          <div className="text-sm text-muted-foreground px-3 py-1">Loading...</div>
        ) : (
          categories?.map((category) => (
            <ToggleFilterButton
              key={category.id}
              className="w-full justify-between"
              label={category.name}
              value={{ category: category.id }}
            />
          ))
        )}
      </FilterCategory>

      {principals && principals.length > 0 && (
        <FilterCategory icon={<Building2 className="h-4 w-4" />} label="Principal/Supplier">
          {principals.map((principal) => (
            <ToggleFilterButton
              key={principal.id}
              className="w-full justify-between"
              label={principal.name}
              value={{ principal_id: principal.id }}
            />
          ))}
        </FilterCategory>
      )}
    </div>
  );
};
