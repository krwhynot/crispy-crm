import { Truck, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useListContext } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_PARENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";

/**
 * OrganizationListFilter - Sidebar filter UI for Organizations list
 *
 * NOTE: Active filter chips are now displayed via FilterChipBar above the datagrid.
 * SidebarActiveFilters removed to avoid duplicate filter visibility.
 */
export const OrganizationListFilter = () => {
  const { filterValues } = useListContext();

  // Determine which segment filters to show based on organization_type filter
  const typeFilter = filterValues?.organization_type;

  // Show playbook filters if:
  // - No type filter active, OR
  // - Distributor or Principal is in the filter
  const showPlaybookFilters =
    !typeFilter ||
    (Array.isArray(typeFilter)
      ? typeFilter.includes("distributor") || typeFilter.includes("principal")
      : typeFilter === "distributor" || typeFilter === "principal");

  // Show operator filters if:
  // - No type filter active, OR
  // - Customer or Prospect is in the filter
  const showOperatorFilters =
    !typeFilter ||
    (Array.isArray(typeFilter)
      ? typeFilter.includes("customer") || typeFilter.includes("prospect")
      : typeFilter === "customer" || typeFilter === "prospect");

  return (
    <div className="flex flex-col gap-4" data-tutorial="org-filters">
      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        {/* Playbook Categories - for Distributors/Principals */}
        {showPlaybookFilters && (
          <FilterCategory icon={<Truck className="h-4 w-4" />} label="Playbook Category">
            {PLAYBOOK_CATEGORY_CHOICES.map((category) => (
              <ToggleFilterButton
                multiselect
                key={category.id}
                className="w-full justify-between"
                label={
                  <Badge className="text-xs px-3 py-2 min-h-[44px] flex items-center tag-teal">
                    {category.name}
                  </Badge>
                }
                value={{ segment_id: category.id }}
              />
            ))}
          </FilterCategory>
        )}

        {/* Operator Segments - for Customers/Prospects */}
        {showOperatorFilters && (
          <FilterCategory icon={<Store className="h-4 w-4" />} label="Operator Segment">
            {OPERATOR_SEGMENT_PARENT_CHOICES.map((segment) => (
              <ToggleFilterButton
                multiselect
                key={segment.id}
                className="w-full justify-between"
                label={
                  <Badge className="text-xs px-3 py-2 min-h-[44px] flex items-center tag-sage">
                    {segment.name}
                  </Badge>
                }
                value={{ segment_id: segment.id }}
              />
            ))}
          </FilterCategory>
        )}
      </div>
    </div>
  );
};
