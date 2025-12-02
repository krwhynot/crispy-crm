import { Truck, Users, Tag, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FilterLiveForm, useGetIdentity } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { SidebarActiveFilters } from "./SidebarActiveFilters";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP } from "./constants";

export const OrganizationListFilter = () => {
  const { data: identity } = useGetIdentity();

  return (
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
        <FilterCategory icon={<Tag className="h-4 w-4" />} label="Organization Type">
          {ORGANIZATION_TYPE_CHOICES.map((type) => {
            const colorClass = ORG_TYPE_COLOR_MAP[type.id] || "tag-gray";

            return (
              <ToggleFilterButton
                multiselect
                key={type.id}
                className="w-full justify-between"
                label={<Badge className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${colorClass}`}>{type.name}</Badge>}
                value={{ organization_type: type.id }}
              />
            );
          })}
        </FilterCategory>

        <FilterCategory icon={<Star className="h-4 w-4" />} label="Priority">
          {PRIORITY_CHOICES.map((priority) => (
            <ToggleFilterButton
              multiselect
              key={priority.id}
              className="w-full justify-between"
              label={
                <Badge variant={PRIORITY_VARIANT_MAP[priority.id]} className="text-xs px-3 py-2 min-h-[44px] flex items-center">
                  {priority.name}
                </Badge>
              }
              value={{ priority: priority.id }}
            />
          ))}
        </FilterCategory>

        <FilterCategory icon={<Truck className="h-4 w-4" />} label="Playbook Category">
          {PLAYBOOK_CATEGORY_CHOICES.map((category) => (
            <ToggleFilterButton
              multiselect
              key={category.id}
              className="w-full justify-between"
              label={category.name}
              value={{ segment_id: category.id }}
            />
          ))}
        </FilterCategory>

        <FilterCategory icon={<Users className="h-4 w-4" />} label="Account Manager">
          <ToggleFilterButton
            className="w-full justify-between"
            label={"Me"}
            value={{ sales_id: identity?.id }}
          />
        </FilterCategory>
      </div>
    </div>
  );
};
