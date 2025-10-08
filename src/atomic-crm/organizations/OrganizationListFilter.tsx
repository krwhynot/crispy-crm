import { Truck, Users, Tag, Star } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";

export const OrganizationListFilter = () => {
  const { identity } = useGetIdentity();
  const { data: segments } = useGetList("segments", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const organizationTypes = [
    { id: "customer", name: "Customer" },
    { id: "prospect", name: "Prospect" },
    { id: "partner", name: "Partner" },
    { id: "principal", name: "Principal" },
    { id: "distributor", name: "Distributor" },
    { id: "unknown", name: "Unknown" },
  ];

  const priorities = [
    { id: "A", name: "A - High Priority" },
    { id: "B", name: "B - Medium-High Priority" },
    { id: "C", name: "C - Medium Priority" },
    { id: "D", name: "D - Low Priority" },
  ];

  return (
    <div className="w-52 min-w-52 flex flex-col gap-8">
      <FilterLiveForm>
        <SearchInput source="q" />
      </FilterLiveForm>

      <FilterCategory
        icon={<Tag className="h-4 w-4" />}
        label="Organization Type"
      >
        {organizationTypes.map((type) => (
          <ToggleFilterButton
            multiselect
            key={type.id}
            className="w-full justify-between"
            label={type.name}
            value={{ organization_type: type.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Star className="h-4 w-4" />} label="Priority">
        {priorities.map((priority) => (
          <ToggleFilterButton
            multiselect
            key={priority.id}
            className="w-full justify-between"
            label={priority.name}
            value={{ priority: priority.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Truck className="h-4 w-4" />} label="Segment">
        {segments?.map((segment) => (
          <ToggleFilterButton
            multiselect
            key={segment.id}
            className="w-full justify-between"
            label={segment.name}
            value={{ segment_id: segment.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Users className="h-4 w-4" />}
        label="Account Manager"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label={"Me"}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </div>
  );
};
