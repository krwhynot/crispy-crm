import { CircleDot } from "lucide-react";
import { useListContext } from "ra-core";

import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { FilterSidebar } from "../filters/FilterSidebar";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

/**
 * ProductDistributorListFilter - Sidebar filter UI for Product Distributors list
 *
 * Provides:
 * - Status toggle filters (pending, active, inactive)
 *
 * Active filter chips are displayed via FilterChipBar above the datagrid.
 */
export const ProductDistributorListFilter = () => {
  useListContext(); // Ensure we're inside a ListContext (used by ToggleFilterButton)

  return (
    <FilterSidebar showSearch={false}>
      <FilterCategory label="Status" icon={<CircleDot className="h-4 w-4" />}>
        {PRODUCT_DISTRIBUTOR_STATUS_CHOICES.map((choice) => (
          <ToggleFilterButton
            key={choice.id}
            className="w-full justify-between"
            label={choice.name}
            value={{ status: choice.id }}
          />
        ))}
      </FilterCategory>
    </FilterSidebar>
  );
};
