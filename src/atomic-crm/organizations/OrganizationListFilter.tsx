import { Truck, Users, Tag, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterLiveForm, useGetIdentity, useGetList } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { SidebarActiveFilters } from "./SidebarActiveFilters";

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

  // Organization type colors using MFB Garden to Table theme
  const organizationTypeColors: Record<string, string> = {
    customer: "secondary",      // Warm tan - welcoming
    prospect: "secondary",      // Sage/olive - growth
    partner: "secondary",       // Teal - collaborative
    principal: "default",       // Eggplant/purple - important/primary
    distributor: "secondary",   // Golden amber - active/connected
    unknown: "outline",         // Mushroom gray - neutral
  };

  const priorities = [
    { id: "A", name: "A - High" },
    { id: "B", name: "B - Medium-High" },
    { id: "C", name: "C - Medium" },
    { id: "D", name: "D - Low" },
  ];

  const priorityColors: Record<string, string> = {
    A: "destructive",
    B: "default",
    C: "secondary",
    D: "outline",
  };

  return (
    <div className="w-52 min-w-52 order-first">
      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <div className="flex flex-col gap-4">
          {/* Search - Always visible */}
          <FilterLiveForm>
            <SearchInput source="q" placeholder="Search organizations..." />
          </FilterLiveForm>

          {/* Active Filters - Conditional */}
          <SidebarActiveFilters />

          {/* Divider */}
          <div className="border-b border-border" />

          {/* Collapsible Filter Sections */}
          <div className="flex flex-col gap-2">
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
                  label={
                    <Badge
                      variant={priorityColors[priority.id] as any}
                      className="text-xs px-1 py-0"
                    >
                      {priority.name}
                    </Badge>
                  }
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
        </div>
      </Card>
    </div>
  );
};
