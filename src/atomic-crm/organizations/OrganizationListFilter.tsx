import { Truck, Users, Tag, Star } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge.constants";
import { Badge } from "@/components/ui/badge";
import { FilterLiveForm, useGetIdentity } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { SidebarActiveFilters } from "./SidebarActiveFilters";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP } from "./constants";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const OrganizationListFilter = () => {
  const { data: identity } = useGetIdentity();

  const organizationTypes = [
    { id: "customer", name: "Customer" },
    { id: "prospect", name: "Prospect" },
    { id: "principal", name: "Principal" },
    { id: "distributor", name: "Distributor" },
    { id: "unknown", name: "Unknown" },
  ];

  // Organization type colors using MFB Garden to Table theme
  const _organizationTypeColors: Record<string, string> = {
    customer: "secondary", // Warm tan - welcoming
    prospect: "secondary", // Sage/olive - growth
    principal: "default", // Eggplant/purple - important/primary
    distributor: "secondary", // Teal - active/connected
    unknown: "outline", // Mushroom gray - neutral
  };

  const priorities = [
    { id: "A", name: "A - High" },
    { id: "B", name: "B - Medium-High" },
    { id: "C", name: "C - Medium" },
    { id: "D", name: "D - Low" },
  ];

  const priorityColors: Record<string, BadgeVariant> = {
    A: "destructive",
    B: "default",
    C: "secondary",
    D: "outline",
  };

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
          {organizationTypes.map((type) => {
            const colorClass =
              {
                customer: "tag-warm",
                prospect: "tag-sage",
                principal: "tag-purple",
                distributor: "tag-teal",
                unknown: "tag-gray",
              }[type.id] || "tag-gray";

            return (
              <ToggleFilterButton
                multiselect
                key={type.id}
                className="w-full justify-between"
                label={<Badge className={`text-xs px-1 py-0 ${colorClass}`}>{type.name}</Badge>}
                value={{ organization_type: type.id }}
              />
            );
          })}
        </FilterCategory>

        <FilterCategory icon={<Star className="h-4 w-4" />} label="Priority">
          {priorities.map((priority) => (
            <ToggleFilterButton
              multiselect
              key={priority.id}
              className="w-full justify-between"
              label={
                <Badge variant={priorityColors[priority.id]} className="text-xs px-1 py-0">
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
