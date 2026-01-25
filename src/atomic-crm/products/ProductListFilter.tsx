import { Building2 } from "lucide-react";
import { useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import type { Organization } from "../types";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

export const ProductListFilter = () => {
  // Fetch principal organizations dynamically
  const { data: principals } = useGetList<Organization>(
    "organizations",
    {
      filter: { organization_type: "principal" },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
    },
    {
      // Principals don't change often - cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div className="flex flex-col gap-4">
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
