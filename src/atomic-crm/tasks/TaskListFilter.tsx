import { Card } from "@/components/ui/card";
import { endOfYesterday, startOfWeek, addDays, endOfDay } from "date-fns";
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  Tag,
  User,
} from "lucide-react";
import { FilterLiveForm, useGetIdentity } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { SidebarActiveFilters } from "../contacts/SidebarActiveFilters";
import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * TaskListFilter Component
 *
 * Sidebar filter for tasks list following codebase pattern.
 * Filters: Search, Due Date, Status, Priority, Type, Assigned To
 *
 * Pattern: FilterLiveForm + FilterCategory + ToggleFilterButton
 * Reference: ContactListFilter.tsx
 */
export const TaskListFilter = () => {
  const { identity } = useGetIdentity();
  const { taskTypes } = useConfigurationContext();
  const today = new Date();

  return (
    <div className="w-52 min-w-52 order-first">
      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <div className="flex flex-col gap-4">
          {/* Search - Always visible */}
          <FilterLiveForm>
            <SearchInput source="q" placeholder="Search tasks..." />
          </FilterLiveForm>

          {/* Active Filters - Conditional */}
          <SidebarActiveFilters />

          {/* Divider */}
          <div className="border-b border-border" />

          {/* Collapsible Filter Sections */}
          <div className="flex flex-col gap-2">
            <FilterCategory label="Due Date" icon={<Calendar className="h-4 w-4" />}>
              <ToggleFilterButton
                className="w-full justify-between"
                label="Overdue"
                value={{
                  "due_date@lte": endOfYesterday().toISOString(),
                  completed: false,
                }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="Today"
                value={{
                  "due_date@gte": endOfYesterday().toISOString(),
                  "due_date@lte": endOfDay(today).toISOString(),
                }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="This Week"
                value={{
                  "due_date@gte": startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
                  "due_date@lte": endOfDay(addDays(startOfWeek(today, { weekStartsOn: 1 }), 6)).toISOString(),
                }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="Next 7 Days"
                value={{
                  "due_date@gte": today.toISOString(),
                  "due_date@lte": endOfDay(addDays(today, 7)).toISOString(),
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

            <FilterCategory label="Priority" icon={<AlertCircle className="h-4 w-4" />}>
              <ToggleFilterButton
                className="w-full justify-between"
                label="Critical"
                value={{ priority: "critical" }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="High"
                value={{ priority: "high" }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="Medium"
                value={{ priority: "medium" }}
              />
              <ToggleFilterButton
                className="w-full justify-between"
                label="Low"
                value={{ priority: "low" }}
              />
            </FilterCategory>

            <FilterCategory label="Type" icon={<Tag className="h-4 w-4" />}>
              {taskTypes.map((type) => (
                <ToggleFilterButton
                  key={type}
                  className="w-full justify-between"
                  label={type}
                  value={{ type }}
                />
              ))}
            </FilterCategory>

            <FilterCategory label="Assigned To" icon={<User className="h-4 w-4" />}>
              <ToggleFilterButton
                className="w-full justify-between"
                label="Me"
                value={{ sales_id: identity?.id }}
              />
            </FilterCategory>
          </div>
        </div>
      </Card>
    </div>
  );
};
