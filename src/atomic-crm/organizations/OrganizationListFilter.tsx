import { Building, Truck, Users, Tag, Star } from "lucide-react";
import { FilterLiveForm, useGetIdentity } from "ra-core";

import { ToggleFilterButton, SearchInput } from "@/components/admin";
import { FilterCategory } from "../filters/FilterCategory";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { sizes } from "./sizes";

export const OrganizationListFilter = () => {
  const { identity } = useGetIdentity();
  const { organizationSectors } = useConfigurationContext();
  const sectors = organizationSectors.map((sector) => ({
    id: sector,
    name: sector,
  }));

  const organizationTypes = [
    { id: "customer", name: "Customer" },
    { id: "prospect", name: "Prospect" },
    { id: "vendor", name: "Vendor" },
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
            key={priority.id}
            className="w-full justify-between"
            label={priority.name}
            value={{ priority: priority.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Building className="h-4 w-4" />} label="Size">
        {sizes.map((size) => (
          <ToggleFilterButton
            key={size.id}
            className="w-full justify-between"
            label={size.name}
            value={{ size: size.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Truck className="h-4 w-4" />} label="Sector">
        {sectors.map((sector) => (
          <ToggleFilterButton
            key={sector.id}
            className="w-full justify-between"
            label={sector.name}
            value={{ sector: sector.id }}
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
