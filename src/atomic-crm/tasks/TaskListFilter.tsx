import { startOfToday, addDays, format } from "date-fns";
import { Calendar, CheckSquare, User } from "lucide-react";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { OwnerFilterDropdown } from "@/components/admin/OwnerFilterDropdown";

/**
 * TaskListFilter Component
 *
 * Sidebar filter panel for tasks list using the collapsible FilterCategory pattern.
 * Filters: due date, completion status
 */
export const TaskListFilter = () => {
  return (
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

      <FilterCategory label="Assigned To" icon={<User className="h-4 w-4" />}>
        <OwnerFilterDropdown source="sales_id" label="Assigned To" />
      </FilterCategory>
    </div>
  );
};
