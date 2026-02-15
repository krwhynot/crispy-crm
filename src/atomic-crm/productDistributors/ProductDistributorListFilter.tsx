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
 * - Search by DOT number (via FilterSidebar's built-in SearchInput)
 * - Status toggle filters (pending, active, inactive)
 *
 * Active filter chips are displayed via FilterChipBar above the datagrid.
 */
export const ProductDistributorListFilter = () => {
  useListContext(); // Ensure we're inside a ListContext (used by ToggleFilterButton)

  return (
    <FilterSidebar searchPlaceholder="Search by DOT number...">
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
