import { Package, Tag, DollarSign, Building2, TrendingUp } from "lucide-react";
import { FilterLiveForm } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";

export const ProductListFilter = () => {
  const productStatuses = [
    { id: "active", name: "Active" },
    { id: "discontinued", name: "Discontinued" },
    { id: "pending", name: "Pending" },
    { id: "seasonal", name: "Seasonal" },
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

  const promotionalStatus = [
    { id: "promoted_this_week", name: "Promoted This Week" },
    { id: "needs_promotion", name: "Needs Promotion" },
    { id: "never_promoted", name: "Never Promoted" },
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

      <FilterCategory
        icon={<TrendingUp className="h-4 w-4" />}
        label="Promotional Status"
      >
        {promotionalStatus.map((status) => (
          <ToggleFilterButton
            key={status.id}
            className="w-full justify-between"
            label={status.name}
            value={{ promotional_status: status.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Building2 className="h-4 w-4" />}
        label="Principal"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label="TechCorp Solutions"
          value={{ principal_id: 3 }}
        />
      </FilterCategory>
    </div>
  );
};