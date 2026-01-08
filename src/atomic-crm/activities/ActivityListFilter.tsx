import { Badge } from "@/components/ui/badge";
import { endOfToday, startOfToday, startOfWeek, subDays } from "date-fns";
import { Calendar, Clock, Filter, Package, Tag, User } from "lucide-react";
import { FilterLiveForm, useGetIdentity } from "ra-core";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { INTERACTION_TYPE_OPTIONS, SAMPLE_STATUS_OPTIONS } from "../validation/activities";
import { OwnerFilterDropdown } from "@/components/admin/OwnerFilterDropdown";

/**
 * ActivityListFilter Component
 *
 * Sidebar filter panel for activities list using the collapsible FilterCategory pattern.
 *
 * Filters:
 * - Quick filters: Samples (type='sample'), Pending Feedback (sample_status='feedback_pending')
 * - Activity Type: All 13 interaction types (call, email, sample, etc.)
 * - Sample Status: sent, received, feedback_pending, feedback_received
 * - Date Range: Today, This Week, Last 7 Days
 * - Created By: Me filter
 */
export const ActivityListFilter = () => {
  const { data: _identity } = useGetIdentity();

  // Sample status badge colors for visual consistency
  const sampleStatusColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
    sent: "outline",
    received: "secondary",
    feedback_pending: "default",
    feedback_received: "destructive",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search activities..." />
      </FilterLiveForm>

      {/* Quick Filters - Most commonly used */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Quick Filters</h3>
        <div className="flex flex-col gap-1">
          <ToggleFilterButton
            className="w-full justify-between"
            label={
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" aria-hidden="true" />
                Samples Only
              </span>
            }
            value={{ type: "sample" }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label={
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Pending Feedback
              </span>
            }
            value={{ sample_status: "feedback_pending" }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-border" />

      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        {/* Activity Type Filter */}
        <FilterCategory label="Activity Type" icon={<Tag className="h-4 w-4" aria-hidden="true" />}>
          {INTERACTION_TYPE_OPTIONS.map((option) => (
            <ToggleFilterButton
              multiselect
              key={option.value}
              className="w-full justify-between"
              label={option.label}
              value={{ type: option.value }}
            />
          ))}
        </FilterCategory>

        {/* Sample Status Filter - Only relevant for sample activities */}
        <FilterCategory
          label="Sample Status"
          icon={<Package className="h-4 w-4" aria-hidden="true" />}
          defaultExpanded={false}
        >
          {SAMPLE_STATUS_OPTIONS.map((option) => (
            <ToggleFilterButton
              multiselect
              key={option.value}
              className="w-full justify-between"
              label={
                <Badge variant={sampleStatusColors[option.value]} className="text-xs px-1 py-0">
                  {option.label}
                </Badge>
              }
              value={{ sample_status: option.value }}
            />
          ))}
        </FilterCategory>

        {/* Activity Date Filter */}
        <FilterCategory
          label="Activity Date"
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
        >
          <ToggleFilterButton
            className="w-full justify-between"
            label="Today"
            value={{
              "activity_date@gte": startOfToday().toISOString(),
              "activity_date@lte": endOfToday().toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="This Week"
            value={{
              "activity_date@gte": startOfWeek(new Date()).toISOString(),
              "activity_date@lte": endOfToday().toISOString(),
            }}
          />
          <ToggleFilterButton
            className="w-full justify-between"
            label="Last 7 Days"
            value={{
              "activity_date@gte": subDays(startOfToday(), 7).toISOString(),
              "activity_date@lte": endOfToday().toISOString(),
            }}
          />
        </FilterCategory>

        {/* Sentiment Filter */}
        <FilterCategory label="Sentiment" icon={<Filter className="h-4 w-4" aria-hidden="true" />}>
          <ToggleFilterButton
            multiselect
            className="w-full justify-between"
            label={
              <Badge
                variant="default"
                className="text-xs px-1 py-0 bg-success text-success-foreground"
              >
                Positive
              </Badge>
            }
            value={{ sentiment: "positive" }}
          />
          <ToggleFilterButton
            multiselect
            className="w-full justify-between"
            label={
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Neutral
              </Badge>
            }
            value={{ sentiment: "neutral" }}
          />
          <ToggleFilterButton
            multiselect
            className="w-full justify-between"
            label={
              <Badge variant="destructive" className="text-xs px-1 py-0">
                Negative
              </Badge>
            }
            value={{ sentiment: "negative" }}
          />
        </FilterCategory>

        {/* Created By Filter - Role-aware dropdown */}
        <FilterCategory label="Created By" icon={<User className="h-4 w-4" />}>
          <OwnerFilterDropdown source="created_by" label="Created By" />
        </FilterCategory>
      </div>
    </div>
  );
};
