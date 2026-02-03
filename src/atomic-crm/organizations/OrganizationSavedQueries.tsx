import { AdminButton } from "@/components/admin/AdminButton";
import { Clock, Star, User, Zap } from "lucide-react";
import { useGetIdentity, useListContext } from "ra-core";
import { addDays } from "date-fns";

import { FilterCategory } from "../filters/FilterCategory";

/**
 * Quick filter presets for the Organizations sidebar.
 * Follows the same pattern as OpportunityListFilter quick filters.
 */
export const OrganizationSavedQueries = () => {
  const { data: identity } = useGetIdentity();
  const { filterValues, setFilters } = useListContext();

  const thirtyDaysAgo = addDays(new Date(), -30).toISOString().split("T")[0];

  const isPresetActive = (presetFilters: Record<string, unknown>): boolean => {
    return Object.entries(presetFilters).every(([key, value]) => {
      const currentValue = filterValues?.[key];
      if (Array.isArray(value) && Array.isArray(currentValue)) {
        return value.every((v) => currentValue.includes(v));
      }
      return currentValue === value;
    });
  };

  const handlePresetClick = (presetFilters: Record<string, unknown>) => {
    if (isPresetActive(presetFilters)) {
      // Toggle OFF: remove preset keys from current filters
      const next = { ...filterValues };
      for (const key of Object.keys(presetFilters)) {
        delete next[key];
      }
      setFilters(next);
    } else {
      // Toggle ON: merge preset into current filters
      setFilters({ ...filterValues, ...presetFilters });
    }
  };

  return (
    <FilterCategory label="Quick Filters" icon={<Zap className="h-4 w-4" />} defaultExpanded>
      <AdminButton
        type="button"
        variant={isPresetActive({ sales_id: identity?.id }) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick({ sales_id: identity?.id })}
        className="w-full justify-start"
        title="Organizations assigned to me"
      >
        <User className="w-3.5 h-3.5 mr-2" />
        My Accounts
      </AdminButton>

      <AdminButton
        type="button"
        variant={isPresetActive({ priority: ["A"] }) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick({ priority: ["A"] })}
        className="w-full justify-start"
        title="Priority A organizations"
      >
        <Star className="w-3.5 h-3.5 mr-2" />
        Key Accounts
      </AdminButton>

      <AdminButton
        type="button"
        variant={
          isPresetActive({
            organization_type: ["prospect"],
            created_at_gte: thirtyDaysAgo,
          })
            ? "default"
            : "outline"
        }
        size="sm"
        onClick={() =>
          handlePresetClick({
            organization_type: ["prospect"],
            created_at_gte: thirtyDaysAgo,
          })
        }
        className="w-full justify-start"
        title="Prospects added in the last 30 days"
      >
        <Clock className="w-3.5 h-3.5 mr-2" />
        Recent Prospects
      </AdminButton>
    </FilterCategory>
  );
};
