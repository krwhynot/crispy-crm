import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { endOfYesterday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Building2, Clock, Tag, Users } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList, useListContext } from "ra-core";
import { cn } from "@/lib/utils";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { getTagColorClass } from "../tags/tag-colors";

/**
 * ContactListFilter - Sidebar filter UI for Contacts list
 *
 * NOTE: Active filter chips are now displayed via FilterChipBar above the datagrid.
 */
export const ContactListFilter = () => {
  const { data: identity } = useGetIdentity();
  const { filterValues, setFilters } = useListContext();

  const { data: tagsData } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  // Fetch organizations for the organization filter dropdown
  // Prioritize customer/prospect types as most relevant for contact filtering
  const { data: organizationsData } = useGetList("organizations", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
    filter: { deleted_at: null },
  });

  // Handle organization filter change via Select dropdown
  const handleOrganizationChange = (value: string) => {
    if (value === "all") {
      // Remove organization_id filter when "All Organizations" is selected
      const { organization_id: _, ...rest } = filterValues || {};
      setFilters(rest);
    } else {
      setFilters({
        ...filterValues,
        organization_id: Number(value),
      });
    }
  };

  // Get current organization filter value for controlled Select
  const currentOrgFilter = filterValues?.organization_id
    ? String(filterValues.organization_id)
    : "all";

  return (
    <div className="flex flex-col gap-4" data-tutorial="contact-filters">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search contacts..." />
      </FilterLiveForm>

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
          <Select value={currentOrgFilter} onValueChange={handleOrganizationChange}>
            <SelectTrigger
              className="w-full min-h-11 bg-background border-border text-foreground"
              aria-label="Filter by organization"
            >
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all" className="min-h-11">
                <span className="text-muted-foreground">All Organizations</span>
              </SelectItem>
              {organizationsData?.map((org) => (
                <SelectItem key={org.id} value={String(org.id)} className="min-h-11">
                  <span className="truncate" title={org.name}>
                    {org.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
