import { Badge } from "@/components/ui/badge";
import { endOfToday, startOfToday, addDays } from "date-fns";
import { Calendar, CheckSquare, Star, Tag } from "lucide-react";
import { FilterLiveForm } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { OwnerFilterDropdown } from "@/components/admin/OwnerFilterDropdown";

/**
 * TaskListFilter Component
 *
 * Sidebar filter panel for tasks list using the collapsible FilterCategory pattern.
 * Filters: opportunity, due date, completion status, priority, type, assigned to
 */
export const TaskListFilter = () => {
  const { taskTypes } = useConfigurationContext();

  const priorityColors: Record<string, string> = {
    low: "outline",
    medium: "secondary",
    high: "default",
    critical: "destructive",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search tasks..." />
      </FilterLiveForm>

      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        <FilterCategory label="Due Date" icon={<Calendar className="h-4 w-4" />}>
          <ToggleFilterButton
            className="w-full justify-between"
            label="Today"
            value={{
              "due_date@gte": startOfToday().toISOString(),
              "due_date@lte": endOfToday().toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="This Week"
            value={{
              "due_date@gte": startOfToday().toISOString(),
              "due_date@lte": addDays(startOfToday(), 7).toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Overdue"
            value={{
              "due_date@lte": startOfToday().toISOString(),
              completed: false,
            }}
          />
        </FilterCategory>

        <FilterCategory label="Status" icon={<CheckSquare className="h-4 w-4" />}>
          <ToggleFilterButton
            className="w-full justify-between"
            label="Incomplete"
            value={{ completed: false }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Completed"
            value={{ completed: true }}
          />
        </FilterCategory>

        <FilterCategory label="Priority" icon={<Star className="h-4 w-4" />}>
          {["low", "medium", "high", "critical"].map((priority) => (
            <ToggleFilterButton
              multiselect
              key={priority}
              className="w-full justify-between"
              label={
                <Badge variant={priorityColors[priority] as any} className="text-xs px-1 py-0">
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Badge>
              }
              value={{ priority }}
            />
          ))}
        </FilterCategory>

        <FilterCategory label="Type" icon={<Tag className="h-4 w-4" />}>
          {taskTypes.map((type) => (
            <ToggleFilterButton
              multiselect
              key={type}
              className="w-full justify-between"
              label={type}
              value={{ type }}
            />
          ))}
        </FilterCategory>
      </div>

      {/* Owner Filter - Always at bottom */}
      <OwnerFilterDropdown source="sales_id" label="Assigned To" />
    </div>
  );
};
