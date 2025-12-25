import { Badge } from "@/components/ui/badge";
import { endOfYesterday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Clock, Tag, User } from "lucide-react";
import { useGetList, useListContext } from "ra-core";
import { cn } from "@/lib/utils";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { getTagColorClass } from "../tags/tag-colors";
import { OwnerFilterDropdown } from "@/components/admin/OwnerFilterDropdown";

/**
 * ContactListFilter - Sidebar filter UI for Contacts list
 *
 * NOTE: Active filter chips are now displayed via FilterChipBar above the datagrid.
 */
export const ContactListFilter = () => {
  useListContext(); // Ensure we're inside a ListContext (used by ToggleFilterButton children)

  const { data: tagsData } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });


  return (
    <div className="flex flex-col gap-4" data-tutorial="contact-filters">
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

        <FilterCategory label="Account Manager" icon={<User className="h-4 w-4" />}>
          <OwnerFilterDropdown source="sales_id" label="Account Manager" />
        </FilterCategory>
      </div>
    </div>
  );
};
