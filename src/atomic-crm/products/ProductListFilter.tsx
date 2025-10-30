import { useMemo } from "react";
import { Package, Tag, Building2 } from "lucide-react";
import { FilterLiveForm, useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import type { Organization } from "../types";
import type { Product } from "../types";

export const ProductListFilter = () => {
  // Fetch principal organizations dynamically
  // Auto-refresh to pick up new principals when organizations are updated
  const { data: principals } = useGetList<Organization>(
    "organizations",
    {
      filter: { organization_type: "principal" },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    },
    {
      // React Query options - aggressive refetch to ensure fresh data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0, // Always consider data stale - refetch immediately
      cacheTime: 1000 * 60, // Keep in cache for 1 minute
    }
  );

  // Fetch all products to extract unique categories
  const { data: products } = useGetList<Product>(
    "products",
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "category", order: "ASC" },
    },
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
      cacheTime: 1000 * 60,
    }
  );

  // Extract unique categories from products
  const categories = useMemo(() => {
    if (!products) return [];

    const uniqueCategories = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });

    // Convert to array and format for display
    return Array.from(uniqueCategories)
      .sort()
      .map((category) => ({
        id: category,
        name: category
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      }));
  }, [products]);

  const productStatuses = [
    { id: "active", name: "Active" },
    { id: "discontinued", name: "Discontinued" },
    { id: "coming_soon", name: "Coming Soon" },
  ];

  return (
    <div className="w-52 min-w-52 flex flex-col gap-8">
      <FilterLiveForm>
        <SearchInput source="q" />
      </FilterLiveForm>

      <FilterCategory
        icon={<Tag className="h-4 w-4" />}
        label="Product Status"
      >
        {productStatuses.map((status) => (
          <ToggleFilterButton
            key={status.id}
            className="w-full justify-between"
            label={status.name}
            value={{ status: status.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Package className="h-4 w-4" />}
        label="Category"
      >
        {categories.map((category) => (
          <ToggleFilterButton
            key={category.id}
            className="w-full justify-between"
            label={category.name}
            value={{ category: category.id }}
          />
        ))}
      </FilterCategory>

      {principals && principals.length > 0 && (
        <FilterCategory
          icon={<Building2 className="h-4 w-4" />}
          label="Principal/Supplier"
        >
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