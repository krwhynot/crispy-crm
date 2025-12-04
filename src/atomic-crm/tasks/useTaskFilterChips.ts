import { useListContext } from "ra-core";
import { useGetList } from "ra-core";
import { format } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";

interface FilterChip {
  key: string;
  value: any;
  label: string;
  category: string;
}

export const useTaskFilterChips = () => {
  const { filterValues, setFilters } = useListContext();

  // Fetch opportunity titles for active opportunity filters
  const opportunityId = filterValues?.opportunity_id;
  const { data: opportunityData } = useGetList(
    "opportunities",
    {
      pagination: { page: 1, perPage: 1 },
      filter: opportunityId ? { id: opportunityId } : {},
    },
    { enabled: !!opportunityId }
  );

  // Fetch sales person name for assigned to filter
  const salesId = filterValues?.sales_id;
  const { data: salesData } = useGetList(
    "sales",
    {
      pagination: { page: 1, perPage: 1 },
      filter: salesId ? { id: salesId } : {},
    },
    { enabled: !!salesId }
  );

  const getOpportunityTitle = (): string => {
    const opportunity = opportunityData?.[0];
    return opportunity?.title || "Unknown Opportunity";
  };

  const getSalesName = (): string => {
    const sales = salesData?.[0];
    return sales ? `${sales.first_name} ${sales.last_name}` : "Unknown";
  };

  const formatDateRange = (gte?: string, lte?: string): string => {
    if (gte && !lte) {
      const date = parseDateSafely(gte);
      return date ? `After ${format(date, "MMM d, yyyy")}` : "Recent";
    }
    if (lte && !gte) {
      const date = parseDateSafely(lte);
      return date ? `Before ${format(date, "MMM d, yyyy")}` : "Older";
    }
    if (gte && lte) {
      const startDate = parseDateSafely(gte);
      const endDate = parseDateSafely(lte);
      return startDate && endDate
        ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
        : "Date range";
    }
    return "Unknown date";
  };

  // Build filter chips array
  const chips: FilterChip[] = [];

  // Search query
  if (filterValues?.q) {
    chips.push({
      key: "q",
      value: filterValues.q,
      label: `"${filterValues.q}"`,
      category: "Search",
    });
  }

  // Opportunity
  if (filterValues?.opportunity_id) {
    chips.push({
      key: "opportunity_id",
      value: filterValues.opportunity_id,
      label: getOpportunityTitle(),
      category: "Opportunity",
    });
  }

  // Due Date
  if (filterValues?.["due_date@gte"] || filterValues?.["due_date@lte"]) {
    const label = formatDateRange(filterValues["due_date@gte"], filterValues["due_date@lte"]);
    chips.push({
      key: "due_date",
      value: { gte: filterValues["due_date@gte"], lte: filterValues["due_date@lte"] },
      label,
      category: "Due Date",
    });
  }

  // Completion Status
  if (filterValues?.completed !== undefined) {
    chips.push({
      key: "completed",
      value: filterValues.completed,
      label: filterValues.completed ? "Completed" : "Incomplete",
      category: "Status",
    });
  }

  // Priority
  if (filterValues?.priority) {
    const priorityArray = Array.isArray(filterValues.priority)
      ? filterValues.priority
      : [filterValues.priority];
    priorityArray.forEach((priority) => {
      chips.push({
        key: "priority",
        value: priority,
        label: priority.charAt(0).toUpperCase() + priority.slice(1),
        category: "Priority",
      });
    });
  }

  // Type
  if (filterValues?.type) {
    const typeArray = Array.isArray(filterValues.type) ? filterValues.type : [filterValues.type];
    typeArray.forEach((type) => {
      chips.push({
        key: "type",
        value: type,
        label: type,
        category: "Type",
      });
    });
  }

  // Assigned To
  if (filterValues?.sales_id) {
    chips.push({
      key: "sales_id",
      value: filterValues.sales_id,
      label: getSalesName(),
      category: "Assigned To",
    });
  }

  // Remove individual filter value
  const removeFilterValue = (key: string, value: any) => {
    const newFilters = { ...filterValues };

    if (key === "due_date") {
      // Remove both date range fields
      delete newFilters["due_date@gte"];
      delete newFilters["due_date@lte"];
    } else if (key === "priority" && Array.isArray(newFilters.priority)) {
      // Remove specific priority from array
      newFilters.priority = newFilters.priority.filter((p: any) => String(p) !== String(value));
      if (newFilters.priority.length === 0) {
        delete newFilters.priority;
      }
    } else if (key === "type" && Array.isArray(newFilters.type)) {
      // Remove specific type from array
      newFilters.type = newFilters.type.filter((t: any) => String(t) !== String(value));
      if (newFilters.type.length === 0) {
        delete newFilters.type;
      }
    } else {
      // Remove simple key
      delete newFilters[key];
    }

    setFilters(newFilters, {});
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({}, {});
  };

  return {
    chips,
    removeFilterValue,
    clearAllFilters,
    hasActiveFilters: chips.length > 0,
  };
};
