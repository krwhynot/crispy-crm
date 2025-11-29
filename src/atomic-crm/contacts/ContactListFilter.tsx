import { Badge } from "@/components/ui/badge";
import { endOfYesterday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Building2, Clock, Tag, Users } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList } from "ra-core";
import { cn } from "@/lib/utils";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { getTagColorClass } from "../tags/tag-colors";
import { SidebarActiveFilters } from "./SidebarActiveFilters";

export const ContactListFilter = () => {
  const { identity } = useGetIdentity();
  const { data: tagsData } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  // Fetch organizations for the organization filter dropdown
  // Prioritize customer/prospect types as most relevant for contact filtering
  const { data: organizationsData } = useGetList("organizations", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "name", order: "ASC" },
    filter: { deleted_at: null },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search contacts..." />
      </FilterLiveForm>

      {/* Active Filters - Conditional */}
      <SidebarActiveFilters />

      {/* Divider */}
      <div className="border-b border-border" />

      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        <FilterCategory label="Last activity" icon={<Clock className="h-4 w-4" />}>
          <ToggleFilterButton
            className="w-full justify-between"
            label="Today"
            value={{
              "last_seen@gte": endOfYesterday().toISOString(),
              "last_seen@lte": undefined,
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="This week"
            value={{
              "last_seen@gte": startOfWeek(new Date()).toISOString(),
              "last_seen@lte": undefined,
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Before this week"
            value={{
              "last_seen@gte": undefined,
              "last_seen@lte": startOfWeek(new Date()).toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Before this month"
            value={{
              "last_seen@gte": undefined,
              "last_seen@lte": startOfMonth(new Date()).toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Before last month"
            value={{
              "last_seen@gte": undefined,
              "last_seen@lte": subMonths(startOfMonth(new Date()), 1).toISOString(),
            }}
          />
        </FilterCategory>

        <FilterCategory label="Tags" icon={<Tag className="h-4 w-4" />}>
          {tagsData &&
            tagsData.map((record) => (
              <ToggleFilterButton
                multiselect
                className="w-full justify-between"
                key={record.id}
                label={
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-normal cursor-pointer",
                      getTagColorClass(record?.color)
                    )}
                  >
                    {record?.name}
                  </Badge>
                }
                value={{ tags: record.id }}
              />
            ))}
        </FilterCategory>

        <FilterCategory label="Organization" icon={<Building2 className="h-4 w-4" />}>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
            {organizationsData &&
              organizationsData.map((org) => (
                <ToggleFilterButton
                  className="w-full justify-between"
                  key={org.id}
                  label={
                    <span className="truncate text-sm" title={org.name}>
                      {org.name}
                    </span>
                  }
                  value={{ organization_id: org.id }}
                />
              ))}
          </div>
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
