import { Package, Tag, DollarSign, Building2 } from "lucide-react";
import { FilterLiveForm, useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import type { Organization } from "../types";

export const ProductListFilter = () => {
  // Fetch principal organizations dynamically
  // Refetch every 10 seconds to pick up new principals
  const { data: principals } = useGetList<Organization>("organizations", {
    filter: { organization_type: "principal" },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
    meta: { refetchInterval: 10000 }, // Refresh every 10 seconds
  });
  const productStatuses = [
    { id: "active", name: "Active" },
    { id: "discontinued", name: "Discontinued" },
    { id: "coming_soon", name: "Coming Soon" },
  ];

  const categories = [
    { id: "equipment", name: "Equipment" },
    { id: "beverages", name: "Beverages" },
    { id: "dairy", name: "Dairy" },
    { id: "frozen", name: "Frozen" },
    { id: "fresh_produce", name: "Fresh Produce" },
    { id: "dry_goods", name: "Dry Goods" },
    { id: "other", name: "Other" },
  ];

  const priceRanges = [
    { id: "0-50", name: "Under $50" },
    { id: "50-100", name: "$50 - $100" },
    { id: "100-500", name: "$100 - $500" },
    { id: "500-1000", name: "$500 - $1000" },
    { id: "1000+", name: "Over $1000" },
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

      <FilterCategory
        icon={<DollarSign className="h-4 w-4" />}
        label="Price Range"
      >
        {priceRanges.map((range) => (
          <ToggleFilterButton
            key={range.id}
            className="w-full justify-between"
            label={range.name}
            value={{ price_range: range.id }}
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