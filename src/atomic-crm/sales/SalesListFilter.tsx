/**
 * SalesListFilter - Sidebar filter UI for Sales (Team Member) list
 *
 * Industry Standard Pattern (Google Workspace, Salesforce, HubSpot):
 * - Role filter: Multiselect buttons for Admin/Manager/Rep
 * - Status filter: Toggle between Active/Disabled/All
 * - Default: Active only (set via filterDefaultValues on List)
 *
 * @module sales/SalesListFilter
 */

import { useListContext } from "ra-core";
import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { Users, Eye } from "lucide-react";

export const SalesListFilter = () => {
  // Ensure we're inside a ListContext (used by ToggleFilterButton children)
  useListContext();

  return (
    <div className="flex flex-col gap-4" data-tutorial="sales-filters">
      {/* Role Filter - Multiselect (Admin, Manager, Rep) */}
      <FilterCategory label="Role" icon={<Users className="h-4 w-4" />}>
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Admin"
          value={{ role: "admin" }}
        />
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Manager"
          value={{ role: "manager" }}
        />
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Rep"
          value={{ role: "rep" }}
        />
      </FilterCategory>

      {/* Status Filter - Industry standard: Active/Disabled/All pattern */}
      <FilterCategory label="Status" icon={<Eye className="h-4 w-4" />}>
        <ToggleFilterButton
          className="w-full justify-between"
          label="Active Only"
          value={{ disabled: false }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Disabled Only"
          value={{ disabled: true }}
        />
        {/* Clearing both shows all users */}
      </FilterCategory>
    </div>
  );
};
